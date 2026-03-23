import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, get, child, remove } from 'firebase/database';
import toast from 'react-hot-toast';

const DeleteProgressPage = () => {
    const [courses, setCourses] = useState({});
    const [selectedCourse, setSelectedCourse] = useState('');

    const [lessons, setLessons] = useState({});
    const [selectedLesson, setSelectedLesson] = useState('');

    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState('');

    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const dbRef = ref(database);
                const snapshot = await get(child(dbRef, 'AlgoCore'));
                if (snapshot.exists()) {
                    setCourses(snapshot.val());
                }
            } catch (err) {
                console.error('Error fetching courses:', err);
                toast.error('Failed to load courses.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse && courses[selectedCourse]?.lessons) {
            setLessons(courses[selectedCourse].lessons);
            setSelectedLesson('');
            setQuestions([]);
            setSelectedQuestion('');
        } else {
            setLessons({});
        }
    }, [selectedCourse, courses]);

    useEffect(() => {
        if (selectedLesson && lessons[selectedLesson]?.questions) {
            setQuestions(lessons[selectedLesson].questions);
            setSelectedQuestion('');
        } else {
            setQuestions([]);
        }
    }, [selectedLesson, lessons]);

    const handleDelete = async () => {
        if (!selectedCourse || !selectedLesson || !selectedQuestion) {
            toast.error('Please select Course, Section, and Question.');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ALL student progress for '${selectedQuestion}' in ${selectedCourse} -> ${selectedLesson}? This action cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            const dbRef = ref(database);
            const userProgressSnap = await get(child(dbRef, 'userprogress'));
            if (userProgressSnap.exists()) {
                const allUsers = userProgressSnap.val();
                let deleteOperations = [];

                Object.keys(allUsers).forEach((uid) => {
                    // Check if progress exists for this specific question for the user
                    if (allUsers[uid]?.[selectedCourse]?.[selectedLesson]?.[selectedQuestion] !== undefined) {
                        const questionProgressRef = child(dbRef, `userprogress/${uid}/${selectedCourse}/${selectedLesson}/${selectedQuestion}`);
                        deleteOperations.push(remove(questionProgressRef));
                    }
                });

                await Promise.all(deleteOperations);
                toast.success(`Successfully deleted progress for ${deleteOperations.length} students.`);
            } else {
                toast.success('No user progress found to delete.');
            }
        } catch (err) {
            console.error('Deletion error:', err);
            toast.error('Failed to delete progress.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen pt-24 px-4 text-center dark:text-white">Loading Data...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 mt-20">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Delete Question Progress (Dev Only)</h1>

            <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-md p-6 border border-gray-200 dark:border-dark-tertiary">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Course
                    </label>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-primary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">-- Choose Course --</option>
                        {Object.keys(courses).map((courseKey) => (
                            <option key={courseKey} value={courseKey}>{courseKey}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Section (Lesson)
                    </label>
                    <select
                        value={selectedLesson}
                        onChange={(e) => setSelectedLesson(e.target.value)}
                        disabled={!selectedCourse}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-primary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                        <option value="">-- Choose Section --</option>
                        {Object.keys(lessons).map((lessonKey) => (
                            <option key={lessonKey} value={lessonKey}>{lessonKey}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Question
                    </label>
                    <select
                        value={selectedQuestion}
                        onChange={(e) => setSelectedQuestion(e.target.value)}
                        disabled={!selectedLesson || questions.length === 0}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-primary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                        <option value="">-- Choose Question --</option>
                        {questions.map((q, idx) => (
                            <option key={idx} value={q}>{q}</option>
                        ))}
                    </select>
                    {selectedLesson && questions.length === 0 && (
                        <p className="text-sm text-red-500 mt-2">No questions found in this section.</p>
                    )}
                </div>

                <button
                    onClick={handleDelete}
                    disabled={!selectedQuestion || deleting}
                    className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors flex justify-center items-center ${!selectedQuestion || deleting
                            ? 'bg-red-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                        }`}
                >
                    {deleting ? 'Deleting Progress...' : 'Delete All Students Progress for Question'}
                </button>
            </div>
        </div>
    );
};

export default DeleteProgressPage;
