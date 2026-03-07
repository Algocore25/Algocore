'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ref, get, set } from "firebase/database";
import { database } from "../firebase";
import { decodeShort } from '../utils/urlEncoder';
import { aiApi } from './api';


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

function NumericPage({ data }) {
    const [activeTab, setActiveTab] = useState('description');
    const [numericAnswer, setNumericAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [aiExplanation, setAiExplanation] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(45);

    const { theme } = useTheme();
    const { user } = useAuth();
    const { course: encCourse, subcourse: encSubcourse, questionId: encQuestionId } = useParams();
    const course = decodeShort(encCourse);
    const subcourse = decodeShort(encSubcourse);
    const questionId = decodeShort(encQuestionId);

    useEffect(() => {
        setNumericAnswer('');
        setIsSubmitted(false);

        const loadUserAnswer = async () => {
            if (user && course && subcourse && questionId) {
                const answerRef = ref(database, `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`);
                try {
                    const snapshot = await get(answerRef);
                    if (snapshot.exists()) {
                        setIsSubmitted(true);
                        // Display the correct answer when already answered
                        if (data && data.numericAnswer !== undefined) {
                            setNumericAnswer(data.numericAnswer.toString());
                        }
                    }
                } catch (error) {
                    console.error("Error loading user answer:", error);
                }
            }
        };

        loadUserAnswer();

        return () => {
            setNumericAnswer('');
            setIsSubmitted(false);
            setAiExplanation('');
        };
    }, [user, course, subcourse, questionId, data]);

    useEffect(() => {
        const fetchAiExplanation = async () => {
            if (isSubmitted && !data.explanation && !aiExplanation && !loadingAi) {
                setLoadingAi(true);
                try {
                    const prompt = `Question: ${data.question}\nCorrect Answer: ${data.numericAnswer}\nProvide a step-by-step mathematical explanation.`;
                    const res = await aiApi.solveAptitude(prompt);
                    if (res.data.success) {
                        setAiExplanation(res.data.response);
                    }
                } catch (error) {
                    console.error("AI Explanation fetch failed:", error);
                } finally {
                    setLoadingAi(false);
                }
            }
        };

        fetchAiExplanation();
    }, [isSubmitted, data, aiExplanation, loadingAi]);


    const handleSubmit = async () => {
        if (numericAnswer.toString().trim() === '' || !user || !course || !subcourse || !questionId || !data) return;

        const answerRef = ref(database, `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`);
        try {
            await set(answerRef, true); // Storing true as per the original flow
            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to save answer:", error);
        }
    };

    const isCorrect = () => {
        return Number(numericAnswer) === Number(data.numericAnswer);
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
                                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                                            Numeric
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
                                                {data.explanation || aiExplanation}
                                                {loadingAi && <span className="italic block mt-2 opacity-70">Generating AI explanation...</span>}
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter your numeric answer</h2>
                        <p className="text-gray-500 mb-6 text-sm">Provide a numeric value as the correct answer. You can use decimals.</p>

                        <div className="mb-8">
                            <input
                                type="number"
                                step="any"
                                value={numericAnswer}
                                onChange={(e) => {
                                    if (!isSubmitted) {
                                        setNumericAnswer(e.target.value);
                                    }
                                }}
                                disabled={isSubmitted}
                                placeholder="Enter numeric answer"
                                className={`w-full max-w-md p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                ${isSubmitted ? (isCorrect() ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900' : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900') : 'border-gray-300 dark:border-gray-600'}`}
                            />
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={numericAnswer.toString().trim() === '' || isSubmitted}
                                className={`px-6 py-3 rounded-lg font-medium text-sm ${numericAnswer.toString().trim() === '' || isSubmitted
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    } transition-colors duration-150`}
                            >
                                {isSubmitted ? 'Submitted' : 'Submit Answer'}
                            </button>

                            {isSubmitted && (
                                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center">
                                        <Icons.CheckCircle2 className={`text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0 ${isCorrect() ? 'text-green-500 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400'}`} />
                                        <span className="text-blue-800 dark:text-blue-200">
                                            {isCorrect()
                                                ? "Correct! Well done!"
                                                : `The correct answer is ${data.numericAnswer}.`}
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

export default NumericPage;
