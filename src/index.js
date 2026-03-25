// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// import App from './App';
// import { ThemeProvider } from './context/ThemeContext';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import LoadingPage from './pages/LoadingPage';
// import DevToolsBlocker from './pages/DevToolsBlocker';


// // Flag to track if DevTools is active and blocking is required
// // Tracking for security violations
// let devToolsDetected = false;
// let detectedToolName = "";

// // Disable React DevTools in production
// if (process.env.NODE_ENV === 'production') {
//   try {
//     if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
//       if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'object') {
//         // Try to disable it
//         window.__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = true;

//         // If it has renderers already, it might already be active
//         // Some versions use 'renderers' Map or similar
//         if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers &&
//           (window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0 ||
//             window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.length > 0)) {
//           devToolsDetected = true;
//           detectedToolName = "React Developer Tools";
//         }
//       }
//     } else {
//       // Define a dummy hook to prevent extension from loading later
//       window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
//         isDisabled: true,
//         supportsFiber: true,
//         inject: () => { },
//         onCommitFiberRoot: () => { },
//         onCommitFiberUnmount: () => { },
//       };
//     }
//   } catch (e) {
//     // If we can't set it, it's likely because the extension has already locked it
//     devToolsDetected = true;
//     detectedToolName = "React Developer Tools";
//   }
// }



// const AuthLoadingWrapper = ({ children }) => {
//   const { loading } = useAuth();

//   if (devToolsDetected) {
//     return <DevToolsBlocker detectedTool={detectedToolName} />;
//   }

//   if (loading) {
//     return (
//       <LoadingPage message="Loading page, please wait..." />
//     );
//   }

//   return children;
// };




// // Disable console logs in production
// if (process.env.NODE_ENV === 'production') {
//   console.log = () => { };
//   console.warn = () => { };
//   console.error = () => { };
// }



// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <ThemeProvider>
//       <AuthProvider>
//         <AuthLoadingWrapper>
//           <App />
//         </AuthLoadingWrapper>
//       </AuthProvider>
//     </ThemeProvider>
//   </React.StrictMode>
// );


import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ✅ Maintenance Screen Component
const MaintenanceScreen = () => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href =
        "https://algocore-h2hyczcqeccshqfw.canadacentral-01.azurewebsites.net/";
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.dot}></div>

        <h1 style={styles.title}>We’ll be back soon</h1>

        <p style={styles.subtitle}>
          AlgoCore is upgrading for a better experience.
        </p>

        <div style={styles.loader}>
          <div style={styles.bar}></div>
        </div>

        <p style={styles.redirect}>Redirecting...</p>
      </div>
    </div>
  );
};

// ✅ Styles (modern minimal UI)
const styles = {
  container: {
    position: "fixed",
    inset: 0,
    background: "#0b0f19",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fff",
  },

  card: {
    textAlign: "center",
    padding: "40px 30px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    width: "320px",
    animation: "fadeUp 0.8s ease",
  },

  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#22c55e",
    margin: "0 auto 15px",
    animation: "pulse 1.5s infinite",
  },

  title: {
    fontSize: "1.6rem",
    marginBottom: "8px",
    fontWeight: "600",
  },

  subtitle: {
    fontSize: "0.95rem",
    opacity: 0.7,
    marginBottom: "20px",
  },

  loader: {
    width: "100%",
    height: "4px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "10px",
  },

  bar: {
    width: "40%",
    height: "100%",
    background: "#22c55e",
    borderRadius: "10px",
    animation: "slide 1.2s infinite",
  },

  redirect: {
    fontSize: "0.8rem",
    opacity: 0.5,
  },
};

// ✅ Inject animations once
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
@keyframes pulse {
  0%,100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`;
document.head.appendChild(styleSheet);

// ✅ Toggle Maintenance Mode (change to false to disable)
const SHOW_MAINTENANCE = true;

// ✅ React Root Render
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {SHOW_MAINTENANCE ? <MaintenanceScreen /> : <App />}
  </React.StrictMode>
);
