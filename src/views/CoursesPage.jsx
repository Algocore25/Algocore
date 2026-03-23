import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { FiClock, FiBookOpen, FiMenu } from 'react-icons/fi';
import AnimatedBackground from '../components/AnimatedBackground';
import { ref, get, child, set } from 'firebase/database';
import { database } from '../firebase';
import LoadingPage from './LoadingPage';
import { useAuth } from '../context/AuthContext';
import { COURSE_ICONS, getCourseIcon } from '../utils/courseIcons';

import { encodeShort } from '../utils/urlEncoder';

const CourseCard = ({ course, onDragStart, onDragOver, onDrop, onDragEnd, isAdmin, adminModeEnabled, draggedCourse, section }) => {
  const isDragged = draggedCourse?.id === course.id;
  const canDrag = isAdmin && adminModeEnabled;
  
  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, course, section)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, course, section)}
      onDragEnd={onDragEnd}
      className={`relative ${canDrag ? 'cursor-move' : ''} ${isDragged ? 'opacity-50' : ''}`}
    >
      <Link href={`/course/${encodeShort(course.id)}`}
        className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-[2rem] p-6 md:p-8 border border-white/40 dark:border-gray-700/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col overflow-hidden ${canDrag ? 'pointer-events-none' : ''}`}
      >
        {/* Admin drag indicator */}
        {canDrag && (
          <div className="absolute top-2 left-2 z-20 text-gray-400 dark:text-gray-600">
            <FiMenu className="w-5 h-5" />
          </div>
        )}
        
        {/* Decorative gradient blur behind the card */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="mb-6 z-10 flex items-start justify-between">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-blue-100/50 dark:border-blue-800/30 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
            {getCourseIcon(course.icon || course.id, "w-8 h-8")}
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
            <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div className="z-10 flex-grow mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
            {course.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
            {course.description}
          </p>
        </div>

        <div className="mt-auto z-10">
          <div className="flex justify-between items-end text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <span className="uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400">Completion</span>
            <span className="text-blue-600 dark:text-blue-400 text-base">{Math.round(course.progress || 0)}%</span>
          </div>
          <div className="w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.round(course.progress || 0)}%` }}
            >
              {/* Subtle shine on progress bar */}
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedCourse, setDraggedCourse] = useState(null);
  const [draggedSection, setDraggedSection] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [adminModeEnabled, setAdminModeEnabled] = useState(true);
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.email?.includes('99220041106@klu.ac.in');
  
  // Debug logging
  useEffect(() => {
    console.log('[Courses Debug] User:', user);
    console.log('[Courses Debug] IsAdmin:', isAdmin);
    console.log('[Courses Debug] Courses count:', courses.length);
  }, [user, courses, isAdmin]);

  // Save reordered courses to Firebase
  const saveCourseOrder = async (updatedCourses) => {
    if (!isAdmin) return;
    
    try {
      setIsReordering(true);
      const dbRef = ref(database);
      await set(child(dbRef, 'Courses'), updatedCourses);
      console.log('Course order saved to Firebase');
    } catch (error) {
      console.error('Error saving course order:', error);
    } finally {
      setIsReordering(false);
    }
  };

  // Drag handlers
  const handleDragStart = (e, course, section) => {
    console.log('[Courses Debug] Drag start:', course.title, 'Admin:', isAdmin, 'AdminModeEnabled:', adminModeEnabled);
    if (!isAdmin || !adminModeEnabled) return;
    setDraggedCourse(course);
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e) => {
    if (!isAdmin || !adminModeEnabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetCourse, targetSection) => {
    console.log('[Courses Debug] Drop attempt:', draggedCourse?.title, '→', targetCourse.title, 'AdminModeEnabled:', adminModeEnabled);
    if (!isAdmin || !adminModeEnabled || !draggedCourse) return;
    e.preventDefault();

    // Don't allow dropping on same course
    if (draggedCourse.id === targetCourse.id) return;

    // Create new courses array with reordered items
    const updatedCourses = [...courses];
    const draggedIndex = updatedCourses.findIndex(c => c.id === draggedCourse.id);
    const targetIndex = updatedCourses.findIndex(c => c.id === targetCourse.id);

    // Remove dragged course and insert at target position
    const [removedCourse] = updatedCourses.splice(draggedIndex, 1);
    updatedCourses.splice(targetIndex, 0, removedCourse);

    // Update section if moved between sections
    if (draggedSection !== targetSection) {
      const movedCourse = updatedCourses[targetIndex];
      movedCourse.section = targetSection;
    }

    console.log('[Courses Debug] New order:', updatedCourses.map(c => c.title));
    setCourses(updatedCourses);
    saveCourseOrder(updatedCourses);
    setDraggedCourse(null);
    setDraggedSection(null);
  };

  const handleDragEnd = () => {
    setDraggedCourse(null);
    setDraggedSection(null);
  };

  const calculateCourseProgress = (lessons, userProgress) => {
    if (!lessons || typeof lessons !== 'object') return 0;
    let total = 0;
    let completed = 0;
    Object.keys(lessons).forEach(topicKey => {
      const topic = lessons[topicKey];
      if (typeof topic !== 'object' || !topic.description) return;
      const questions = Array.isArray(topic.questions)
        ? topic.questions
        : (typeof topic.questions === 'object' ? Object.keys(topic.questions) : []);
      total += questions.length;
      const tProg = (userProgress && userProgress[topicKey]) || {};
      questions.forEach(q => {
        if (tProg && tProg[q] === true) completed += 1;
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'Courses'));

        if (snapshot.exists()) {
          const data = snapshot.val();
          const dataArr = Array.isArray(data) ? data : Object.values(data);
          const validCourses = dataArr.filter(Boolean);
          setCourses(validCourses);

          // If user logged in, compute progress for each course
          if (user && validCourses.length > 0) {
            const enriched = await Promise.all(
              validCourses.map(async (c) => {
                try {
                  const [lessonsSnap, progressSnap] = await Promise.all([
                    get(child(dbRef, `AlgoCore/${c.id}/lessons`)),
                    get(child(dbRef, `userprogress/${user.uid}/${c.id}`))
                  ]);
                  const lessons = lessonsSnap.exists() ? lessonsSnap.val() : {};
                  const uprog = progressSnap.exists() ? progressSnap.val() : {};
                  const percent = calculateCourseProgress(lessons, uprog);
                  return { ...c, progress: percent };
                } catch (e) {
                  console.error('Error computing course progress for', c.id, e);
                  return { ...c, progress: 0 };
                }
              })
            );
            setCourses(enriched);
          }

        }
        else {
          setError('No courses found');
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('coursesPageScrollPos', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading) {
      const savedPosition = sessionStorage.getItem('coursesPageScrollPos');
      if (savedPosition) {
        // A small timeout ensures the DOM has laid out the new elements before scrolling
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant'
          });
        }, 0);
      }
    }
  }, [loading]);

  if (loading) {
    return (
      <LoadingPage />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col w-full">
      <AnimatedBackground />
      <main className="relative flex-grow z-10 w-full">
        {/* Clean Header Section */}
        <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Explore Courses
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Level up your skills with interactive coding challenges.
                </p>
              </div>
              
              {/* Admin Controls */}
              {isAdmin && (
                <div className="text-right">
                  <div className="inline-flex items-center gap-3">
                    <button
                      onClick={() => setAdminModeEnabled(!adminModeEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        adminModeEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          adminModeEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {adminModeEnabled ? 'Admin Mode' : 'Normal View'}
                    </span>
                  </div>
                  {adminModeEnabled && (
                    <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2">
                      <FiMenu className="w-4 h-4" />
                      Drag to reorder courses
                    </div>
                  )}
                  {isReordering && adminModeEnabled && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium animate-pulse mt-1">
                      Saving new order...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section className="relative z-10 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            {Object.entries((courses || []).reduce((acc, course) => {
              if (!course) return acc;
              let section = course.section;
              if (!section || section.trim() === '') return acc; // Skip courses with empty/no valid sections explicitly requested

              if (!acc[section]) acc[section] = [];
              acc[section].push(course);
              return acc;
            }, {})).map(([sectionName, sectionCourses]) => {
              if (sectionCourses.length === 0) return null;

              return (
                <div key={sectionName}>
                  <div className="flex items-center mb-10 mt-6 lg:mt-10">
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white pr-6 tracking-tight">
                      {sectionName}
                    </h3>
                    <div className="flex-grow h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700 dark:to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                    {sectionCourses.map(course => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        isAdmin={isAdmin}
                        adminModeEnabled={adminModeEnabled}
                        draggedCourse={draggedCourse}
                        section={sectionName}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>


      </main>
    </div>
  );
};

export default CoursesPage;
