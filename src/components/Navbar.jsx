import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';

import { FaSun as SunIcon, FaMoon as MoonIcon, FaUserCircle as UserCircleIcon } from 'react-icons/fa';
import logoLight from '../assets/LOGO.png';
import logoDark from '../assets/LOGO-1.png';

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

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    !isAdmin && user && { label: 'Tests', href: '/test' },
    isAdmin && { label: 'Admin', href: '/admin' },
    { label: 'Compiler', href: '/compiler' },
  ].filter(Boolean); // This will remove any falsy values (like null or false)


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
          <Link to="/" className="flex items-center gap-2">
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

export default Navbar;
