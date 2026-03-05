import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get, set, remove } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ActivityCalendar from "./ActivityCalendar";
import LoadingPage from "./LoadingPage";
import AnimatedBackground from "../components/AnimatedBackground";
import GoogleAd from "../components/GoogleAd";
import Footer from "../components/Footer";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseTs = (key) => {
    if (!key) return new Date(NaN);
    const fixed = key.replace(/T(\d{2})_(\d{2})_(\d{2})_(\d{3})Z/, 'T$1:$2:$3.$4Z');
    const d = new Date(fixed);
    return isNaN(d.getTime()) ? new Date(NaN) : d;
};
const fmtTs = (key) => {
    const d = parseTs(key);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const fmtJoin = (ts) => !ts ? "Unknown" : new Date(ts).toLocaleDateString("en-US", { month: "long", year: "numeric" });

const LANG_COLOR = {
    cpp: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    python: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    java: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    javascript: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    sql: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
const langStyle = (l) => LANG_COLOR[l?.toLowerCase()] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
const statusStyle = (s) =>
    s === "Accepted"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";

// Avatar gradient based on username char
const GRADIENTS = [
    'from-violet-500 to-indigo-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-fuchsia-500 to-purple-600',
];
const avatarGradient = (name = '') => GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];

// GitHub icon
const GitHubIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
);

// ─── Error screen ──────────────────────────────────────────────────────────
function ErrorScreen({ emoji, title, desc, username, onHome }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 gap-3">
            <div className="text-5xl">{emoji}</div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {desc} <code className="font-mono text-indigo-500">@{username}</code>
            </p>
            <button
                onClick={onHome}
                className="mt-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
            >
                ← Back to home
            </button>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [state, setState] = useState("loading");
    const [profile, setProfile] = useState(null);
    const [profileUid, setProfileUid] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [activeTab, setActiveTab] = useState("activity");
    const [page, setPage] = useState(0);
    const [copiedLink, setCopiedLink] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const PAGE_SIZE = 10;

    const calculateCourseProgress = (lessons, userProgress) => {
        if (!lessons || typeof lessons !== 'object') return 0;
        let total = 0;
        let completed = 0;
        Object.keys(lessons).forEach(topicKey => {
            const topic = lessons[topicKey];
            if (typeof topic !== 'object' || !topic.description) return;
            const questions = Array.isArray(topic.questions)
                ? topic.questions
                : (typeof topic.questions === 'object' ? Object.keys(topic.questions) : []);
            total += questions.length;
            const tProg = (userProgress && userProgress[topicKey]) || {};
            questions.forEach(q => {
                if (tProg && tProg[q] === true) completed += 1;
            });
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    useEffect(() => {
        if (!username) { setState("notfound"); return; }

        const load = async () => {
            try {
                const allUsersSnap = await get(ref(database, "users"));
                if (!allUsersSnap.exists()) { setState("notfound"); return; }

                let foundUid = null, foundProfile = null;
                allUsersSnap.forEach(s => {
                    const p = s.child("profile").val();
                    if (p?.username === username) { foundUid = s.key; foundProfile = p; }
                });

                if (!foundUid) { setState("notfound"); return; }
                if (foundProfile.isPublic === false) { setState("private"); return; }

                setProfileUid(foundUid);

                // Submissions (count both total and accepted from the same source)
                const subSnap = await get(ref(database, `Submissions/${foundUid}`));
                let total = 0;
                let accepted = 0;
                const subList = [];
                if (subSnap.exists()) {
                    const sd = subSnap.val();
                    for (const ck in sd) for (const sk in sd[ck]) for (const qId in sd[ck][sk])
                        for (const ts in sd[ck][sk][qId]) {
                            const s = sd[ck][sk][qId][ts];
                            total++;
                            // Count accepted submissions from actual submission status
                            if (s.status === "correct") {
                                accepted++;
                            }
                            subList.push({
                                problem: qId, course: ck, subcourse: sk,
                                language: s.language || "N/A",
                                status: s.status === "correct" ? "Accepted" : "Wrong Answer",
                                date: fmtTs(ts), timestamp: parseTs(ts).getTime(),
                            });
                        }
                }
                subList.sort((a, b) => b.timestamp - a.timestamp);

                // Fetch courses with progress
                const coursesSnap = await get(ref(database, 'Courses'));
                let coursesList = [];
                if (coursesSnap.exists()) {
                    const coursesData = coursesSnap.val();
                    const coursesArr = Array.isArray(coursesData) ? coursesData : Object.values(coursesData);

                    coursesList = await Promise.all(
                        coursesArr.filter(Boolean).map(async (course) => {
                            try {
                                const [lessonsSnap, progressSnap] = await Promise.all([
                                    get(ref(database, `AlgoCore/${course.id}/lessons`)),
                                    get(ref(database, `userprogress/${foundUid}/${course.id}`))
                                ]);
                                const lessons = lessonsSnap.exists() ? lessonsSnap.val() : {};
                                const userProg = progressSnap.exists() ? progressSnap.val() : {};
                                const progress = calculateCourseProgress(lessons, userProg);
                                return { ...course, progress };
                            } catch (e) {
                                console.error('Error fetching course progress:', e);
                                return { ...course, progress: 0 };
                            }
                        })
                    );
                    // Filter courses with progress > 0
                    coursesList = coursesList.filter(c => c.progress > 0);
                }
                setCourses(coursesList);

                // Follow counts
                const [followersSnap, followingSnap] = await Promise.all([
                    get(ref(database, `follows/${foundUid}/followers`)),
                    get(ref(database, `follows/${foundUid}/following`)),
                ]);
                const fCount = followersSnap.exists() ? Object.keys(followersSnap.val()).length : 0;
                const fgCount = followingSnap.exists() ? Object.keys(followingSnap.val()).length : 0;
                setFollowerCount(fCount);
                setFollowingCount(fgCount);

                const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
                const displayName = foundProfile.displayName || username;
                const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

                setProfile({
                    username, displayName, photoURL: foundProfile.photoURL || null,
                    joinDate: fmtJoin(foundProfile.joinedAt || null),
                    githubLink: foundProfile.githubLink || '',
                    totalSubmissions: total, acceptedSubmissions: accepted, acceptRate, initials
                });
                setSubmissions(subList);

                // Check if current viewer is following this profile
                if (user && user.uid !== foundUid) {
                    const followSnap = await get(ref(database, `follows/${user.uid}/following/${foundUid}`));
                    setIsFollowing(followSnap.exists());
                }

                setState("found");
            } catch (e) {
                console.error(e);
                setState("notfound");
            }
        };
        load();
    }, [username, user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleFollowToggle = async () => {
        if (!user || !profileUid) return;
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await Promise.all([
                    remove(ref(database, `follows/${user.uid}/following/${profileUid}`)),
                    remove(ref(database, `follows/${profileUid}/followers/${user.uid}`)),
                ]);
                setIsFollowing(false);
                setFollowerCount(c => Math.max(0, c - 1));
            } else {
                await Promise.all([
                    set(ref(database, `follows/${user.uid}/following/${profileUid}`), true),
                    set(ref(database, `follows/${profileUid}/followers/${user.uid}`), true),
                ]);
                setIsFollowing(true);
                setFollowerCount(c => c + 1);
            }
        } catch (e) { console.error(e); }
        setFollowLoading(false);
    };

    if (state === "loading") return <LoadingPage />;
    if (state === "notfound") return <ErrorScreen emoji="🔍" title="User not found" desc="No profile exists for" username={username} onHome={() => navigate("/")} />;
    if (state === "private") return <ErrorScreen emoji="🔒" title="Private Profile" desc="This profile is private." username={username} onHome={() => navigate("/")} />;

    const paged = submissions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const grad = avatarGradient(profile.displayName);
    const isOwn = user && user.uid === profileUid;

    return (
        <div className="min-h-screen relative text-gray-900 dark:text-gray-100 w-full flex flex-col">
            <AnimatedBackground />
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

                {/* ── Profile Card ── */}
                <div className="bg-white/50 dark:bg-dark-tertiary/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/50 dark:border-dark-tertiary/50 overflow-hidden w-full">
                    <div className="px-6 py-5">

                        {/* Avatar row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                            {/* Avatar */}
                            <div className={`w-16 h-16 rounded-xl shadow-sm bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden`}>
                                {profile.photoURL
                                    ? <img src={profile.photoURL} alt="avatar" className="w-full h-full object-cover" />
                                    : profile.initials}
                            </div>

                            {/* Actions */}
                            <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
                                {/* Follow / Unfollow button — only if logged in and not own profile */}
                                {user && !isOwn && (
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-lg border transition disabled:opacity-50 ${isFollowing
                                            ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 hover:text-red-600'
                                            : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {followLoading ? '…' : isFollowing ? 'Unfollow' : '+ Follow'}
                                    </button>
                                )}
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    {copiedLink ? 'Copied!' : 'Share'}
                                </button>
                                <button
                                    onClick={() => navigate("/")}
                                    className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                >
                                    ← Back
                                </button>
                            </div>
                        </div>

                        {/* Name + username */}
                        <div className="mb-4 space-y-0.5">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profile.displayName}</h1>
                            <p className="text-sm font-mono text-gray-500 dark:text-gray-400">@{profile.username}</p>
                            <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400 dark:text-gray-500 pt-1">
                                {profile.joinDate !== "Unknown" && (
                                    <span>Joined {profile.joinDate}</span>
                                )}
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Public
                                </span>
                                {/* GitHub link */}
                                {profile.githubLink && (
                                    <a
                                        href={profile.githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition"
                                    >
                                        <GitHubIcon />
                                        {profile.githubLink.replace('https://github.com/', '')}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Stats strip */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {[
                                { label: 'Submissions', value: profile.totalSubmissions },
                                { label: 'Accepted', value: profile.acceptedSubmissions },
                                { label: 'Acceptance %', value: `${profile.acceptRate}%` },
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

                {/* ── Tab Card ── */}
                <div className="bg-white/50 dark:bg-dark-tertiary/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/50 dark:border-dark-tertiary/50 overflow-hidden w-full">
                    {/* Tab strip */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 px-2 overflow-x-auto">
                        {[
                            { key: "activity", label: "Activity" },
                            { key: "courses", label: `Courses (${courses.length})` },
                            { key: "submissions", label: `Submissions (${submissions.length})` },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-5 py-4 text-sm font-medium transition-all duration-150 whitespace-nowrap ${activeTab === key
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Activity Tab */}
                        {activeTab === "activity" && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Coding Activity — Last 6 Months</h3>
                                <ActivityCalendar submissions={submissions} />
                            </div>
                        )}

                        {/* Courses Tab */}
                        {activeTab === "courses" && (
                            <div className="space-y-4">
                                {courses.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400 dark:text-gray-500">No courses with progress yet.</div>
                                ) : (
                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                        {courses.map((course, idx) => (
                                            <div key={idx} className="bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{course.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">{course.description}</p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-600 dark:text-gray-300">Progress</span>
                                                        <span className="font-semibold text-blue-600 dark:text-blue-400">{Math.round(course.progress)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${Math.round(course.progress)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submissions Tab */}
                        {activeTab === "submissions" && (
                            <div className="space-y-4">
                                {submissions.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400 dark:text-gray-500">No submissions yet.</div>
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
                                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{s.course}</td>
                                                            <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${langStyle(s.language)}`}>{s.language}</span></td>
                                                            <td className="px-5 py-3"><span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle(s.status)}`}>{s.status}</span></td>
                                                            <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{s.date}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="flex items-center justify-between pt-1">
                                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                                className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                                ← Previous
                                            </button>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                Page {page + 1} of {Math.max(1, Math.ceil(submissions.length / PAGE_SIZE))}
                                            </span>
                                            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= submissions.length}
                                                className="px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                                Next →
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <GoogleAd className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800" />
            </div>
            <Footer />
        </div>
    );
}
