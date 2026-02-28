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

function MSQPage({ data }) {
    const { testid } = useParams();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('description');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [initialOptions, setInitialOptions] = useState([]);
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
                    const savedOptions = snapshot.val() || [];
                    setSelectedOptions(Array.isArray(savedOptions) ? savedOptions : []);
                    setInitialOptions(Array.isArray(savedOptions) ? savedOptions : []);
                    setIsSubmitted(true);
                } else {
                    setSelectedOptions([]);
                    setInitialOptions([]);
                    setIsSubmitted(false);
                }
            } catch (error) {
                console.error("Failed to fetch submission:", error);
                setSelectedOptions([]);
                setInitialOptions([]);
                setIsSubmitted(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmission();
    }, [data, user, testid]);

    const handleOptionSelect = (index) => {
        if (isLoading) return;
        const newOptions = selectedOptions.includes(index)
            ? selectedOptions.filter(i => i !== index)
            : [...selectedOptions, index];

        setSelectedOptions(newOptions);

        // Check if new selection is different from the saved one
        const sortedNew = [...newOptions].sort();
        const sortedInitial = [...initialOptions].sort();
        if (JSON.stringify(sortedNew) !== JSON.stringify(sortedInitial)) {
            setIsSubmitted(false);
        } else {
            setIsSubmitted(true);
        }
    };

    const isAllCorrect = () => {
        const correctIndices = (data.correctAnswers || []).map(val => val - 1);
        const sortedSelected = [...selectedOptions].sort();
        const sortedCorrect = [...correctIndices].sort();
        return JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);
    };

    const handleSubmit = async () => {
        if (selectedOptions.length === 0 || !user) return;

        setIsSubmitted(true);
        try {
            const answerRef = ref(database, `ExamCode/${testid}/${user.uid}/${data.questionname}/`);
            const answerRef2 = ref(database, `ExamSubmissions/${testid}/${user.uid}/${data.questionname}/`);
            const answerRef3 = ref(database, `Marks/${testid}/${user.uid}/${data.questionname}/`);

            const correct = isAllCorrect();

            await set(answerRef, selectedOptions);
            await set(answerRef2, correct ? 'true' : 'false');
            await set(answerRef3, correct ? 100 : 0);
            setInitialOptions(selectedOptions); // Update initial options to the new submission
        } catch (error) {
            console.error("Error saving answer: ", error);
            setIsSubmitted(false); // Allow user to try again if save fails
        }
    };

    const sortedSelected = [...selectedOptions].sort();
    const sortedInitial = [...initialOptions].sort();
    const showSubmitButton = selectedOptions.length > 0 && JSON.stringify(sortedSelected) !== JSON.stringify(sortedInitial);

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
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium">
                                            MSQ
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

                {/* Right Panel (MSQ Options) */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                    <div className="p-6 overflow-y-auto h-full">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select correct answers</h2>
                        <p className="text-gray-500 mb-6 text-sm">This is a Multiple Select Question. One or more options can be correct.</p>

                        <div className="space-y-4 mb-8">
                            {data?.options && data.options.map((option, index) => {
                                let optionClasses = "p-4 border rounded-lg cursor-pointer transition-colors duration-150 flex items-center gap-3 ";

                                if (selectedOptions.includes(index)) {
                                    optionClasses += "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200";
                                } else {
                                    optionClasses += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600";
                                }

                                return (
                                    <div
                                        key={index}
                                        className={optionClasses}
                                        onClick={() => handleOptionSelect(index)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedOptions.includes(index)}
                                            readOnly
                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                                        />
                                        <div className="flex items-center">
                                            <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                                            <span>{option}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-auto pt-6">
                            {showSubmitButton ? (
                                <button
                                    onClick={handleSubmit}
                                    className="w-full px-6 py-3 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150"
                                >
                                    Submit Answer
                                </button>
                            ) : isSubmitted && selectedOptions.length > 0 ? (
                                <p className="text-center text-green-600 dark:text-green-400 font-medium">Answer Submitted</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MSQPage;
