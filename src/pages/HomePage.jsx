import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FiCode, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import Footer from '../components/Footer';
import GoogleAd from '../components/GoogleAd';
import LoadingPage from './LoadingPage';
import { ref, get, child } from 'firebase/database';
import { database } from '../firebase';
import AnimatedBackground from '../components/AnimatedBackground';

function HomePage() {
  const navigate = useNavigate();
  const { googleSignIn, loading, user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const languages = [
    { name: 'JavaScript', icon: '⚡' },
    { name: 'Python', icon: '🐍' },
    { name: 'Java', icon: '☕' },
    { name: 'C++', icon: '⚙️' },
    { name: 'SQL', icon: '🗄️' },
    { name: 'TypeScript', icon: '📘' },
  ];

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
      // navigate('/profile'); // Redirect to profile after successful sign-in
    } catch (error) {
      console.error("Google Sign-In failed", error);
      // Optionally, show an error to the user
    }
  };

  // 
  // No longer fetching course progress here
  // 

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      <AnimatedBackground />

      <main className="relative flex-grow flex flex-col items-center justify-center z-10 pt-20">
        <div className="text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white">
            Master Programming with AlgoCore
          </h1>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400">
            Bored of Theory? Let's Code for Real
          </h2>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Kickstart Your Coding Journey — No Boring Lectures, Just Real Practice!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Welcome back, {user.displayName || user.name || 'Coder'} 👋
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Here’s a quick snapshot of your learning progress
                </p>
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => navigate('/profile')}
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 shadow-sm"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => navigate('/courses')}
                    className="bg-white text-blue-600 font-semibold py-2 px-4 rounded-md border-2 border-blue-600 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700 transition duration-200"
                  >
                    Browse Courses
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-3 bg-blue-600 text-white font-semibold pl-2 pr-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md w-full sm:w-auto"
              >
                <div className="bg-white p-1 rounded-full">
                  <FcGoogle size={24} />
                </div>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Languages Section */}
        <section className="w-full max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
            Learn in Your Favorite Language
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {languages.map((language, index) => (
              <div
                key={index}
                onClick={() => navigate('/courses')}
                className="flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 w-32 h-32 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
              >
                <span className="text-4xl mb-2">{language.icon}</span>
                <span className="text-lg font-medium text-gray-900 dark:text-white">{language.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why AlgoCore Section */}
        <section className="w-full max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white sm:text-4xl shadow-sm inline-block px-4">
              Why Choose AlgoCore?
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Skip the long videos. Write code, solve problems, and verify instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 dark:bg-blue-900/40 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
              <div className="relative text-blue-600 dark:text-blue-400 mb-6">
                <FiCode className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Interactive Coding</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Practice directly in your browser with our built-in IDE. No setup required. Compile and run code instantly against real test cases.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-100 dark:bg-purple-900/40 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
              <div className="relative text-purple-600 dark:text-purple-400 mb-6">
                <FiTrendingUp className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Track Your Progress</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Watch your skills grow with visual progress bars. We keep track of your completed problems, so you always know where you left off.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-100 dark:bg-green-900/40 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
              <div className="relative text-green-600 dark:text-green-400 mb-6">
                <FiCheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Instant Feedback</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Our automated judge system evaluates your code against rigorous test cases, providing immediate feedback so you can learn fast.
              </p>
            </div>
          </div>
        </section>
      </main>

      <div className="w-full max-w-6xl mx-auto py-10 px-4">
        <GoogleAd />
      </div>

      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
}

export default HomePage;