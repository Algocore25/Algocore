import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, ArrowRight, Star, Users, Clock, TrendingUp } from 'lucide-react';
import { courseContent } from '../utils/courseContent';
import FloatingChatbot from '../components/FloatingChatbot';

const LearnPage = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const courses = Object.values(courseContent);

    return (
        <div className={`min-h-screen relative overflow-x-hidden flex flex-col w-full pt-20 pb-12 px-4 transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
            }`}>
            <div className="max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="mb-12">
                    <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                        Learn Programming
                    </h1>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Master programming languages with comprehensive, beginner-friendly tutorials.
                    </p>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            onClick={() => navigate(`/learn/${course.id}`)}
                            className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-[2rem] p-6 md:p-8 border shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer ${theme === 'dark'
                                ? 'border-gray-700/50'
                                : 'border-white/40'
                                }`}
                        >
                            {/* Decorative gradient blur behind the card */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="mb-6 z-10 flex items-start justify-between">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300 shadow-sm text-3xl ${theme === 'dark'
                                    ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-800/30'
                                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100/50'
                                    }`}>
                                    {course.icon}
                                </div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm group-hover:bg-blue-600 group-hover:text-white ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'
                                    }`}>
                                    <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>

                            <div className="z-10 flex-grow mb-6">
                                <h3 className={`text-2xl font-bold mb-3 transition-colors line-clamp-1 ${theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'
                                    }`}>
                                    {course.name}
                                </h3>
                                <p className={`leading-relaxed line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    {course.description}
                                </p>
                            </div>

                            <div className="mt-auto z-10 pt-4 border-t" style={{
                                borderColor: theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'
                            }}>

                            </div>
                        </div>
                    ))}
                </div>


            </div>
            {/* Include floating chatbot */}
            <FloatingChatbot />
        </div>
    );
};

export default LearnPage;
