import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';

import { auth } from '../firebase'; // This now points to the second firebase config



import { ref, set } from 'firebase/database';
import { database } from '../firebase'; // Firebase configuration

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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