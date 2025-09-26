import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';

import { auth } from '../firebase'; // This now points to the second firebase config

import { ref, set, onValue, onDisconnect, remove, update, get } from 'firebase/database';
import { database } from '../firebase'; // Firebase configuration

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionEnforced, setSessionEnforced] = useState(true);

  // session management refs
  const sessionIdRef = React.useRef(null);
  const sessionUnsubRef = React.useRef(null);
  const heartbeatRef = React.useRef(null);
  const sessionPathRef = React.useRef(null);
  const isManualLogoutRef = React.useRef(false); // Add this to track manual logouts

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser);
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
      } else {
        console.log('No user found, setting user to null');
        setUser(null);
        // cleanup session when no user
        cleanupSessionListeners();
      }
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Initialize single-session enforcement when user changes
  useEffect(() => {
    if (!user?.uid || !sessionEnforced) return;

    initSingleSession(user.uid);

    return () => {
      // component unmount or user switched
      cleanupSessionListeners();
    };
  }, [user?.uid, sessionEnforced]);

  const initSingleSession = async (uid) => {
    try {
      // Create a new session ID
      const newSessionId = window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2);
      sessionIdRef.current = newSessionId;

      // Store session path
      sessionPathRef.current = `sessions/${uid}`;
      const sRef = ref(database, sessionPathRef.current);

      // Create session data with timestamp
      const sessionData = {
        sessionId: newSessionId,
        updatedAt: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        lastActive: Date.now()
      };

      // Get current session if it exists
      const snapshot = await get(ref(database, sessionPathRef.current));
      const currentSession = snapshot.val();

      // Only update session if this is a new login or the session is expired (older than 5 minutes)
      const isNewLogin = !currentSession ||
        (currentSession.updatedAt && (Date.now() - currentSession.updatedAt > 5 * 60 * 1000));

      if (isNewLogin) {
        // This is a new login, update the session
        await set(sRef, sessionData);
      } else {
        // Use existing session if it's still valid
        sessionIdRef.current = currentSession.sessionId;
      }

      // Remove this session on disconnect
      try {
        await onDisconnect(sRef).remove();
      } catch (e) {
        console.warn('onDisconnect setup failed (non-fatal):', e);
      }

      // Listen for session changes
      sessionUnsubRef.current = onValue(sRef, (snap) => {
        const val = snap.val();
        if (!val) {
          // Session was removed (likely by another login)
          // Only show modal if this wasn't a manual logout
          if (!isManualLogoutRef.current) {
            console.log('Session was terminated by another login.');
            logout(true);
          }
          return;
        }

        // Check if this session was replaced by a new login
        if (val.sessionId && val.sessionId !== sessionIdRef.current) {
          // Check if this is a new login (not just a page refresh)
          const isNewLogin = val.updatedAt && (val.updatedAt - (val.lastActive || 0) > 5000);

          if (isNewLogin && !isManualLogoutRef.current) {
            console.log('New login detected. Terminating this session.');
            logout(true);
          } else if (!isManualLogoutRef.current) {
            // Just an update from another tab, update our session ID
            sessionIdRef.current = val.sessionId;
          }
        }
      });

      // Heartbeat to keep session active
      heartbeatRef.current = window.setInterval(() => {
        // Don't send heartbeat if manually logging out
        if (!isManualLogoutRef.current) {
          update(sRef, {
            updatedAt: Date.now(),
            lastActive: Date.now()
          }).catch(() => { });
        }
      }, 20_000); // every 20s
    } catch (e) {
      console.error('Failed to initialize single-session enforcement:', e);
    }
  };

  const cleanupSessionListeners = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (sessionUnsubRef.current) {
      try { sessionUnsubRef.current(); } catch (_) { }
      sessionUnsubRef.current = null;
    }
    sessionIdRef.current = null;
    sessionPathRef.current = null;
    isManualLogoutRef.current = false; // Reset manual logout flag
  };

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await set(ref(database, `users/${result.user.uid}`), {
        email: result.user.email,
        name: result.user.displayName,
        profilePhoto: result.user.photoURL
      });
      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const logout = async (isAuto = false) => {
    try {
      // Set manual logout flag if this is not an automatic logout
      if (!isAuto) {
        isManualLogoutRef.current = true;
      }

      // Try to remove the session record
      const uid = auth.currentUser?.uid || user?.uid;
      if (uid) {
        try {
          await remove(ref(database, `sessions/${uid}`));
        } catch (_) { }
      }

      cleanupSessionListeners();
      await firebaseSignOut(auth);
      setUser(null);
      
      // Only show modal for automatic logouts
      if (isAuto) {
        // Show a centered modal dialog
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-yellow-500 text-2xl">⚠️</span>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Session Ended</h3>
            </div>
            <p class="text-gray-600 dark:text-gray-300 mb-6">
              You have been logged out because your account was signed in from another device or tab.
            </p>
            <div class="flex justify-end">
              <button 
                id="modal-ok-btn"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // Handle OK button click
        const okBtn = modal.querySelector('#modal-ok-btn');
        const removeModal = () => {
          document.body.removeChild(modal);
        };
        okBtn.addEventListener('click', removeModal);

        // Cleanup
        return () => {
          okBtn.removeEventListener('click', removeModal);
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        };
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const login = async ({ email, password }) => {
    // For email/password login (if implemented)
    // Note: You'll need to implement email/password auth in firebase.js
    throw new Error("Email/password login not implemented yet");
  };

  const value = {
    user,
    loading,
    googleSignIn,
    logout,
    login
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);