"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase';
import { ref, onValue, get, update } from 'firebase/database';
import LoadingPage from '../views/LoadingPage';

/**
 * SessionGuard ensures that users only have ONE active session when entering
 * a "test window" (like an exam).
 * 
 * If multiple sessions are detected, it blocks the content and provides
 * a button to "Terminate other sessions".
 */
export default function SessionGuard({ children }) {
  const { user, sessionId, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(false);

  useEffect(() => {
    if (!user?.uid || authLoading) return;

    const sessionsRef = ref(database, `sessions/${user.uid}`);
    
    // Listen to sessions live
    const unsub = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        // Sort current session to the top
        list.sort((a, b) => (a.id === sessionId ? -1 : b.id === sessionId ? 1 : 0));
        setSessions(list);
      } else {
        setSessions([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid, authLoading, sessionId]);

  const handleTerminateOthers = async () => {
    if (!user?.uid || !sessionId) return;
    setTerminating(true);
    try {
      const sessionsRef = ref(database, `sessions/${user.uid}`);
      const snapshot = await get(sessionsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const updates = {};
        Object.keys(data).forEach(key => {
          if (key !== sessionId) {
            updates[key] = null;
          }
        });
        if (Object.keys(updates).length > 0) {
          await update(sessionsRef, updates);
        }
      }
    } catch (error) {
      console.error("Failed to terminate sessions:", error);
      alert("Error: Could not disconnect other devices.");
    } finally {
      setTerminating(false);
    }
  };

  if (authLoading || loading) return <LoadingPage />;

  // More than one session? Block access.
  if (sessions.length > 1) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 flex items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-xl w-full my-auto space-y-8 bg-gray-50 dark:bg-gray-800 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Multiple Sessions Detected
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              To ensure exam integrity, please close all other active windows or devices.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Active Windows ({sessions.length})</h3>
            <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
              {sessions.map(s => {
                const isMe = s.id === sessionId;
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isMe ? 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900/40 border-gray-200 dark:border-gray-700'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isMe ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {isMe ? '💻' : '🌐'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                          {s.platform || 'Unknown Device'}
                        </span>
                        {isMe && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">This Device</span>}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate opacity-70">
                        {s.userAgent}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleTerminateOthers}
              disabled={terminating}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              {terminating ? "Closing other sessions..." : "Disconnect Other Devices"}
            </button>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Other tabs and devices will be instantly logged out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
