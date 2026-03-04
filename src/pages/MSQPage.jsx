'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ref, get, set } from "firebase/database";
import { database } from "../firebase";
import { decodeShort } from '../utils/urlEncoder';

// SVG Icons
const Icons = {
    FileText: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    CheckCircle2: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    GripVertical: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
        </svg>
    )
};

function MSQPage({ data }) {
    const [activeTab, setActiveTab] = useState('description');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(45);
    const { theme } = useTheme();
    const { user } = useAuth();
    const { course: encCourse, subcourse: encSubcourse, questionId: encQuestionId } = useParams();
    const course = decodeShort(encCourse);
    const subcourse = decodeShort(encSubcourse);
    const questionId = decodeShort(encQuestionId);

    useEffect(() => {
        setSelectedOptions([]);
        setIsSubmitted(false);

        const loadUserAnswer = async () => {
            if (user && course && subcourse && questionId) {
                const answerRef = ref(database, `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`);
                try {
                    const snapshot = await get(answerRef);
                    if (snapshot.exists()) {
                        // Using true to check completion
                        setIsSubmitted(true);
                        // We'll set correct answers so we can see what they were?
                        // Since we save true and not the answer itself right now...
                        // the user will see their previous answers as empty but they can see the solution
                        // If they saved the actual answer, we could load it.
                    }
                } catch (error) {
                    console.error("Error loading user answer:", error);
                }
            }
        };

        loadUserAnswer();
    }, [user, course, subcourse, questionId, data]);

    const handleSubmit = async () => {
        if (selectedOptions.length === 0 || !user || !course || !subcourse || !questionId || !data) return;

        const answerRef = ref(database, `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`);
        try {
            await set(answerRef, true); // Storing true as per the original flow
            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to save answer:", error);
        }
    };

    const handleOptionSelect = (index) => {
        if (!isSubmitted) {
            setSelectedOptions(prev => {
                if (prev.includes(index)) {
                    return prev.filter(i => i !== index);
                } else {
                    return [...prev, index];
                }
            });
        }
    };

    const getOptionClasses = (index) => {
        let classes = "p-4 border rounded-lg cursor-pointer transition-colors duration-150 flex items-center gap-3 ";
        const isCorrect = (data.correctAnswers || []).includes(index + 1);
        const isSelected = selectedOptions.includes(index);

        if (isSubmitted) {
            if (isCorrect && isSelected) {
                classes += "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200";
            } else if (isCorrect && !isSelected) {
                classes += "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 border-dashed";
            } else if (!isCorrect && isSelected) {
                classes += "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200";
            } else {
                classes += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 opacity-50";
            }
        } else {
            if (isSelected) {
                classes += "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200";
            } else {
                classes += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600";
            }
        }
        return classes;
    };

    const isAllCorrect = () => {
        const correctIndices = (data.correctAnswers || []).map(val => val - 1);
        const sortedSelected = [...selectedOptions].sort();
        const sortedCorrect = [...correctIndices].sort();
        return JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900">
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel */}
                <div
                    className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden h-full shadow-sm"
                    style={{ width: `${leftPanelWidth}%` }}
                >
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            className={`px-6 py-4 text-sm font-medium ${activeTab === 'description'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                            onClick={() => setActiveTab('description')}
                        >
                            <div className="flex items-center gap-2">
                                <Icons.FileText />
                                Description
                            </div>
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-auto">
                        {activeTab === 'description' && (
                            <div className="text-gray-700 dark:text-gray-300">
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{data.questionname}</h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-4">
                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                                            {data.difficulty}
                                        </span>
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium">
                                            MSQ
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Statement</h2>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {data.question}
                                        </p>
                                        {data?.darkimageurl && (
                                            <div className="mb-4">
                                                <img
                                                    src={theme === 'dark' ? data.darkimageurl : data.lightimageurl}
                                                    alt="Question diagram"
                                                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {isSubmitted && (
                                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <h2 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Explanation</h2>
                                            <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                                                {data.explanation || data.Explanation }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Draggable Divider */}
                <div className="w-1 bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-colors">
                    <Icons.GripVertical />
                </div>

                {/* Right Panel */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                    <div className="p-6 overflow-y-auto h-full">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select correct answers</h2>
                        <p className="text-gray-500 mb-6 text-sm">This is a Multiple Select Question. One or more options can be correct.</p>

                        <div className="space-y-4 mb-8">
                            {data.options && data.options.map((option, index) => (
                                <div
                                    key={index}
                                    className={getOptionClasses(index)}
                                    onClick={() => handleOptionSelect(index)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedOptions.includes(index) || (isSubmitted && (data.correctAnswers || []).includes(index + 1))}
                                        readOnly
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                                    />
                                    <div className="flex items-center">
                                        <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                                        <span>{option}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={selectedOptions.length === 0 || isSubmitted}
                                className={`px-6 py-3 rounded-lg font-medium text-sm ${selectedOptions.length === 0 || isSubmitted
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    } transition-colors duration-150`}
                            >
                                {isSubmitted ? 'Submitted' : 'Submit Answer'}
                            </button>

                            {isSubmitted && (
                                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center">
                                        <Icons.CheckCircle2 className={`flex-shrink-0 mr-3 ${isAllCorrect() ? 'text-green-500 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400'}`} />
                                        <span className="text-blue-800 dark:text-blue-200">
                                            {isAllCorrect()
                                                ? "Correct! Well done!"
                                                : `The correct answer(s): ${(data.correctAnswers || []).map(val => String.fromCharCode(65 + val - 1)).join(', ')}.`}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MSQPage;
