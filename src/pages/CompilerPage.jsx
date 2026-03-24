import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { executeCode, aiApi } from './api';
import { languageTemplates } from './constants';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';
import FloatingChatbot from '../components/FloatingChatbot';

// ─── Snippet storage helpers ──────────────────────────────────────────────────
const STORAGE_KEY = 'compiler-snippets';
const loadSnippets = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};
const saveSnippets = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

const CompilerPage = () => {
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState({
    stdout: 'Your output will appear here.',
    stderr: null,
    time: null,
    memory: null,
    timeout: false,
    statusId: null,
  });
  const [language, setLanguage] = useState('cpp');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [intelliSenseActive, setIntelliSenseActive] = useState(false);

  // ── AI features state ──────────────────────────────────────────────────────
  const { user } = useAuth();
  const [globalCodeEvaluateEnabled, setGlobalCodeEvaluateEnabled] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [complexity, setComplexity] = useState(null);
  const [showAiResults, setShowAiResults] = useState(true);
  const [localAiEnabled, setLocalAiEnabled] = useState(false);

  // Fetch AI settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (user?.uid) {
        try {
          const snap = await get(ref(database, `users/${user.uid}/profile/settings/codeEvaluateEnabled`));
          if (snap.exists()) {
            setGlobalCodeEvaluateEnabled(snap.val() !== false);
          }
        } catch (e) {
          console.error("Failed to load evaluation setting", e);
        }
      } else {
        setGlobalCodeEvaluateEnabled(true);
      }
    };
    fetchSettings();
  }, [user]);

  // ── Snippet state ──────────────────────────────────────────────────────────
  const [snippets, setSnippets] = useState(loadSnippets);
  const [snippetName, setSnippetName] = useState('');
  const [selectedSnippetId, setSelectedSnippetId] = useState('');
  const [snipPanel, setSnipPanel] = useState(false); // toggle panel
  const [saveMsg, setSaveMsg] = useState(null); // success/error flash

  // Load code and input from localStorage on component mount
  useEffect(() => {
    const savedCode = localStorage.getItem('compiler-code');
    const savedLanguage = localStorage.getItem('compiler-language');
    const savedInput = localStorage.getItem('compiler-input');

    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(languageTemplates['cpp']);
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    if (savedInput) {
      setInput(savedInput);
    }
  }, []);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    if (code) {
      localStorage.setItem('compiler-code', code);
    }
  }, [code]);

  // Save input to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('compiler-input', input);
  }, [input]);

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('compiler-language', language);
  }, [language]);

  // Configure Monaco IntelliSense for the current language whenever it changes
  useEffect(() => {
    if (!monacoRef.current) return;
    const monaco = monacoRef.current;

    // JavaScript / TypeScript language-service settings
    if (language === 'javascript' || language === 'typescript') {
      const tsDefaults = monaco.languages.typescript.typescriptDefaults;
      const jsDefaults = monaco.languages.typescript.javascriptDefaults;

      const compilerOptions = {
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        strictNullChecks: true,
        allowJs: true,
        checkJs: language === 'javascript',
      };
      tsDefaults.setCompilerOptions(compilerOptions);
      jsDefaults.setCompilerOptions(compilerOptions);

      tsDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
      jsDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    }
  }, [language, monacoRef.current]);

  // Called once the Monaco editor instance is ready
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIntelliSenseActive(true);

    // ── JS / TS language-service ──────────────────────────────────────────
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

    // ── Helper ────────────────────────────────────────────────────────────
    const CK = monaco.languages.CompletionItemKind;
    const mkRange = (model, position, word) =>
      new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      );
    const kw = (label, range) => ({ label, kind: CK.Keyword, insertText: label, range });
    const snip = (label, insert, doc, range) => ({
      label, kind: CK.Snippet,
      insertText: insert,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: doc,
      range,
    });
    const fn = (label, insert, doc, range) => ({
      label, kind: CK.Function,
      insertText: insert,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: doc,
      range,
    });

    // ── C++ Completion Provider ───────────────────────────────────────────
    monaco.languages.registerCompletionItemProvider('cpp', {
      triggerCharacters: ['.', ':', '>', '#', '<'],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = mkRange(model, position, word);

        const keywords = [
          'auto', 'break', 'case', 'catch', 'class', 'const', 'constexpr', 'continue',
          'default', 'delete', 'do', 'double', 'else', 'enum', 'explicit', 'extern',
          'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable',
          'namespace', 'new', 'noexcept', 'nullptr', 'operator', 'override', 'private',
          'protected', 'public', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
          'static_assert', 'static_cast', 'struct', 'switch', 'template', 'this', 'throw',
          'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using',
          'virtual', 'void', 'volatile', 'while',
        ].map(k => kw(k, range));

        const snippets = [
          snip('#include <iostream>', '#include <iostream>', 'Include iostream', range),
          snip('#include <vector>', '#include <vector>', 'Include vector', range),
          snip('#include <string>', '#include <string>', 'Include string', range),
          snip('#include <algorithm>', '#include <algorithm>', 'Include algorithm', range),
          snip('#include <map>', '#include <map>', 'Include map', range),
          snip('#include <set>', '#include <set>', 'Include set', range),
          snip('#include <unordered_map>', '#include <unordered_map>', 'Include unordered_map', range),
          snip('#include <queue>', '#include <queue>', 'Include queue', range),
          snip('#include <stack>', '#include <stack>', 'Include stack', range),
          snip('main',
            '#include<bits/stdc++.h>\nusing namespace std;\nint main() {\n\t${1:// code here}\n\treturn 0;\n}',
            'main() skeleton', range),
          snip('for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', 'for loop', range),
          snip('while', 'while (${1:condition}) {\n\t$0\n}', 'while loop', range),
          snip('if', 'if (${1:condition}) {\n\t$0\n}', 'if statement', range),
          snip('ifelse', 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', 'if-else', range),
          snip('class',
            'class ${1:Name} {\npublic:\n\t${1:Name}() {}\n\t$0\n};',
            'class skeleton', range),
          snip('vector<int>', 'vector<int> ${1:v};', 'vector<int>', range),
          snip('cout', 'cout << ${1:msg} << endl;', 'cout statement', range),
          snip('cin', 'cin >> ${1:var};', 'cin statement', range),
          snip('sort', 'sort(${1:v}.begin(), ${1:v}.end());', 'sort vector', range),
          snip('lambda', 'auto ${1:fn} = [${2:&}](${3:args}) {\n\t$0\n};', 'lambda', range),
          snip('pair', 'pair<${1:int}, ${2:int}> ${3:p};', 'pair', range),
          snip('map', 'map<${1:string}, ${2:int}> ${3:m};', 'map', range),
        ];

        const functions = [
          fn('printf', 'printf("${1:%s}", ${2:arg});', 'C printf', range),
          fn('scanf', 'scanf("${1:%d}", &${2:var});', 'C scanf', range),
          fn('strlen', 'strlen(${1:str})', 'String length', range),
          fn('strcmp', 'strcmp(${1:a}, ${2:b})', 'String compare', range),
          fn('memset', 'memset(${1:arr}, ${2:0}, sizeof(${1:arr}));', 'memset', range),
          fn('max', 'max(${1:a}, ${2:b})', 'std::max', range),
          fn('min', 'min(${1:a}, ${2:b})', 'std::min', range),
          fn('abs', 'abs(${1:x})', 'Absolute value', range),
          fn('swap', 'swap(${1:a}, ${2:b});', 'std::swap', range),
          fn('reverse', 'reverse(${1:v}.begin(), ${1:v}.end());', 'Reverse', range),
          fn('find', '${1:v}.find(${2:val})', 'Container find', range),
          fn('push_back', '${1:v}.push_back(${2:val});', 'push_back', range),
          fn('pop_back', '${1:v}.pop_back();', 'pop_back', range),
          fn('size', '${1:v}.size()', 'Container size', range),
          fn('empty', '${1:v}.empty()', 'Container empty', range),
          fn('begin', '${1:v}.begin()', 'begin iterator', range),
          fn('end', '${1:v}.end()', 'end iterator', range),
        ];

        return { suggestions: [...keywords, ...snippets, ...functions] };
      },
    });

    // ── Python Completion Provider ─────────────────────────────────────────
    monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['.', '(', ' '],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = mkRange(model, position, word);

        const keywords = [
          'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
          'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
          'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
          'raise', 'return', 'try', 'while', 'with', 'yield',
        ].map(k => kw(k, range));

        const snippets = [
          snip('def', 'def ${1:function_name}(${2:args}):\n\t$0', 'Function definition', range),
          snip('class', 'class ${1:ClassName}:\n\tdef __init__(self${2:, args}):\n\t\t$0', 'Class definition', range),
          snip('if', 'if ${1:condition}:\n\t$0', 'if statement', range),
          snip('ifelse', 'if ${1:condition}:\n\t$2\nelse:\n\t$0', 'if-else statement', range),
          snip('for', 'for ${1:item} in ${2:iterable}:\n\t$0', 'for loop', range),
          snip('while', 'while ${1:condition}:\n\t$0', 'while loop', range),
          snip('with', 'with ${1:expr} as ${2:var}:\n\t$0', 'with statement', range),
          snip('try', 'try:\n\t$1\nexcept ${2:Exception} as ${3:e}:\n\t$0', 'try-except', range),
          snip('lambda', 'lambda ${1:args}: ${2:expr}', 'lambda expression', range),
          snip('listcomp', '[${1:expr} for ${2:x} in ${3:iterable}]', 'list comprehension', range),
          snip('dictcomp', '{${1:k}: ${2:v} for ${3:k}, ${4:v} in ${5:iterable}.items()}', 'dict comprehension', range),
          snip('main', 'def main():\n\t$0\n\nif __name__ == "__main__":\n\tmain()', 'main() skeleton', range),
          snip('print', 'print(${1:value})', 'print()', range),
          snip('input', '${1:var} = input("${2:Enter: }")', 'input()', range),
          snip('open', 'with open("${1:file.txt}", "${2:r}") as ${3:f}:\n\t$0', 'open file', range),
        ];

        const builtins = [
          fn('print', 'print(${1:value})', 'Print to stdout', range),
          fn('input', 'input("${1:prompt}")', 'Read user input', range),
          fn('len', 'len(${1:obj})', 'Length of object', range),
          fn('range', 'range(${1:start}, ${2:stop})', 'Range function', range),
          fn('int', 'int(${1:x})', 'Convert to int', range),
          fn('float', 'float(${1:x})', 'Convert to float', range),
          fn('str', 'str(${1:x})', 'Convert to str', range),
          fn('list', 'list(${1:iterable})', 'Convert to list', range),
          fn('dict', 'dict(${1:pairs})', 'Convert to dict', range),
          fn('set', 'set(${1:iterable})', 'Convert to set', range),
          fn('tuple', 'tuple(${1:iterable})', 'Convert to tuple', range),
          fn('enumerate', 'enumerate(${1:iterable})', 'Enumerate', range),
          fn('zip', 'zip(${1:a}, ${2:b})', 'Zip iterables', range),
          fn('map', 'map(${1:fn}, ${2:iterable})', 'Map function', range),
          fn('filter', 'filter(${1:fn}, ${2:iterable})', 'Filter function', range),
          fn('sorted', 'sorted(${1:iterable})', 'Sort', range),
          fn('reversed', 'reversed(${1:iterable})', 'Reverse', range),
          fn('max', 'max(${1:iterable})', 'Max value', range),
          fn('min', 'min(${1:iterable})', 'Min value', range),
          fn('sum', 'sum(${1:iterable})', 'Sum of iterable', range),
          fn('abs', 'abs(${1:x})', 'Absolute value', range),
          fn('round', 'round(${1:number}, ${2:ndigits})', 'Round number', range),
          fn('type', 'type(${1:obj})', 'Type of object', range),
          fn('isinstance', 'isinstance(${1:obj}, ${2:type})', 'Type check', range),
          fn('hasattr', 'hasattr(${1:obj}, "${2:attr}")', 'Has attribute', range),
          fn('getattr', 'getattr(${1:obj}, "${2:attr}")', 'Get attribute', range),
          fn('setattr', 'setattr(${1:obj}, "${2:attr}", ${3:val})', 'Set attribute', range),
          fn('open', 'open("${1:file}", "${2:r}")', 'Open file', range),
          fn('append', '${1:lst}.append(${2:val})', 'List append', range),
          fn('extend', '${1:lst}.extend(${2:iterable})', 'List extend', range),
          fn('pop', '${1:lst}.pop(${2:index})', 'List pop', range),
          fn('split', '${1:str}.split("${2:sep}")', 'String split', range),
          fn('join', '"${1:sep}".join(${2:iterable})', 'String join', range),
          fn('strip', '${1:str}.strip()', 'String strip', range),
          fn('format', '"${1:template}".format(${2:args})', 'String format', range),
          fn('items', '${1:dict}.items()', 'Dict items', range),
          fn('keys', '${1:dict}.keys()', 'Dict keys', range),
          fn('values', '${1:dict}.values()', 'Dict values', range),
        ];

        return { suggestions: [...keywords, ...snippets, ...builtins] };
      },
    });

    // ── Java Completion Provider ───────────────────────────────────────────
    monaco.languages.registerCompletionItemProvider('java', {
      triggerCharacters: ['.', '(', ' '],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = mkRange(model, position, word);

        const keywords = [
          'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
          'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
          'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
          'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected',
          'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized',
          'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false',
        ].map(k => kw(k, range));

        const snippets = [
          snip('main',
            'public static void main(String[] args) {\n\t$0\n}',
            'main method', range),
          snip('class',
            'public class ${1:ClassName} {\n\tpublic ${1:ClassName}() {\n\t\t$0\n\t}\n}',
            'Class skeleton', range),
          snip('sout', 'System.out.println(${1:value});', 'Print line', range),
          snip('soutf', 'System.out.printf("${1:%s}%n", ${2:args});', 'Printf', range),
          snip('serr', 'System.err.println(${1:value});', 'Print error', range),
          snip('for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', 'for loop', range),
          snip('foreach', 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t$0\n}', 'enhanced for loop', range),
          snip('while', 'while (${1:condition}) {\n\t$0\n}', 'while loop', range),
          snip('if', 'if (${1:condition}) {\n\t$0\n}', 'if statement', range),
          snip('ifelse', 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', 'if-else', range),
          snip('try', 'try {\n\t$1\n} catch (${2:Exception} ${3:e}) {\n\t${3:e}.printStackTrace();\n}', 'try-catch', range),
          snip('interface',
            'public interface ${1:InterfaceName} {\n\t$0\n}',
            'Interface skeleton', range),
          snip('lambda', '(${1:args}) -> ${2:expression}', 'Lambda expression', range),
          snip('ArrayList', 'ArrayList<${1:Type}> ${2:list} = new ArrayList<>();', 'ArrayList', range),
          snip('HashMap', 'HashMap<${1:K}, ${2:V}> ${3:map} = new HashMap<>();', 'HashMap', range),
          snip('scanner',
            'Scanner ${1:sc} = new Scanner(System.in);\n${2:int} ${3:n} = ${1:sc}.next${4:Int}();',
            'Scanner', range),
        ];

        const methods = [
          fn('System.out.println', 'System.out.println(${1:value});', 'Print with newline', range),
          fn('System.out.print', 'System.out.print(${1:value});', 'Print without newline', range),
          fn('String.valueOf', 'String.valueOf(${1:value})', 'Convert to String', range),
          fn('Integer.parseInt', 'Integer.parseInt(${1:str})', 'Parse int', range),
          fn('Double.parseDouble', 'Double.parseDouble(${1:str})', 'Parse double', range),
          fn('Math.max', 'Math.max(${1:a}, ${2:b})', 'Max value', range),
          fn('Math.min', 'Math.min(${1:a}, ${2:b})', 'Min value', range),
          fn('Math.abs', 'Math.abs(${1:x})', 'Absolute value', range),
          fn('Math.sqrt', 'Math.sqrt(${1:x})', 'Square root', range),
          fn('Math.pow', 'Math.pow(${1:base}, ${2:exp})', 'Power', range),
          fn('Math.floor', 'Math.floor(${1:x})', 'Floor', range),
          fn('Math.ceil', 'Math.ceil(${1:x})', 'Ceiling', range),
          fn('Arrays.sort', 'Arrays.sort(${1:arr});', 'Sort array', range),
          fn('Arrays.fill', 'Arrays.fill(${1:arr}, ${2:val});', 'Fill array', range),
          fn('Collections.sort', 'Collections.sort(${1:list});', 'Sort list', range),
          fn('length', '${1:str}.length()', 'String/array length', range),
          fn('charAt', '${1:str}.charAt(${2:index})', 'Char at index', range),
          fn('substring', '${1:str}.substring(${2:start}, ${3:end})', 'Substring', range),
          fn('equals', '${1:str}.equals(${2:other})', 'String equals', range),
          fn('contains', '${1:str}.contains("${2:seq}")', 'Contains', range),
          fn('toUpperCase', '${1:str}.toUpperCase()', 'To uppercase', range),
          fn('toLowerCase', '${1:str}.toLowerCase()', 'To lowercase', range),
          fn('trim', '${1:str}.trim()', 'Trim whitespace', range),
          fn('split', '${1:str}.split("${2:regex}")', 'Split string', range),
          fn('add', '${1:list}.add(${2:item});', 'List add', range),
          fn('get', '${1:list}.get(${2:index})', 'List get', range),
          fn('size', '${1:list}.size()', 'Collection size', range),
          fn('isEmpty', '${1:obj}.isEmpty()', 'Is empty', range),
          fn('put', '${1:map}.put(${2:key}, ${3:val});', 'Map put', range),
          fn('getOrDefault', '${1:map}.getOrDefault(${2:key}, ${3:def})', 'Map getOrDefault', range),
        ];

        return { suggestions: [...keywords, ...snippets, ...methods] };
      },
    });

    // Focus editor
    editor.focus();
  };

  const handleRunCode = async () => {
    setIsLoading(true);
    setEvaluation(null);
    setComplexity(null);
    setOutput({ stdout: 'Executing...', stderr: null, time: null, memory: null, timeout: false, statusId: null });
    try {
      const result = await executeCode(language, code, input);
      setOutput({
        stdout: result.stdout || result.output || '',
        stderr: result.stderr || result.error || '',
        time: `${result.cpuTime || 0} ms`,
        memory: `${result.memory || 0} KB`,
        timeout: result.timeout || false,
        statusId: result.statusId || null,
      });
    } catch (error) {
      setOutput({
        stdout: '',
        stderr: error.message || 'Execution failed.',
        time: null,
        memory: null,
        timeout: false,
        statusId: null,
      });
    }
    setIsLoading(false);
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    // Load the default template for the selected language
    setCode(languageTemplates[newLanguage] || '');
  };

  const resetToTemplate = () => setCode(languageTemplates[language]);

  // ── AI Functions ────────────────────────────────────────────────────────────
  const handleEvaluateCode = async () => {
    if (!code?.trim()) return;
    setIsEvaluating(true);
    setEvaluation(null);
    try {
      const prompt = `You are a strict code reviewer. Evaluate the following code. Respond ONLY in this exact JSON format (no markdown, no explanation outside JSON):\n{"score": <number 0-100>, "improvements": ["<point 1>", "<point 2>", ...]}`;
      const res = await aiApi.evaluateCode(prompt + "\n\nCode:\n" + code);
      const raw = res.data?.response || res.data?.reply || res.data?.content || '';
      const jsonMatch = raw.match(/{[\s\S]*}/);
      if (jsonMatch) {
        setEvaluation(JSON.parse(jsonMatch[0]));
      } else {
        setEvaluation({ score: null, improvements: [raw] });
      }
    } catch (e) {
      console.error('Evaluation failed:', e);
      setEvaluation({ score: null, improvements: ['Evaluation failed. Please try again.'] });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAnalyzeComplexity = async () => {
    if (!code?.trim()) return;
    setIsAnalyzing(true);
    setComplexity(null);
    try {
      const prompt = `Analyze the time and space complexity of the following code. Provide a short, concise analysis (max 2 sentences).\n\nCode:\n${code}`;
      const res = await aiApi.analyzeComplexity(prompt);
      const raw = res.data?.response || res.data?.reply || res.data?.content || '';
      setComplexity(raw);
    } catch (e) {
      console.error('Analysis failed:', e);
      setComplexity('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Save current code as named snippet ─────────────────────────────────────
  const handleSaveSnippet = () => {
    const name = snippetName.trim();
    if (!name) { setSaveMsg({ type: 'error', text: 'Enter a snippet name first.' }); setTimeout(() => setSaveMsg(null), 2500); return; }
    const now = new Date();
    const label = `${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    const snippet = { id: Date.now().toString(), name, language, code, input, savedAt: label };
    const updated = [snippet, ...snippets];
    setSnippets(updated);
    saveSnippets(updated);
    setSnippetName('');
    setSaveMsg({ type: 'success', text: `"${name}" saved!` });
    setTimeout(() => setSaveMsg(null), 2500);
  };

  // ── Load a snippet into the editor ──────────────────────────────────────────
  const handleLoadSnippet = (id) => {
    const s = snippets.find(x => x.id === id);
    if (!s) return;
    setCode(s.code);
    setInput(s.input || '');
    setLanguage(s.language);
    setSelectedSnippetId(id);
    setSaveMsg({ type: 'success', text: `Loaded "${s.name}"` });
    setTimeout(() => setSaveMsg(null), 2000);
  };

  // ── Delete a snippet ────────────────────────────────────────────────────────
  const handleDeleteSnippet = (id) => {
    const updated = snippets.filter(x => x.id !== id);
    setSnippets(updated);
    saveSnippets(updated);
    if (selectedSnippetId === id) setSelectedSnippetId('');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 md:p-6 bg-gray-100 dark:bg-gray-900 h-[calc(100vh-4rem)] overflow-hidden">
      {/* Code Editor Panel */}
      <div className="flex flex-col w-full md:w-3/5 h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-gray-800 dark:text-gray-200 font-semibold text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            Code Editor
            {intelliSenseActive && (
              <span
                title="Microsoft IntelliSense is active"
                className="flex items-center gap-1 text-[10px] font-semibold tracking-wide bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.134 0L0 11.134v1.732L11.134 24H12.866L24 12.866v-1.732L12.866 0zm-.517 3.47L21.53 12l-10.913 8.53L2.47 12z" />
                </svg>
                IntelliSense
              </span>
            )}
          </h2>
          <div className="flex gap-2 items-center">
            {/* Save/Load toggle */}
            <button
              onClick={() => setSnipPanel(p => !p)}
              title="Saved Snippets"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition ${snipPanel
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              {snippets.length > 0 ? `Snippets (${snippets.length})` : 'Snippets'}
            </button>

            <div className="relative">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="appearance-none bg-white dark:bg-gray-900 text-sm rounded-md pl-3 pr-8 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px] font-medium transition-colors"
                style={{ cursor: 'pointer' }}
              >
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── Save / Load Snippets Panel ───────────────────────────────── */}
        {snipPanel && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-indigo-50/60 dark:bg-indigo-900/20 px-4 py-3 space-y-3">
            {/* Flash message */}
            {saveMsg && (
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${saveMsg.type === 'success'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {saveMsg.text}
              </div>
            )}

            {/* Save row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={snippetName}
                onChange={e => setSnippetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveSnippet()}
                placeholder="Snippet name…"
                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleSaveSnippet}
                className="flex items-center gap-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Save
              </button>
            </div>

            {/* Load row */}
            {snippets.length > 0 && (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saved Snippets</p>
                {snippets.map(s => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${selectedSnippetId === s.id
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600'
                      }`}
                    onClick={() => handleLoadSnippet(s.id)}
                  >
                    {/* Language pill */}
                    <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded uppercase">{s.language}</span>
                    {/* Name */}
                    <span className="flex-1 font-medium text-gray-800 dark:text-gray-100 truncate">{s.name}</span>
                    {/* Date */}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{s.savedAt}</span>
                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteSnippet(s.id); }}
                      className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition ml-1 shrink-0"
                      title="Delete snippet"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {snippets.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">No snippets saved yet. Write some code and hit Save!</p>
            )}
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-grow overflow-hidden" style={{ height: '100%' }}>
          <Editor
            height="100%"
            language={language}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={code}
            onChange={(value) => {
              setCode(value || '');
              setEvaluation(null);
              setComplexity(null);
            }}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,

              // ── IntelliSense ──────────────────────────────────
              quickSuggestions: {
                other: 'on',
                comments: 'on',
                strings: 'on',
              },
              quickSuggestionsDelay: 50,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              acceptSuggestionOnCommitCharacter: true,
              tabCompletion: 'on',
              wordBasedSuggestions: 'allDocuments',
              parameterHints: { enabled: true, cycle: true },
              suggest: {
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showDeprecated: false,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showKeywords: true,
                showWords: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showSnippets: true,
                insertMode: 'replace',
                filterGraceful: true,
                localityBonus: true,
                shareSuggestSelections: false,
                snippetsPreventQuickSuggestions: false,
              },
              inlayHints: { enabled: 'on' },
              hover: { enabled: true, delay: 300 },
              codeActionsOnSave: { 'source.fixAll': true },
              lightbulb: { enabled: 'on' },
              formatOnType: true,
              formatOnPaste: true,
              snippetSuggestions: 'inline',
              // ─────────────────────────────────────────────────
            }}
          />
        </div>

        {/* Run Button removed from left panel to go to header or left as is */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-wrap gap-3">
          <div className="flex gap-3 items-center">
            <button
              onClick={resetToTemplate}
              className="text-xs font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded transition flex items-center gap-1"
              title="Reset code to language default template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Reset
            </button>
            {globalCodeEvaluateEnabled && (
              <button
                onClick={() => setLocalAiEnabled(p => !p)}
                title="Toggle AI Features on this page"
                className={`text-xs font-semibold px-3 py-2 rounded transition flex items-center gap-1.5 border shadow-sm ${localAiEnabled
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60'
                  : 'bg-white text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <svg className={`w-4 h-4 ${localAiEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {localAiEnabled ? 'AI Tools: ON' : 'AI Tools: OFF'}
              </button>
            )}
          </div>
          <div className="flex gap-3 items-center">
            {globalCodeEvaluateEnabled && localAiEnabled && (
              <>
                <button
                  onClick={handleAnalyzeComplexity}
                  className="bg-indigo-100/80 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 px-4 py-2 text-sm rounded-md font-medium transition disabled:bg-gray-400/50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                  disabled={isAnalyzing || !code?.trim()}
                >
                  {isAnalyzing ? (
                    <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"></path></svg> Analyzing...</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Complexity</>
                  )}
                </button>
                <button
                  onClick={handleEvaluateCode}
                  className="bg-purple-100/80 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60 px-4 py-2 text-sm rounded-md font-medium transition disabled:bg-gray-400/50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                  disabled={isEvaluating || !code?.trim()}
                >
                  {isEvaluating ? (
                    <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"></path></svg> Evaluating...</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> AI Evaluate</>
                  )}
                </button>
              </>
            )}
            <button
              onClick={handleRunCode}
              className="bg-[#4285F4] hover:bg-[#357ae8] text-white px-6 py-2 rounded-md font-medium transition disabled:bg-gray-400 flex items-center gap-2 shadow-sm shadow-blue-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Running...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Run Code
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Input & Output */}
      <div className="flex flex-col w-full md:w-2/5 h-full gap-4">
        {/* Input Panel */}
        <div className="flex flex-col h-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex-1 border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
            <h2 className="text-gray-800 dark:text-gray-200 font-semibold text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Input
            </h2>
          </div>
          <div className="flex-grow p-0">
            <textarea
              className="w-full h-full p-4 resize-none bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 font-mono text-sm leading-relaxed"
              placeholder="Enter your input here... (Optional)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck="false"
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col h-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex-1 border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 className="text-gray-800 dark:text-gray-200 font-semibold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Output
              </h2>
            </div>

            {/* Execution Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {/* Execution Time */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{output.time ? output.time : 'N/A'}</span>
                </span>
              </div>

              {/* Memory Used */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800">
                <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{output.memory ? output.memory.replace(/[A-Za-z]/g, '').trim() + ' KB' : 'N/A'}</span>
                </span>
              </div>

              {/* AI Features Enabled indicator */}
              {localAiEnabled && (
                <button
                  onClick={() => globalCodeEvaluateEnabled && setShowAiResults(!showAiResults)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-colors ${globalCodeEvaluateEnabled ? (showAiResults ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer' : 'bg-gray-100 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer') : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-70'}`}
                  title={globalCodeEvaluateEnabled ? `Click to toggle AI Evaluation Results. Currently: ${showAiResults ? 'Visible' : 'Hidden'}` : 'AI features are disabled in your settings.'}
                >
                  <div className={`w-2 h-2 rounded-full shadow-sm ${globalCodeEvaluateEnabled ? (showAiResults ? 'bg-green-500 animate-pulse' : 'bg-yellow-500') : 'bg-gray-400 dark:bg-gray-600'}`}></div>
                  <span className={`font-semibold ${globalCodeEvaluateEnabled ? (showAiResults ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300') : 'text-gray-500 dark:text-gray-400'}`}>
                    AI Evaluate: {showAiResults ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {/* Timeout Status */}
              {output.timeout && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800 animate-pulse">
                  <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                  <span className="font-semibold text-red-600 dark:text-red-400">⏱️ TIMEOUT</span>
                </div>
              )}

              {/* Error Status Badge */}
              {output.statusId === 6 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
                  <svg className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">Compilation Error</span>
                </div>
              )}

              {output.statusId === 7 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 dark:bg-orange-900/30 rounded border border-orange-200 dark:border-orange-800">
                  <svg className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">Runtime Error</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-grow overflow-auto p-4 bg-[#f8f9fa] dark:bg-[#1e1e1e]">
            {/* AI Results */}
            {localAiEnabled && showAiResults && complexity && (
              <div className="w-full mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                <h3 className="text-indigo-900 dark:text-indigo-100 font-bold mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Complexity Analysis
                </h3>
                <p className="text-indigo-800 dark:text-indigo-200 text-sm italic">{complexity}</p>
              </div>
            )}

            {localAiEnabled && showAiResults && evaluation && (
              <div className="mb-6 p-4 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-4 ${evaluation.score >= 80 ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : evaluation.score >= 50 ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                    }`}>
                    {evaluation.score ?? '?'}
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-800 dark:text-gray-100">Code Score</p>
                    <p className={`text-sm font-semibold ${evaluation.score >= 80 ? 'text-green-600 dark:text-green-400'
                      : evaluation.score >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                      }`}>
                      {evaluation.score >= 80 ? '🎉 Great job!' : evaluation.score >= 50 ? '👍 Room to improve' : '⚠️ Needs work'}
                    </p>
                  </div>
                </div>

                {evaluation.improvements?.length > 0 && evaluation.score < 100 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">What to improve:</p>
                    <ul className="space-y-1.5">
                      {evaluation.improvements.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="mt-0.5 text-violet-500 shrink-0">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Standard Outputs */}
            {output.timeout ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 dark:text-red-400 font-semibold mb-1">Execution Timeout!</p>
                <p className="text-sm text-red-500 dark:text-red-300">The code took too long to execute. Check for infinite loops or optimize your code.</p>
                {output.stdout && (
                  <div className="mt-4 text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Partial output before timeout:</p>
                    <pre className="text-gray-800 dark:text-gray-200 font-mono text-sm whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-700">{output.stdout}</pre>
                  </div>
                )}
              </div>
            ) : output.stderr ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Error Output:</p>
                <pre className="text-red-600 dark:text-red-400 font-mono text-sm whitespace-pre-wrap">{output.stderr}</pre>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Standard Output:</p>
                <pre className="text-gray-800 dark:text-gray-200 font-mono text-sm whitespace-pre-wrap">{output.stdout}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
      {localAiEnabled && <FloatingChatbot contextCode={code} isCompiler={true} />}
    </div>
  );
};

export default CompilerPage;
