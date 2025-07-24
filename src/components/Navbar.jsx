import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';
import { matchPath } from 'react-router-dom';




import { FaSun as SunIcon, FaMoon as MoonIcon, FaUserCircle as UserCircleIcon } from 'react-icons/fa';
import logoLight from '../assets/LOGO.png';
import logoDark from '../assets/LOGO-1.png';

const pathMappings = [
  {
    pattern: "/problem/:course/:subcourse/:questionId",
    label: "course/os",
  },
  {
    pattern: "/course/:courseId",
    label: "course",
  }
];



const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);

  const authDropdownRef = useRef(null);
  const authButtonRef = useRef(null);

  if (loading) return null;

  const matched = pathMappings
  .map(({ pattern, label }) => {
    const match = matchPath(pattern, location.pathname);
    return match ? { pattern, label, params: match.params } : null;
  })
  .find(Boolean);

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    !isAdmin && user && { label: 'Tests', href: '/test' },
    isAdmin && { label: 'Admin', href: '/admin' },
    isAdmin && { label: 'Students', href: '/adminmonitor' },
    { label: 'Compiler', href: '/compiler' },
  ].filter(Boolean); // This will remove any falsy values (like null or false)



  const [questionData, setQuestionData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [match, setMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchQuestionData = async () => {
      const pathMatch = matchPath("/problem/:course/:subcourse/:questionId", location.pathname);
      setMatch(pathMatch);

      if (!pathMatch) {
        if (isMounted) {
          setQuestionData([]);
          setCurrentIndex(-1);
        }
        return;
      }

      const { course, subcourse, questionId } = pathMatch.params;
      
      if (isMounted) {
        setIsLoading(true);
      }


      try {
        const questionRef = ref(database, `AlgoCore/${course}`);
        const snapshot = await get(questionRef);
        console.log(snapshot.val()["lessons"][subcourse.replaceAll("%20", " ")]["questions"]);
        console.log(subcourse);
        
        if (!isMounted) return;

        if (snapshot.exists()) {
          const questions = snapshot.val() || [];
          // Convert to array if it's an object
          const questionsArray = questions["lessons"][subcourse.replaceAll("%20", " ")]["questions"];
          
          setQuestionData(questionsArray);
          
          // Find the index of the current question
          const index = questionsArray.findIndex(q => q === questionId || (q && q === questionId.replaceAll("%20", " ")));
          setCurrentIndex(index);
          
          console.log('Questions:', questionsArray);
          console.log('Current Question ID:', questionId);
          console.log('Found at index:', index);
        } else {
          setQuestionData([]);
          setCurrentIndex(-1);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        if (isMounted) {
          setQuestionData([]);
          setCurrentIndex(-1);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuestionData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [location.pathname ]);


  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const userRef = ref(database, `Admins/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error fetching user admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);




  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAuthOpen &&
        authDropdownRef.current &&
        !authDropdownRef.current.contains(event.target) &&
        authButtonRef.current &&
        !authButtonRef.current.contains(event.target)) {
        setIsAuthOpen(false);
      }

      if (isMenuOpen && !event.target.closest('.mobile-menu-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAuthOpen, isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsAuthOpen(false);
  }, [location]);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-tertiary z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to= {matched?.label || '/'} className="flex items-center gap-2">
            <img src={theme === 'dark' ? logoDark : logoLight} alt="AlgoCore Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold text-[#202124] dark:text-white">AlgoCore</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className={`text-sm font-medium transition-colors ${location.pathname === item.href
                  ? 'text-[#4285F4]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-gray-100'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">

          {match && questionData.length > 0 && currentIndex >= 0 && (
            <div className="w-48 mr-4">
              <PercentageBar 
                label={`Question ${currentIndex + 1} of ${questionData.length}`} 
                percentage={((currentIndex + 1) / questionData.length) * 100} 
                color="#3b82f6"
              />
            </div>
          )}
          {/* {isLoading && (
            <div className="w-48 mr-4 flex items-center">
              <div className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
                Loading progress...
              </div>
            </div>
          )} */}


          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-tertiary"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-gray-700" />}
          </button>

          <div className="relative">
            {user ? (
              <>
                <button
                  ref={authButtonRef}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-tertiary rounded-full"
                  onClick={() => setIsAuthOpen(!isAuthOpen)}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 text-gray-700 dark:text-gray-200" />
                  )}
                </button>

                {isAuthOpen && (
                  <div
                    ref={authDropdownRef}
                    className="absolute top-12 right-0 w-60 bg-white dark:bg-dark-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-tertiary py-2 animate-fadeIn"
                  >
                    <div
                      className="px-4 py-2 border-b border-gray-100 dark:border-dark-tertiary cursor-pointer"
                      onClick={() => {
                        navigate('/profile');
                      }}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsAuthOpen(false);
                        navigate('/');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-tertiary"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-dark-tertiary rounded-full relative mobile-menu-button"
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setIsAuthOpen(false);
            }}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {isMenuOpen && (
            <div className="absolute top-16 right-4 w-64 bg-white dark:bg-dark-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-tertiary py-2 animate-fadeIn">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-[#4285F4]/10 hover:text-[#4285F4] transition-colors ${location.pathname === item.href
                    ? 'bg-[#4285F4]/10 text-[#4285F4]'
                    : 'text-gray-700 dark:text-gray-200'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

function PercentageBar({ label = '', percentage = 0, color = '#3b82f6', height = '8px' }) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100); // Clamp 0–100
  const displayPercentage = Math.round(safePercentage);

  return (
    <div className="w-full">
      {label && <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">{label}</div>}
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style={{ height }}>
        <div 
          className="h-full flex items-center justify-end pr-2 text-xs font-medium text-white transition-all duration-300 ease-out"
          style={{
            width: `${safePercentage}%`,
            backgroundColor: color,
          }}>
          {/* {displayPercentage}% */}
        </div>
      </div>
    </div>
  );
}


export default Navbar;
