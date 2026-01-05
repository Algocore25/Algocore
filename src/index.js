import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingPage from './pages/LoadingPage';


// Flag to track if DevTools is active and blocking is required
let devToolsDetected = false;

// Disable React DevTools in production
if (process.env.NODE_ENV === 'production') {
  try {
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
        // Try to disable it
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = true;

        // If it has renderers already, it might already be active
        // Some versions use 'renderers' Map or similar
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers &&
          (window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0 ||
            window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.length > 0)) {
          devToolsDetected = true;
        }
      }
    } else {
      // Define a dummy hook to prevent extension from loading later
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        isDisabled: true,
        supportsFiber: true,
        inject: () => { },
        onCommitFiberRoot: () => { },
        onCommitFiberUnmount: () => { },
      };
    }
  } catch (e) {
    // If we can't set it, it's likely because the extension has already locked it
    devToolsDetected = true;
  }
}

const DevToolsBlocker = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] p-6 text-center font-sans">
    <div className="bg-[#1a1a1a] p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-lg border border-red-500/20 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>

      <div className="mb-8 flex justify-center">
        <div className="bg-red-500/10 p-5 rounded-full ring-2 ring-red-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Access Restricted</h1>

      <p className="text-gray-400 text-lg mb-8 leading-relaxed">
        To maintain the security and integrity of our assessment environment, this platform cannot be used while <span className="text-red-400 font-semibold">React Developer Tools</span> is active.
      </p>

      <div className="space-y-4 mb-10 text-left bg-black/30 p-6 rounded-xl border border-white/5">
        <div className="flex items-start space-x-3">
          <div className="mt-1 bg-red-500 w-2 h-2 rounded-full shrink-0"></div>
          <p className="text-gray-300 text-sm">Disable or uninstall the React DevTools extension from your browser.</p>
        </div>
        <div className="flex items-start space-x-3">
          <div className="mt-1 bg-red-500 w-2 h-2 rounded-full shrink-0"></div>
          <p className="text-gray-300 text-sm">Close any open Developer Tools (Inspect Element) windows.</p>
        </div>
        <div className="flex items-start space-x-3">
          <div className="mt-1 bg-red-500 w-2 h-2 rounded-full shrink-0"></div>
          <p className="text-gray-300 text-sm">Refresh the page to verify and restore access.</p>
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-[0_10px_20px_rgba(239,68,68,0.2)] transform hover:-translate-y-0.5 active:translate-y-0"
      >
        Re-verify & Refresh Page
      </button>

      <p className="mt-6 text-gray-500 text-xs uppercase tracking-widest font-medium">
        Secured by Algocore Proctoring Engine
      </p>
    </div>
  </div>
);

const AuthLoadingWrapper = ({ children }) => {
  const { loading } = useAuth();

  if (devToolsDetected) {
    return <DevToolsBlocker />;
  }

  if (loading) {
    return (
      <LoadingPage message="Loading page, please wait..." />
    );
  }

  return children;
};


const disableCopyPaste = () => {
  // Disable right-click
  document.addEventListener("contextmenu", (event) => event.preventDefault());

  // Disable Copy, Cut, and Paste
  document.addEventListener("copy", (event) => event.preventDefault());
  document.addEventListener("cut", (event) => event.preventDefault());
  document.addEventListener("paste", (event) => event.preventDefault());

  // Disable Text Selection
  document.addEventListener("selectstart", (event) => event.preventDefault());

  // Disable Dragging
  document.addEventListener("dragstart", (event) => event.preventDefault());
};


// disableCopyPaste();

// Disable console logs in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => { };
  console.warn = () => { };
  console.error = () => { };
}



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AuthLoadingWrapper>
          <App />
        </AuthLoadingWrapper>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
