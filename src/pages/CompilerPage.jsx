import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { executeCode } from './api';
import { languageTemplates } from './constants';

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
  });
  const [language, setLanguage] = useState('cpp');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [intelliSenseActive, setIntelliSenseActive] = useState(false);

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
    setOutput({ stdout: 'Executing...', stderr: null, time: null, memory: null });
    try {
      const result = await executeCode(language, code, input);
      setOutput({
        stdout: result.run.stdout || '',
        stderr: result.run.stderr || '',
        time: `${result.run.cpuTime} ms`,
        memory: `${result.run.memory} KB`,
      });
    } catch (error) {
      setOutput({
        stdout: '',
        stderr: error.message || 'Execution failed.',
        time: null,
        memory: null,
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
            onChange={(value) => setCode(value || '')}
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
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetToTemplate}
            className="text-xs font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded transition flex items-center gap-1"
            title="Reset code to language default template"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Reset
          </button>
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
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-gray-800 dark:text-gray-200 font-semibold text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Output
            </h2>
            {output.time && output.memory && (
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                <span className="flex items-center gap-1" title="Execution Time">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {output.time}
                </span>
                <span className="w-px h-3 bg-gray-300 dark:bg-gray-600 border-l"></span>
                <span className="flex items-center gap-1" title="Memory Used">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                  {output.memory.replace(/[A-Za-z]/g, '').trim()} KB
                </span>
              </div>
            )}
          </div>
          <div className="flex-grow overflow-auto p-4 bg-[#f8f9fa] dark:bg-[#1e1e1e]">
            {output.stderr ? (
              <pre className="text-red-600 dark:text-red-400 font-mono text-sm whitespace-pre-wrap">{output.stderr}</pre>
            ) : (
              <pre className="text-gray-800 dark:text-gray-200 font-mono text-sm whitespace-pre-wrap">{output.stdout}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompilerPage;
