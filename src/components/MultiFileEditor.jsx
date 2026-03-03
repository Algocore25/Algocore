import React, { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { INTELLISENSE_OPTIONS } from '../hooks/useMonacoIntelliSense';
import { Icons } from '../pages/constants';

/**
 * MultiFileEditor component for handling non-editable and editable file tabs
 */
const MultiFileEditor = ({
  defaultCode,
  language,
  onCodeChange,
  theme,
  savedCode = null
}) => {
  const [activeFileTab, setActiveFileTab] = useState('editable');
  const [fileCodes, setFileCodes] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const layoutTimeoutRef = useRef(null);

  // Initialize file codes from defaultCode structure
  useEffect(() => {
    if (defaultCode && defaultCode.files && !isInitialized) {
      const initialCodes = {};

      Object.entries(defaultCode.files).forEach(([fileType, fileData]) => {
        if (fileType === 'nonEditable') {
          initialCodes[fileData.fileName] = fileData.code;
        } else if (fileType === 'editable') {
          initialCodes[fileData.fileName] = savedCode || fileData.code;
          // Set active tab to editable file by default
          setActiveFileTab(fileData.fileName);
        }
      });

      setFileCodes(initialCodes);
      setIsInitialized(true);
    }
  }, [defaultCode, savedCode, isInitialized]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Create ResizeObserver for layout updates
    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }

      layoutTimeoutRef.current = setTimeout(() => {
        try {
          if (editorRef.current && !editorRef.current.isDisposed()) {
            editorRef.current.layout();
          }
        } catch (error) {
          console.warn('Editor layout error:', error);
        }
      }, 0);
    });

    const container = editor.getContainerDomNode()?.parentElement?.parentElement;
    if (container && resizeObserverRef.current) {
      resizeObserverRef.current.observe(container);
    }

    // Disable Copy (Ctrl + C)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      // Copy disabled logic can be added here if needed
    });

    // Disable Paste (Ctrl + V)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      // Paste disabled logic can be added here if needed
    });

    editor.updateOptions({
      contextmenu: false,
    });
  }, []);

  // Handle code change
  const handleCodeChange = useCallback((newValue) => {
    const updatedCodes = { ...fileCodes };
    updatedCodes[activeFileTab] = newValue;
    setFileCodes(updatedCodes);

    // Only notify parent of changes to editable files
    const fileData = Object.values(defaultCode?.files || {}).find(
      file => file.fileName === activeFileTab
    );

    if (fileData && onCodeChange) {
      onCodeChange(newValue);
    }
  }, [activeFileTab, fileCodes, defaultCode, onCodeChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Get file tabs
  const getFileTabs = () => {
    if (!defaultCode || !defaultCode.files) return [];

    return Object.entries(defaultCode.files).map(([fileType, fileData]) => ({
      fileName: fileData.fileName,
      fileType,
      isEditable: fileType === 'editable'
    }));
  };

  const fileTabs = getFileTabs();
  const currentFileData = fileTabs.find(tab => tab.fileName === activeFileTab);
  const isEditable = currentFileData?.isEditable || false;

  if (!defaultCode || !defaultCode.files) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-auto">
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Icons.FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No code template available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto">
      {/* File Tabs */}
      <div className="bg-gray-50 dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-tertiary">
        <div className="flex overflow-x-auto">
          {fileTabs.map((tab) => (
            <button
              key={tab.fileName}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeFileTab === tab.fileName
                  ? 'text-[#4285F4] border-[#4285F4] bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-[#4285F4] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-tertiary'
                } ${!tab.isEditable ? 'opacity-75' : ''}`}
              onClick={() => setActiveFileTab(tab.fileName)}
            >
              <div className="flex items-center gap-2">
                <Icons.Code2 className="w-4 h-4" />
                <span>{tab.fileName}</span>
                {!tab.isEditable && (
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                    Read-only
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-auto">
        <Editor
          height="100%"
          path={activeFileTab}
          defaultLanguage={language === 'cpp' ? 'cpp' : language}
          language={language === 'cpp' ? 'cpp' : language}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          value={fileCodes[activeFileTab] || ''}
          onChange={isEditable ? handleCodeChange : undefined}
          onMount={handleEditorDidMount}
          options={{
            ...INTELLISENSE_OPTIONS,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
            dragAndDrop: true,
            formatOnPaste: true,
            formatOnType: true,
            readOnly: !isEditable,
          }}
        />
      </div>

      {/* File Info Bar */}
      <div className="bg-gray-50 dark:bg-dark-secondary border-t border-gray-200 dark:border-dark-tertiary px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Icons.FileText className="w-3 h-3" />
              {activeFileTab}
            </span>
            <span className={`px-2 py-1 rounded ${isEditable
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
              {isEditable ? 'Editable' : 'Read-only'}
            </span>
          </div>
          <span className="text-gray-400">
            {language} • {fileCodes[activeFileTab]?.split('\n').length || 0} lines
          </span>
        </div>
      </div>
    </div>
  );
};

export default MultiFileEditor;
