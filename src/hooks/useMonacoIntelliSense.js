/**
 * useMonacoIntelliSense
 * ---------------------
 * Shared hook that wires up full Microsoft IntelliSense for every Monaco
 * Editor instance in the app (C++, Python, Java, SQL, JS/TS).
 *
 * Usage:
 *   const { registerIntelliSense, INTELLISENSE_OPTIONS } = useMonacoIntelliSense();
 *   <Editor onMount={registerIntelliSense} options={{ ...INTELLISENSE_OPTIONS, ...yourOtherOptions }} />
 */

// ─── Editor options (language-agnostic) ──────────────────────────────────────
export const INTELLISENSE_OPTIONS = {
    quickSuggestions: { other: 'on', comments: 'on', strings: 'on' },
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
    lightbulb: { enabled: 'on' },
    formatOnType: true,
    formatOnPaste: true,
    snippetSuggestions: 'inline',
};

// ─── Track whether providers have been registered per Monaco instance ───────
const _registeredMonacoInstances = new WeakSet();

// ─── Main registration function ──────────────────────────────────────────────
/**
 * Call this as the Monaco Editor's `onMount` handler.
 * It registers C++, Python, Java, and SQL completion providers for each Monaco instance
 * and configures the JS/TS language service for richer completions.
 */
export function registerIntelliSense(editor, monaco) {
    // ── JS / TS language service ──────────────────────────────────────────────
    try {
        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

        const compilerOptions = {
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            strictNullChecks: true,
            allowJs: true,
            checkJs: true,
        };
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    } catch (_) { /* not all Monaco builds ship TS defaults */ }

    // Only register completion providers ONCE per Monaco instance (not globally)
    if (_registeredMonacoInstances.has(monaco)) return;
    _registeredMonacoInstances.add(monaco);

    const CK = monaco.languages.CompletionItemKind;

    const mkRange = (model, position, word) =>
        new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

    const kw = (label, range) => ({ label, kind: CK.Keyword, insertText: label, range });
    const snip = (label, insert, doc, range) => ({
        label, kind: CK.Snippet,
        insertText: insert,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: doc, range,
    });
    const fn = (label, insert, doc, range) => ({
        label, kind: CK.Function,
        insertText: insert,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: doc, range,
    });

    // ── Local Variable Extraction Helper ─────────────────────────────────────
    /**
     * Extracts local variables from the current document up to the cursor position
     * Supports C, C++, Python, Java, and basic variable declarations
     */
    const getLocalVariables = (model, position) => {
        const variables = new Set();
        const lines = model.getLinesContent();
        const currentLine = position.lineNumber - 1;

        // Scan lines up to current position
        for (let i = 0; i <= currentLine && i < lines.length; i++) {
            const line = lines[i];
            const isCurrentLine = i === currentLine;
            const stopAtColumn = isCurrentLine ? position.column - 1 : line.length;
            const lineToCheck = line.substring(0, stopAtColumn);

            // Skip comments and strings
            if (lineToCheck.trim().startsWith('//') || lineToCheck.trim().startsWith('#') ||
                lineToCheck.includes('/*') || lineToCheck.includes('*')) {
                continue;
            }

            // C/C++ variable declarations (int x, double y, char* ptr, etc.)
            const cppVarRegex = /\b(?:auto|char|double|float|int|long|short|signed|unsigned|bool|string|vector|map|set|queue|stack|pair|iterator|const|static|extern)\s+(?:\*?\s*)([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
            let match;
            while ((match = cppVarRegex.exec(lineToCheck)) !== null) {
                variables.add(match[1]);
            }

            // Function parameters
            const funcParamRegex = /\b(?:[a-zA-Z_][a-zA-Z0-9_<>:*&\s]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:[,)]|$)/g;
            while ((match = funcParamRegex.exec(lineToCheck)) !== null) {
                if (match[1] && !match[1].includes(' ') && !['int', 'char', 'void', 'double', 'float'].includes(match[1])) {
                    variables.add(match[1]);
                }
            }

            // Python variable assignments (x =, y :=, etc.)
            const pythonVarRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|:=)\s/g;
            while ((match = pythonVarRegex.exec(lineToCheck)) !== null) {
                variables.add(match[1]);
            }

            // Java variable declarations
            const javaVarRegex = /\b(?:int|double|float|char|boolean|long|short|byte|String|ArrayList|HashMap|List|Map|Set|Queue|Stack)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
            while ((match = javaVarRegex.exec(lineToCheck)) !== null) {
                variables.add(match[1]);
            }

            // For loop variables (for i in, for(int i =, etc.)
            const forLoopRegex = /(?:for\s*\(\s*(?:int|char|double|float|long|short)?\s*)?([a-zA-Z_][a-zA-Z0-9_]*)/g;
            while ((match = forLoopRegex.exec(lineToCheck)) !== null) {
                variables.add(match[1]);
            }
        }

        return Array.from(variables);
    };

    // ── C ───────────────────────────────────────────────────────────────────
    monaco.languages.registerCompletionItemProvider('c', {
        triggerCharacters: ['.', '#', '<', '(', ' '],
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = mkRange(model, position, word);

            // Get local variables from the current document
            const localVariables = getLocalVariables(model, position);

            const keywords = [
                'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
                'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
                'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
                'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
                'true', 'false', 'NULL',
            ].map(k => kw(k, range));

            const snippets = [
                snip('#include <stdio.h>', '#include <stdio.h>', 'Include stdio.h', range),
                snip('#include <stdlib.h>', '#include <stdlib.h>', 'Include stdlib.h', range),
                snip('#include <string.h>', '#include <string.h>', 'Include string.h', range),
                snip('#include <math.h>', '#include <math.h>', 'Include math.h', range),
                snip('#include <stdbool.h>', '#include <stdbool.h>', 'Include stdbool.h', range),
                snip('#include <ctype.h>', '#include <ctype.h>', 'Include ctype.h', range),
                snip('#include <limits.h>', '#include <limits.h>', 'Include limits.h', range),
                snip('#include <time.h>', '#include <time.h>', 'Include time.h', range),
                snip('main',
                    'int main() {\n\t${1:// code}\n\treturn 0;\n}',
                    'main() function', range),
                snip('for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', 'for loop', range),
                snip('while', 'while (${1:condition}) {\n\t$0\n}', 'while loop', range),
                snip('if', 'if (${1:condition}) {\n\t$0\n}', 'if statement', range),
                snip('ifelse', 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', 'if-else', range),
                snip('struct', 'struct ${1:Name} {\n\t${2:type} ${3:member};\n\t$0\n};', 'struct definition', range),
                snip('typedef', 'typedef struct {\n\t${2:type} ${3:member};\n\t$0\n} ${1:Name};', 'typedef struct', range),
                snip('printf', 'printf("${1:%s}", ${2:arg});', 'printf', range),
                snip('scanf', 'scanf("${1:%d}", &${2:var});', 'scanf', range),
                snip('malloc', '${1:ptr} = (${2:type}*)malloc(sizeof(${2:type}) * ${3:size});', 'malloc', range),
                snip('free', 'free(${1:ptr});', 'free', range),
                snip('sizeof', 'sizeof(${1:type})', 'sizeof operator', range),
                snip('switch', 'switch (${1:variable}) {\n\tcase ${2:value}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}', 'switch statement', range),
                snip('do-while', 'do {\n\t$0\n} while (${1:condition});', 'do-while loop', range),
                snip('function', '${1:return_type} ${2:function_name}(${3:params}) {\n\t$0\n}', 'function definition', range),
                snip('pointer', '${1:type} *${2:pointer};', 'pointer declaration', range),
            ];

            const functions = [
                fn('printf', 'printf("${1:format}", ${2:args});', 'Print formatted output', range),
                fn('scanf', 'scanf("${1:format}", &${2:args});', 'Read formatted input', range),
                fn('fprintf', 'fprintf(${1:stream}, "${2:format}", ${3:args});', 'Print to stream', range),
                fn('fscanf', 'fscanf(${1:stream}, "${2:format}", &${3:args});', 'Read from stream', range),
                fn('sprintf', 'sprintf(${1:buffer}, "${2:format}", ${3:args});', 'Print to string', range),
                fn('sscanf', 'sscanf(${1:string}, "${2:format}", &${3:args});', 'Read from string', range),
                fn('malloc', 'malloc(${1:size})', 'Allocate memory', range),
                fn('calloc', 'calloc(${1:count}, ${2:size})', 'Allocate and zero memory', range),
                fn('realloc', 'realloc(${1:ptr}, ${2:size})', 'Reallocate memory', range),
                fn('free', 'free(${1:ptr})', 'Free memory', range),
                fn('memcpy', 'memcpy(${1:dest}, ${2:src}, ${3:n})', 'Copy memory', range),
                fn('memset', 'memset(${1:ptr}, ${2:value}, ${3:n})', 'Set memory', range),
                fn('memmove', 'memmove(${1:dest}, ${2:src}, ${3:n})', 'Move memory', range),
                fn('memcmp', 'memcmp(${1:ptr1}, ${2:ptr2}, ${3:n})', 'Compare memory', range),
                fn('strlen', 'strlen(${1:str})', 'String length', range),
                fn('strcpy', 'strcpy(${1:dest}, ${2:src})', 'Copy string', range),
                fn('strncpy', 'strncpy(${1:dest}, ${2:src}, ${3:n})', 'Copy string with limit', range),
                fn('strcat', 'strcat(${1:dest}, ${2:src})', 'Concatenate strings', range),
                fn('strncat', 'strncat(${1:dest}, ${2:src}, ${3:n})', 'Concatenate with limit', range),
                fn('strcmp', 'strcmp(${1:str1}, ${2:str2})', 'Compare strings', range),
                fn('strncmp', 'strncmp(${1:str1}, ${2:str2}, ${3:n})', 'Compare strings with limit', range),
                fn('strchr', 'strchr(${1:str}, ${2:ch})', 'Find character in string', range),
                fn('strstr', 'strstr(${1:haystack}, ${2:needle})', 'Find substring', range),
                fn('atoi', 'atoi(${1:str})', 'Convert string to int', range),
                fn('atof', 'atof(${1:str})', 'Convert string to double', range),
                fn('atol', 'atol(${1:str})', 'Convert string to long', range),
                fn('sprintf', 'sprintf(${1:buffer}, "${2:format}", ${3:args});', 'Format string', range),
                fn('abs', 'abs(${1:x})', 'Absolute value (int)', range),
                fn('labs', 'labs(${1:x})', 'Absolute value (long)', range),
                fn('fabs', 'fabs(${1:x})', 'Absolute value (double)', range),
                fn('sqrt', 'sqrt(${1:x})', 'Square root', range),
                fn('pow', 'pow(${1:base}, ${2:exp})', 'Power function', range),
                fn('sin', 'sin(${1:x})', 'Sine function', range),
                fn('cos', 'cos(${1:x})', 'Cosine function', range),
                fn('tan', 'tan(${1:x})', 'Tangent function', range),
                fn('log', 'log(${1:x})', 'Natural logarithm', range),
                fn('log10', 'log10(${1:x})', 'Base-10 logarithm', range),
                fn('exp', 'exp(${1:x})', 'Exponential function', range),
                fn('rand', 'rand()', 'Random number', range),
                fn('srand', 'srand(${1:seed})', 'Seed random generator', range),
                fn('time', 'time(NULL)', 'Get current time', range),
                fn('clock', 'clock()', 'Get processor time', range),
                fn('exit', 'exit(${1:code})', 'Exit program', range),
                fn('system', 'system("${1:command}")', 'Execute system command', range),
                fn('fopen', 'fopen("${1:filename}", "${2:mode}")', 'Open file', range),
                fn('fclose', 'fclose(${1:file})', 'Close file', range),
                fn('fread', 'fread(${1:buffer}, ${2:size}, ${3:count}, ${4:file})', 'Read from file', range),
                fn('fwrite', 'fwrite(${1:buffer}, ${2:size}, ${3:count}, ${4:file})', 'Write to file', range),
                fn('fseek', 'fseek(${1:file}, ${2:offset}, ${3:whence})', 'Seek in file', range),
                fn('ftell', 'ftell(${1:file})', 'Get file position', range),
                fn('rewind', 'rewind(${1:file})', 'Rewind file', range),
                fn('feof', 'feof(${1:file})', 'Check end of file', range),
                fn('ferror', 'ferror(${1:file})', 'Check file error', range),
                fn('clearerr', 'clearerr(${1:file})', 'Clear file error', range),
                fn('remove', 'remove("${1:filename}")', 'Remove file', range),
                fn('rename', 'rename("${1:oldname}", "${2:newname}")', 'Rename file', range),
                fn('tmpfile', 'tmpfile()', 'Create temporary file', range),
                fn('tmpnam', 'tmpnam(${1:buffer})', 'Create temporary filename', range),
            ];

            // Convert local variables to completion items
            const localVarSuggestions = localVariables.map(varName => ({
                label: varName,
                kind: CK.Variable,
                insertText: varName,
                range,
                documentation: `Local variable: ${varName}`
            }));

            return { suggestions: [...keywords, ...snippets, ...functions, ...localVarSuggestions] };
        },
    });

    // ── C++ ──────────────────────────────────────────────────────────────────
    monaco.languages.registerCompletionItemProvider('cpp', {
        triggerCharacters: ['.', ':', '>', '#', '<'],
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = mkRange(model, position, word);

            // Get local variables from the current document
            const localVariables = getLocalVariables(model, position);

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
                    '#include<bits/stdc++.h>\nusing namespace std;\nint main() {\n\t${1:// code}\n\treturn 0;\n}',
                    'main() skeleton', range),
                snip('for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', 'for loop', range),
                snip('while', 'while (${1:condition}) {\n\t$0\n}', 'while loop', range),
                snip('if', 'if (${1:condition}) {\n\t$0\n}', 'if statement', range),
                snip('ifelse', 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', 'if-else', range),
                snip('class', 'class ${1:Name} {\npublic:\n\t${1:Name}() {}\n\t$0\n};', 'class skeleton', range),
                snip('cout', 'cout << ${1:msg} << endl;', 'cout', range),
                snip('cin', 'cin >> ${1:var};', 'cin', range),
                snip('sort', 'sort(${1:v}.begin(), ${1:v}.end());', 'sort vector', range),
                snip('lambda', 'auto ${1:fn} = [${2:&}](${3:args}) {\n\t$0\n};', 'lambda', range),
                snip('pair', 'pair<${1:int}, ${2:int}> ${3:p};', 'pair', range),
                snip('map', 'map<${1:string}, ${2:int}> ${3:m};', 'map', range),
                snip('vector<int>', 'vector<int> ${1:v};', 'vector<int>', range),
            ];

            const functions = [
                fn('printf', 'printf("${1:%s}", ${2:arg});', 'C printf', range),
                fn('scanf', 'scanf("${1:%d}", &${2:var});', 'C scanf', range),
                fn('max', 'max(${1:a}, ${2:b})', 'std::max', range),
                fn('min', 'min(${1:a}, ${2:b})', 'std::min', range),
                fn('abs', 'abs(${1:x})', 'Absolute value', range),
                fn('swap', 'swap(${1:a}, ${2:b});', 'std::swap', range),
                fn('reverse', 'reverse(${1:v}.begin(), ${1:v}.end());', 'Reverse', range),
                fn('push_back', '${1:v}.push_back(${2:val});', 'push_back', range),
                fn('pop_back', '${1:v}.pop_back();', 'pop_back', range),
                fn('size', '${1:v}.size()', 'size', range),
                fn('empty', '${1:v}.empty()', 'empty', range),
                fn('find', '${1:v}.find(${2:val})', 'find', range),
                fn('memset', 'memset(${1:arr}, ${2:0}, sizeof(${1:arr}));', 'memset', range),
                fn('strlen', 'strlen(${1:str})', 'strlen', range),
            ];

            // Convert local variables to completion items
            const localVarSuggestions = localVariables.map(varName => ({
                label: varName,
                kind: CK.Variable,
                insertText: varName,
                range,
                documentation: `Local variable: ${varName}`
            }));

            return { suggestions: [...keywords, ...snippets, ...functions, ...localVarSuggestions] };
        },
    });

    // ── Python ────────────────────────────────────────────────────────────────
    monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.', '('],
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = mkRange(model, position, word);

            // Get local variables from the current document
            const localVariables = getLocalVariables(model, position);

            const keywords = [
                'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
                'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
                'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
                'raise', 'return', 'try', 'while', 'with', 'yield',
            ].map(k => kw(k, range));

            const snippets = [
                snip('def', 'def ${1:fn}(${2:args}):\n\t$0', 'Function definition', range),
                snip('class', 'class ${1:Name}:\n\tdef __init__(self${2:, args}):\n\t\t$0', 'Class definition', range),
                snip('if', 'if ${1:condition}:\n\t$0', 'if statement', range),
                snip('ifelse', 'if ${1:condition}:\n\t$2\nelse:\n\t$0', 'if-else', range),
                snip('for', 'for ${1:item} in ${2:iterable}:\n\t$0', 'for loop', range),
                snip('while', 'while ${1:condition}:\n\t$0', 'while loop', range),
                snip('try', 'try:\n\t$1\nexcept ${2:Exception} as ${3:e}:\n\t$0', 'try-except', range),
                snip('with', 'with ${1:expr} as ${2:var}:\n\t$0', 'with statement', range),
                snip('lambda', 'lambda ${1:args}: ${2:expr}', 'lambda', range),
                snip('listcomp', '[${1:expr} for ${2:x} in ${3:iterable}]', 'list comprehension', range),
                snip('dictcomp', '{${1:k}: ${2:v} for ${3:k}, ${4:v} in ${5:iter}.items()}', 'dict comprehension', range),
                snip('main', 'def main():\n\t$0\n\nif __name__ == "__main__":\n\tmain()', 'main() skeleton', range),
                snip('open', 'with open("${1:file}", "${2:r}") as ${3:f}:\n\t$0', 'open file', range),
            ];

            const builtins = [
                fn('print', 'print(${1:value})', 'print()', range),
                fn('input', 'input("${1:prompt}")', 'input()', range),
                fn('len', 'len(${1:obj})', 'len()', range),
                fn('range', 'range(${1:start}, ${2:stop})', 'range()', range),
                fn('int', 'int(${1:x})', 'int()', range),
                fn('float', 'float(${1:x})', 'float()', range),
                fn('str', 'str(${1:x})', 'str()', range),
                fn('list', 'list(${1:iterable})', 'list()', range),
                fn('dict', 'dict(${1:pairs})', 'dict()', range),
                fn('set', 'set(${1:iterable})', 'set()', range),
                fn('tuple', 'tuple(${1:iterable})', 'tuple()', range),
                fn('enumerate', 'enumerate(${1:iterable})', 'enumerate()', range),
                fn('zip', 'zip(${1:a}, ${2:b})', 'zip()', range),
                fn('map', 'map(${1:fn}, ${2:iterable})', 'map()', range),
                fn('filter', 'filter(${1:fn}, ${2:iterable})', 'filter()', range),
                fn('sorted', 'sorted(${1:iterable})', 'sorted()', range),
                fn('max', 'max(${1:iterable})', 'max()', range),
                fn('min', 'min(${1:iterable})', 'min()', range),
                fn('sum', 'sum(${1:iterable})', 'sum()', range),
                fn('abs', 'abs(${1:x})', 'abs()', range),
                fn('round', 'round(${1:n}, ${2:digits})', 'round()', range),
                fn('type', 'type(${1:obj})', 'type()', range),
                fn('isinstance', 'isinstance(${1:obj}, ${2:type})', 'isinstance()', range),
                fn('append', '${1:lst}.append(${2:val})', 'list.append()', range),
                fn('split', '${1:s}.split("${2:sep}")', 'str.split()', range),
                fn('join', '"${1:sep}".join(${2:iterable})', 'str.join()', range),
                fn('strip', '${1:s}.strip()', 'str.strip()', range),
                fn('items', '${1:d}.items()', 'dict.items()', range),
                fn('keys', '${1:d}.keys()', 'dict.keys()', range),
                fn('values', '${1:d}.values()', 'dict.values()', range),
            ];

            // Convert local variables to completion items
            const localVarSuggestions = localVariables.map(varName => ({
                label: varName,
                kind: CK.Variable,
                insertText: varName,
                range,
                documentation: `Local variable: ${varName}`
            }));

            return { suggestions: [...keywords, ...snippets, ...builtins, ...localVarSuggestions] };
        },
    });

    // ── Java ──────────────────────────────────────────────────────────────────
    monaco.languages.registerCompletionItemProvider('java', {
        triggerCharacters: ['.', '('],
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = mkRange(model, position, word);

            // Get local variables from the current document
            const localVariables = getLocalVariables(model, position);

            const keywords = [
                'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
                'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
                'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
                'interface', 'long', 'native', 'new', 'null', 'package', 'private', 'protected',
                'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized',
                'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false',
            ].map(k => kw(k, range));

            const snippets = [
                snip('main', 'public static void main(String[] args) {\n\t$0\n}', 'main method', range),
                snip('class', 'public class ${1:Name} {\n\tpublic ${1:Name}() {\n\t\t$0\n\t}\n}', 'class skeleton', range),
                snip('sout', 'System.out.println(${1:value});', 'sout', range),
                snip('soutf', 'System.out.printf("${1:%s}%n", ${2:args});', 'printf', range),
                snip('for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', 'for loop', range),
                snip('foreach', 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t$0\n}', 'foreach', range),
                snip('while', 'while (${1:condition}) {\n\t$0\n}', 'while loop', range),
                snip('if', 'if (${1:condition}) {\n\t$0\n}', 'if statement', range),
                snip('ifelse', 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', 'if-else', range),
                snip('try', 'try {\n\t$1\n} catch (${2:Exception} ${3:e}) {\n\t${3:e}.printStackTrace();\n}', 'try-catch', range),
                snip('interface', 'public interface ${1:Name} {\n\t$0\n}', 'interface', range),
                snip('lambda', '(${1:args}) -> ${2:expression}', 'lambda', range),
                snip('ArrayList', 'ArrayList<${1:Type}> ${2:list} = new ArrayList<>();', 'ArrayList', range),
                snip('HashMap', 'HashMap<${1:K}, ${2:V}> ${3:map} = new HashMap<>();', 'HashMap', range),
                snip('scanner', 'Scanner ${1:sc} = new Scanner(System.in);\n${2:int} ${3:n} = ${1:sc}.next${4:Int}();', 'Scanner', range),
            ];

            const methods = [
                fn('System.out.println', 'System.out.println(${1:value});', 'Print line', range),
                fn('System.out.print', 'System.out.print(${1:value});', 'Print', range),
                fn('Integer.parseInt', 'Integer.parseInt(${1:str})', 'Parse int', range),
                fn('Double.parseDouble', 'Double.parseDouble(${1:str})', 'Parse double', range),
                fn('String.valueOf', 'String.valueOf(${1:value})', 'To string', range),
                fn('Math.max', 'Math.max(${1:a}, ${2:b})', 'Math.max', range),
                fn('Math.min', 'Math.min(${1:a}, ${2:b})', 'Math.min', range),
                fn('Math.abs', 'Math.abs(${1:x})', 'Math.abs', range),
                fn('Math.sqrt', 'Math.sqrt(${1:x})', 'Math.sqrt', range),
                fn('Math.pow', 'Math.pow(${1:base}, ${2:exp})', 'Math.pow', range),
                fn('Arrays.sort', 'Arrays.sort(${1:arr});', 'Arrays.sort', range),
                fn('Arrays.fill', 'Arrays.fill(${1:arr}, ${2:val});', 'Arrays.fill', range),
                fn('Collections.sort', 'Collections.sort(${1:list});', 'Collections.sort', range),
                fn('length', '${1:str}.length()', 'length()', range),
                fn('charAt', '${1:str}.charAt(${2:index})', 'charAt()', range),
                fn('substring', '${1:str}.substring(${2:start}, ${3:end})', 'substring()', range),
                fn('equals', '${1:str}.equals(${2:other})', 'equals()', range),
                fn('contains', '${1:str}.contains("${2:seq}")', 'contains()', range),
                fn('split', '${1:str}.split("${2:regex}")', 'split()', range),
                fn('trim', '${1:str}.trim()', 'trim()', range),
                fn('add', '${1:list}.add(${2:item});', 'add()', range),
                fn('get', '${1:list}.get(${2:index})', 'get()', range),
                fn('size', '${1:list}.size()', 'size()', range),
                fn('isEmpty', '${1:obj}.isEmpty()', 'isEmpty()', range),
                fn('put', '${1:map}.put(${2:key}, ${3:val});', 'put()', range),
                fn('getOrDefault', '${1:map}.getOrDefault(${2:key}, ${3:def})', 'getOrDefault()', range),
            ];

            // Convert local variables to completion items
            const localVarSuggestions = localVariables.map(varName => ({
                label: varName,
                kind: CK.Variable,
                insertText: varName,
                range,
                documentation: `Local variable: ${varName}`
            }));

            return { suggestions: [...keywords, ...snippets, ...methods, ...localVarSuggestions] };
        },
    });

    // ── SQL ───────────────────────────────────────────────────────────────────
    monaco.languages.registerCompletionItemProvider('sql', {
        triggerCharacters: [' ', '.', '('],
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = mkRange(model, position, word);

            // Get potential table/column names from the current document
            const localVariables = getLocalVariables(model, position);

            const keywords = [
                'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL',
                'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO',
                'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'ADD',
                'COLUMN', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'NOT', 'NULL',
                'DEFAULT', 'AUTO_INCREMENT', 'INDEX', 'VIEW', 'AS', 'DISTINCT', 'ALL', 'AND',
                'OR', 'IN', 'NOT IN', 'BETWEEN', 'LIKE', 'IS', 'IS NOT', 'EXISTS', 'UNION',
                'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH', 'RECURSIVE', 'EXPLAIN',
                'TRANSACTION', 'COMMIT', 'ROLLBACK', 'BEGIN',
            ].map(k => kw(k, range));

            const snippets = [
                snip('SELECT *',
                    'SELECT * FROM ${1:table_name};',
                    'Select all', range),
                snip('SELECT cols',
                    'SELECT ${1:col1}, ${2:col2}\nFROM ${3:table_name}\nWHERE ${4:condition};',
                    'Select with condition', range),
                snip('INSERT',
                    'INSERT INTO ${1:table} (${2:col1}, ${3:col2})\nVALUES (${4:val1}, ${5:val2});',
                    'Insert row', range),
                snip('UPDATE',
                    'UPDATE ${1:table}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition};',
                    'Update row', range),
                snip('DELETE',
                    'DELETE FROM ${1:table}\nWHERE ${2:condition};',
                    'Delete rows', range),
                snip('CREATE TABLE',
                    'CREATE TABLE ${1:table_name} (\n\tid INT PRIMARY KEY AUTO_INCREMENT,\n\t${2:column} ${3:VARCHAR(255)}\n);',
                    'Create table', range),
                snip('JOIN',
                    'SELECT ${1:cols}\nFROM ${2:table1}\nJOIN ${3:table2} ON ${2:table1}.${4:id} = ${3:table2}.${5:fk};',
                    'INNER JOIN', range),
                snip('LEFT JOIN',
                    'SELECT ${1:cols}\nFROM ${2:table1}\nLEFT JOIN ${3:table2} ON ${2:table1}.${4:id} = ${3:table2}.${5:fk};',
                    'LEFT JOIN', range),
                snip('GROUP BY',
                    'SELECT ${1:col}, COUNT(*)\nFROM ${2:table}\nGROUP BY ${1:col};',
                    'Group By', range),
                snip('HAVING',
                    'SELECT ${1:col}, COUNT(*)\nFROM ${2:table}\nGROUP BY ${1:col}\nHAVING COUNT(*) > ${3:1};',
                    'Having clause', range),
                snip('subquery',
                    'SELECT * FROM ${1:table}\nWHERE ${2:column} IN (\n\tSELECT ${2:column} FROM ${3:other_table} WHERE ${4:condition}\n);',
                    'Subquery', range),
                snip('CASE',
                    'CASE\n\tWHEN ${1:condition} THEN ${2:result}\n\tELSE ${3:default}\nEND',
                    'CASE expression', range),
            ];

            const functions = [
                fn('COUNT', 'COUNT(${1:*})', 'COUNT()', range),
                fn('SUM', 'SUM(${1:column})', 'SUM()', range),
                fn('AVG', 'AVG(${1:column})', 'AVG()', range),
                fn('MAX', 'MAX(${1:column})', 'MAX()', range),
                fn('MIN', 'MIN(${1:column})', 'MIN()', range),
                fn('CONCAT', 'CONCAT(${1:str1}, ${2:str2})', 'CONCAT()', range),
                fn('LENGTH', 'LENGTH(${1:str})', 'LENGTH()', range),
                fn('UPPER', 'UPPER(${1:str})', 'UPPER()', range),
                fn('LOWER', 'LOWER(${1:str})', 'LOWER()', range),
                fn('TRIM', 'TRIM(${1:str})', 'TRIM()', range),
                fn('NOW', 'NOW()', 'NOW()', range),
                fn('COALESCE', 'COALESCE(${1:val}, ${2:default})', 'COALESCE()', range),
                fn('IFNULL', 'IFNULL(${1:val}, ${2:default})', 'IFNULL()', range),
                fn('ROUND', 'ROUND(${1:num}, ${2:decimals})', 'ROUND()', range),
                fn('FLOOR', 'FLOOR(${1:num})', 'FLOOR()', range),
                fn('CEIL', 'CEIL(${1:num})', 'CEIL()', range),
                fn('DATEDIFF', 'DATEDIFF(${1:date1}, ${2:date2})', 'DATEDIFF()', range),
                fn('DATE_FORMAT', 'DATE_FORMAT(${1:date}, "${2:%Y-%m-%d}")', 'DATE_FORMAT()', range),
                fn('SUBSTRING', 'SUBSTRING(${1:str}, ${2:start}, ${3:len})', 'SUBSTRING()', range),
                fn('REPLACE', 'REPLACE(${1:str}, "${2:find}", "${3:replace}")', 'REPLACE()', range),
            ];

            // Convert detected table/column names to completion items
            const tableColumnSuggestions = localVariables.map(varName => ({
                label: varName,
                kind: CK.Field,
                insertText: varName,
                range,
                documentation: `Table/Column: ${varName}`
            }));

            return { suggestions: [...keywords, ...snippets, ...functions, ...tableColumnSuggestions] };
        },
    });
}
