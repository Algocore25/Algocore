import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useTheme } from '../context/ThemeContext';
import { BookOpen, ArrowRight, Star, Users, Clock, TrendingUp } from 'lucide-react';
import { courseContent } from '../utils/courseContent';
import FloatingChatbot from '../components/FloatingChatbot';


const LearnPage = () => {
    const { theme } = useTheme();
    const router = useRouter();

    const courses = Object.values(courseContent);

    return (
        <div className={`min-h-screen relative overflow-x-hidden flex flex-col w-full pt-20 pb-16 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${theme === 'dark'
            ? 'bg-[#0f172a] text-slate-200'
            : 'bg-[#f8fafc] text-slate-800'
            }`}>
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-5%] w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto w-full relative z-10">
                {/* Header Section */}
                <div className="mb-16 mt-8 text-center max-w-3xl mx-auto">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border ${theme === 'dark' ? 'bg-blue-900/30 border-blue-800/50 text-blue-400' : 'bg-blue-100/50 border-blue-200/50 text-blue-700'}`}>
                        <Star className="w-4 h-4" /> Top Rated Courses
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                        Elevate Your{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                            Coding Skills
                        </span>
                    </h1>
                    <p className={`text-lg md:text-xl leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Master programming languages with our comprehensive, beautifully crafted tutorials designed for absolute beginners and advanced developers.
                    </p>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
                    {courses.map((course, idx) => (
                        <div
                            key={course.id}
                            style={{ animationDelay: `${idx * 100}ms` }}
                            onClick={() => router.push(`/learn/${course.id}`)}
                            className={`group relative rounded-[2rem] p-6 lg:p-8 backdrop-blur-xl border transition-all duration-500 hover:-translate-y-3 cursor-pointer overflow-hidden animate-fade-in-up ${theme === 'dark'
                                    ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:border-blue-500/30'
                                    : 'bg-white/70 border-white hover:bg-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-blue-200'
                                }`}
                        >
                            {/* Card Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-colors duration-500 pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Icon & Arrow */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 ${theme === 'dark'
                                            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-black/20'
                                            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-gray-200/50'
                                        }`}>
                                        {course.icon}
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${theme === 'dark' 
                                        ? 'bg-slate-800 text-slate-500 group-hover:bg-blue-600 group-hover:text-white' 
                                        : 'bg-white text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md'
                                        }`}>
                                        <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-grow">
                                    <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                                        }`}>
                                        {course.name}
                                    </h3>
                                    <p className={`text-sm leading-relaxed mb-6 line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                        {course.description}
                                    </p>
                                </div>

                                {/* Footer Stats */}
                                <div className="mt-auto pt-6 border-t flex items-center justify-between" style={{
                                    borderColor: theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.6)'
                                }}>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span>{course.rating}</span>
                                    </div>
                                    
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{course.hours}h</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Additional Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 max-w-5xl mx-auto">
                    <div className={`rounded-3xl p-8 flex items-center gap-6 border backdrop-blur-md ${theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-100'}`}>
                        <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm'}`}>
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-1">Thriving Community</h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Join over 100,000+ learners worldwide</p>
                        </div>
                    </div>
                    
                    <div className={`rounded-3xl p-8 flex items-center gap-6 border backdrop-blur-md ${theme === 'dark' ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-100'}`}>
                        <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white text-emerald-600 shadow-sm'}`}>
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold mb-1">Career Ready Projects</h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Build real-world applications to show off</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Include floating chatbot */}
            <FloatingChatbot />
        </div>
    );
};

export default LearnPage;
