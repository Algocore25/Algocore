import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPython, FaJava, FaJs, FaCuttlefish } from "react-icons/fa";
import { SiCplusplus, SiC } from "react-icons/si";
import { ref, get, child } from 'firebase/database';
import { database } from '../firebase';
import LoadingPage from './LoadingPage';

const iconMap = {
  python: <FaPython className="w-12 h-12 text-[#3776AB]" />,
  java: <FaJava className="w-12 h-12 text-[#007396]" />,
  javascript: <FaJs className="w-12 h-12 text-[#F7DF1E]" />,
  c: <SiC className="w-12 h-12 text-[#555555]" />,
  cpp: <SiCplusplus className="w-12 h-12 text-[#00599C]" />,
};

const CourseCard = ({ course }) => (
  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:border-blue-400 dark:hover:border-blue-500">
    <div className="text-blue-600 dark:text-blue-400 mb-4">
      {iconMap[course.id] || <FaCuttlefish className="w-12 h-12" />}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">{course.description}</p>

    <div className="mt-4 mb-6">
      {/* <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-300">Progress</span>
        <span className="font-medium">{course.progress || 0}%</span>
      </div> */}
      {/* <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
          style={{ width: `${course.progress || 0}%` }}
        ></div>
      </div> */}
    </div>

    <Link
      to={`/course/${course.id}`}
      className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors mt-auto"
    >
      {course.progress > 0 ? 'Continue Learning' : 'Start Learning'}
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  </div>
);

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'Courses'));

        if (snapshot.exists()) {
          const data = snapshot.val();
          setCourses(data);

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
  }, []);

  if (loading) {
    return (
      <LoadingPage/>
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
    <div className="min-h-screen bg-white dark:bg-gray-900 relative overflow-x-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern dark:bg-grid-pattern"></div>
      <main className="relative flex-grow z-10">
        {/* Hero Section */}
        <section className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
          <div className="w-full flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              Explore Our Courses
            </h1>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-blue-600 dark:text-blue-400 mb-4">
              Master Programming Through Practice
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              No boring lectures - just real coding challenges to level up your skills
            </p>
          </div>
        </section>

        {/* Courses Section */}
        <section className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>

     
      </main>
    </div>
  );
};

export default CoursesPage;
