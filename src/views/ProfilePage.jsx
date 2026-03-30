import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ref, get, child, set, remove, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../firebase";
import { auth } from "../firebase";
import {
  EmailAuthProvider,
  linkWithCredential, unlink, sendPasswordResetEmail,
  GoogleAuthProvider, linkWithPopup,
} from "firebase/auth";
import { useRouter } from 'next/navigation';

import SignInRequiredPage from "./SignInRequiredPage";
import LoadingPage from "./LoadingPage";
import useUserActivityTime from '../hooks/useUserActivityTime';
import ActivityCalendar from './ActivityCalendar';
import { sendEmailService, getUserEmail } from '../utils/emailService';
import AnimatedBackground from '../components/AnimatedBackground';
import algocoreLogo from '../assets/LOGO-1.png';

import Footer from '../components/Footer';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// ─── Random Username Generator ────────────────────────────────────────────────
const ADJECTIVES = [
  'swift', 'brave', 'silent', 'cosmic', 'quantum', 'binary', 'dark', 'electric',
  'frozen', 'golden', 'hyper', 'iron', 'lazy', 'magic', 'neon', 'omega', 'pixel',
  'rapid', 'solar', 'turbo', 'ultra', 'vivid', 'wild', 'xray', 'yellow', 'zen',
];
const NOUNS = [
  'coder', 'hacker', 'ninja', 'wizard', 'dragon', 'falcon', 'tiger', 'panda',
  'wolf', 'shark', 'phoenix', 'cipher', 'byte', 'pixel', 'node', 'kernel',
  'stack', 'loop', 'array', 'vector', 'matrix', 'lambda', 'prime', 'sigma',
];

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}_${noun}_${num}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseFirebaseTimestamp = (key) => {
  if (!key) return new Date(NaN);
  const fixed = key.replace(/T(\d{2})_(\d{2})_(\d{2})_(\d{3})Z/, 'T$1:$2:$3.$4Z');
  const d = new Date(fixed);
  return isNaN(d.getTime()) ? new Date(NaN) : d;
};

const formatFirebaseTimestamp = (key) => {
  const d = parseFirebaseTimestamp(key);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatJoinDate = (ts) => {
  if (!ts) return "Unknown";
  return new Date(ts).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const getStatusColor = (status) => {
  if (status === "Accepted") return "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
  if (status === "Wrong Answer") return "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
  return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30";
};

// ─── Calculate Streak ─────────────────────────────────────────────────────────
const calculateStreak = (submissions) => {
  if (!submissions || submissions.length === 0) return 0;

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get unique dates with submissions (format: YYYY-MM-DD)
  const submissionDates = new Set();
  submissions.forEach(s => {
    const date = new Date(s.timestamp);
    submissionDates.add(getLocalDateStr(date));
  });

  // Start from today and go backwards
  let streak = 0;
  const today = new Date();
  const todayStr = getLocalDateStr(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  if (!submissionDates.has(todayStr) && !submissionDates.has(yesterdayStr)) {
    return 0;
  }

  let currentDate = new Date(today);
  // If today has no submission but yesterday does, start from yesterday
  if (!submissionDates.has(todayStr) && submissionDates.has(yesterdayStr)) {
    currentDate = yesterday;
  }

  // Count consecutive days backwards
  while (true) {
    const dateStr = getLocalDateStr(currentDate);
    if (submissionDates.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// ─── Icon set ────────────────────────────────────────────────────────────────
const Ic = {
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Globe: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  User: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Link: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
  Warning: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  GitHub: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>,
  Users: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Camera: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Monitor: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
};

// ─── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmModal({ title, description, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className={`px-6 py-5 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
          <span className={danger ? 'text-red-500' : 'text-blue-500'}><Ic.Warning /></span>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="px-6 py-5 text-sm text-gray-600 dark:text-gray-300">{description}</div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm rounded-lg font-semibold text-white transition ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ProfilePage() {
  const { theme } = useTheme();
  const { user, loading, sessionId } = useAuth();
  const { totalTime, formatTime } = useUserActivityTime();
  const router = useRouter();

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentStreak, setCurrentStreak] = useState(0);

  // Username editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const nameInputRef = useRef(null);

  // @username (handle) editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const usernameInputRef = useRef(null);

  // Public profile toggle
  const [isPublic, setIsPublic] = useState(false);
  const [publicSaving, setPublicSaving] = useState(false);

  // GitHub link
  const [githubLink, setGithubLink] = useState('');
  const [editingGithub, setEditingGithub] = useState(false);
  const [githubDraft, setGithubDraft] = useState('');
  const [githubSaving, setGithubSaving] = useState(false);

  // Follow / Followers
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followerList, setFollowerList] = useState([]); // [{ username, displayName, photoURL }]
  const [followingList, setFollowingList] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);

  // Search / find users
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchFollowingSet, setSearchFollowingSet] = useState(new Set());
  const [searchLoadingFollow, setSearchLoadingFollow] = useState(new Set());
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Reset progress
  const [courses, setCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [resetModal, setResetModal] = useState(null); // { course }
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);

  // Photo uploading
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  // ── Linked accounts state ──────────────────────────────────────────────────
  const [linkedProviders, setLinkedProviders] = useState([]);
  // Email link form
  const [emailLinkForm, setEmailLinkForm] = useState({ email: '', password: '', confirm: '' });
  const [emailLinkMsg, setEmailLinkMsg] = useState(null);
  const [emailLinking, setEmailLinking] = useState(false);
  const [resetPwSent, setResetPwSent] = useState(false);


  // Submissions
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Global Settings
  const [globalChatbotEnabled, setGlobalChatbotEnabled] = useState(true);
  const [globalCodeEvaluateEnabled, setGlobalCodeEvaluateEnabled] = useState(true);
  const [certificatesEnabled, setCertificatesEnabled] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const init = async () => {
      const dbRef = ref(database);

      // 1. Load / generate user profile node
      const profileSnap = await get(child(dbRef, `users/${user.uid}/profile`));
      let profileNode = profileSnap.exists() ? profileSnap.val() : {};

      // Assign random username only if it does not exist
      if (!profileNode.username) {
        profileNode.username = generateUsername();
        await set(ref(database, `users/${user.uid}/profile/username`), profileNode.username);
      }

      // Read public flag — default to TRUE for new users
      const publicSnap = await get(child(dbRef, `users/${user.uid}/profile/isPublic`));
      const pub = publicSnap.exists() ? publicSnap.val() : true;
      if (!publicSnap.exists()) {
        await set(ref(database, `users/${user.uid}/profile/isPublic`), true);
      }
      setIsPublic(pub);

      // Display name fallback: profile.displayName → auth name → email prefix
      const displayName = profileNode.displayName || user.displayName || user.email?.split('@')[0] || 'Coder';
      const photoURL = user.photoURL || null;

      // Persist displayName + photoURL to DB so public profile can read them
      const updates = {};
      if (!profileNode.displayName && displayName) updates[`users/${user.uid}/profile/displayName`] = displayName;
      if (photoURL && photoURL !== profileNode.photoURL) updates[`users/${user.uid}/profile/photoURL`] = photoURL;
      if (Object.keys(updates).length > 0) {
        await Promise.all(Object.entries(updates).map(([path, val]) => set(ref(database, path), val)));
      }


      // GitHub link
      const gh = profileNode.githubLink || '';
      setGithubLink(gh);
      setGithubDraft(gh);

      // Settings
      if (profileNode.settings) {
        setGlobalChatbotEnabled(profileNode.settings.chatbotEnabled !== false);
        setGlobalCodeEvaluateEnabled(profileNode.settings.codeEvaluateEnabled !== false);
        setCertificatesEnabled(profileNode.settings.certificatesEnabled === true);
      }

      setProfileData({
        username: profileNode.username,
        displayName,
        email: user.email || "No email",
        photoURL,
        joinDate: formatJoinDate(user.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now()),
        totalSubmissions: 0,
        acceptedSubmissions: 0,
      });
      setNameDraft(displayName);

      // Follow counts
      const [followersSnap, followingSnap] = await Promise.all([
        get(ref(database, `follows/${user.uid}/followers`)),
        get(ref(database, `follows/${user.uid}/following`)),
      ]);
      setFollowerCount(followersSnap.exists() ? Object.keys(followersSnap.val()).length : 0);
      setFollowingCount(followingSnap.exists() ? Object.keys(followingSnap.val()).length : 0);

      // 2. Load progress → list of courses + completed courses
      const progressSnap = await get(child(dbRef, `userprogress/${user.uid}`));
      const courseSet = new Set();
      if (progressSnap.exists()) {
        const pd = progressSnap.val();
        for (const courseKey in pd) courseSet.add(courseKey);
      }
      setCourses([...courseSet]);

      // Load full courses list to find completed ones
      try {
        const coursesSnap = await get(child(dbRef, 'Courses'));
        if (coursesSnap.exists()) {
          const coursesData = coursesSnap.val();
          const coursesArr = Array.isArray(coursesData) ? coursesData : Object.values(coursesData);
          const completed = [];
          await Promise.all(coursesArr.filter(Boolean).map(async (c) => {
            try {
              const [lessonsSnap, progSnap] = await Promise.all([
                get(child(dbRef, `AlgoCore/${c.id}/lessons`)),
                get(child(dbRef, `userprogress/${user.uid}/${c.id}`))
              ]);
              if (!lessonsSnap.exists()) return;
              const lessons = lessonsSnap.val();
              const userProg = progSnap.exists() ? progSnap.val() : {};
              let total = 0, done = 0;
              Object.keys(lessons).forEach(tk => {
                const t = lessons[tk];
                if (!t?.description) return;
                const qs = Array.isArray(t.questions) ? t.questions : Object.keys(t.questions || {});
                total += qs.length;
                const tp = userProg[tk] || {};
                qs.forEach(q => { if (tp[q] === true) done++; });
              });
              if (total > 0 && done === total) {
                completed.push({ id: c.id, title: c.title || c.id, description: c.description || '' });
              }
            } catch (_) {}
          }));
          setCompletedCourses(completed);
        }
      } catch (_) {}

      // 3. Load submissions
      const subSnap = await get(child(dbRef, `Submissions/${user.uid}`));
      let total = 0;
      let accepted = 0;
      const subList = [];
      if (subSnap.exists()) {
        const subData = subSnap.val();
        for (const courseKey in subData) {
          for (const subKey in subData[courseKey]) {
            for (const qId in subData[courseKey][subKey]) {
              for (const ts in subData[courseKey][subKey][qId]) {
                const s = subData[courseKey][subKey][qId][ts];
                total++;
                // Count accepted submissions from actual submission status
                if (s.status === "correct") {
                  accepted++;
                }
                subList.push({
                  problem: qId,
                  course: courseKey,
                  subcourse: subKey,
                  language: s.language || "N/A",
                  status: s.status === "correct" ? "Accepted" : "Wrong Answer",
                  date: formatFirebaseTimestamp(ts),
                  timestamp: parseFirebaseTimestamp(ts).getTime(),
                });
              }
            }
          }
        }
      }
      subList.sort((a, b) => b.timestamp - a.timestamp);
      setAllSubmissions(subList);
      setFilteredSubs(subList);

      // Calculate streak from submissions
      const streak = calculateStreak(subList);
      setCurrentStreak(streak);

      setProfileData(prev => ({
        ...prev,
        totalSubmissions: total,
        acceptedSubmissions: accepted,
      }));
    };

    init();
  }, [user]);

  // ── Focus inputs when editing starts ─────────────────────────────────────
  useEffect(() => { if (editingName) nameInputRef.current?.focus(); }, [editingName]);
  useEffect(() => { if (editingUsername) usernameInputRef.current?.focus(); }, [editingUsername]);

  // ── Load linked providers whenever user changes ───────────────────────────
  useEffect(() => {
    if (!auth.currentUser) return;
    setLinkedProviders(auth.currentUser.providerData.map(p => p.providerId));
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!nameDraft.trim()) return;
    setNameSaving(true);
    await set(ref(database, `users/${user.uid}/profile/displayName`), nameDraft.trim());
    setProfileData(prev => ({ ...prev, displayName: nameDraft.trim() }));
    setEditingName(false);
    setNameSaving(false);
  };

  // ── Save username (@handle) ────────────────────────────────────────────────
  const handleSaveUsername = async () => {
    const raw = usernameDraft.trim().toLowerCase().replace(/\s+/g, '_');
    if (!raw) { setUsernameError('Username cannot be empty.'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(raw)) {
      setUsernameError('3–20 chars, letters/numbers/underscore only.');
      return;
    }
    setUsernameSaving(true);
    setUsernameError('');
    // Check uniqueness — scan all users' usernames
    try {
      const allUsersSnap = await get(ref(database, 'users'));
      let taken = false;
      if (allUsersSnap.exists()) {
        allUsersSnap.forEach(userSnap => {
          if (userSnap.key !== user.uid) {
            const uname = userSnap.child('profile/username').val();
            if (uname === raw) taken = true;
          }
        });
      }
      if (taken) {
        setUsernameError(`@${raw} is already taken. Choose another.`);
        setUsernameSaving(false);
        return;
      }
      await set(ref(database, `users/${user.uid}/profile/username`), raw);
      setProfileData(prev => ({ ...prev, username: raw }));
      setEditingUsername(false);
    } catch (e) {
      setUsernameError('Save failed. Try again.');
    }
    setUsernameSaving(false);
  };

  // ── Link Email + Password ────────────────────────────────────────────────
  const handleLinkEmail = async () => {
    const { email, password, confirm } = emailLinkForm;
    if (!email || !password) { setEmailLinkMsg({ type: 'error', text: 'Fill in email and password.' }); return; }
    if (password !== confirm) { setEmailLinkMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (password.length < 6) { setEmailLinkMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setEmailLinking(true);
    setEmailLinkMsg(null);
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(auth.currentUser, credential);
      setLinkedProviders(auth.currentUser.providerData.map(p => p.providerId));
      setEmailLinkMsg({ type: 'success', text: 'Email/password linked successfully!' });
      setEmailLinkForm({ email: '', password: '', confirm: '' });
    } catch (e) {
      const msg = e.code === 'auth/email-already-in-use'
        ? 'This email is already linked to another account.'
        : e.code === 'auth/provider-already-linked'
          ? 'Email is already linked to this account.'
          : e.message || 'Failed to link email.';
      setEmailLinkMsg({ type: 'error', text: msg });
    }
    setEmailLinking(false);
  };

  // ── Link Google ────────────────────────────────────────────────────────
  const handleLinkGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      setLinkedProviders(auth.currentUser.providerData.map(p => p.providerId));
    } catch (e) {
      const msg = e.code === 'auth/provider-already-linked' ? 'Google is already linked.' : e.message;
      alert(msg);
    }
  };

  // ── Unlink a provider ─────────────────────────────────────────────────
  const handleUnlink = async (providerId) => {
    if (linkedProviders.length <= 1) {
      alert('You must keep at least one sign-in method linked.');
      return;
    }
    if (!window.confirm(`Remove ${providerId} sign-in method?`)) return;
    try {
      await unlink(auth.currentUser, providerId);
      setLinkedProviders(auth.currentUser.providerData.map(p => p.providerId));
    } catch (e) { alert(e.message); }
  };

  // ── Send password reset email ──────────────────────────────────────────────
  const handleResetPassword = async () => {
    const email = auth.currentUser?.email;
    if (!email) {
      setEmailLinkMsg({ type: 'error', text: 'No email address found on your account.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetPwSent(true);
      setEmailLinkMsg({ type: 'success', text: `Password reset email sent to ${email}` });
      setTimeout(() => { setResetPwSent(false); setEmailLinkMsg(null); }, 6000);
    } catch (e) {
      setEmailLinkMsg({ type: 'error', text: e.message || 'Failed to send reset email.' });
    }
  };

  // ── Load search users (lazy — called once when tab opens) ──────────────
  const loadSearchUsers = async () => {
    if (searchLoaded) return;
    setSearchLoading(true);
    try {
      const [usersSnap, followSnap] = await Promise.all([
        get(ref(database, 'users')),
        get(ref(database, 'follows')),
      ]);
      const followData = followSnap.exists() ? followSnap.val() : {};
      const list = [];
      if (usersSnap.exists()) {
        usersSnap.forEach(s => {
          if (s.key === user.uid) return; // skip self
          const p = s.child('profile').val();
          if (!p || p.isPublic === false || !p.username) return;
          const followers = followData[s.key]?.followers
            ? Object.keys(followData[s.key].followers).length : 0;
          list.push({
            uid: s.key,
            username: p.username,
            displayName: p.displayName || p.username,
            photoURL: p.photoURL || null,
            githubLink: p.githubLink || '',
            followers,
          });
        });
      }
      list.sort((a, b) => b.followers - a.followers);
      setSearchUsers(list);
      const myFollowing = followData[user.uid]?.following
        ? new Set(Object.keys(followData[user.uid].following)) : new Set();
      setSearchFollowingSet(myFollowing);
      setSearchLoaded(true);
    } catch (e) { console.error(e); }
    setSearchLoading(false);
  };

  // ── Follow toggle from search tab ────────────────────────────────────────
  const handleSearchFollow = async (e, targetUid) => {
    e.stopPropagation();
    setSearchLoadingFollow(prev => new Set(prev).add(targetUid));
    const curFollowing = searchFollowingSet.has(targetUid);
    try {
      if (curFollowing) {
        await Promise.all([
          remove(ref(database, `follows/${user.uid}/following/${targetUid}`)),
          remove(ref(database, `follows/${targetUid}/followers/${user.uid}`)),
        ]);
        setSearchFollowingSet(prev => { const n = new Set(prev); n.delete(targetUid); return n; });
        setSearchUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, followers: Math.max(0, u.followers - 1) } : u));
        setFollowingCount(c => Math.max(0, c - 1));
      } else {
        await Promise.all([
          set(ref(database, `follows/${user.uid}/following/${targetUid}`), true),
          set(ref(database, `follows/${targetUid}/followers/${user.uid}`), true),
        ]);
        setSearchFollowingSet(prev => new Set(prev).add(targetUid));
        setSearchUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, followers: u.followers + 1 } : u));
        setFollowingCount(c => c + 1);

        // Send email notification to the followed user
        try {
          const targetEmail = await getUserEmail(targetUid);

          if (targetEmail) {
            const [targetUserSnap] = await Promise.all([
              get(ref(database, `users/${targetUid}/profile`))
            ]);
            const targetProfile = targetUserSnap.exists() ? targetUserSnap.val() : {};
            const followerName = user.displayName || user.email?.split('@')[0] || "Someone";

            await sendEmailService({
              to: targetEmail,
              subject: "New Follower on AlgoCore! 🎉",
              text: `Hi! ${followerName} just started following you on AlgoCore.`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
                  <h2 style="color: #1a56db;">You have a new follower! 🎉</h2>
                  <p style="font-size: 16px; color: #4b5563;">
                    Hi <strong>${targetProfile.displayName || targetProfile.username || 'User'}</strong>,
                  </p>
                  <p style="font-size: 16px; color: #4b5563;">
                    <strong>${followerName}</strong> just started following you on AlgoCore.
                  </p>
                  <br />
                  <a href="https://algocore.netlify.app/u/${profileData.username}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Profile</a>
                </div>
              `
            });
          }
        } catch (mailError) {
          console.error("Failed to send follow notification email:", mailError);
        }
      }
    } catch (e) { console.error(e); }
    setSearchLoadingFollow(prev => { const n = new Set(prev); n.delete(targetUid); return n; });
  };

  // ── Save GitHub link ──────────────────────────────────────────────────────
  const handleSaveGithub = async () => {
    setGithubSaving(true);
    const val = githubDraft.trim();
    await set(ref(database, `users/${user.uid}/profile/githubLink`), val);
    setGithubLink(val);
    setEditingGithub(false);
    setGithubSaving(false);
  };

  // ── Load social lists ────────────────────────────────────────────────────
  const loadSocialLists = async () => {
    setSocialLoading(true);
    try {
      const allSnap = await get(ref(database, 'users'));
      const userMap = {};
      if (allSnap.exists()) {
        allSnap.forEach(s => {
          const p = s.child('profile').val() || {};
          userMap[s.key] = { username: p.username || s.key, displayName: p.displayName || s.key, photoURL: p.photoURL || null };
        });
      }
      const [followersSnap, followingSnap] = await Promise.all([
        get(ref(database, `follows/${user.uid}/followers`)),
        get(ref(database, `follows/${user.uid}/following`)),
      ]);
      const frs = followersSnap.exists() ? Object.keys(followersSnap.val()).map(uid => userMap[uid]).filter(Boolean) : [];
      const fng = followingSnap.exists() ? Object.keys(followingSnap.val()).map(uid => userMap[uid]).filter(Boolean) : [];
      setFollowerList(frs);
      setFollowingList(fng);
    } catch (e) { console.error(e); }
    setSocialLoading(false);
  };

  // ── Copy public link ───────────────────────────────────────────────────────
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/${profileData.username}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTogglePublic = async () => {
    setPublicSaving(true);
    const next = !isPublic;
    await set(ref(database, `users/${user.uid}/profile/isPublic`), next);
    setIsPublic(next);
    setPublicSaving(false);
  };

  const handleResetCourse = async () => {
    if (!resetModal) return;
    setResetting(true);
    try {
      // Remove progress for the selected course
      await remove(ref(database, `userprogress/${user.uid}/${resetModal.course}`));
      setCourses(prev => prev.filter(c => c !== resetModal.course));
      setResetSuccess(resetModal.course);
      setTimeout(() => setResetSuccess(null), 3000);
    } catch (e) {
      console.error("Reset error:", e);
    }
    setResetting(false);
    setResetModal(null);
  };

  const handleFilterSubs = (lang, status) => {
    let f = [...allSubmissions];
    if (lang && lang !== "All Languages") f = f.filter(s => s.language === lang);
    if (status && status !== "All Status") f = f.filter(s => s.status === status);
    setFilteredSubs(f);
    setPage(0);
  };

  const handleToggleSetting = async (settingName, currentValue) => {
    setSettingsSaving(true);
    const newValue = !currentValue;
    try {
      await set(ref(database, `users/${user.uid}/profile/settings/${settingName}`), newValue);
      if (settingName === 'chatbotEnabled') setGlobalChatbotEnabled(newValue);
      if (settingName === 'codeEvaluateEnabled') setGlobalCodeEvaluateEnabled(newValue);
      if (settingName === 'certificatesEnabled') setCertificatesEnabled(newValue);
    } catch (e) {
      console.error("Error saving setting:", e);
    }
    setSettingsSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const { imageUrl } = await res.json();

      // Update Firebase Profile in RTDB
      await set(ref(database, `users/${user.uid}/profile/photoURL`), imageUrl);
      
      // Update local state
      setProfileData(prev => ({ ...prev, photoURL: imageUrl }));
    } catch (error) {
      console.error(error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResetPhoto = async (e) => {
    e.stopPropagation(); // prevent triggering file input
    if (!user?.photoURL) {
      alert("No default Google photo found.");
      return;
    }
    setUploadingPhoto(true);
    try {
      await set(ref(database, `users/${user.uid}/profile/photoURL`), user.photoURL);
      setProfileData(prev => ({ ...prev, photoURL: user.photoURL }));
    } catch (error) {
      console.error(error);
      alert("Failed to reset photo.");
    }
    setUploadingPhoto(false);
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const sessionsRef = ref(database, `sessions/${user.uid}`);
      const snapshot = await get(sessionsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        list.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
        setSessions(list);
      } else {
        setSessions([]);
      }
    } catch (e) {
      console.error(e);
    }
    setSessionsLoading(false);
  };

  const handleTerminateSession = async (sid) => {
    if (sid === sessionId) return; // Can't terminate current session from here
    if (!window.confirm("Disconnect this device?")) return;
    try {
      await remove(ref(database, `sessions/${user.uid}/${sid}`));
      setSessions(prev => prev.filter(s => s.id !== sid));
    } catch (e) {
      console.error(e);
      alert("Failed to terminate session.");
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    if (!window.confirm("Disconnect all other devices/tabs?")) return;
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
        setSessions(prev => prev.filter(s => s.id === sessionId));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to terminate sessions.");
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return <LoadingPage />;
  if (!user) return <SignInRequiredPage />;
  if (!profileData) return <LoadingPage />;

  const paged = filteredSubs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const acceptanceRate = profileData.totalSubmissions > 0
    ? Math.round((profileData.acceptedSubmissions / profileData.totalSubmissions) * 100)
    : 0;

  // Avatar initials
  const initials = profileData.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen relative text-gray-900 dark:text-gray-100 w-full flex flex-col">
      <AnimatedBackground />

      {/* Reset confirmation modal */}
      {resetModal && (
        <ConfirmModal
          title={`Reset "${resetModal.course}" Progress`}
          description={`This will permanently delete all your progress for the course "${resetModal.course}". This action cannot be undone.`}
          confirmLabel={resetting ? "Resetting…" : "Reset Progress"}
          onConfirm={handleResetCourse}
          onCancel={() => setResetModal(null)}
        />
      )}

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* ── Profile Card ── */}
        <div className="bg-white/50 dark:bg-dark-tertiary/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/50 dark:border-dark-tertiary/50 overflow-hidden w-full">

          <div className="px-6 py-5">
            {/* Avatar + toggle row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
              {/* Avatar with upload option */}
              <div 
                className="relative group cursor-pointer w-28 h-28 rounded-2xl shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shrink-0 overflow-hidden border-4 border-white dark:border-dark-tertiary"
                onClick={() => photoInputRef.current?.click()}
                title="Change profile picture"
              >
                {profileData.photoURL ? (
                  <img src={profileData.photoURL} alt="avatar" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                ) : initials}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                  <Ic.Camera />
                  {profileData.photoURL !== user?.photoURL && (
                    <button 
                      onClick={handleResetPhoto} 
                      title="Reset to Google photo"
                      className="p-1 hover:text-red-400 transition"
                    >
                      <Ic.Refresh />
                    </button>
                  )}
                </div>
                
                {/* Uploading Spinner */}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={photoInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* Public toggle chip */}
              <div className="sm:ml-auto">
                <button
                  onClick={handleTogglePublic}
                  disabled={publicSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isPublic
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-300 dark:border-green-700'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                    }`}
                >
                  {isPublic ? <Ic.Globe /> : <Ic.Lock />}
                  {publicSaving ? 'Saving…' : isPublic ? 'Public Profile' : 'Private Profile'}
                </button>
              </div>
            </div>

            {/* Name + Username row */}
            <div className="space-y-1 mb-2">
              {/* Display Name (editable) */}
              <div className="flex items-center gap-2">
                {editingName ? (
                  <>
                    <input
                      ref={nameInputRef}
                      value={nameDraft}
                      onChange={e => setNameDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNameDraft(profileData.displayName); } }}
                      className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 outline-none text-gray-900 dark:text-white w-64"
                    />
                    <button onClick={handleSaveName} disabled={nameSaving} className="text-green-500 hover:text-green-600 transition">
                      <Ic.Check />
                    </button>
                    <button onClick={() => { setEditingName(false); setNameDraft(profileData.displayName); }} className="text-gray-400 hover:text-gray-600 transition">
                      <Ic.X />
                    </button>
                  </>
                ) : (
                  <div className="group flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.displayName}</h1>
                    <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-blue-500 transition" title="Edit display name">
                      <Ic.Edit />
                    </button>
                  </div>
                )}
              </div>

              {/* @username chip — now editable */}
              <div className="flex items-center gap-2 flex-wrap">
                {editingUsername ? (
                  <>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">@</span>
                    <input
                      ref={usernameInputRef}
                      value={usernameDraft}
                      onChange={e => { setUsernameDraft(e.target.value); setUsernameError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') { setEditingUsername(false); setUsernameError(''); } }}
                      placeholder="new_username"
                      className="text-sm font-mono bg-transparent border-b-2 border-indigo-500 outline-none text-gray-900 dark:text-white w-44"
                    />
                    <button onClick={handleSaveUsername} disabled={usernameSaving} className="text-green-500 hover:text-green-600 transition">
                      <Ic.Check />
                    </button>
                    <button onClick={() => { setEditingUsername(false); setUsernameError(''); }} className="text-gray-400 hover:text-gray-600 transition">
                      <Ic.X />
                    </button>
                    {usernameError && <span className="text-xs text-red-500">{usernameError}</span>}
                    {usernameSaving && <span className="text-xs text-gray-400">Checking…</span>}
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                      @{profileData.username}
                    </span>
                    {/* Edit username */}
                    <button
                      onClick={() => { setEditingUsername(true); setUsernameDraft(profileData.username); }}
                      className="text-gray-400 hover:text-indigo-500 transition"
                      title="Edit username"
                    >
                      <Ic.Edit />
                    </button>
                    {/* Copy public link */}
                    <button
                      onClick={handleCopyLink}
                      className="text-gray-400 hover:text-blue-500 transition"
                      title="Copy public profile link"
                    >
                      {copiedLink ? <span className="text-xs text-green-500 font-semibold">Copied!</span> : <Ic.Copy />}
                    </button>
                    {/* Open public profile */}
                    <button
                      onClick={() => router.push(`/u/${profileData.username}`)}
                      className="text-gray-400 hover:text-purple-500 transition"
                      title="View public profile"
                    >
                      <Ic.Link />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span className="flex items-center gap-1.5"><Ic.Mail />{profileData.email}</span>
              <span className="flex items-center gap-1.5"><Ic.Calendar />Joined {profileData.joinDate}</span>
              {isPublic && <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400"><Ic.Globe />Public</span>}
            </div>

            {/* GitHub link row */}
            <div className="flex items-center gap-2 mb-5">
              {editingGithub ? (
                <>
                  <span className="text-gray-400"><Ic.GitHub /></span>
                  <input
                    value={githubDraft}
                    onChange={e => setGithubDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveGithub(); if (e.key === 'Escape') { setEditingGithub(false); setGithubDraft(githubLink); } }}
                    placeholder="https://github.com/yourusername"
                    className="text-sm bg-transparent border-b-2 border-gray-400 outline-none text-gray-700 dark:text-gray-200 w-72"
                  />
                  <button onClick={handleSaveGithub} disabled={githubSaving} className="text-green-500 hover:text-green-600 transition"><Ic.Check /></button>
                  <button onClick={() => { setEditingGithub(false); setGithubDraft(githubLink); }} className="text-gray-400 hover:text-gray-600 transition"><Ic.X /></button>
                </>
              ) : (
                <>
                  {githubLink ? (
                    <a href={githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
                      <Ic.GitHub />
                      <span className="font-mono">{githubLink.replace('https://github.com/', '')}</span>
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1.5"><Ic.GitHub />No GitHub linked</span>
                  )}
                  <button onClick={() => { setEditingGithub(true); setGithubDraft(githubLink); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition" title="Edit GitHub link"><Ic.Edit /></button>
                </>
              )}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Submissions', value: profileData.totalSubmissions },
                { label: 'Accepted', value: profileData.acceptedSubmissions },
                { label: 'Acceptance Rate', value: `${acceptanceRate}%` },
                { label: 'Time Spent', value: formatTime(totalTime) },
                { label: 'Followers', value: followerCount },
                { label: 'Following', value: followingCount },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-4 py-3">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white/50 dark:bg-dark-tertiary/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/50 dark:border-dark-tertiary/50 overflow-hidden w-full">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-2 overflow-x-auto">
            {["overview", "certificates", "submissions", "find-users", "social", "sessions", "linked-accounts", "settings", "reset-progress"].filter(t => t !== 'certificates' || certificatesEnabled).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); if (tab === 'social') loadSocialLists(); if (tab === 'find-users') loadSearchUsers(); if (tab === 'sessions') loadSessions(); }}
                className={`px-5 py-4 text-sm font-medium capitalize transition-all duration-150 whitespace-nowrap ${activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
                  }`}
              >
                {tab === 'reset-progress' ? '⚠️ Reset Progress'
                  : tab === 'linked-accounts' ? '🔗 Linked Accounts'
                    : tab === 'social' ? '👥 Social'
                      : tab === 'find-users' ? '🔍 Find Users'
                        : tab === 'settings' ? '⚙️ Settings'
                          : tab === 'certificates' ? '🏅 Certificates'
                            : tab === 'sessions' ? '🖥️ Sessions'
                              : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">

            {/* ── Find Users Tab ───────────────────────────────────────── */}
            {activeTab === "find-users" && (
              <div className="space-y-4">
                {/* Search bar */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by username or name…"
                    className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <Ic.X />
                    </button>
                  )}
                </div>

                {searchLoading ? (
                  <div className="text-center py-10 text-gray-400">Loading users…</div>
                ) : (() => {
                  const q = searchQuery.trim().toLowerCase();
                  const filtered = q
                    ? searchUsers.filter(u => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
                    : searchUsers;
                  return filtered.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-3xl mb-2">🔍</div>
                      <p className="text-sm text-gray-400">{searchQuery ? 'No users found' : 'No public users yet'}</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {filtered.map(u => {
                        const grad = ['from-violet-500 to-indigo-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600', 'from-fuchsia-500 to-purple-600'][(u.displayName.charCodeAt(0) || 0) % 6];
                        const initials = u.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                        const following = searchFollowingSet.has(u.uid);
                        const busy = searchLoadingFollow.has(u.uid);
                        return (
                          <div key={u.uid} onClick={() => router.push(`/u/${u.username}`)} className="flex items-center gap-3 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-blue-400 transition cursor-pointer group">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden`}>
                              {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-500 transition">{u.displayName}</p>
                              <p className="text-xs text-gray-400 font-mono truncate">@{u.username} · 👥 {u.followers}</p>
                            </div>
                            <button
                              onClick={(e) => handleSearchFollow(e, u.uid)}
                              disabled={busy}
                              className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-lg border transition disabled:opacity-50 ${following
                                ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 hover:text-red-600'
                                : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                              {busy ? '…' : following ? 'Unfollow' : '+ Follow'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Certificates Tab ─────────────────────────────────────── */}
            {activeTab === "certificates" && certificatesEnabled && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Certificates</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{completedCourses.length} earned</span>
                </div>

                {completedCourses.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-4xl">🎓</div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 font-semibold">No certificates yet</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Complete a course 100% to earn your first certificate!</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedCourses.map((c) => (
                      <div
                        key={c.id}
                        className="relative bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/30 dark:to-dark-tertiary rounded-xl border-2 border-blue-300 dark:border-blue-700/60 p-5 flex flex-col items-center text-center overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        style={{ minHeight: '260px' }}
                      >
                        {/* Corner decorations */}
                        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br" />

                        {/* AlgoCore Logo */}
                        <img src={algocoreLogo.src} alt="AlgoCore" className="h-6 object-contain mb-2 mt-1" />
                        <div className="w-16 h-px bg-blue-300 dark:bg-blue-600 mb-2" />

                        <h4 className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.15em] mb-2">
                          Certificate of Completion
                        </h4>

                        <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5">Presented to</p>

                        {/* Display Name */}
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider leading-tight px-2 mb-0.5">
                          {profileData.displayName}
                        </p>
                        <p className="text-[8px] text-gray-400 dark:text-gray-500 mb-2">{profileData.email}</p>

                        <p className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">for successfully completing</p>

                        {/* Course Name */}
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300 px-3 leading-snug mb-3">
                          {c.title}
                        </p>

                        <div className="relative mt-auto flex flex-col items-center">
                          <p className="font-serif italic text-base text-blue-600 dark:text-blue-400 opacity-80 -rotate-2 select-none">
                            AlgoCore
                          </p>
                          <div className="w-16 h-px bg-blue-300 dark:bg-blue-600 mt-1" />
                          <p className="text-[8px] text-blue-500 dark:text-blue-400 mt-0.5 font-medium tracking-widest uppercase">AlgoCore Platform</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Overview Tab ─────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {resetSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl px-4 py-3">
                    <Ic.Check /> Progress for <strong>{resetSuccess}</strong> was reset successfully.
                  </div>
                )}

                <div className="bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏆 Achievements & Badges</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔥</div>
                      <p className="text-3xl font-bold text-orange-500 mb-1">{currentStreak}</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Day Streak</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">⭐</div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">First Problem</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚀</div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Speed Coder</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">💎</div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Problem Master</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Calendar</h3>
                  <ActivityCalendar submissions={allSubmissions} />
                </div>
              </div>
            )}

            {/* ── Submissions Tab ──────────────────────────────────────── */}
            {activeTab === "submissions" && (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Submissions ({filteredSubs.length})
                  </h3>
                  <div className="flex gap-2">
                    <select onChange={e => handleFilterSubs(e.target.value, undefined)}
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option>All Languages</option>
                      <option>cpp</option><option>python</option><option>java</option><option>javascript</option><option>sql</option>
                    </select>
                    <select onChange={e => handleFilterSubs(undefined, e.target.value)}
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option>All Status</option><option>Accepted</option><option>Wrong Answer</option>
                    </select>
                  </div>
                </div>

                {paged.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    No submissions yet.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {['Problem', 'Course', 'Language', 'Status', 'Date'].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                          {paged.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
                              <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100 max-w-[180px] truncate">{s.problem}</td>
                              <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{s.course} / {s.subcourse}</td>
                              <td className="px-5 py-3"><span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{s.language}</span></td>
                              <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(s.status)}`}>{s.status}</span></td>
                              <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{s.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-2">
                      <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                        className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        ← Previous
                      </button>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page {page + 1} of {Math.max(1, Math.ceil(filteredSubs.length / PAGE_SIZE))}
                      </span>
                      <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= filteredSubs.length}
                        className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        Next →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Social Tab ────────────────────────────────────────────── */}
            {activeTab === "social" && (
              <div className="space-y-6">
                {socialLoading ? (
                  <div className="text-center py-10 text-gray-400">Loading…</div>
                ) : (
                  <>
                    {/* Followers */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Followers ({followerCount})</h3>
                      {followerList.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No followers yet.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {followerList.map(u => (
                            <button key={u.username} onClick={() => router.push(`/u/${u.username}`)} className="flex items-center gap-3 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-blue-400 transition text-left">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                                {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : (u.displayName?.[0] || '?').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{u.displayName}</p>
                                <p className="text-xs text-gray-400 font-mono truncate">@{u.username}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Following */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Following ({followingCount})</h3>
                      {followingList.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500">Not following anyone yet.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {followingList.map(u => (
                            <button key={u.username} onClick={() => router.push(`/u/${u.username}`)} className="flex items-center gap-3 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:border-blue-400 transition text-left">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                                {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : (u.displayName?.[0] || '?').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{u.displayName}</p>
                                <p className="text-xs text-gray-400 font-mono truncate">@{u.username}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Settings Tab ─────────────────────────────────────────── */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚙️ Global Settings</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Enable AI Chatbot</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allow using the AI chatbot globally across all courses.</p>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('chatbotEnabled', globalChatbotEnabled)}
                        disabled={settingsSaving}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${globalChatbotEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} disabled:opacity-50`}
                      >
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalChatbotEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Enable AI Code Evaluation</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allow using the AI to evaluate code and suggest fixes.</p>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('codeEvaluateEnabled', globalCodeEvaluateEnabled)}
                        disabled={settingsSaving}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${globalCodeEvaluateEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} disabled:opacity-50`}
                      >
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalCodeEvaluateEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Enable Certificates Display</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Show earned certificates on your profile and course pages.</p>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('certificatesEnabled', certificatesEnabled)}
                        disabled={settingsSaving}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${certificatesEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'} disabled:opacity-50`}
                      >
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${certificatesEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Reset Progress Tab ───────────────────────────────────── */}
            {activeTab === "reset-progress" && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                  <span className="text-amber-500 mt-0.5"><Ic.Warning /></span>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Resetting a course's progress is <strong>permanent and irreversible</strong>. Your submission history will remain, but progress tracking for that course will be cleared.
                  </p>
                </div>

                {courses.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    No course progress found.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {courses.map(course => (
                      <div key={course} className="flex items-center justify-between bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 shadow-sm">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{course}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Course progress tracked</p>
                        </div>
                        <button
                          onClick={() => setResetModal({ course })}
                          className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-xl transition"
                        >
                          <Ic.Refresh /> Reset
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Sessions Tab ────────────────────────────────────────── */}
            {activeTab === "sessions" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage all your active devices and tabs.</p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={handleTerminateAllOtherSessions}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                    >
                      Terminate All Others
                    </button>
                  )}
                </div>

                {sessionsLoading ? (
                  <div className="text-center py-20 text-gray-400">Loading sessions…</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">No active sessions found.</div>
                ) : (
                  <div className="grid gap-3">
                    {sessions.map(s => {
                      const isMe = s.id === sessionId;
                      return (
                        <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isMe ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-900/40 border-gray-200 dark:border-gray-700'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isMe ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                              <Ic.Monitor />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                                  {s.platform || 'Unknown Device'}
                                </span>
                                {isMe && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">This Device</span>}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">{s.userAgent}</p>
                              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-mono">
                                Last seen: {s.lastActive ? new Date(s.lastActive).toLocaleString() : 'Just now'}
                              </p>
                            </div>
                          </div>
                          {!isMe && (
                            <button
                              onClick={() => handleTerminateSession(s.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Terminate Session"
                            >
                              <Ic.Trash />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Linked Accounts Tab ───────────────────────────────── */}
            {activeTab === "linked-accounts" && (
              <div className="space-y-6">

                {/* Connected providers status strip */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Connected Sign-in Methods</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { id: 'google.com', label: 'Google', icon: '🌐', color: 'from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200 dark:border-blue-800' },
                      { id: 'password', label: 'Email/Password', icon: '✉️', color: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200 dark:border-emerald-800' },
                    ].map(({ id, label, icon, color }) => {
                      const linked = linkedProviders.includes(id);
                      return (
                        <div key={id} className={`flex items-center justify-between bg-gradient-to-br ${color} border rounded-2xl px-4 py-3`}>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                              <p className={`text-xs font-medium ${linked ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                {linked ? '✓ Connected' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          {linked && linkedProviders.length > 1 && (
                            <button
                              onClick={() => handleUnlink(id)}
                              className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition font-semibold"
                              title={`Disconnect ${label}`}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-gray-700" />

                {/* Link Google */}
                {!linkedProviders.includes('google.com') && (
                  <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">🌐 Link Google Account</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sign in with Google in addition to your current method.</p>
                    <button
                      onClick={handleLinkGoogle}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                      Continue with Google
                    </button>
                  </div>
                )}

                {/* Link Email / Password — or Reset Password if already linked */}
                {!linkedProviders.includes('password') ? (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 space-y-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">✉️ Add Email / Password Sign-in</h4>
                    {emailLinkMsg && (
                      <div className={`text-xs font-semibold px-3 py-2 rounded-xl ${emailLinkMsg.type === 'success'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{emailLinkMsg.text}</div>
                    )}
                    <div className="space-y-2.5">
                      <input
                        type="email" placeholder="Email address"
                        value={emailLinkForm.email}
                        onChange={e => setEmailLinkForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <input
                        type="password" placeholder="New password (min 6 chars)"
                        value={emailLinkForm.password}
                        onChange={e => setEmailLinkForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <input
                        type="password" placeholder="Confirm password"
                        value={emailLinkForm.confirm}
                        onChange={e => setEmailLinkForm(f => ({ ...f, confirm: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleLinkEmail()}
                        className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <button
                        onClick={handleLinkEmail} disabled={emailLinking}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition shadow-sm"
                      >
                        {emailLinking ? 'Linking…' : 'Link Email / Password'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Email already linked — show Reset Password option */
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">✉️</span>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">Email / Password</h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Connected — {auth.currentUser?.email}</p>
                      </div>
                    </div>
                    {emailLinkMsg && (
                      <div className={`text-xs font-semibold px-3 py-2 rounded-xl ${emailLinkMsg.type === 'success'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{emailLinkMsg.text}</div>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleResetPassword}
                        disabled={resetPwSent}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        {resetPwSent ? 'Email sent!' : 'Reset Password'}
                      </button>
                      <p className="text-xs text-gray-400 dark:text-gray-500">We'll send a reset link to your email address.</p>
                    </div>
                  </div>
                )}

                {/* All linked — celebrate */}
                {linkedProviders.includes('google.com') && linkedProviders.includes('password') && (
                  <div className="text-center py-6 space-y-1">
                    <div className="text-4xl">🎉</div>
                    <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Both sign-in methods are linked!</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-2">
                  You can sign in with any linked method. You must keep at least one method linked at all times.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      <Footer />

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
        .animate-fadeIn { animation: fadeIn .2s ease; }
      `}</style>
    </div>
  );
}

export default ProfilePage;
