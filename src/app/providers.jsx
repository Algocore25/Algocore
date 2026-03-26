"use client";

import React, { useEffect } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ActivityTracker from '../components/ActivityTracker';
import WhatsNewModal from '../components/WhatsNewModal';
import PageLayout from '../components/PageLayout';
import LoadingPage from '../views/LoadingPage';
import DevToolsBlocker from '../views/DevToolsBlocker';
import CopyPasteGuard from '../components/CopyPasteGuard';


// Flag to track if DevTools is active and blocking is required
let devToolsDetected = false;
let detectedToolName = "";

// Disable React DevTools in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = true;
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers &&
          (window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0 ||
            window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.length > 0)) {
          devToolsDetected = true;
          detectedToolName = "React Developer Tools";
        }
      }
    } else {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        isDisabled: true,
        supportsFiber: true,
        inject: () => { },
        onCommitFiberRoot: () => { },
        onCommitFiberUnmount: () => { },
      };
    }
  } catch (e) {
    devToolsDetected = true;
    detectedToolName = "React Developer Tools";
  }
}

// Disable console logs in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  console.log = () => { };
  console.warn = () => { };
  console.error = () => { };
}

const AuthLoadingWrapper = ({ children }) => {
  const { loading } = useAuth();

  if (devToolsDetected) {
    return <DevToolsBlocker detectedTool={detectedToolName} />;
  }

  if (loading) {
    return <LoadingPage message="Loading page, please wait..." />;
  }

  return children;
};

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthLoadingWrapper>
          <ActivityTracker>
            <WhatsNewModal />
            <Toaster position="top-center" reverseOrder={false} />
            <PageLayout>
              <CopyPasteGuard />
              {children}
            </PageLayout>
          </ActivityTracker>
        </AuthLoadingWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
}
