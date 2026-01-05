import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logoLight from '../assets/LOGO.png';
import logoDark from '../assets/LOGO-1.png';
import { FaSun as SunIcon, FaMoon as MoonIcon } from 'react-icons/fa';

const DevToolsBlocker = () => {
    const { theme, toggleTheme } = useTheme();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <div className={`h-screen flex flex-col transition-colors duration-500 overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Navbar shrink-0 to take only necessary space */}
            <nav className="h-16 w-full bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-tertiary shrink-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={theme === 'dark' ? logoDark : logoLight} alt="AlgoCore Logo" className="h-8 w-auto" />
                        <span className="text-xl font-bold text-[#202124] dark:text-white">AlgoCore</span>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? (
                            <SunIcon className="w-5 h-5 text-yellow-400" />
                        ) : (
                            <MoonIcon className="w-5 h-5 text-gray-700" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Main Content - Flex-1 with centering */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-orange-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={`max-w-xl w-full max-h-[calc(100vh-6rem)] p-6 md:p-8 rounded-3xl shadow-2xl border backdrop-blur-md relative z-10 overflow-y-auto hide-scrollbar flex flex-col items-center justify-center ${theme === 'dark'
                            ? 'bg-[#141414]/90 border-white/10 shadow-black'
                            : 'bg-white/90 border-black/5 shadow-gray-200'
                        }`}
                >
                    {/* Developer Animation */}
                    <motion.div variants={itemVariants} className="flex justify-center mb-4 relative shrink-0">
                        <div className="relative group">
                            <motion.svg
                                width="100"
                                height="100"
                                viewBox="0 0 200 200"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                className="relative z-10"
                            >
                                <rect x="40" y="140" width="120" height="8" rx="4" fill={theme === 'dark' ? '#333' : '#cbd5e1'} />
                                <rect x="60" y="148" width="80" height="4" rx="2" fill={theme === 'dark' ? '#222' : '#94a3b8'} />
                                <motion.rect
                                    x="50" y="60" width="100" height="80" rx="8"
                                    fill={theme === 'dark' ? '#1a1a1a' : '#f8fafc'}
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                />
                                {[75, 90, 105, 120].map((y, i) => (
                                    <motion.rect
                                        key={i}
                                        x="60" y={y}
                                        height="4"
                                        rx="2"
                                        fill={i % 2 === 0 ? '#ef4444' : (theme === 'dark' ? '#444' : '#e2e8f0')}
                                        initial={{ width: 0 }}
                                        animate={{ width: [0, 80, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                                    />
                                ))}
                                <motion.path
                                    d="M100 85 L110 105 L90 105 Z"
                                    fill="#ef4444"
                                    animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <circle cx="100" cy="40" r="15" fill={theme === 'dark' ? '#333' : '#e2e8f0'} />
                                <motion.path d="M80 58 Q100 50 120 58" stroke={theme === 'dark' ? '#333' : '#e2e8f0'} strokeWidth="12" strokeLinecap="round" />
                            </motion.svg>
                            <div className="absolute inset-0 bg-red-500/10 blur-[30px] rounded-full -z-10 animate-pulse"></div>
                        </div>
                    </motion.div>

                    {/* Security Icon & Text */}
                    <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4 shrink-0">
                        <div className="bg-red-500/10 p-2.5 rounded-full ring-2 ring-red-500/20">
                            <ShieldAlert size={24} className="text-red-500" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Access Restricted</h1>
                    </motion.div>

                    <motion.p variants={itemVariants} className={`text-base text-center mb-6 leading-relaxed shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Our security system has detected <span className="text-red-500 font-semibold italic">Developer Tools</span> active.
                        Please disable them to maintain the integrity of your session.
                    </motion.p>

                    {/* Action List */}
                    <motion.div variants={itemVariants} className={`w-full space-y-3 mb-6 p-5 rounded-2xl border shrink-0 ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-black/5'}`}>
                        {[
                            "Close all developer tool windows (F12 / Inspect)",
                            "Disable the React DevTools browser extension",
                            "Refresh this page to verify and continue"
                        ].map((action, idx) => (
                            <div key={idx} className="flex items-start space-x-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{action}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Primary Button */}
                    <motion.div variants={itemVariants} className="w-full flex flex-col items-center shrink-0">
                        <button
                            onClick={() => window.location.reload()}
                            className="group relative w-full md:w-auto min-w-[240px] bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 px-10 rounded-2xl transition-all duration-300 shadow-xl shadow-red-900/20 flex items-center justify-center space-x-2.5 overflow-hidden"
                        >
                            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                            <span className="relative z-10">Re-verify & Refresh</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        </button>

                        <p className={`mt-5 text-[10px] uppercase tracking-[0.2em] font-bold opacity-30`}>
                            AlgoCore Security Proctoring
                        </p>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
};

export default DevToolsBlocker;
