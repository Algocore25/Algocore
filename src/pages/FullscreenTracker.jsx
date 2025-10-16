
import React, { useEffect, useRef, useState } from "react";
import screenfull from "screenfull";

const FullscreenTracker = ( { violation , setviolation, isViolationReady ,testid} ) => {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);
  const [hoverLeaveCount, setHoverLeaveCount] = useState(0);
  const [keypressCount, setKeypressCount] = useState(0);
  const [totalBlurTime, setTotalBlurTime] = useState(0);
  const [totalHoverLeaveTime, setTotalHoverLeaveTime] = useState(0);

  const blurStartRef = useRef(null);
  const hoverLeaveStartRef = useRef(null);

  const toggleFullscreen = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle(containerRef.current);
    }
  };

  // Fullscreen toggle detection
  useEffect(() => {
    if (!screenfull.isEnabled) return;

    const onChange = () => {
      const fs = screenfull.isFullscreen;
      setIsFullscreen(fs);
      if (!fs && isViolationReady) 
      {
        console.log("Fullscreen exit violation detected");
        setviolation(prev => prev + 1);
        setExitCount((prev) => prev + 1);
      }
        
    };

    screenfull.on("change", onChange);
    return () => screenfull.off("change", onChange);
  }, [isViolationReady, setviolation]);

  // Tab switch / blur time tracking + visibility change
  useEffect(() => {
    const handleBlur = () => {
      console.log("Window blur detected - app switched");
      blurStartRef.current = Date.now();
      if (isViolationReady) 
      {
        console.log("Adding violation for window blur");
        setviolation(prev => prev + 1);
        setSwitchCount((prev) => prev + 1);
      }
    };

    const handleFocus = () => {
      console.log("Window focus restored");
      if (blurStartRef.current) {
        const duration = Date.now() - blurStartRef.current;
        setTotalBlurTime((prev) => prev + duration);
        blurStartRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden - tab/app switched");
        blurStartRef.current = Date.now();
        if (isViolationReady) {
          console.log("Adding violation for visibility change");
          setviolation(prev => prev + 1);
          setSwitchCount((prev) => prev + 1);
        }
      } else {
        console.log("Page visible again");
        if (blurStartRef.current) {
          const duration = Date.now() - blurStartRef.current;
          setTotalBlurTime((prev) => prev + duration);
          blurStartRef.current = null;
        }
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isViolationReady, setviolation]);

  // Mouse leave/enter time tracking
  useEffect(() => {
    const handleMouseLeave = (e) => {
      if (
        e.clientY <= 0 ||
        e.clientX <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        if (isViolationReady) 
        {
          console.log("Mouse left screen - violation");
          setviolation(prev => prev + 1);
          setHoverLeaveCount((prev) => prev + 1);
          hoverLeaveStartRef.current = Date.now();
        }
      }
    };

    const handleMouseEnter = () => {
      if (hoverLeaveStartRef.current) {
        const duration = Date.now() - hoverLeaveStartRef.current;
        setTotalHoverLeaveTime((prev) => prev + duration);
        hoverLeaveStartRef.current = null;
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isViolationReady, setviolation]);

  // Key press detection while not focused
  useEffect(() => {
    const handleKeyDown = () => {
      if (document.hidden || document.activeElement.tagName === "BODY") {
        setKeypressCount((prev) => prev + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Time formatter
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <></>
    // <div>
    //   <button onClick={toggleFullscreen}>
    //     {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    //   </button>

    //   <div
    //     ref={containerRef}
    //     style={{
    //       width: "100%",
    //       height: isFullscreen ? "100vh" : "400px",
    //       background: "#111",
    //       color: "#0f0",
    //       padding: "20px",
    //       marginTop: "20px",
    //       overflow: "auto",
    //     }}
    //   >
    //     <h2>Fullscreen Mode Active</h2>
    //     <p>Exit Fullscreen Count: {exitCount}</p>
    //     <p>Tab Switch / Blur Count: {switchCount}</p>
    //     <p>Total Time Outside Tab: {formatTime(totalBlurTime)}</p>
    //     <p>Mouse Hover Leave Count: {hoverLeaveCount}</p>
    //     <p>Total Time Mouse Outside: {formatTime(totalHoverLeaveTime)}</p>
    //     <p>Key Presses While Not Focused: {keypressCount}</p>
    //   </div>
    // </div>
  );
};

export default FullscreenTracker;
