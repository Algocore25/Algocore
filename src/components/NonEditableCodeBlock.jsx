import React from 'react';

function copyToClipboard(text) {
    try {
        navigator.clipboard.writeText(text);
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
}

export default function NonEditableCodeBlock({ blocks = [], language = 'text' }) {
    if (!blocks || blocks.length === 0) return null;

    return (
        <div className="space-y-4">
            {blocks.map((block, idx) => (
                <div key={idx} className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {block.title || Block ${idx + 1}}
                        </div>
                        <button
                            onClick={() => copyToClipboard(block.content)}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-tertiary rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                        >
                            Copy
                        </button>
                    </div>
                    <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 overflow-auto" aria-readonly="true">
                        {block.content}
                    </pre>
                </div>
            ))}
        </div>
    );
}
