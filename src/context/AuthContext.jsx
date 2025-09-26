import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

import { auth } from '../firebase';
import { ref, set, get, off, onValue } from 'firebase/database';
import { database } from '../firebase';

const AuthContext = createContext(null);

// Function to generate a unique session ID
const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 9);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(() => {
    // Try to get session ID from sessionStorage first
    return sessionStorage.getItem('sessionId') || generateSessionId();
  });

  // Function to validate user session
  const validateUserSession = async (firebaseUser) => {
    if (!firebaseUser) return false;
    
    const userSessionsRef = ref(database, `userSessions/${firebaseUser.uid}`);
    try {
      const snapshot = await get(userSessionsRef);
      const sessionData = snapshot.val();
      
      // If no session exists or the stored session ID matches current session
      if (!sessionData || sessionData.sessionId === sessionId) {
        // Update or create session
        await set(userSessionsRef, {
          sessionId: sessionId,
          lastActive: new Date().toISOString(),
          email: firebaseUser.email
        });
        sessionStorage.setItem('sessionId', sessionId);
        return true;
      }
      
      // If session IDs don't match, sign out the user
      await firebaseSignOut(auth);
      return false;
      
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  };

  // Clean up old sessions
  const cleanupOldSessions = async (userId) => {
    const userSessionsRef = ref(database, `userSessions`);
    try {
      const snapshot = await get(userSessionsRef);
      if (snapshot.exists()) {
        const sessions = snapshot.val();
        const updates = {};
        
        // Find and remove other sessions for this user
        Object.keys(sessions).forEach((uid) => {
          if (uid === userId) return; // Skip current user
          if (sessions[uid].email === user?.email) {
            updates[`userSessions/${uid}`] = null;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await set(ref(database), updates, { merge: true });
        }
      }
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  };

  useEffect(() => {
    // Store session ID in sessionStorage
    sessionStorage.setItem('sessionId', sessionId);
    
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser);
      
      if (firebaseUser) {
        const isValidSession = await validateUserSession(firebaseUser);
        
        if (isValidSession) {
          // Clean up any old sessions for this user
          await cleanupOldSessions(firebaseUser.uid);
          
          // Set up real-time session monitoring
          const userSessionRef = ref(database, `userSessions/${firebaseUser.uid}`);
          const sessionListener = onValue(userSessionRef, (snapshot) => {
            const sessionData = snapshot.val();
            if (sessionData && sessionData.sessionId !== sessionId) {
              // Session was invalidated by another login
              firebaseSignOut(auth);
              setUser(null);
              window.location.href = '/login';
              alert('This account was logged in from another device.');
            }
          });
          
          // Set user data with session information
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
        } else {
          setUser(null);
        }
      } else {
        console.log('No user found, setting user to null');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

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

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
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