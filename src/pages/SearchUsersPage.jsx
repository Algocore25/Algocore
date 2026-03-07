import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, set, remove } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { sendEmailService } from "../utils/emailService";
import AnimatedBackground from "../components/AnimatedBackground";

const GRADIENTS = [
    'from-violet-500 to-indigo-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-fuchsia-500 to-purple-600',
];
const avatarGradient = (name = '') => GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];

const GitHubIcon = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
);

export default function SearchUsersPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [allUsers, setAllUsers] = useState([]);   // [{ uid, username, displayName, photoURL, githubLink, followers }]
    const [followingSet, setFollowingSet] = useState(new Set()); // uids the viewer already follows
    const [loadingFollow, setLoadingFollow] = useState(new Set()); // uids with in-flight toggle
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [usersSnap, followSnap] = await Promise.all([
                    get(ref(database, "users")),
                    get(ref(database, "follows")),
                ]);
                const followData = followSnap.exists() ? followSnap.val() : {};

                // Build users list
                const list = [];
                if (usersSnap.exists()) {
                    usersSnap.forEach(s => {
                        const p = s.child("profile").val();
                        if (!p || p.isPublic === false || !p.username) return;
                        const followers = followData[s.key]?.followers
                            ? Object.keys(followData[s.key].followers).length
                            : 0;
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
                setAllUsers(list);

                // Build which users the current viewer follows
                if (user) {
                    const myFollowing = followData[user.uid]?.following
                        ? new Set(Object.keys(followData[user.uid].following))
                        : new Set();
                    setFollowingSet(myFollowing);
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        load();
    }, [user]);

    const handleFollowToggle = useCallback(async (e, targetUid) => {
        e.stopPropagation(); // don't navigate on click
        if (!user) { navigate('/login'); return; }
        if (targetUid === user.uid) return;

        setLoadingFollow(prev => new Set(prev).add(targetUid));

        const curFollowing = followingSet.has(targetUid);
        try {
            if (curFollowing) {
                await Promise.all([
                    remove(ref(database, `follows/${user.uid}/following/${targetUid}`)),
                    remove(ref(database, `follows/${targetUid}/followers/${user.uid}`)),
                ]);
                setFollowingSet(prev => { const n = new Set(prev); n.delete(targetUid); return n; });
                setAllUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, followers: Math.max(0, u.followers - 1) } : u));
            } else {
                await Promise.all([
                    set(ref(database, `follows/${user.uid}/following/${targetUid}`), true),
                    set(ref(database, `follows/${targetUid}/followers/${user.uid}`), true),
                ]);

                // Send email notification to user being followed
                try {
                    const targetEmailSnap = await get(ref(database, `users/${targetUid}/email`));
                    if (targetEmailSnap.exists()) {
                        const targetEmail = targetEmailSnap.val();
                        const followerName = user.displayName || user.email?.split('@')[0] || "Someone";
                        await sendEmailService({
                            to: targetEmail,
                            subject: "New Follower on AlgoCore! 🎉",
                            text: `Hi! ${followerName} just started following you on AlgoCore.`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
                                    <h2 style="color: #1a56db;">You have a new follower! 🎉</h2>
                                    <p style="font-size: 16px; color: #4b5563;">
                                        <strong>${followerName}</strong> just started following you on AlgoCore.
                                    </p>
                                    <br />
                                </div>
                            `
                        });
                    }
                } catch (emailErr) {
                    console.error("Failed to send follow email", emailErr);
                }

                setFollowingSet(prev => new Set(prev).add(targetUid));
                setAllUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, followers: u.followers + 1 } : u));
            }
        } catch (e) { console.error(e); }

        setLoadingFollow(prev => { const n = new Set(prev); n.delete(targetUid); return n; });
    }, [user, followingSet, navigate]);

    const q = query.trim().toLowerCase();
    const filtered = q
        ? allUsers.filter(u =>
            u.username.toLowerCase().includes(q) ||
            u.displayName.toLowerCase().includes(q)
        )
        : allUsers;

    return (
        <div className="min-h-screen relative text-gray-900 dark:text-gray-100 w-full flex flex-col">
            <AnimatedBackground />
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Discover Coders</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Search and follow public AlgoCore profiles</p>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        autoFocus
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search by username or name…"
                        className="w-full pl-11 pr-10 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                {/* Results count */}
                {!loading && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {filtered.length} {filtered.length === 1 ? 'user' : 'users'} found
                        {q && <span> for <span className="font-semibold text-gray-600 dark:text-gray-300">"{query}"</span></span>}
                    </p>
                )}

                {/* Content */}
                {loading ? (
                    <div className="py-16 text-center text-gray-400">Loading users…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {filtered.map(u => {
                            const grad = avatarGradient(u.displayName);
                            const initials = u.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                            const isOwn = user && user.uid === u.uid;
                            const following = followingSet.has(u.uid);
                            const busy = loadingFollow.has(u.uid);

                            return (
                                <div
                                    key={u.uid}
                                    onClick={() => navigate(`/u/${u.username}`)}
                                    className="flex items-center gap-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl px-5 py-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    {/* Avatar */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-base font-bold shrink-0 overflow-hidden shadow-sm`}>
                                        {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : initials}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{u.displayName}</p>
                                        <p className="text-xs text-gray-400 font-mono truncate">@{u.username}</p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                👥 {u.followers} follower{u.followers !== 1 ? 's' : ''}
                                            </span>
                                            {u.githubLink && (
                                                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                                    <GitHubIcon />
                                                    {u.githubLink.replace('https://github.com/', '')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Follow button */}
                                    {!isOwn && (
                                        <button
                                            onClick={(e) => handleFollowToggle(e, u.uid)}
                                            disabled={busy}
                                            className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border transition disabled:opacity-50 ${following
                                                ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400'
                                                : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                        >
                                            {busy ? '…' : following ? 'Unfollow' : '+ Follow'}
                                        </button>
                                    )}

                                    {/* Arrow */}
                                    {isOwn && (
                                        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
