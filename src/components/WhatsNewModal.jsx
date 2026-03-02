import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket,
    Code2,
    Cpu,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Zap,
    Globe,
    BookOpen,
    Clock,
    Star,
} from 'lucide-react';

const STORAGE_KEY = 'algocore_whatsnew_v3';

const SLIDES = [
    {
        icon: <Sparkles className="w-8 h-8" />,
        tag: "Welcome",
        title: "AlgoCore Update",
        description: "Experience the latest enhancements in performance and usability. We've refined the platform for a smoother coding journey.",
        accent: "from-indigo-600 to-violet-600",
        bgPattern: "from-indigo-500/10 to-transparent",
    },
    {
        icon: <BookOpen className="w-8 h-8" />,
        tag: "Exams",
        title: "Exam Module Added",
        description: "Take scheduled exams and unlimited anytime tests. Comprehensive proctoring, real-time results, and detailed performance analytics.",
        accent: "from-blue-500 to-cyan-600",
        bgPattern: "from-blue-500/10 to-transparent",
    },
    {
        icon: <Code2 className="w-8 h-8" />,
        tag: "Languages",
        title: "Java Infrastructure",
        description: "Our Java logic is now fully optimized with a high-performance judge and intelligent syntax highlighting.",
        accent: "from-orange-500 to-amber-600",
        bgPattern: "from-orange-500/10 to-transparent",
    },
    {
        icon: <Zap className="w-8 h-8" />,
        tag: "Languages",
        title: "Python Support",
        description: "Lightning-fast Python execution is live. Solve complex algorithmic challenges with seamless runtime support.",
        accent: "from-yellow-500 to-green-600",
        bgPattern: "from-yellow-500/10 to-transparent",
    },
    {
        icon: <Clock className="w-8 h-8" />,
        tag: "Features",
        title: "Scheduled & Anytime Exams",
        description: "Flexible exam scheduling with automatic notifications. Take exams on your time with instant result verification.",
        accent: "from-purple-500 to-fuchsia-600",
        bgPattern: "from-purple-500/10 to-transparent",
    },
    {
        icon: <Globe className="w-8 h-8" />,
        tag: "Social",
        title: "Profile & Network",
        description: "Build your presence. Link your GitHub, follow top coders, and customize your professional public profile.",
        accent: "from-pink-500 to-rose-600",
        bgPattern: "from-pink-500/10 to-transparent",
    },
];

export default function WhatsNewModal() {
    const [visible, setVisible] = useState(false);
    const [slide, setSlide] = useState(0);

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
            const timer = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
    };

    const next = () => {
        if (slide < SLIDES.length - 1) setSlide(s => s + 1);
        else dismiss();
    };

    const prev = () => { if (slide > 0) setSlide(s => s - 1); };

    if (!visible) return null;

    const s = SLIDES[slide];
    const isLast = slide === SLIDES.length - 1;

    // Sophisticated animations
    const contentVariants = {
        initial: { opacity: 0, y: 30, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -30, scale: 0.9 }
    };

    const iconVariants = {
        initial: { scale: 0, rotate: -180, opacity: 0 },
        animate: { scale: 1, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 15, delay: 0.1 } },
        exit: { scale: 0, rotate: 180, opacity: 0 }
    };

    const badgeVariants = {
        initial: { opacity: 0, y: -15, x: -20 },
        animate: { opacity: 1, y: 0, x: 0, transition: { delay: 0.2, type: "spring", stiffness: 200 } },
    };

    const titleVariants = {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.4 } },
        exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
    };

    const descriptionVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.4 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.15,
            }
        }
    };

    // Floating animation
    const floatingVariants = {
        initial: { y: 0 },
        animate: {
            y: [-10, 10, -10],
            transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
        }
    };

    // Pulse animation for glow
    const pulseVariants = {
        animate: {
            opacity: [0.3, 0.7, 0.3],
            transition: { duration: 3, repeat: Infinity }
        }
    };

    // Slide in animation for buttons
    const slideInVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.3 } }
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-lg"
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 60 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 60 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800"
                    >
                        {/* Animated Background Pattern */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${s.bgPattern} pointer-events-none`} />
                        <motion.div
                            className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/20 dark:from-white/5 rounded-full blur-3xl pointer-events-none"
                            animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute -bottom-20 -left-20 w-56 h-56 bg-gradient-to-tr from-gray-200/20 dark:from-slate-700/20 rounded-full blur-3xl pointer-events-none"
                            animate={{ x: [0, -15, 0], y: [0, -20, 0] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />

                        <motion.div
                            className="relative pt-16 pb-12 px-12 lg:px-16 flex flex-col items-center"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Animated Badge */}
                            <motion.div variants={badgeVariants}>
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${s.accent} text-white shadow-lg`}>
                                    {s.tag}
                                </span>
                            </motion.div>

                            {/* Animated Icon with Floating Effect */}
                            <motion.div
                                variants={iconVariants}
                                className="relative mt-10 mb-10"
                            >
                                <motion.div
                                    className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${s.accent} flex items-center justify-center text-white shadow-2xl`}
                                    whileHover={{ scale: 1.15, rotate: 12 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                                >
                                    <motion.div variants={floatingVariants} initial="initial" animate="animate">
                                        {s.icon}
                                    </motion.div>
                                </motion.div>

                                {/* Animated Glow effect */}
                                <motion.div
                                    variants={pulseVariants}
                                    animate="animate"
                                    className={`absolute inset-0 bg-gradient-to-br ${s.accent} rounded-3xl blur-2xl -z-10`}
                                />
                            </motion.div>

                            {/* Content with Staggered Animation */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={slide}
                                    className="text-center w-full max-w-lg"
                                >
                                    <motion.h2
                                        variants={titleVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mb-4 tracking-tight"
                                    >
                                        {s.title}
                                    </motion.h2>
                                    <motion.p
                                        variants={descriptionVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        className="text-gray-600 dark:text-gray-400 text-base lg:text-lg leading-relaxed font-medium"
                                    >
                                        {s.description}
                                    </motion.p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Animated Progress Indicator */}
                            <div className="flex gap-3 mt-12">
                                {SLIDES.map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={`rounded-full transition-all ${i === slide ? `h-3 bg-gradient-to-r ${s.accent} shadow-lg` : 'h-2 bg-gray-300 dark:bg-gray-600'}`}
                                        animate={{
                                            width: i === slide ? 28 : 10,
                                            scale: i === slide ? 1 : 0.8,
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                ))}
                            </div>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            variants={slideInVariants}
                            initial="initial"
                            animate="animate"
                            className="px-12 lg:px-16 pb-12 flex gap-4 w-full"
                        >
                            {slide > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.08, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={prev}
                                    className="flex-1 py-3 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                    Back
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.08, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={next}
                                className={`flex-[2] py-4 px-6 rounded-xl bg-gradient-to-r ${s.accent} text-sm lg:text-base font-bold text-white flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-shadow`}
                            >
                                {isLast ? (
                                    <>
                                        <span>Explore Now</span>
                                        <motion.div
                                            animate={{ x: [0, 4, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <Rocket size={18} />
                                        </motion.div>
                                    </>
                                ) : (
                                    <>
                                        <span>Next</span>
                                        <motion.div
                                            animate={{ x: [0, 6, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <ChevronRight size={18} />
                                        </motion.div>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>

                        {/* Animated Progress Bar with Shimmer */}
                        <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                            <motion.div
                                className={`h-full bg-gradient-to-r ${s.accent} relative`}
                                initial={{ width: 0 }}
                                animate={{ width: `${((slide + 1) / SLIDES.length) * 100}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-white/30"
                                    animate={{ x: [-100, 100] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
