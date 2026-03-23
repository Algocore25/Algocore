import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue, set, remove, get } from 'firebase/database';
import { FiPlus, FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';
import { database } from '../../firebase';
import toast from 'react-hot-toast';
import LoadingPage from '../LoadingPage';

const ManageCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingCourse, setCreatingCourse] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const db = getDatabase();
        const coursesRef = ref(db, 'Courses');

        const unsubscribe = onValue(coursesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (Array.isArray(data)) {
                    // Keep the real Firebase array index on each course as _key
                    const arr = data
                        .map((c, i) => c ? { ...c, _key: String(i) } : null)
                        .filter(Boolean);
                    setCourses(arr);
                } else {
                    const coursesArray = Object.keys(data).map(key => ({
                        _key: key,
                        ...data[key]
                    }));
                    setCourses(coursesArray);
                }
            } else {
                setCourses([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const createCourse = async () => {
        if (creatingCourse) return;
        setCreatingCourse(true);
        try {
            const newCourseId = 'course_' + Math.random().toString(36).substr(2, 9);

            // Read the current Courses to find the real next index
            const snap = await get(ref(database, 'Courses'));
            let nextIndex = 0;
            if (snap.exists()) {
                const data = snap.val();
                if (Array.isArray(data)) {
                    nextIndex = data.length;
                } else {
                    const keys = Object.keys(data).filter(k => !isNaN(k)).map(Number);
                    nextIndex = keys.length > 0 ? Math.max(...keys) + 1 : 0;
                }
            }

            const newCourseRef = ref(database, `Courses/${nextIndex}`);
            const courseData = {
                id: newCourseId,
                title: 'New Course',
                description: 'New Course Description',
            };

            await set(newCourseRef, courseData);

            // Initialize the AlgoCore node for this course
            await set(ref(database, `AlgoCore/${newCourseId}/course`), {
                title: 'New Course',
                description: 'New Course Description',
                stats: { level: 'Beginner' }
            });

            toast.success('Course created');
            navigate(`/courseedit/${newCourseId}?index=${nextIndex}`);
        } catch (error) {
            console.error('Error creating course', error);
            toast.error('Failed to create course');
        } finally {
            setCreatingCourse(false);
        }
    };

    const deleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
        if (deletingId) return;
        setDeletingId(courseId);
        try {
            // 1. Read the live Courses list directly from Firebase (not from local state)
            const snap = await get(ref(database, 'Courses'));
            if (!snap.exists()) {
                toast.error('Courses list not found in database.');
                return;
            }

            const raw = snap.val();

            // 2. Flatten to a clean array (handles both array and object shapes)
            let allEntries = Array.isArray(raw)
                ? raw.filter(Boolean)
                : Object.values(raw).filter(Boolean);

            // 3. Remove only the course that matches the given courseId
            const filtered = allEntries.filter(c => c.id !== courseId);

            if (filtered.length === allEntries.length) {
                toast.error('Course entry not found in list — AlgoCore data will still be removed.');
            }

            // 4. Rewrite the entire Courses array compactly (no null holes left behind)
            await set(ref(database, 'Courses'), filtered.length > 0 ? filtered : []);

            // 5. Delete all AlgoCore data for this course
            await remove(ref(database, `AlgoCore/${courseId}`));

            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Error deleting course:', error);
            toast.error('Failed to delete course');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <LoadingPage />;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Courses</h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/bulk-course-upload')}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
                    >
                        <FiUpload className="mr-2" />
                        Bulk Upload
                    </button>
                    <button
                        onClick={createCourse}
                        disabled={creatingCourse}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                    >
                        <FiPlus className="mr-2" />
                        {creatingCourse ? 'Creating...' : 'Create Course'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    course && course.id ? (
                        <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 flex flex-col hover:border-blue-500 transition-colors">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow truncate">{course.description}</p>

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => navigate(`/courseedit/${course.id}?index=${course._key}`)}
                                    className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    <FiEdit2 className="mr-1" /> Edit
                                </button>
                                <button
                                    onClick={() => deleteCourse(course.id)}
                                    disabled={!!deletingId}
                                    className="flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                >
                                    <FiTrash2 className="mr-1" />
                                    {deletingId === course.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ) : null
                ))}
            </div>

            {courses.length === 0 && (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No courses found. Create one to get started.</p>
                </div>
            )}
        </div>
    );
};

export default ManageCourses;
