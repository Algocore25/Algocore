import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDBWkdtOH1AMKWL81UYRdcVGApSmYFjRUs",
  authDomain: "algocore-db3d9.firebaseapp.com",
  databaseURL: "https://algocore-db3d9-default-rtdb.firebaseio.com",
  projectId: "algocore-db3d9",
  storageBucket: "algocore-db3d9.firebasestorage.app",
  messagingSenderId: "586545249772",
  appId: "1:586545249772:web:9397ac695648a1b584d4c9",
  measurementId: "G-VNL5R9KQWY"
};


// Initialize Firebase app (only if it hasn't been initialized yet)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);  // Use the initialized app for auth
const googleProvider = new GoogleAuthProvider();

const database = getDatabase(app);  // Use the initialized app for database

export {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  database,
};
