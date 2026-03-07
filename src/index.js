import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingPage from './pages/LoadingPage';
import DevToolsBlocker from './pages/DevToolsBlocker';


// Flag to track if DevTools is active and blocking is required
// Tracking for security violations
let devToolsDetected = false;
let detectedToolName = "";

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
          detectedToolName = "React Developer Tools";
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
    detectedToolName = "React Developer Tools";
  }
}



const AuthLoadingWrapper = ({ children }) => {
  const { loading } = useAuth();

  if (devToolsDetected) {
    return <DevToolsBlocker detectedTool={detectedToolName} />;
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
