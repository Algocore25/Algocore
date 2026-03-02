import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, BookMarked, Code, AlertCircle } from 'lucide-react';

import { courseContent } from '../utils/courseContent';


const parseInlineMarkdown = (text) => {
    if (typeof text !== 'string') return text;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-mono text-green-600 dark:text-green-400">{part.slice(1, -1)}</code>;
        } else {
            return part;
        }
    });
};

const renderContent = (content, theme) => {
    // Split by both code blocks and compiler blocks
    const parts = content.split(/(```[\s\S]*?```|<COMPILER>[\s\S]*?<\/COMPILER>)/g);

    return <>{parts.map((part, idx) => {
        // Handle compiler blocks
        if (part.startsWith('<COMPILER>') && part.endsWith('</COMPILER>')) {
            const code = part.replace(/<COMPILER>|<\/COMPILER>/g, '').trim();

            return (
                <div key={idx} className={`rounded overflow-hidden my-6 border-2 ${theme === 'dark'
                    ? 'border-blue-600 bg-[#0d1424]'
                    : 'border-blue-400 bg-[#f8f9fa]'
                    }`}>
                    <div className={`px-4 py-3 text-sm font-bold flex justify-between items-center ${theme === 'dark'
                        ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-blue-200 border-b border-blue-700'
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-b border-blue-300'
                        }`}>
                        <span className="flex items-center gap-2">
                            <Code size={16} />
                            <span>Try it Yourself - Run Code</span>
                        </span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(code);
                                alert('Code copied!');
                            }}
                            className={`text-xs px-2 py-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-blue-800' : 'hover:bg-blue-200'}`}
                        >
                            Copy
                        </button>
                    </div>
                    <div className={`p-4 overflow-x-auto font-mono text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                        }`}>
                        <pre className="whitespace-pre-wrap break-words">{code}</pre>
                    </div>
                    <div className={`px-4 py-3 text-xs italic flex items-center gap-2 ${theme === 'dark'
                        ? 'bg-blue-900/20 text-blue-300 border-t border-blue-700'
                        : 'bg-blue-50 text-blue-700 border-t border-blue-200'
                        }`}>
                        <AlertCircle size={14} />
                        <span>💡 Click the Copy button to copy this code and run it in your Java IDE</span>
                    </div>
                </div>
            );
        }
        // Handle regular code blocks
        else if (part.startsWith('```') && part.endsWith('```')) {
            const code = part.replace(/```/g, '').trim();
            const lang = code.split('\n')[0] || 'code';
            const codeContent = code.includes('\n') ? code.split('\n').slice(1).join('\n') : code;

            return (
                <div key={idx} className={`rounded overflow-hidden my-6 border ${theme === 'dark'
                    ? 'border-gray-700 bg-[#0d1424]'
                    : 'border-gray-200 bg-[#f8f9fa]'
                    }`}>
                    <div className={`px-4 py-2 text-xs font-mono font-bold flex justify-between items-center ${theme === 'dark'
                        ? 'bg-[#1e293b] text-gray-300 border-b border-gray-700'
                        : 'bg-gray-100 text-gray-700 border-b border-gray-200'
                        }`}>
                        <span className="uppercase text-green-600 dark:text-green-400">{lang}</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(codeContent);
                                alert('Code copied!');
                            }}
                            className={`text-xs px-2 py-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                        >
                            Copy
                        </button>
                    </div>
                    <div className={`p-4 overflow-x-auto font-mono text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                        }`}>
                        <pre className="whitespace-pre-wrap break-words">{codeContent}</pre>
                    </div>
                </div>
            );
        } else {
            return (
                <div key={idx} className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {part.split('\n').map((line, lIdx) => {
                        if (line.startsWith('## ')) {
                            return (
                                <h2 key={lIdx} className={`text-2xl font-bold mt-8 mb-4 border-b pb-2 ${theme === 'dark' ? 'text-white border-gray-800' : 'text-gray-900 border-gray-100'}`}>
                                    {parseInlineMarkdown(line.replace('## ', ''))}
                                </h2>
                            );
                        } else if (line.startsWith('### ')) {
                            return (
                                <h3 key={lIdx} className={`text-xl font-bold mt-6 mb-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                                    {parseInlineMarkdown(line.replace('### ', ''))}
                                </h3>
                            );
                        } else if (line.startsWith('#### ')) {
                            return (
                                <h4 key={lIdx} className={`text-lg font-bold mt-4 mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                    {parseInlineMarkdown(line.replace('#### ', ''))}
                                </h4>
                            );
                        } else if (line.startsWith('- ')) {
                            return (
                                <li key={lIdx} className="ml-6 mb-2 list-disc marker:text-green-500">
                                    {parseInlineMarkdown(line.replace('- ', ''))}
                                </li>
                            );
                        } else if (line.match(/^\d+\.\s/)) {
                            return (
                                <li key={lIdx} className="ml-6 mb-2 list-decimal marker:text-green-500 font-bold">
                                    {parseInlineMarkdown(line.replace(/^\d+\.\s/, ''))}
                                </li>
                            );
                        } else if (line.trim() === '') {
                            return <div key={lIdx} className="h-4"></div>;
                        } else {
                            return (
                                <p key={lIdx} className="mb-4">
                                    {parseInlineMarkdown(line)}
                                </p>
                            );
                        }
                    })}
                </div>
            );
        }
    })}</>;
};

const CourseDetailsPage = () => {
    const { courseId } = useParams();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [selectedLesson, setSelectedLesson] = useState(1);

    const course = courseContent[courseId];

    if (!course) {
        return (
            <div className={`min-h-screen pt-20 flex items-center justify-center ${theme === 'dark' ? 'bg-dark-primary' : 'bg-white'
                }`}>
                <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    Course not found
                </p>
            </div>
        );
    }

    const lesson = course.lessons.find(l => l.id === selectedLesson);

    return (
        <div className={`fixed inset-0 pt-20 transition-colors duration-300 overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-[#0b1120]' : 'bg-[#f0f2f5]'}`}>
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col pb-4">
                {/* Header / Breadcrumb */}
                <div className="mb-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <button
                            onClick={() => navigate('/learn')}
                            className={`flex items-center gap-1 hover:underline ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}
                        >
                            <ChevronLeft size={16} /> Courses
                        </button>
                        <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}>/</span>
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{course.name} Tutorial</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0 w-full max-w-full overflow-hidden">
                    {/* Left Sidebar - GFG Style Index */}
                    <div className={`w-full lg:w-64 shrink-0 lg:flex-shrink-0 flex flex-col lg:h-full rounded-lg overflow-hidden border shadow-sm max-h-[40vh] lg:max-h-full ${theme === 'dark' ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className={`p-4 border-b shrink-0 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {course.icon} {course.name}
                            </h2>
                        </div>
                        <div className="py-2 flex-1 overflow-y-auto custom-scrollbar">
                            {course.lessons.map((l) => (
                                <button
                                    key={l.id}
                                    onClick={() => setSelectedLesson(l.id)}
                                    className={`w-full text-left px-5 py-2.5 text-sm transition-colors border-l-4 ${selectedLesson === l.id
                                        ? theme === 'dark'
                                            ? 'border-green-500 bg-green-900/20 text-green-400 font-bold'
                                            : 'border-green-600 bg-green-50 text-green-700 font-bold'
                                        : theme === 'dark'
                                            ? 'border-transparent text-gray-300 hover:bg-gray-800'
                                            : 'border-transparent text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {l.id}. {l.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className={`flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-[#0f172a] border-gray-700' : 'bg-white border-gray-200'}`} id="main-content-area">
                        {lesson && (
                            <div className="p-6 md:p-10">
                                {/* Article Header */}
                                <div className="mb-8 border-b pb-6" style={{ borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}>
                                    <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {lesson.title}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
                                        <div className={`px-2.5 py-0.5 rounded-full font-medium ${lesson.difficulty === 'Beginner'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : lesson.difficulty === 'Intermediate'
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {lesson.difficulty || 'Beginner'}
                                        </div>
                                        <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            ⏱️ {lesson.duration || '5 mins'} read
                                        </div>
                                    </div>
                                </div>

                                {/* Content Parsing */}
                                <div className={`prose prose-sm md:prose-base max-w-none ${theme === 'dark' ? 'prose-invert' : ''
                                    }`}>
                                    {renderContent(lesson.content, theme)}
                                </div>

                                {/* Bottom Navigation */}
                                <div className="flex justify-between items-center mt-12 pt-8 border-t" style={{
                                    borderColor: theme === 'dark' ? '#334155' : '#e2e8f0'
                                }}>
                                    <button
                                        onClick={() => {
                                            const prevId = selectedLesson - 1;
                                            if (prevId > 0) {
                                                setSelectedLesson(prevId);
                                                document.getElementById('main-content-area').scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                        }}
                                        disabled={selectedLesson === 1}
                                        className={`px-6 py-2.5 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                            }`}
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        onClick={() => {
                                            const nextId = selectedLesson + 1;
                                            if (nextId <= course.lessons.length) {
                                                setSelectedLesson(nextId);
                                                document.getElementById('main-content-area').scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                        }}
                                        disabled={selectedLesson === course.lessons.length}
                                        className={`px-6 py-2.5 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Extra Padding for GFG look (Optional Practice section) */}
                    <div className="hidden xl:block w-64 flex-shrink-0 h-full overflow-y-auto custom-scrollbar">
                        <div className={`p-6 rounded-lg border shadow-sm text-center ${theme === 'dark' ? 'bg-[#1e293b] border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                            <div className="text-sm font-bold mb-2">Practice With Us</div>
                            <div className="text-xs mb-4">Master your skills with coding challenges tailored for you</div>
                            <button onClick={() => navigate('/courses')} className={`w-full py-2 text-sm font-bold rounded transition-colors ${theme === 'dark' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                                Solve Problems
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailsPage;
