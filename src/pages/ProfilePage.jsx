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
import { useNavigate } from "react-router-dom";
import SignInRequiredPage from "./SignInRequiredPage";
import LoadingPage from "./LoadingPage";
import useUserActivityTime from '../hooks/useUserActivityTime';
import ActivityCalendar from './ActivityCalendar';
import AnimatedBackground from '../components/AnimatedBackground';
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
  const { user, loading } = useAuth();
  const { totalTime, formatTime } = useUserActivityTime();
  const navigate = useNavigate();

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

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

  // Reset progress
  const [courses, setCourses] = useState([]);
  const [resetModal, setResetModal] = useState(null); // { course }
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);
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

      // Read public flag
      const publicSnap = await get(child(dbRef, `users/${user.uid}/profile/isPublic`));
      const pub = publicSnap.exists() ? publicSnap.val() : false;
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

      // 2. Load progress → list of courses + accepted count
      const progressSnap = await get(child(dbRef, `userprogress/${user.uid}`));
      let accepted = 0;
      const courseSet = new Set();
      if (progressSnap.exists()) {
        const pd = progressSnap.val();
        for (const courseKey in pd) {
          courseSet.add(courseKey);
          for (const subKey in pd[courseKey]) {
            for (const qId in pd[courseKey][subKey]) {
              if (pd[courseKey][subKey][qId] === true) accepted++;
            }
          }
        }
      }
      setCourses([...courseSet]);

      // 3. Load submissions
      const subSnap = await get(child(dbRef, `Submissions/${user.uid}`));
      let total = 0;
      const subList = [];
      if (subSnap.exists()) {
        const subData = subSnap.val();
        for (const courseKey in subData) {
          for (const subKey in subData[courseKey]) {
            for (const qId in subData[courseKey][subKey]) {
              for (const ts in subData[courseKey][subKey][qId]) {
                const s = subData[courseKey][subKey][qId][ts];
                total++;
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
              {/* Avatar */}
              <div className="w-16 h-16 rounded-xl shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
                {profileData.photoURL ? (
                  <img src={profileData.photoURL} alt="avatar" className="w-full h-full object-cover" />
                ) : initials}
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
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.displayName}</h1>
                    <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-blue-500 transition" title="Edit display name">
                      <Ic.Edit />
                    </button>
                  </>
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
                      onClick={() => navigate(`/u/${profileData.username}`)}
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
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <span className="flex items-center gap-1.5"><Ic.Mail />{profileData.email}</span>
              <span className="flex items-center gap-1.5"><Ic.Calendar />Joined {profileData.joinDate}</span>
              {isPublic && <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400"><Ic.Globe />Public</span>}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Submissions', value: profileData.totalSubmissions },
                { label: 'Accepted', value: profileData.acceptedSubmissions },
                { label: 'Acceptance Rate', value: `${acceptanceRate}%` },
                { label: 'Time Spent', value: formatTime(totalTime) },
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
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-2">
            {["overview", "submissions", "linked-accounts", "reset-progress"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-4 text-sm font-medium capitalize transition-all duration-150 whitespace-nowrap ${activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
                  }`}
              >
                {tab === 'reset-progress' ? '⚠️ Reset Progress'
                  : tab === 'linked-accounts' ? '🔗 Linked Accounts'
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">

            {/* ── Overview Tab ─────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {resetSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl px-4 py-3">
                    <Ic.Check /> Progress for <strong>{resetSuccess}</strong> was reset successfully.
                  </div>
                )}
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

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
        .animate-fadeIn { animation: fadeIn .2s ease; }
      `}</style>
    </div>
  );
}

export default ProfilePage;