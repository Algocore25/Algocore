import React, { useState, useEffect } from 'react';
import { FiX, FiAlertCircle, FiClock } from 'react-icons/fi';

const SideToastNotification = ({ message, type = 'info', duration = 10000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    const typeStyles = {
        active: {
            bg: 'bg-green-50 dark:bg-green-900/30',
            border: 'border-l-4 border-green-500',
            icon: 'text-green-600 dark:text-green-400',
            text: 'text-green-800 dark:text-green-200',
            subtitle: 'text-green-700 dark:text-green-300'
        },
        upcoming: {
            bg: 'bg-amber-50 dark:bg-amber-900/30',
            border: 'border-l-4 border-amber-500',
            icon: 'text-amber-600 dark:text-amber-400',
            text: 'text-amber-800 dark:text-amber-200',
            subtitle: 'text-amber-700 dark:text-amber-300'
        },
        anytime: {
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            border: 'border-l-4 border-blue-500',
            icon: 'text-blue-600 dark:text-blue-400',
            text: 'text-blue-800 dark:text-blue-200',
            subtitle: 'text-blue-700 dark:text-blue-300'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            border: 'border-l-4 border-blue-500',
            icon: 'text-blue-600 dark:text-blue-400',
            text: 'text-blue-800 dark:text-blue-200',
            subtitle: 'text-blue-700 dark:text-blue-300'
        }
    };

    const style = typeStyles[type] || typeStyles.info;

    return (
        <div className={`animate-in fade-in slide-in-from-right duration-300`}>
            <div className={`${style.bg} ${style.border} rounded-lg shadow-lg p-4 max-w-sm w-full backdrop-blur-sm`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className={`flex-shrink-0 mt-0.5`}>
                            {type === 'active' && (
                                <FiAlertCircle className={`h-5 w-5 ${style.icon} animate-pulse`} />
                            )}
                            {type === 'upcoming' && (
                                <FiClock className={`h-5 w-5 ${style.icon}`} />
                            )}
                            {(type === 'anytime' || type === 'info') && (
                                <FiAlertCircle className={`h-5 w-5 ${style.icon}`} />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-sm font-semibold ${style.text}`}>
                                {type === 'active' && '🔴 Active Exam Now!'}
                                {type === 'upcoming' && '⏰ Exam Coming Soon'}
                                {type === 'anytime' && '📚 Exam Available'}
                                {type === 'info' && message}
                            </h3>
                            {message && type !== 'info' && (
                                <p className={`text-xs ${style.subtitle} mt-1`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className={`flex-shrink-0 ml-2 ${style.icon} hover:opacity-70 transition-opacity`}
                    >
                        <FiX className="h-4 w-4" />
                    </button>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${type === 'active'
                            ? 'bg-green-500'
                            : type === 'upcoming'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            } animate-pulse`}
                        style={{
                            animation: `shrink ${duration}ms linear forwards`,
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `}</style>
        </div>
    );
};

export default SideToastNotification;
