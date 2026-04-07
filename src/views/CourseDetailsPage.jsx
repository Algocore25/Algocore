import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, BookMarked, Code, AlertCircle, Quote, CheckCircle, Lightbulb, UserCheck, Star, PlayCircle, BookOpen, Clock } from 'lucide-react';

import { courseContent } from '../utils/courseContent';
import FloatingChatbot from '../components/FloatingChatbot';
import GoogleAd from '../components/GoogleAd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { executeCode } from './api';

const parseInlineMarkdown = (text) => {
    if (typeof text !== 'string') return text;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-slate-900 dark:text-white px-1">{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-sm font-mono text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">{part.slice(1, -1)}</code>;
        } else {
            return <span key={i}>{part}</span>;
        }
    });
};

const InteractiveCodeBlock = ({ initialCode, theme, language }) => {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRun = async () => {
        setIsLoading(true);
        setOutput(null);
        try {
            let mappedLang = language;
            if (language === 'dsa' || language === 'daa') mappedLang = 'cpp';
            if (language === 'html_css') mappedLang = 'javascript';
            if (!mappedLang || mappedLang === 'code') mappedLang = 'javascript';

            let finalCode = code;
            if (mappedLang === 'java') {
                const publicClassMatch = finalCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
                if (publicClassMatch && publicClassMatch[1] !== 'Main') {
                    const className = publicClassMatch[1];
                    finalCode = finalCode.replace(new RegExp(`public\\s+class\\s+${className}\\b`), `class ${className}`);
                    finalCode += `\n\npublic class Main {\n    public static void main(String[] args) {\n        ${className}.main(args);\n    }\n}`;
                } else if (!publicClassMatch && !finalCode.includes('class Main')) {
                    const anyClassMatch = finalCode.match(/class\s+([A-Za-z0-9_]+)/);
                    if (anyClassMatch && anyClassMatch[1] !== 'Main') {
                        finalCode += `\n\npublic class Main {\n    public static void main(String[] args) {\n        ${anyClassMatch[1]}.main(args);\n    }\n}`;
                    }
                }
            }

            const result = await executeCode(mappedLang, finalCode, "");
            
            const runResult = result.run || result;

            setOutput({
                compile: result.compile,
                stdout: runResult.output,
                stderr: runResult.stderr || runResult.error,
                code: runResult.code !== undefined ? runResult.code : (runResult.stderr ? 1 : 0)
            });
        } catch (error) {
            console.error('Execution error:', error);
            setOutput({ stderr: error.message || 'Error connecting to execution server.', code: 1 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`rounded-xl overflow-hidden my-8 shadow-lg border-2 ${theme === 'dark' ? 'border-blue-500/40 bg-[#0f172a]' : 'border-blue-400/50 bg-[#ffffff]'}`}>
            <div className={`px-5 py-3.5 text-sm font-bold flex justify-between items-center ${theme === 'dark' ? 'bg-gradient-to-r from-blue-900/80 to-indigo-900/80 text-blue-200 border-b border-blue-800' : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-b border-blue-100'}`}>
                <span className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span>Interactive Code Editor</span>
                </span>
                <div className="flex gap-3 items-center">
                    <button onClick={() => { navigator.clipboard.writeText(code); alert('Code copied!'); }} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${theme === 'dark' ? 'border-blue-700 bg-blue-900/30 hover:bg-blue-800 text-blue-300' : 'border-blue-300 bg-blue-50 hover:bg-blue-200 text-blue-800'}`}>
                        Copy
                    </button>
                    <button onClick={handleRun} disabled={isLoading} className={`flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg font-bold transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md'} ${theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'}`}>
                        {isLoading ? <span className="animate-spin text-lg leading-none">⏳</span> : <PlayCircle className="w-4 h-4" />}
                        {isLoading ? 'Running...' : 'Run Code'}
                    </button>
                </div>
            </div>
            
            <div className="relative border-b" style={{ borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                <Editor
                    height="350px"
                    language={language === 'c' || language === 'cpp' || language === 'dsa' || language === 'daa' ? 'cpp' : (language === 'html_css' ? 'html' : (language || 'javascript'))}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        padding: { top: 16, bottom: 16 }
                    }}
                />
            </div>

            {output && (
                <div className={`${theme === 'dark' ? 'bg-[#0b1120]' : 'bg-slate-50'}`}>
                    <div className={`px-5 py-2 text-xs font-bold uppercase tracking-wider flex justify-between ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                        <span>Terminal Output</span>
                        <button onClick={() => setOutput(null)} className="hover:text-red-400 transition-colors">Clear</button>
                    </div>
                    <div className="p-5 overflow-x-auto font-mono text-sm max-h-[300px] overflow-y-auto">
                        {(output.compile && output.compile.code !== 0) ? (
                            <pre className="text-red-500 whitespace-pre-wrap">{output.compile.stderr}</pre>
                        ) : output.stderr ? (
                            <pre className="text-red-500 whitespace-pre-wrap">{output.stderr}</pre>
                        ) : (
                            <pre className={`${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} whitespace-pre-wrap`}>
                                { output.stdout || 'Program exited with no output.'}
                            </pre>
                        )}
                        <div className={`mt-3 pt-3 border-t border-dashed ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'} text-xs ${output.code === 0 ? (theme === 'dark' ? 'text-slate-500' : 'text-slate-400') : 'text-red-500'}`}>
                            Process finished with exit code {output.code !== undefined ? output.code : 'Unknown'}
                        </div>
                    </div>
                </div>
            )}
            
            {!output && (
                 <div className={`px-5 py-3 text-xs italic flex items-center gap-2 ${theme === 'dark' ? 'bg-blue-950/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>Edit the code above and click <b>Run Code</b> to instantly see the output right here in your browser!</span>
                </div>
            )}
        </div>
    );
};

const renderContent = (content, theme, courseId) => {
    const parts = content.split(/(```[\s\S]*?```|<COMPILER>[\s\S]*?<\/COMPILER>)/g);

    return <div className="space-y-6">{parts.map((part, idx) => {
        if (part.startsWith('<COMPILER>') && part.endsWith('</COMPILER>')) {
            const code = part.replace(/<COMPILER>|<\/COMPILER>/g, '').trim();

            return <InteractiveCodeBlock key={idx} initialCode={code} theme={theme} language={courseId} />;
        }
        else if (part.startsWith('```') && part.endsWith('```')) {
            const code = part.replace(/```/g, '').trim();
            const langMatches = code.split('\n')[0];
            const hasLang = !langMatches.includes(' ') && langMatches.length < 15;
            const lang = hasLang ? langMatches : 'code';
            const codeContent = hasLang ? code.split('\n').slice(1).join('\n') : code;

            return (
                <div key={idx} className={`rounded-xl overflow-hidden my-6 border shadow-sm ${theme === 'dark'
                    ? 'border-slate-700 bg-[#0f172a]'
                    : 'border-slate-200 bg-[#f8fafc]'
                    }`}>
                    <div className={`px-4 py-2.5 text-xs font-mono font-bold flex justify-between items-center ${theme === 'dark'
                        ? 'bg-slate-800/80 text-slate-300 border-b border-slate-700'
                        : 'bg-slate-100 text-slate-600 border-b border-slate-200'
                        }`}>
                        <span className="uppercase tracking-wider text-emerald-500">{lang}</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(codeContent);
                                alert('Code copied!');
                            }}
                            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-700'}`}
                        >
                            Copy
                        </button>
                    </div>
                    <div className="p-0 overflow-hidden font-mono text-[13px] leading-relaxed">
                        <SyntaxHighlighter
                            language={lang === 'code' ? 'c' : lang.toLowerCase()}
                            style={theme === 'dark' ? dracula : oneLight}
                            customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent' }}
                            wrapLongLines={true}
                        >
                            {codeContent}
                        </SyntaxHighlighter>
                    </div>
                </div>
            );
        } else {
            return (
                <div key={idx} className={`text-base md:text-lg leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {part.split('\n').map((line, lIdx) => {
                        if (line.startsWith('## ')) {
                            return (
                                <h2 key={lIdx} className={`text-2xl md:text-3xl font-extrabold mt-12 mb-6 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {parseInlineMarkdown(line.replace('## ', ''))}
                                </h2>
                            );
                        } else if (line.startsWith('### ')) {
                            return (
                                <h3 key={lIdx} className={`text-xl md:text-2xl font-bold mt-8 mb-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    {parseInlineMarkdown(line.replace('### ', ''))}
                                </h3>
                            );
                        } else if (line.startsWith('#### ')) {
                            return (
                                <h4 key={lIdx} className={`text-lg font-bold mt-6 mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {parseInlineMarkdown(line.replace('#### ', ''))}
                                </h4>
                            );
                        } else if (line.startsWith('- ')) {
                            return (
                                <li key={lIdx} className="ml-6 mb-3 flex items-start">
                                    <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    <span>{parseInlineMarkdown(line.replace('- ', ''))}</span>
                                </li>
                            );
                        } else if (line.match(/^\d+\.\s/)) {
                            return (
                                <li key={lIdx} className="ml-6 mb-3 flex items-start gap-3">
                                    <span className={`font-bold shrink-0 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {line.match(/^\d+/)[0]}.
                                    </span>
                                    <span>{parseInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</span>
                                </li>
                            );
                        } else if (line.startsWith('> ')) {
                            return (
                                <blockquote key={lIdx} className={`my-6 border-l-4 p-5 rounded-r-xl ${theme === 'dark' ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-amber-500 bg-amber-50 text-amber-900'}`}>
                                    <div className="flex gap-3">
                                        <Lightbulb className="w-6 h-6 shrink-0" />
                                        <div className="italic font-medium">{parseInlineMarkdown(line.replace('> ', ''))}</div>
                                    </div>
                                </blockquote>
                            );
                        } else if (line.trim() === '') {
                            return <div key={lIdx} className="h-4"></div>;
                        } else {
                            return (
                                <p key={lIdx} className="mb-5 text-justify">
                                    {parseInlineMarkdown(line)}
                                </p>
                            );
                        }
                    })}
                </div>
            );
        }
    })}</div>;
};

const CourseDetailsPage = () => {
    const { courseId } = useParams();
    const { theme } = useTheme();
    const router = useRouter();
    const [selectedLesson, setSelectedLesson] = useState(1);
    const [activeTab, setActiveTab] = useState('lessons');

    const course = courseContent[courseId];

    if (!course) {
        return (
            <div className={`min-h-screen pt-20 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Course Not Found</h2>
                    <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>The course you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const lesson = course.lessons.find(l => l.id === selectedLesson);

    return (
        <div className={`fixed inset-0 pt-20 transition-colors duration-500 overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
            {/* Background elements */}
            <div className={`absolute top-0 right-[-10%] w-1/2 h-1/2 rounded-full blur-[150px] pointer-events-none ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-100/50'}`} />
            
            <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col pb-4 relative z-10">
                {/* Header Navigation */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4 mt-2">
                    <div className="flex items-center gap-3 text-sm font-medium">
                        <button
                            onClick={() => router.push('/learn')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:translate-x-[-2px] ${theme === 'dark' ? 'text-emerald-400 hover:bg-slate-800' : 'text-emerald-600 hover:bg-slate-100'}`}
                        >
                            <ChevronLeft size={16} /> Back to Courses
                        </button>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
                        <span className={`truncate max-w-[200px] sm:max-w-xs ${theme === 'dark' ? 'text-slate-300 flex items-center gap-2' : 'text-slate-700 flex items-center gap-2'}`}>
                            <BookOpen size={14} /> {course.name}
                        </span>
                    </div>
                    
                    {/* Tab Navigation Pill */}
                    <div className={`flex p-1 rounded-xl shrink-0 border backdrop-blur-sm ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${activeTab === 'overview'
                                ? theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            Course Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('lessons')}
                            className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${activeTab === 'lessons'
                                ? theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            Interactive Lessons
                        </button>
                    </div>
                </div>

                {activeTab === 'overview' ? (
                    // Overview Tab View
                    <div className={`flex-1 overflow-y-auto custom-scrollbar rounded-2xl border backdrop-blur-xl shadow-xl transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/70 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
                        <div className="p-8 md:p-12 lg:p-16 max-w-5xl mx-auto">
                            {/* Hero Section */}
                            <div className="mb-16">
                                <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
                                    <div className={`p-6 rounded-3xl text-7xl flex items-center justify-center border shadow-inner ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                        {course.icon}
                                    </div>
                                    <div>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                            <Star className="w-3.5 h-3.5 fill-current" /> {course.rating} Avg Rating
                                        </div>
                                        <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                            {course.name}
                                        </h1>
                                        <p className={`text-xl leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {course.longDescription || course.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                    {[
                                        { label: 'Total Duration', value: `${course.hours}+ hrs`, icon: '⏱️' },
                                        { label: 'Active Students', value: `${(course.students / 1000).toFixed(0)}K+`, icon: '👨‍🎓' },
                                        { label: 'Difficulty Level', value: course.difficulty, icon: '📈' },
                                        { label: 'Total Lessons', value: course.lessons.length, icon: '📚' }
                                    ].map((stat, i) => (
                                        <div key={i} className={`p-5 rounded-2xl border transition-transform hover:-translate-y-1 duration-300 ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50/50 border-slate-200'}`}>
                                            <div className="text-2xl mb-2">{stat.icon}</div>
                                            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
                                            <div className={`text-xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                                {/* Objectives */}
                                {course.learningObjectives && (
                                    <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                                        <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                            <CheckCircle className="w-6 h-6" /> What You'll Learn
                                        </h2>
                                        <ul className="space-y-4">
                                            {course.learningObjectives.map((obj, idx) => (
                                                <li key={idx} className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    <span className="text-emerald-500 font-bold mt-1 shrink-0">✓</span>
                                                    <span className="leading-relaxed">{obj}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Prerequisites */}
                                {course.prerequisites && (
                                    <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                                        <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                                            <UserCheck className="w-6 h-6" /> Prerequisites
                                        </h2>
                                        <ul className="space-y-4">
                                            {course.prerequisites.map((prereq, idx) => (
                                                <li key={idx} className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                                    <span className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></span>
                                                    <span className="leading-relaxed">{prereq}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Core Curriculum Preview */}
                            <div>
                                <h2 className={`text-3xl font-bold mb-8 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    Course Curriculum
                                </h2>
                                <div className="space-y-4">
                                    {course.lessons.map((l, index) => (
                                        <div
                                            key={l.id}
                                            onClick={() => {
                                                setSelectedLesson(l.id);
                                                setActiveTab('lessons');
                                            }}
                                            className={`group p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${theme === 'dark'
                                                ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/50'
                                                : 'bg-white border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${theme === 'dark' ? 'bg-slate-700 text-slate-300 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold text-lg mb-1 transition-colors ${theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                                            {l.title}
                                                        </h3>
                                                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {l.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 ml-14 md:ml-0 shrink-0">
                                                    {l.difficulty && (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${l.difficulty === 'Beginner'
                                                            ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : l.difficulty === 'Intermediate'
                                                                ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                : 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {l.difficulty}
                                                        </span>
                                                    )}
                                                    {l.duration && (
                                                        <span className={`text-sm font-medium flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            <Clock size={16} /> {l.duration}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Lessons Interface
                    <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0 w-full max-w-full overflow-hidden">
                        {/* Elegant Sidebar Index */}
                        <div className={`w-full lg:w-72 shrink-0 lg:flex-shrink-0 flex flex-col lg:h-full rounded-2xl overflow-hidden border shadow-lg backdrop-blur-md max-h-[35vh] lg:max-h-full transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/90 border-slate-200'}`}>
                            <div className={`p-6 border-b shrink-0 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                                <h2 className={`font-bold flex items-center gap-3 text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    <span className="text-2xl">{course.icon}</span> Modules
                                </h2>
                            </div>
                            <div className="py-3 flex-1 overflow-y-auto custom-scrollbar">
                                {course.lessons.map((l, index) => (
                                    <button
                                        key={l.id}
                                        onClick={() => setSelectedLesson(l.id)}
                                        className={`w-full text-left px-6 py-3.5 text-sm transition-all relative flex items-start gap-3 group ${selectedLesson === l.id
                                            ? theme === 'dark'
                                                ? 'bg-blue-900/20 text-blue-400 font-bold'
                                                : 'bg-blue-50 text-blue-700 font-bold'
                                            : theme === 'dark'
                                                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        {/* Active Indicator Line */}
                                        {selectedLesson === l.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                                        )}
                                        <span className={`w-5 h-5 rounded-md flex justify-center items-center shrink-0 mt-0.5 text-[10px] ${selectedLesson === l.id ? 'bg-blue-500 text-white' : theme === 'dark' ? 'bg-slate-800 text-slate-500 group-hover:bg-slate-700' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="leading-snug">{l.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Reading Canvas */}
                        <div className={`flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar rounded-2xl border shadow-xl backdrop-blur-xl transition-colors duration-300 relative ${theme === 'dark' ? 'bg-[#0f172a]/95 border-slate-700/50' : 'bg-white border-slate-200'}`} id="main-content-area">
                            {lesson && (
                                <div className="p-8 md:p-12 lg:p-16 max-w-4xl mx-auto">
                                    {/* Article Header */}
                                    <div className="mb-12 border-b pb-8" style={{ borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}>
                                        <div className="flex gap-2 mb-4">
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${lesson.difficulty === 'Beginner'
                                                ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : lesson.difficulty === 'Intermediate'
                                                    ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {lesson.difficulty || 'Beginner'}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                                <Clock size={14} /> {lesson.duration || '5 mins'} read
                                            </div>
                                        </div>
                                        
                                        <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'
                                            }`}>
                                            {lesson.title}
                                        </h1>
                                        <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {lesson.description}
                                        </p>
                                    </div>

                                    {/* Rich Content Engine */}
                                    <div className={`prose-lg max-w-none`}>
                                        {renderContent(lesson.content, theme, courseId)}
                                    </div>

                                    {/* Ad Integration */}
                                    <div className="my-12">
                                        <GoogleAd />
                                    </div>

                                    {/* Pagination / Bottom Navigation */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-16 pt-8 border-t" style={{
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
                                            className={`px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 ${theme === 'dark'
                                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            <ChevronLeft size={20} /> Previous Lesson
                                        </button>
                                        
                                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {selectedLesson} of {course.lessons.length}
                                        </span>

                                        <button
                                            onClick={() => {
                                                const nextId = selectedLesson + 1;
                                                if (nextId <= course.lessons.length) {
                                                    setSelectedLesson(nextId);
                                                    document.getElementById('main-content-area').scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            disabled={selectedLesson === course.lessons.length}
                                            className={`px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg ${theme === 'dark'
                                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                                                }`}
                                        >
                                            Next Lesson <ChevronLeft size={20} className="rotate-180" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Extra Desktop Side Widget */}
                        <div className="hidden xl:flex w-72 shrink-0 flex-col gap-6">
                            <div className={`p-6 rounded-2xl border shadow-lg backdrop-blur-sm relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100'}`}>
                                <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm'}`}>
                                        <Code size={24} />
                                    </div>
                                    <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Ready to Practice?</h3>
                                    <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-indigo-200/70' : 'text-indigo-800/70'}`}>Put your new skills to the test with our interactive coding environments.</p>
                                    <button onClick={() => router.push('/courses')} className={`w-full py-3 text-sm font-bold rounded-xl transition-all shadow-md ${theme === 'dark' ? 'bg-indigo-500 text-white hover:bg-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                        Start Coding Labs
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <FloatingChatbot />
        </div>
    );
};

export default CourseDetailsPage;
