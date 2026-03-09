'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase';
import { ref, set, get } from 'firebase/database';

const Icons = {
    FileText: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    GripVertical: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
        </svg>
    )
};

function NumericPage({ data }) {
    const { testid } = useParams();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('description');
    const [numericAnswer, setNumericAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [initialAnswer, setInitialAnswer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [leftPanelWidth, setLeftPanelWidth] = useState(45);
    const { theme } = useTheme();

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!user || !data?.questionname) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const submissionRef = ref(database, `ExamCode/${testid}/${user.uid}/${data.questionname}`);
                const snapshot = await get(submissionRef);
                if (snapshot.exists()) {
                    const savedAnswer = snapshot.val();
                    setNumericAnswer(savedAnswer);
                    setInitialAnswer(savedAnswer);
                    setIsSubmitted(true);
                } else {
                    setNumericAnswer('');
                    setInitialAnswer(null);
                    setIsSubmitted(false);
                }
            } catch (error) {
                console.error("Failed to fetch submission:", error);
                setNumericAnswer('');
                setInitialAnswer(null);
                setIsSubmitted(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmission();
    }, [data, user, testid]);

    const handleInputChange = (e) => {
        if (isLoading) return;
        const value = e.target.value;
        setNumericAnswer(value);

        // Check if new selection is different from the saved one
        if (value !== initialAnswer) {
            setIsSubmitted(false);
        } else {
            setIsSubmitted(true); // Same as initial means valid saved state
        }
    };

    const isCorrect = () => {
        return Number(numericAnswer) === Number(data.numericAnswer);
    };

    const handleSubmit = async () => {
        if (numericAnswer.toString().trim() === '' || !user) return;

        setIsSubmitted(true);
        try {
            const answerRef = ref(database, `ExamCode/${testid}/${user.uid}/${data.questionname}/`);
            const answerRef2 = ref(database, `ExamSubmissions/${testid}/${user.uid}/${data.questionname}/`);
            const answerRef3 = ref(database, `Marks/${testid}/${user.uid}/${data.questionname}/`);

            const correct = isCorrect();

            await set(answerRef, numericAnswer);
            await set(answerRef2, correct ? 'true' : 'false');
            await set(answerRef3, correct ? 100 : 0);
            setInitialAnswer(numericAnswer); // Update initial answer to the new submission
        } catch (error) {
            console.error("Error saving answer: ", error);
            setIsSubmitted(false); // Allow user to try again if save fails
        }
    };

    const showSubmitButton = numericAnswer.toString().trim() !== '' && numericAnswer !== initialAnswer;

    return (
        <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900">
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel */}
                <div
                    className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden shadow-sm"
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

                    <div className="p-6 flex-1 overflow-y-auto">
                        {activeTab === 'description' && (
                            <div className="text-gray-700 dark:text-gray-300">
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{data?.questionname}</h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-4">
                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                                            {data?.difficulty}
                                        </span>
                                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                                            Numeric
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Statement</h2>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{data?.question}</p>
                                        {data?.darkimageurl && (
                                            <div className="mt-4">
                                                <img
                                                    src={theme === 'dark' ? data.darkimageurl : data.lightimageurl}
                                                    alt="Question content"
                                                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                        {data?.svgContent && (
                                            <div
                                                className="my-4 flex justify-center w-full dark:[&>svg]:invert dark:[&>svg]:hue-rotate-180 [&>svg]:max-w-full [&>svg]:h-auto"
                                                dangerouslySetInnerHTML={{ __html: data.svgContent }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 cursor-col-resize flex items-center justify-center">
                    <Icons.GripVertical />
                </div>

                {/* Right Panel (Numeric Input) */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                    <div className="p-6 overflow-y-auto h-full">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter your numeric answer</h2>
                        <p className="text-gray-500 mb-6 text-sm">Provide a numeric value as the correct answer. You can use decimals.</p>

                        <div className="mb-8">
                            <input
                                type="number"
                                step="any"
                                value={numericAnswer}
                                onChange={handleInputChange}
                                placeholder="Enter numeric answer"
                                className="w-full max-w-md p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                            />
                        </div>

                        <div className="mt-auto pt-6">
                            {showSubmitButton ? (
                                <button
                                    onClick={handleSubmit}
                                    className="w-full px-6 py-3 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150"
                                >
                                    Submit Answer
                                </button>
                            ) : isSubmitted && numericAnswer.toString().trim() !== '' ? (
                                <p className="text-center text-green-600 dark:text-green-400 font-medium">Answer Submitted: {numericAnswer}</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NumericPage;
