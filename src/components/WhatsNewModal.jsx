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
    Globe
} from 'lucide-react';

const STORAGE_KEY = 'algocore_whatsnew_v2';

const SLIDES = [
    {
        icon: <Sparkles className="w-8 h-8" />,
        tag: "Welcome",
        title: "AlgoCore Update",
        description: "Experience the latest enhancements in performance and usability. We've refined the platform for a smoother coding journey.",
        accent: "from-indigo-600 to-violet-600",
    },
    {
        icon: <Code2 className="w-8 h-8" />,
        tag: "Languages",
        title: "Java Infrastructure",
        description: "Our Java logic is now fully optimized with a high-performance judge and intelligent syntax highlighting.",
        accent: "from-orange-500 to-amber-600",
    },
    {
        icon: <Zap className="w-8 h-8" />,
        tag: "Languages",
        title: "Python Support",
        description: "Lightning-fast Python execution is live. Solve complex algorithmic challenges with seamless runtime support.",
        accent: "from-yellow-500 to-green-600",
    },
    {
        icon: <Cpu className="w-8 h-8" />,
        tag: "Features",
        title: "Aptitude Track",
        description: "Prepare for your career with a dedicated section for logical and quantitative reasoning skills.",
        accent: "from-purple-500 to-fuchsia-600",
    },
    {
        icon: <Globe className="w-8 h-8" />,
        tag: "Social",
        title: "Profile & Network",
        description: "Build your presence. Link your GitHub, follow top coders, and customize your professional public profile.",
        accent: "from-pink-500 to-rose-600",
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

    // Simplified animations
    const contentVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 }
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.98, opacity: 0 }}
                        className="relative w-full max-w-[340px] bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5"
                    >
                        <div className="relative pt-12 pb-8 px-8 flex flex-col items-center">
                            {/* Badge */}
                            <div className="mb-6">
                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r ${s.accent} text-white`}>
                                    {s.tag}
                                </span>
                            </div>

                            {/* Icon */}
                            <div
                                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.accent} flex items-center justify-center text-white shadow-lg mb-6`}
                            >
                                {s.icon}
                            </div>

                            {/* Content with simple crossfade */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={slide}
                                    variants={contentVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="text-center"
                                >
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                        {s.title}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-[13px] leading-relaxed">
                                        {s.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Professional Progress Indicator */}
                            <div className="flex gap-1.5 mt-8">
                                {SLIDES.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === slide ? 'w-6 bg-gray-900 dark:bg-white' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Actions: Simplified Footer */}
                        <div className="px-8 pb-8 flex gap-3">
                            {slide > 0 && (
                                <button
                                    onClick={prev}
                                    className="flex-1 py-3 px-2 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                    Back
                                </button>
                            )}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={next}
                                className={`flex-[2] py-3.5 rounded-xl bg-gradient-to-r ${s.accent} text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all`}
                            >
                                {isLast ? (
                                    <>
                                        Explore Now
                                        <Rocket size={14} />
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight size={14} />
                                    </>
                                )}
                            </motion.button>
                        </div>

                        {/* Minimal line at bottom */}
                        <div className="h-1 w-full bg-gray-50 dark:bg-gray-800/50">
                            <motion.div
                                className={`h-full bg-gradient-to-r ${s.accent}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${((slide + 1) / SLIDES.length) * 100}%` }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
