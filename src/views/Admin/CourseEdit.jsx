import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSearchParams } from 'react-router-dom';
import { getDatabase, ref, get, set, update, child } from 'firebase/database';
import { database } from '../../firebase';
import { FiSave, FiPlus, FiTrash2, FiArrowLeft, FiArrowUp, FiArrowDown, FiX, FiMenu, FiEdit2 } from 'react-icons/fi';
import { FaChevronDown } from "react-icons/fa";
import { Reorder } from "framer-motion";
import { COURSE_ICONS, getCourseIcon, getCourseIconDef } from '../../utils/courseIcons';
import toast from 'react-hot-toast';
import LoadingPage from '../LoadingPage';
import AddQuestionModal from './AddQuestionModal';

const CourseEdit = () => {
    const { courseId } = useParams();
    const [searchParams] = useSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [courseInfo, setCourseInfo] = useState({ title: '', description: '', id: courseId });
    const [courseStats, setCourseStats] = useState({ level: 'Beginner' });
    const [lessons, setLessons] = useState({});
    const [courseIndex, setCourseIndex] = useState(searchParams.get('index'));

    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [activeSectionForQuestions, setActiveSectionForQuestions] = useState(null);
    const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [tempSectionOrder, setTempSectionOrder] = useState([]);

    const [accessType, setAccessType] = useState('open'); // 'open' or 'restricted'
    const [allowedUsers, setAllowedUsers] = useState([]); // array of users
    const [allowedLanguages, setAllowedLanguages] = useState(['c', 'python', 'javascript', 'java', 'cpp']); // allowed languages
    const [allStudents, setAllStudents] = useState([]);
    const [userSearchText, setUserSearchText] = useState('');
    const [allQuestionsData, setAllQuestionsData] = useState([]);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const availableLanguages = [
        { id: 'c', label: 'C' },
        { id: 'python', label: 'Python' },
        { id: 'javascript', label: 'JavaScript' },
        { id: 'java', label: 'Java' },
        { id: 'cpp', label: 'C++' },
        { id: 'typescript', label: 'TypeScript' },
        { id: 'sql', label: 'SQL' }
    ];

    useEffect(() => {
        let indexToUse = courseIndex;

        const fetchQuestions = async () => {
            const dbRef = ref(database);
            const questionsSnap = await get(child(dbRef, 'questions'));
            if (questionsSnap.exists()) {
                const qData = questionsSnap.val();
                const qArray = Object.entries(qData).map(([id, data]) => ({
                    id,
                    ...data
                }));
                setAllQuestionsData(qArray);
            }
        };

        const fetchCourseData = async () => {
            try {
                const dbRef = ref(database);

                // Fetch the index if not provided
                if (!indexToUse || indexToUse === 'undefined') {
                    const coursesSnapshot = await get(child(dbRef, 'Courses'));
                    if (coursesSnapshot.exists()) {
                        const data = coursesSnapshot.val();
                        let foundIndex = null;
                        if (Array.isArray(data)) {
                            foundIndex = data.findIndex(c => c && c.id === courseId);
                        } else {
                            foundIndex = Object.keys(data).find(key => data[key].id === courseId);
                        }
                        if (foundIndex !== null && foundIndex !== -1) {
                            setCourseIndex(foundIndex);
                            indexToUse = foundIndex;
                        }
                    }
                }

                // Fetch from Courses
                if (indexToUse !== null && indexToUse !== undefined && indexToUse !== 'undefined') {
                    const courseListSnap = await get(child(dbRef, `Courses/${indexToUse}`));
                    if (courseListSnap.exists()) {
                        setCourseInfo(courseListSnap.val());
                    }
                }

                // Fetch from AlgoCore
                const algoSnap = await get(child(dbRef, `AlgoCore/${courseId}/course`));
                if (algoSnap.exists()) {
                    const data = algoSnap.val();
                    setCourseInfo(prev => ({ ...prev, ...data }));
                    if (data.stats) setCourseStats(data.stats);
                    if (data.accessType) setAccessType(data.accessType);
                    if (data.allowedLanguages) setAllowedLanguages(data.allowedLanguages);
                    if (data.allowedUsers) {
                        if (typeof data.allowedUsers === 'string') {
                            setAllowedUsers(data.allowedUsers.split(',').map(u => u.trim()).filter(u => u));
                        } else if (Array.isArray(data.allowedUsers)) {
                            setAllowedUsers(data.allowedUsers);
                        }
                    }
                }

                // Fetch lessons
                const lessonsSnap = await get(child(dbRef, `AlgoCore/${courseId}/lessons`));
                if (lessonsSnap.exists()) {
                    const lessonsData = lessonsSnap.val();
                    let orderCounter = 0;
                    const normalizedLessons = {};
                    Object.keys(lessonsData).forEach(key => {
                        const lesson = lessonsData[key];
                        if (lesson.order === undefined) {
                            lesson.order = orderCounter++;
                        } else {
                            orderCounter = Math.max(orderCounter, lesson.order + 1);
                        }
                        normalizedLessons[key] = lesson;
                    });
                    setLessons(normalizedLessons);
                }

                // Fetch all questions for direct editing
                await fetchQuestions();

                // Fetch possible students for autocomplete
                const studentsSnap = await get(child(dbRef, 'Students'));
                if (studentsSnap.exists()) {
                    const studentsData = studentsSnap.val();
                    if (Array.isArray(studentsData)) {
                        setAllStudents(studentsData);
                    }
                }
            } catch (error) {
                console.error('Error fetching course data', error);
                toast.error('Failed to load course details');
            } finally {
                setLoading(false);
            }
        };

        window.fetchQuestionsForCourseEdit = fetchQuestions; // Expose for modal onClose

        fetchCourseData();
    }, [courseId, courseIndex]);

    const handleCourseInfoChange = (e) => {
        const { name, value } = e.target;
        setCourseInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleStatsChange = (e) => {
        setCourseStats(prev => ({ ...prev, level: e.target.value }));
    };

    const addSection = () => {
        const newSectionName = `Topic ${Object.keys(lessons).length + 1}`;
        const maxOrder = Object.values(lessons).reduce((max, s) => Math.max(max, s.order || 0), -1);
        setLessons(prev => ({
            ...prev,
            [newSectionName]: {
                description: 'Section description',
                status: 'Started',
                questions: [],
                order: maxOrder + 1
            }
        }));
    };

    const removeSection = (sectionName) => {
        if (window.confirm('Are you sure you want to remove this section?')) {
            const newLessons = { ...lessons };
            delete newLessons[sectionName];
            setLessons(newLessons);
        }
    };

    const updateSectionName = (oldName, newName) => {
        if (oldName === newName || !newName.trim()) return;

        setLessons(prev => {
            const newLessons = { ...prev };
            newLessons[newName] = newLessons[oldName];
            delete newLessons[oldName];
            return newLessons;
        });
    };

    const updateSectionProp = (sectionName, key, value) => {
        setLessons(prev => ({
            ...prev,
            [sectionName]: {
                ...prev[sectionName],
                [key]: value
            }
        }));
    };

    const addQuestion = (sectionName) => {
        setActiveSectionForQuestions(sectionName);
        setIsQuestionModalOpen(true);
    };

    const handleAddQuestionsFromModal = (newQuestions) => {
        if (!activeSectionForQuestions || !newQuestions || newQuestions.length === 0) return;

        setLessons(prev => {
            const currentQuestions = [...(prev[activeSectionForQuestions].questions || [])];
            const addedNames = newQuestions.map(q => q.questionname || q.id); // prefer questionname, fallback to id

            // avoid duplicates if they're already in this section
            const uniqueAddedNames = addedNames.filter(name => !currentQuestions.includes(name));

            return {
                ...prev,
                [activeSectionForQuestions]: {
                    ...prev[activeSectionForQuestions],
                    questions: [...currentQuestions, ...uniqueAddedNames]
                }
            };
        });
        setIsQuestionModalOpen(false);
        setActiveSectionForQuestions(null);
    };

    const removeQuestion = (sectionName, qIndex) => {
        setLessons(prev => {
            const questions = [...(prev[sectionName].questions || [])];
            questions.splice(qIndex, 1);
            return {
                ...prev,
                [sectionName]: {
                    ...prev[sectionName],
                    questions
                }
            };
        });
    };

    const handleEditQuestion = (qIdentifier) => {
        const qObj = allQuestionsData.find(question =>
            question.id === qIdentifier || question.questionname === qIdentifier
        );
        if (qObj) {
            setEditingQuestion(qObj);
            setIsQuestionModalOpen(true);
        } else {
            toast.error('Question data not found');
        }
    };

    const moveQuestionUp = (sectionName, qIndex) => {
        if (qIndex === 0) return;
        setLessons(prev => {
            const questions = [...(prev[sectionName].questions || [])];
            const temp = questions[qIndex - 1];
            questions[qIndex - 1] = questions[qIndex];
            questions[qIndex] = temp;
            return {
                ...prev,
                [sectionName]: {
                    ...prev[sectionName],
                    questions
                }
            };
        });
    };

    const moveQuestionDown = (sectionName, qIndex) => {
        setLessons(prev => {
            const questions = [...(prev[sectionName].questions || [])];
            if (qIndex === questions.length - 1) return prev;
            const temp = questions[qIndex + 1];
            questions[qIndex + 1] = questions[qIndex];
            questions[qIndex] = temp;
            return {
                ...prev,
                [sectionName]: {
                    ...prev[sectionName],
                    questions
                }
            };
        });
    };

    const moveSectionUp = (index) => {
        if (index === 0) return;
        setLessons(prev => {
            const sorted = Object.entries(prev).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

            // Reconstruct new state entirely instead of mutating the old references to force a React UI re-render
            const newLessons = {};
            sorted.forEach(([key, val], i) => {
                newLessons[key] = { ...val, order: i }; // Ensure contiguous base numbering
            });

            const currentObjKey = sorted[index][0];
            const prevObjKey = sorted[index - 1][0];

            // Perform the mathematical swap
            newLessons[currentObjKey].order = index - 1;
            newLessons[prevObjKey].order = index;

            return newLessons;
        });
    };

    const moveSectionDown = (index) => {
        setLessons(prev => {
            const sorted = Object.entries(prev).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
            if (index === sorted.length - 1) return prev;

            // Reconstruct new state entirely instead of mutating the old references to force a React UI re-render
            const newLessons = {};
            sorted.forEach(([key, val], i) => {
                newLessons[key] = { ...val, order: i }; // Ensure contiguous base numbering
            });

            const currentObjKey = sorted[index][0];
            const nextObjKey = sorted[index + 1][0];

            // Perform the mathematical swap
            newLessons[currentObjKey].order = index + 1;
            newLessons[nextObjKey].order = index;

            return newLessons;
        });
    };

    const openReorderModal = () => {
        const sortedKeys = Object.entries(lessons)
            .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
            .map(entry => entry[0]);
        setTempSectionOrder(sortedKeys);
        setIsReorderModalOpen(true);
    };

    const handleTempMoveUp = (index) => {
        if (index === 0) return;
        const newOrder = [...tempSectionOrder];
        const temp = newOrder[index - 1];
        newOrder[index - 1] = newOrder[index];
        newOrder[index] = temp;
        setTempSectionOrder(newOrder);
    };

    const handleTempMoveDown = (index) => {
        if (index === tempSectionOrder.length - 1) return;
        const newOrder = [...tempSectionOrder];
        const temp = newOrder[index + 1];
        newOrder[index + 1] = newOrder[index];
        newOrder[index] = temp;
        setTempSectionOrder(newOrder);
    };

    const saveReorderModal = () => {
        setLessons(prev => {
            const newLessons = {};
            tempSectionOrder.forEach((sectionKey, index) => {
                newLessons[sectionKey] = { ...prev[sectionKey], order: index };
            });
            return newLessons;
        });
        setIsReorderModalOpen(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (courseIndex !== null && courseIndex !== undefined && courseIndex !== 'undefined') {
                const topCourseRef = ref(database, `Courses/${courseIndex}`);
                await update(topCourseRef, {
                    title: courseInfo.title,
                    description: courseInfo.description,
                    section: courseInfo.section || '',
                    icon: courseInfo.icon || ''
                });
            }

            await update(ref(database, `AlgoCore/${courseId}/course`), {
                title: courseInfo.title,
                description: courseInfo.description,
                section: courseInfo.section || '',
                icon: courseInfo.icon || '',
                stats: courseStats,
                accessType: accessType,
                allowedUsers: accessType === 'restricted' ? allowedUsers.join(', ') : '',
                allowedLanguages: allowedLanguages
            });

            await set(ref(database, `AlgoCore/${courseId}/lessons`), lessons);

            toast.success('Course saved successfully!');
        } catch (error) {
            console.error('Error saving course', error);
            toast.error('Failed to save course changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingPage />;

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] -mt-4 -mx-4 bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => router.push('/admin')} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <FiArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Course</h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <FiSave className="mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Basic Info */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Basic Info</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={courseInfo.title}
                            onChange={handleCourseInfoChange}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={courseInfo.description}
                            onChange={handleCourseInfoChange}
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Section (Category)</label>
                        <input
                            type="text"
                            name="section"
                            value={courseInfo.section || ''}
                            onChange={handleCourseInfoChange}
                            placeholder="e.g. Programming Languages, Web Development"
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Icon</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <div className="flex items-center gap-3">
                                    {getCourseIcon(courseInfo.icon || '', "w-5 h-5")}
                                    <span>{getCourseIconDef(courseInfo.icon || '').label}</span>
                                </div>
                                <FaChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            {isIconDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {COURSE_ICONS.map((opt) => {
                                        const IconComponent = opt.icon;
                                        return (
                                            <button
                                                key={opt.val}
                                                type="button"
                                                onClick={() => {
                                                    handleCourseInfoChange({ target: { name: 'icon', value: opt.val } });
                                                    setIsIconDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-900 dark:text-white"
                                            >
                                                <IconComponent className={`w-5 h-5 ${opt.color}`} />
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                        <select
                            value={courseStats.level}
                            onChange={handleStatsChange}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Options</label>
                        <select
                            value={accessType}
                            onChange={(e) => setAccessType(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        >
                            <option value="open">Open Access to All</option>
                            <option value="restricted">Restrict to Specific Users</option>
                        </select>

                        {accessType === 'restricted' && (
                            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allowed Users</label>

                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        list="studentsList"
                                        value={userSearchText}
                                        onChange={(e) => setUserSearchText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = userSearchText.trim();
                                                if (val && !allowedUsers.includes(val)) {
                                                    setAllowedUsers([...allowedUsers, val]);
                                                    setUserSearchText('');
                                                }
                                            }
                                        }}
                                        placeholder="Type email or user ID and press Enter"
                                        className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <datalist id="studentsList">
                                        {allStudents.map(studentEmail => (
                                            <option key={studentEmail} value={studentEmail} />
                                        ))}
                                    </datalist>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const val = userSearchText.trim();
                                            if (val && !allowedUsers.includes(val)) {
                                                setAllowedUsers([...allowedUsers, val]);
                                                setUserSearchText('');
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
                                    {allowedUsers.length === 0 ? (
                                        <p className="text-sm text-gray-400 dark:text-gray-500 py-1 px-2 italic">No users added yet.</p>
                                    ) : (
                                        allowedUsers.map(user => (
                                            <div key={user} className="flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800/50">
                                                <span>{user}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAllowedUsers(allowedUsers.filter(u => u !== user))}
                                                    className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors focus:outline-none"
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Only users listed here will be able to access this course. You can select existing students from the dropdown or type a custom email.
                                </p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allowed Languages for Coding Questions</label>
                        <div className="flex flex-wrap gap-3 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                            {availableLanguages.map((lang) => (
                                <label key={lang.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowedLanguages.includes(lang.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setAllowedLanguages([...allowedLanguages, lang.id]);
                                            } else {
                                                // Prevent removing all languages
                                                if (allowedLanguages.length > 1) {
                                                    setAllowedLanguages(allowedLanguages.filter(l => l !== lang.id));
                                                } else {
                                                    toast.error("At least one language must be allowed.");
                                                }
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{lang.label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Select the programming languages students are allowed to use when solving coding questions in this course.
                        </p>
                    </div>
                </div>

                {/* Sections and Questions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Curriculum</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={openReorderModal}
                                disabled={Object.keys(lessons).length < 2}
                                className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-md transition-colors text-sm flex items-center disabled:opacity-50"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg> Reorder Sections
                            </button>
                            <button
                                onClick={addSection}
                                className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-md transition-colors text-sm flex items-center"
                            >
                                <FiPlus className="mr-1" /> Add Section
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {Object.keys(lessons).length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sections added yet. Add one to get started.</p>
                        )}

                        {Object.entries(lessons).sort((a, b) => (a[1].order || 0) - (b[1].order || 0)).map(([sectionName, section], index) => {
                            const numSections = Object.keys(lessons).length;

                            return (
                                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={sectionName}
                                                onChange={(e) => updateSectionName(sectionName, e.target.value)}
                                                onBlur={(e) => updateSectionName(sectionName, e.target.value)}
                                                placeholder="Section Title"
                                                className="font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full md:w-auto"
                                            />
                                            <input
                                                type="text"
                                                value={section.description || ''}
                                                onChange={(e) => updateSectionProp(sectionName, 'description', e.target.value)}
                                                placeholder="Section Description"
                                                className="text-sm text-gray-600 dark:text-gray-300 bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full block"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => moveSectionUp(index)}
                                                disabled={index === 0}
                                                className={`p-1 ${index === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'}`}
                                                title="Move Section Up"
                                            >
                                                <FiArrowUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => moveSectionDown(index)}
                                                disabled={index === numSections - 1}
                                                className={`p-1 ${index === numSections - 1 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'}`}
                                                title="Move Section Down"
                                            >
                                                <FiArrowDown size={16} />
                                            </button>
                                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                            <select
                                                value={section.status || 'Started'}
                                                onChange={(e) => updateSectionProp(sectionName, 'status', e.target.value)}
                                                className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
                                            >
                                                <option value="Started">Started</option>
                                                <option value="blocked">Blocked</option>
                                            </select>
                                            <button onClick={() => removeSection(sectionName)} className="text-red-500 hover:text-red-700 p-1" title="Delete Section">
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Questions ({section.questions ? section.questions.length : 0})</h4>
                                            <button
                                                onClick={() => addQuestion(sectionName)}
                                                className="text-xs flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                <FiPlus className="mr-1" /> Add Question
                                            </button>
                                        </div>

                                        {(!section.questions || section.questions.length === 0) ? (
                                            <p className="text-xs text-gray-400 italic">No questions in this section</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {section.questions.map((q, qIndex) => (
                                                    <li key={qIndex} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30 px-3 py-2 rounded flex justify-between items-center group">
                                                        <span>{q}</span>
                                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => moveQuestionUp(sectionName, qIndex)}
                                                                disabled={qIndex === 0}
                                                                className={`p-1 ${qIndex === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'}`}
                                                            >
                                                                <FiArrowUp size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => moveQuestionDown(sectionName, qIndex)}
                                                                disabled={qIndex === section.questions.length - 1}
                                                                className={`p-1 ${qIndex === section.questions.length - 1 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'}`}
                                                            >
                                                                <FiArrowDown size={16} />
                                                            </button>
                                                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                                            <button onClick={() => handleEditQuestion(q)} className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-400" title="Edit Question">
                                                                <FiEdit2 size={16} />
                                                            </button>
                                                            <button onClick={() => removeQuestion(sectionName, qIndex)} className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-400">
                                                                <FiTrash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Modal for adding existing questions */}
            <AddQuestionModal
                isOpen={isQuestionModalOpen}
                onClose={() => {
                    setIsQuestionModalOpen(false);
                    setActiveSectionForQuestions(null);
                    setEditingQuestion(null);
                    if (window.fetchQuestionsForCourseEdit) {
                        window.fetchQuestionsForCourseEdit();
                    }
                }}
                question={editingQuestion}
                onAddQuestions={handleAddQuestionsFromModal}
            />

            {/* Reorder Sections Modal */}
            {isReorderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reorder Sections</h3>
                            <button onClick={() => setIsReorderModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            <Reorder.Group axis="y" values={tempSectionOrder} onReorder={setTempSectionOrder} className="space-y-2">
                                {tempSectionOrder.map((sectionKey, idx) => (
                                    <Reorder.Item key={sectionKey} value={sectionKey} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md p-3 cursor-grab active:cursor-grabbing">
                                        <div className="flex items-center flex-1 overflow-hidden">
                                            <FiMenu className="text-gray-400 mr-3 shrink-0" size={18} />
                                            <span className="font-medium text-gray-900 dark:text-white truncate pr-4">{sectionKey}</span>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => handleTempMoveUp(idx)}
                                                disabled={idx === 0}
                                                className={`p-1 rounded ${idx === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                                                title="Move Up"
                                            >
                                                <FiArrowUp size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleTempMoveDown(idx)}
                                                disabled={idx === tempSectionOrder.length - 1}
                                                className={`p-1 rounded ${idx === tempSectionOrder.length - 1 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                                                title="Move Down"
                                            >
                                                <FiArrowDown size={18} />
                                            </button>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setIsReorderModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveReorderModal}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Save Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseEdit;
