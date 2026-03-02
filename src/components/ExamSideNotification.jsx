import React, { useState, useEffect } from 'react';
import SideToastNotification from './SideToastNotification';
import { useScheduledExams } from '../hooks/useScheduledExams';
import { useAuth } from '../context/AuthContext';

const ExamSideNotification = () => {
    const { user } = useAuth();
    const { exams } = useScheduledExams(user);
    const [notifications, setNotifications] = useState([]);
    const [notifiedExams, setNotifiedExams] = useState(new Set());

    // Don't show on admin pages
    const isAdminPage = /^\/(admin|testedit|exammonitor|adminresults|monitor)/i.test(window.location.pathname);

    useEffect(() => {
        if (!user || isAdminPage) return;

        // Show notification for active exams
        exams.active.forEach((exam) => {
            const notificationId = `active-${exam.id}`;
            if (!notifiedExams.has(notificationId)) {
                setNotifications((prev) => [
                    ...prev,
                    {
                        id: notificationId,
                        type: 'active',
                        exam: exam,
                        message: `${exam.name} is happening now!`,
                    },
                ]);
                setNotifiedExams((prev) => new Set([...prev, notificationId]));
            }
        });

        // Show notification for upcoming exams (only first upcoming)
        if (exams.upcoming.length > 0 && !notifiedExams.has(`upcoming-${exams.upcoming[0].id}`)) {
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
            setNotifiedExams((prev) => new Set([...prev, `upcoming-${upcomingExam.id}`]));
        }

        // Show notification for unattempted anytime exams
        exams.anytime.forEach((exam) => {
            const notificationId = `anytime-${exam.id}`;
            if (!notifiedExams.has(notificationId)) {
                setNotifications((prev) => [
                    ...prev,
                    {
                        id: notificationId,
                        type: 'anytime',
                        exam: exam,
                        message: `${exam.name} is available to take anytime!`,
                    },
                ]);
                setNotifiedExams((prev) => new Set([...prev, notificationId]));
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
                        duration={10000}
                        onClose={() => removeNotification(notification.id)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ExamSideNotification;
