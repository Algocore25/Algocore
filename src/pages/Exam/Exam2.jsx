import React, { useState, useRef, useEffect, useCallback } from 'react';

import { languageTemplates } from '../constants';

import { motion, AnimatePresence } from 'framer-motion';

import { database } from "../../firebase";
import { ref, get, set, child } from "firebase/database";



import {
    FiCheck,
    FiX,
    FiAlertTriangle,
    FiPlay,
    FiFileText,
    FiCode,
    FiTerminal,
    FiChevronLeft,
    FiChevronRight,
    FiCheckCircle,
    FiXCircle,
    FiMaximize,
    FiMinimize
} from 'react-icons/fi';
import DynamicComponent from './DynamicComponent';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const Exam2 = ({ Questions, startTime, onExamComplete, duration }) => {

    const { testid } = useParams();

    const [activeTab, setActiveTab] = useState('description');
    const [timeLeft, setTimeLeft] = useState(() => {

        console.log(startTime);


        if (!startTime) return null;

    

        const examDuration = 60*duration;


        
        const start = new Date(startTime);
        const now = new Date();
        console.log('Start Time:', start);
        console.log('Current Time:', now);
        const elapsedSeconds = Math.floor((now - start) / 1000);
        console.log('Elapsed Seconds:', elapsedSeconds);
        const remaining = Math.max(0, examDuration - elapsedSeconds);
        console.log('Remaining Time:', remaining);
        return remaining;
    });

    const { user } = useAuth();


    // Handle question change
    const handleQuestionChange = useCallback((index) => {

        console.log(index);

        console.log(Questions.length);


        if (!Questions || index < 0 || index >= Questions.length) {
            console.error('Invalid question index or test data not loaded');
            return;
        }

        setActiveQuestion(index);

        // Get the current question
        const question = Questions[index];


        // Scroll to top when changing questions
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const goToQuestion = useCallback((index) => {
        handleQuestionChange(index);
        setActiveTab('description');
        setIsMenuOpen(false);
    }, [handleQuestionChange]);


    const submitExam = () => {

        const examRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);

        set(examRef, "completed")
            .then(() => {
                alert("Exam submitted successfully!");
            })
            .catch((error) => {
                console.error("Error submitting exam:", error);
                alert("There was an error submitting the exam.");
            });
    };



    useEffect(() => {
        if (!startTime) return;

        // Calculate remaining time based on startTime and exam duration
        const calculateRemainingTime = () => {
            const examDuration = 60 * duration; // 30 minutes in seconds (adjust if you store duration elsewhere)
            const start = new Date(startTime);
            const now = new Date();
            const elapsedSeconds = Math.floor((now - start) / 1000);
            const remaining = Math.max(0, examDuration - elapsedSeconds);
            setTimeLeft(remaining);

            if (remaining <= 0) {
                onExamComplete();
            }
        };

        // Initial calculation
        calculateRemainingTime();

        // Update every second
        const timer = setInterval(calculateRemainingTime, 1000);

        return () => clearInterval(timer);
    }, [startTime, onExamComplete]);

    // Format time for display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuRef = useRef(null);

    const [activeQuestion, setActiveQuestion] = useState(0);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };



    }, []);


    useEffect(() => {

        console.log(Questions[0]);

    }, []);






    const goToNextQuestion = useCallback(() => {
        if (Questions && activeQuestion < Questions.length - 1) {
            handleQuestionChange(activeQuestion + 1);
            setActiveTab('description');
        }
    }, [activeQuestion, Questions?.length, handleQuestionChange]);

    const goToPreviousQuestion = useCallback(() => {
        if (activeQuestion > 0) {
            handleQuestionChange(activeQuestion - 1);
            setActiveTab('description');
        }

        // console.log( Questions );

    }, [activeQuestion, handleQuestionChange]);




    return (
        <>
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
                {/* Navbar */}
                <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none hamburger-menu"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {'Coding Exam'}
                        </h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Question {activeQuestion + 1} of {Questions.length}
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {/* <BsLightningCharge className="text-yellow-500" /> */}
                            <span>Time Left: {timeLeft !== null ? formatTime(timeLeft) : 'Loading...'}</span>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={goToPreviousQuestion}
                                disabled={activeQuestion === 0}
                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={goToNextQuestion}
                                disabled={activeQuestion === Questions.length - 1}
                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                            <button
                                onClick={submitExam}
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md flex items-center gap-2"
                            >
                                {/* <FiCheck size={16} /> */}
                                Submit Exam
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="flex flex-1 overflow-hidden">
                    {/* Question Navigation Sidebar */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'tween' }}
                                className="fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700"
                                ref={menuRef}
                            >
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-medium text-gray-900 dark:text-white">Questions</h3>
                                    <button
                                        onClick={() => setIsMenuOpen(false)}
                                        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                                <div className="overflow-y-auto h-[calc(100%-4rem)]">
                                    {Questions?.map((question, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                goToQuestion(index);
                                                setIsMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${activeQuestion === index
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                                                : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 text-sm font-medium ${activeQuestion === index
                                                    ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                                <span className="truncate">
                                                    {question.title || `Question ${index + 1}`}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">

                        <DynamicComponent question={Questions[activeQuestion]}
                        />
                    </div>
                </div>



            </div>


        </>
    );
};

export default Exam2;