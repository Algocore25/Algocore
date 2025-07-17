import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import Footer from '../components/Footer';
import LoadingPage from './LoadingPage';

function HomePage() {
  const navigate = useNavigate();
  const { googleSignIn, loading, user } = useAuth();

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
      navigate('/profile'); // Redirect to profile after successful sign-in
    } catch (error) {
      console.error("Google Sign-In failed", error);
      // Optionally, show an error to the user
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Grid Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern dark:bg-dark-grid-pattern bg-20"></div>
      
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
              <button
                onClick={() => navigate('/profile')}
                className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md w-full sm:w-auto"
              >
                Go to Your Profile
              </button>
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
            <button
              onClick={() => navigate('/courses')}
              className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg border-2 border-blue-600 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700 transition duration-300 w-full sm:w-auto"
            >
              Explore Courses
            </button>
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
                className="flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 w-32 h-32 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <span className="text-4xl mb-2">{language.icon}</span>
                <span className="text-lg font-medium text-gray-900 dark:text-white">{language.name}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div>
  );
}

export default HomePage;