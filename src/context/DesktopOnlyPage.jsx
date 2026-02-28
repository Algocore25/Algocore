import React, { useEffect, useState } from "react";
import { Monitor, Smartphone, AlertCircle, Laptop, ArrowRight } from "lucide-react";

/**
 * DesktopOnlyPage.jsx
 * A premium fallback page that informs users when a feature is best as desktop-only.
 * Matches AlgoCore's modern design system with glassmorphism and smooth animations.
 */
export default function DesktopOnlyPage({ children, desktopBreakpoint = 1024 }) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < desktopBreakpoint;
  });

  const [forceShowDesktop, setForceShowDesktop] = useState(false);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < desktopBreakpoint);
    }
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [desktopBreakpoint]);

  if (!isMobile || forceShowDesktop) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary px-6 transition-colors duration-500 overflow-hidden relative font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />

      <div className="relative max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white/80 dark:bg-dark-secondary/80 backdrop-blur-2xl border border-white/40 dark:border-dark-tertiary/50 rounded-[2.5rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-slideUp">

          {/* Visual Indicator */}
          <div className="flex justify-center mb-10">
            <div className="relative group">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative w-28 h-28 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-tertiary dark:to-dark-primary rounded-3xl flex items-center justify-center border border-white dark:border-gray-700 shadow-xl">
                <Laptop className="w-14 h-14 text-blue-600 dark:text-blue-400" />

                {/* Overlay Alert Icon */}
                <div className="absolute -top-2 -right-2 bg-white dark:bg-dark-secondary p-1.5 rounded-full border border-gray-100 dark:border-dark-tertiary shadow-lg">
                  <div className="bg-amber-500 rounded-full p-1">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center space-y-4 mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Desktop Optimized
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              To provide the most powerful coding environment, this page is optimized for larger screens.
              <span className="block mt-2 font-medium">Please switch to a laptop or desktop for the full experience.</span>
            </p>
          </div>

          {/* Action Area */}
          <div className="grid gap-4">
            <button
              onClick={() => setForceShowDesktop(true)}
              className="group relative w-full flex items-center justify-center gap-2 py-4 px-8 bg-[#4285F4] hover:bg-[#4285F4]/90 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all duration-300"
            >
              Enter Anyway
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-500">
              Tip: You can also use <span className="font-semibold text-blue-500">Request Desktop Site</span> in your browser menu.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-600 text-sm animate-fadeIn">
          <Monitor className="w-4 h-4" />
          <span>Best viewed at 1024px width or higher</span>
        </div>
      </div>
    </div>
  );
}


