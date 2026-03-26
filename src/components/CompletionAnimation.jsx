import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const CompletionAnimation = ({ isVisible, onClose }) => {
    const [confetti, setConfetti] = useState([]);

    useEffect(() => {
        if (isVisible) {
            // Generate confetti particles
            const particles = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 1,
            }));
            setConfetti(particles);

            // Auto close after 3 seconds
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden">
                {confetti.map((particle) => (
                    <div
                        key={particle.id}
                        className="absolute w-2 h-2 animate-pulse"
                        style={{
                            left: `${particle.left}%`,
                            top: '-10px',
                            backgroundColor: [
                                '#3B82F6', // blue
                                '#10B981', // green
                                '#F59E0B', // amber
                                '#EF4444', // red
                                '#8B5CF6', // purple
                            ][Math.floor(Math.random() * 5)],
                            animation: `fall ${particle.duration}s ease-in forwards`,
                            animationDelay: `${particle.delay}s`,
                            borderRadius: '50%',
                        }}
                    />
                ))}
            </div>

            {/* Main celebration modal */}
            <div className="relative z-10">
                {/* Glow backdrop */}
                <div className="absolute inset-0 -m-20 bg-gradient-to-r from-green-400 to-emerald-500 blur-3xl opacity-20 rounded-full animate-pulse" />

                {/* Content */}
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-12 text-center max-w-md border-2 border-green-500 dark:border-emerald-500">
                    {/* Checkmark icon */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl -m-4 animate-pulse" />
                        <FaCheckCircle className="relative text-6xl text-green-500 mx-auto animate-bounce" />
                    </div>

                    {/* Text */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-green-600 dark:text-emerald-400">
                            Perfect! 🎉
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                            All test cases passed!
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Great job solving this problem!
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                style={{
                                    animation: 'scaleWidth 3s ease-out forwards',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS animations */}
            <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes scaleWidth {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
};

export default CompletionAnimation;
