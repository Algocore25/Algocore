import React, { useState, useEffect } from 'react';
import SideToastNotification from './SideToastNotification';
import { useScheduledExams } from '../hooks/useScheduledExams';
import { useAuth } from '../context/AuthContext';

const ExamSideNotification = () => {
    const { user } = useAuth();
    const { exams } = useScheduledExams(user);
    const [notifications, setNotifications] = useState([]);
    const [notifiedExams, setNotifiedExams] = useState(() => {
        // Load notification timestamps from localStorage on mount
        try {
            const stored = localStorage.getItem('examNotificationTimestamps');
            return stored ? new Map(JSON.parse(stored)) : new Map();
        } catch {
            return new Map();
        }
    });

    // Don't show on admin pages
    const isAdminPage = /^\/(admin|testedit|exammonitor|adminresults|monitor)/i.test(window.location.pathname);

    // Helper function to check if enough time has passed (30 minutes = 1800000 ms)
    const shouldShowNotification = (notificationId) => {
        const lastNotified = notifiedExams.get(notificationId);
        if (!lastNotified) return true; // Never notified before
        const now = Date.now();
        return (now - lastNotified) > 1800000; // 30 minutes in milliseconds
    };

    // Helper function to mark exam as notified and persist to localStorage
    const markAsNotified = (notificationId) => {
        setNotifiedExams(prev => {
            const updated = new Map(prev.set(notificationId, Date.now()));
            // Persist to localStorage
            try {
                localStorage.setItem('examNotificationTimestamps', JSON.stringify(Array.from(updated.entries())));
            } catch {
                console.warn('Failed to persist notification timestamps to localStorage');
            }
            return updated;
        });
    };

    useEffect(() => {
        if (!user || isAdminPage) return;

        // Show notification for active exams
        exams.active.forEach((exam) => {
            const notificationId = `active-${exam.id}`;
            if (shouldShowNotification(notificationId)) {
                setNotifications((prev) => [
                    ...prev,
                    {
                        id: notificationId,
                        type: 'active',
                        exam: exam,
                        message: `${exam.name} is happening now!`,
                    },
                ]);
                markAsNotified(notificationId);
            }
        });

        // Show notification for upcoming exams (only first upcoming)
        if (exams.upcoming.length > 0 && shouldShowNotification(`upcoming-${exams.upcoming[0].id}`)) {
            const upcomingExam = exams.upcoming[0];
            const startTime = upcomingExam.Properties?.startTime
                ? new Date(upcomingExam.Properties.startTime)
                : null;

            setNotifications((prev) => [
                ...prev,
                {
                    id: `upcoming-${upcomingExam.id}`,
                    type: 'upcoming',
                    exam: upcomingExam,
                    message: startTime
                        ? `${upcomingExam.name} starts on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString(
                            [],
                            { hour: '2-digit', minute: '2-digit' }
                        )}`
                        : `${upcomingExam.name} is coming up!`,
                },
            ]);
            markAsNotified(`upcoming-${upcomingExam.id}`);
        }

        // Show notification for unattempted anytime exams
        exams.anytime.forEach((exam) => {
            const notificationId = `anytime-${exam.id}`;
            if (shouldShowNotification(notificationId)) {
                setNotifications((prev) => [
                    ...prev,
                    {
                        id: notificationId,
                        type: 'anytime',
                        exam: exam,
                        message: `${exam.name} is available to take anytime!`,
                    },
                ]);
                markAsNotified(notificationId);
            }
        });
    }, [exams.active, exams.upcoming, exams.anytime, user, isAdminPage]);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    if (!user || isAdminPage || notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
            {notifications.map((notification) => (
                <div key={notification.id} className="pointer-events-auto">
                    <SideToastNotification
                        type={notification.type}
                        message={notification.message}
                        duration={1500}
                        onClose={() => removeNotification(notification.id)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ExamSideNotification;
