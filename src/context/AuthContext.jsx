import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';

import { auth } from '../firebase';

import { ref, set, onValue, onDisconnect, remove, update, get, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { sendEmailService, getWelcomeTemplate, getLoginNotificationTemplate } from '../utils/emailService';

const AuthContext = createContext(null);


// Session configuration
const SESSION_CONFIG = {
  HEARTBEAT_INTERVAL: 45000, // 45 seconds (increased from 30 for better stability)
  SESSION_EXPIRY: 300000, // 5 minutes (stale session cleanup)
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnforced, setSessionEnforced] = useState(true);
  const [adminUids, setAdminUids] = useState([]);

  useEffect(() => {
    const adminRef = ref(database, 'Admins');
    const unsub = onValue(adminRef, (snapshot) => {
      if (snapshot.exists()) {
        setAdminUids(Object.keys(snapshot.val()));
      } else {
        setAdminUids([]);
      }
    });
    return () => unsub();
  }, []);

  // Session management refs
  const sessionIdRef = React.useRef(null);
  const sessionUnsubRef = React.useRef(null);
  const heartbeatRef = React.useRef(null);
  const sessionPathRef = React.useRef(null);
  const isManualLogoutRef = React.useRef(false);
  const isInitializingSessionRef = React.useRef(false);
  const cleanupTimeoutRef = React.useRef(null);
  const isOnlineRef = React.useRef(navigator.onLine);

  // Generate a more robust session ID
  const generateSessionId = () => {
    const existingSessionId = sessionStorage.getItem('algocore_session_id');
    if (existingSessionId) {
      return existingSessionId;
    }

    let newSessionId;
    if (window.crypto?.randomUUID) {
      newSessionId = window.crypto.randomUUID();
    } else {
      // Fallback for older browsers
      newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    sessionStorage.setItem('algocore_session_id', newSessionId);
    return newSessionId;
  };

  // Enhanced cleanup function
  const cleanupSessionListeners = useCallback(() => {
    console.log('Cleaning up session listeners');

    // Clear heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    // Clear cleanup timeout
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Unsubscribe from session listener
    if (sessionUnsubRef.current) {
      try {
        sessionUnsubRef.current();
      } catch (error) {
        console.warn('Error unsubscribing from session listener:', error);
      }
      sessionUnsubRef.current = null;
    }

    // Reset state/refs
    setSessionId(null);
    sessionIdRef.current = null;
    sessionPathRef.current = null;
    isManualLogoutRef.current = false;
    isInitializingSessionRef.current = false;
  }, []);

  // Enhanced logout function with proper cleanup
  const logout = useCallback(async (isAuto = false, reason = 'manual') => {
    try {
      console.log(`Logging out - Auto: ${isAuto}, Reason: ${reason}`);

      // Set manual logout flag if this is not an automatic logout
      if (!isAuto) {
        isManualLogoutRef.current = true;
      }

      // Clean up session listeners first
      cleanupSessionListeners();

      // Clear session storage ID
      sessionStorage.removeItem('algocore_session_id');

      // Try to remove the session record from database
      const uid = auth.currentUser?.uid || user?.uid;
      if (uid && sessionPathRef.current) {
        try {
          await remove(ref(database, sessionPathRef.current));
          console.log('Current session record removed from database');
        } catch (error) {
          console.warn('Failed to remove session record:', error);
        }
      }

      // Sign out from Firebase
      await firebaseSignOut(auth);
      setUser(null);

      // Show modal for automatic logouts only
      if (isAuto && reason !== 'manual') {
        showLogoutModal(reason);
      }

    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [user?.uid, cleanupSessionListeners]);

  // Show logout modal
  const showLogoutModal = (reason) => {
    // Remove any existing modals first
    const existingModal = document.querySelector('.session-logout-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'session-logout-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    const reasonText = reason === 'new-login'
      ? 'You have been logged out because your account was signed in from another device or browser.'
      : reason === 'session-removed'
        ? 'Your session was terminated by another login.'
        : 'Your session has ended.';

    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-yellow-500 text-2xl">⚠️</span>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Session Ended</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          ${reasonText}
        </p>
        <div class="flex justify-end gap-2">
          <button 
            id="modal-ok-btn"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            OK
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle interactions
    const removeModal = () => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };

    const okBtn = modal.querySelector('#modal-ok-btn');
    okBtn?.addEventListener('click', removeModal);

    // Auto-remove after 15 seconds
    setTimeout(removeModal, 15000);

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        removeModal();
      }
    });
  };

  // Enhanced session initialization for multiple sessions
  const initSession = useCallback(async (uid) => {
    if (isInitializingSessionRef.current) {
      return;
    }

    try {
      isInitializingSessionRef.current = true;
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      sessionIdRef.current = newSessionId;
      sessionPathRef.current = `sessions/${uid}/${newSessionId}`;

      const sessionRef = ref(database, sessionPathRef.current);

      const sessionData = {
        sessionId: newSessionId,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        isCurrent: true 
      };

      // Set session data
      await set(sessionRef, sessionData);
      // Removed onDisconnect().remove() to prevent brief network drops
      // from automatically deleting the session and logging the user out.
      
      // Set up heartbeat
      const sendHeartbeat = async () => {
        if (!sessionPathRef.current) return;
        try {
          await update(ref(database, sessionPathRef.current), {
            lastActive: serverTimestamp()
          });
        } catch (error) {
          if (error.code === 'PERMISSION_DENIED') {
            logout(true, 'permission-denied');
          }
        }
      };

      heartbeatRef.current = setInterval(sendHeartbeat, SESSION_CONFIG.HEARTBEAT_INTERVAL);

      // Listen for THIS session removal (admin or user might terminate it from another device)
      sessionUnsubRef.current = onValue(sessionRef, (snapshot) => {
        if (!snapshot.exists() && !isManualLogoutRef.current) {
          logout(true, 'session-terminated');
        }
      });

      // Periodic cleanup of stale sessions for this user
      const cleanupStaleSessions = async () => {
        try {
          const sessionsRef = ref(database, `sessions/${uid}`);
          const snapshot = await get(sessionsRef);
          if (snapshot.exists()) {
            const sessionsData = snapshot.val();
            const now = Date.now();
            const updates = {};
            
            Object.keys(sessionsData).forEach(key => {
              const session = sessionsData[key];
              // If session was last active more than 5 minutes ago, mark for removal
              // unless it's the current session
              if (key !== newSessionId && session.lastActive && (now - session.lastActive) > SESSION_CONFIG.SESSION_EXPIRY) {
                updates[key] = null;
              }
            });

            if (Object.keys(updates).length > 0) {
              await update(sessionsRef, updates);
              console.log('Cleaned up stale sessions:', Object.keys(updates));
            }
          }
        } catch (error) {
          console.warn('Silent failure cleaning up stale sessions:', error);
        }
      };

      // Run cleanup once on init
      cleanupStaleSessions();

    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      isInitializingSessionRef.current = false;
    }
  }, [logout]);

  // Network status tracking
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: ONLINE');
      isOnlineRef.current = true;
    };

    const handleOffline = () => {
      console.log('Network: OFFLINE');
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    console.log('Setting up auth state listener');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid || 'null');

      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
        setUser(userData);

        // Ensure email is in database for notifications
        try {
          if (firebaseUser.email) {
            await update(ref(database, `users/${firebaseUser.uid}`), {
              email: firebaseUser.email,
              lastLogin: Date.now()
            });
          }
        } catch (err) {
          console.warn('Silent failure updating user email in DB:', err);
        }
      } else {
        console.log('No user found, cleaning up');
        setUser(null);
        cleanupSessionListeners();
      }

      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
      cleanupSessionListeners();
    };
  }, [cleanupSessionListeners]);

  // Session enforcement effect
  useEffect(() => {
    if (!user?.uid || !sessionEnforced || loading) {
      return;
    }

    console.log('Starting session tracking for user:', user.uid);

    // Small delay to ensure auth is fully settled
    const timeoutId = setTimeout(() => {
      initSession(user.uid);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      cleanupSessionListeners();
    };
  }, [user?.uid, sessionEnforced, loading, initSession, cleanupSessionListeners, adminUids]);

  // Security restrictions (Copy/Paste disable)
  useEffect(() => {
    // Determine admin status
    const isAdmin = user && adminUids.includes(user.uid);

    // Skip restrictions on compiler page
    const isCompilerPage = window.location.pathname.startsWith('/compiler');

    // Disable behavior handler
    const preventDef = (e) => {
      // Don't block interactions if user is admin or on compiler page
      if (isAdmin || isCompilerPage) return;
      e.preventDefault();
    };

    console.log('Security restrictions enabled for user:', user?.uid);
    console.log('Admin status:', isAdmin);
    console.log('Compiler page:', isCompilerPage);

    console.log('Admin UIDs:', adminUids);

    // Attach listeners
    document.addEventListener("contextmenu", preventDef);
    document.addEventListener("copy", preventDef);
    document.addEventListener("cut", preventDef);
    document.addEventListener("paste", preventDef);
    document.addEventListener("selectstart", preventDef);
    document.addEventListener("dragstart", preventDef);

    return () => {
      document.removeEventListener("contextmenu", preventDef);
      document.removeEventListener("copy", preventDef);
      document.removeEventListener("cut", preventDef);
      document.removeEventListener("paste", preventDef);
      document.removeEventListener("selectstart", preventDef);
      document.removeEventListener("dragstart", preventDef);
    };
  }, [user, adminUids]);

  // Enhanced Google sign-in
  const googleSignIn = async () => {
    try {
      console.log('Starting Google sign-in');

      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(auth, provider);

      const userRef = ref(database, `users/${result.user.uid}`);
      const userSnap = await get(userRef);
      const isFirstLogin = !userSnap.exists();

      // Store user data in database using update() to preserve existing profile data
      await update(userRef, {
        email: result.user.email,
        name: result.user.displayName,
        profilePhoto: result.user.photoURL,
        lastLogin: Date.now(),
        provider: 'google'
      });

      // Send appropriate email notification
      try {
        const userName = result.user.displayName || 'User';
        const userEmail = result.user.email;

        if (isFirstLogin) {
          await sendEmailService({
            to: userEmail,
            subject: 'Welcome to AlgoCore!',
            text: `Hi ${userName}, Welcome to AlgoCore! We're thrilled to have you join our community.`,
            html: getWelcomeTemplate(userName)
          });
          console.log('Welcome email sent to new user');
        } else {
          await sendEmailService({
            to: userEmail,
            subject: 'New Login Detected - AlgoCore',
            text: `Hello ${userName}, your AlgoCore account was just accessed from a new device.`,
            html: getLoginNotificationTemplate(userName)
          });
          console.log('Login notification email sent to existing user');
        }
      } catch (err) {
        console.warn('Silent failure sending login email:', err);
      }

      console.log('Google sign-in successful');
      toast.success('Signed in successfully!');

      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Pop-up was blocked. Please allow pop-ups and try again.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }

      throw error;
    }
  };

  // Email/password login
  const login = async ({ email, password }) => {

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User signed in:', user);
      toast.success('Successfully signed in!');

      // Send login notification for email/password login too
      try {
        const userName = user.displayName || user.email.split('@')[0];
        await sendEmailService({
          to: user.email,
          subject: 'New Login Detected - AlgoCore',
          text: `Hello ${userName}, your AlgoCore account was just accessed.`,
          html: getLoginNotificationTemplate(userName)
        });
      } catch (err) {
        console.warn('Failed to send login email for password user:', err);
      }
    } catch (error) {
      console.error('Error during login:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('No user found with this email.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
      throw error;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSessionListeners();
    };
  }, [cleanupSessionListeners]);

  const value = {
    user,
    loading,
    googleSignIn,
    logout: (isAuto = false) => logout(isAuto, 'manual'),
    login,
    sessionEnforced,
    setSessionEnforced,
    isAdmin: user ? adminUids.includes(user.uid) : false,
    sessionId: sessionId
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};