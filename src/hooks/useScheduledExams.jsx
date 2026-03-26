import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../firebase';

export const useScheduledExams = (user) => {
    const [exams, setExams] = useState({
        active: [],
        upcoming: [],
        ended: [],
        anytime: []
    });
    const [loading, setLoading] = useState(true);

    const checkExamStatus = useCallback((exam) => {
        const schedulingType = exam?.Properties?.type || 'anytime';
        const startTime = exam.Properties?.startTime ? new Date(exam.Properties.startTime) : null;
        const endTime = exam.Properties?.endTime ? new Date(exam.Properties.endTime) : null;
        const now = new Date();

        if (schedulingType === 'anytime') {
            return 'anytime'; // Return anytime for anytime exams
        }

        if (startTime && now < startTime) {
            return 'upcoming';
        }
        if (endTime && now > endTime) {
            return 'ended';
        }
        return 'active';
    }, []);

    const hasAttemptedExam = useCallback(async (examId) => {
        if (!user?.uid) return false;
        try {
            const submissionRef = ref(database, `ExamSubmissions/${examId}/${user.uid}`);
            const snapshot = await get(submissionRef);
            return snapshot.exists() && snapshot.val() !== null;
        } catch (error) {
            console.error('Error checking exam attempt:', error);
            return false;
        }
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        // Get all exams where this user is eligible
        const eligibleRef = ref(database, 'Exam');

        const unsubscribe = onValue(eligibleRef, async (snapshot) => {
            if (!snapshot.exists()) {
                setExams({ active: [], upcoming: [], ended: [], anytime: [] });
                setLoading(false);
                return;
            }

            console.log('Fetched exams for scheduling:', snapshot.val());

            const allExams = snapshot.val();
            const categorized = {
                active: [],
                upcoming: [],
                ended: [],
                anytime: []
            };

            // Check each exam if current user is eligible
            const examsToProcess = [];
            Object.entries(allExams).forEach(([examId, exam]) => {
                // Check if exam is visible and user is eligible
                // Eligible is stored as {uid: email}, so we check if user's email is in the values
                const isEligible = exam.Eligible && Object.values(exam.Eligible || {}).includes(user?.email) || exam.allowAllStudents === true;

                if (exam.isVisible !== false && isEligible) {
                    examsToProcess.push({ examId, exam });
                }
            });

            // Process exams with attempt checking for anytime exams
            for (const { examId, exam } of examsToProcess) {
                const status = checkExamStatus(exam);

                if (status === 'anytime') {
                    // Check if user has attempted this anytime exam
                    const hasAttempted = await hasAttemptedExam(examId);
                    if (!hasAttempted) {
                        // Only add if not attempted
                        const examWithId = { ...exam, id: examId };
                        categorized[status].push(examWithId);
                    }
                } else if (status) {
                    const examWithId = { ...exam, id: examId };
                    categorized[status].push(examWithId);
                }
            }

            setExams(categorized);
            console.log('Categorized Exams:', categorized);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid, checkExamStatus, hasAttemptedExam]);

    return { exams, loading };
};
