import React from 'react';
import { motion } from 'framer-motion';

const bubbleParams = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    size: Math.random() * 40 + 10,
    left: Math.random() * 100,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 5,
    color: 'bg-blue-300 dark:bg-blue-700',
    startX: Math.random() * 30 - 15,
    endX: Math.random() * 60 - 30,
}));

const AnimatedBackground = () => {
    return (
        <>
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-grid-pattern"></div>

            {/* Moving Bubble Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                {bubbleParams.map((b) => (
                    <motion.div
                        key={b.id}
                        className={`absolute rounded-full opacity-10 dark:opacity-20 blur-2xl mix-blend-screen ${b.color}`}
                        style={{
                            width: b.size,
                            height: b.size,
                            left: `${b.left}%`,
                        }}
                        initial={{ y: '110vh', x: b.startX }}
                        animate={{
                            y: '-20vh',
                            x: [b.startX, b.endX, b.startX],
                        }}
                        transition={{
                            y: { duration: b.duration, repeat: Infinity, ease: 'linear', delay: b.delay },
                            x: { duration: b.duration * 0.8, repeat: Infinity, ease: 'easeInOut', delay: b.delay, repeatType: 'mirror' },
                        }}
                    />
                ))}

                {/* Glow Blobs */}
                <div className="absolute top-20 left-10 w-64 h-64 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-20 w-64 h-64 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-40 w-64 h-64 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>
        </>
    );
};

export default AnimatedBackground;
