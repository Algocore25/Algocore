import React, { useState, useEffect, useRef } from 'react';
import { sendEmailService } from '../../utils/emailService';
import { ref, get, set as fbSet } from 'firebase/database';
import { database } from '../../firebase';
import toast from 'react-hot-toast';
import {
    FiMail, FiSend, FiUsers, FiX, FiChevronDown, FiCheck,
    FiAlertCircle, FiSettings, FiEye, FiEdit3, FiSearch
} from 'react-icons/fi';

// ─── EmailJS Config — DEPRECATED (Using Netlify Functions now) ──────────────────
// No longer needs public/private keys in frontend.

/**
 * Helper to wrap plain text body into a premium responsive HTML email.
 */
const wrapInHtmlTemplate = (title, body, name) => {
    const formattedBody = body.replace(/\{\{to_name\}\}/g, name).replace(/\n/g, '<br/>');
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${title}</h1>
      </div>
      <div style="padding: 32px 24px;">
        <div style="color: #334155; font-size: 16px; line-height: 1.6;">
          ${formattedBody}
        </div>
        <div style="margin-top: 32px; padding-top: 24px; border-t: 1px solid #f1f5f9;">
          <a href="https://algocore.in" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Visit AlgoCore</a>
        </div>
      </div>
      <div style="padding: 24px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; 2026 AlgoCore — Advanced Learning Platform</p>
      </div>
    </div>
  `;
};

// ─── Pre-built templates ───────────────────────────────────────────────────────
const PRESET_TEMPLATES = [
    {
        id: 'exam_reminder',
        label: '📅 Exam Reminder',
        subject: 'Upcoming Exam Reminder – AlgoCore',
        body: `Dear {{to_name}},

This is a reminder that you have an upcoming exam scheduled on AlgoCore. Please make sure you:
  • Have a stable internet connection
  • Are in a quiet environment
  • Log in at least 5 minutes before the scheduled start time

If you have any questions, feel free to reach out to us.

Good luck!
AlgoCore Team`,
    },
    {
        id: 'result_published',
        label: '🏆 Results Published',
        subject: 'Your Exam Results Are Ready – AlgoCore',
        body: `Dear {{to_name}},

We are pleased to inform you that your exam results have been published on AlgoCore.

You can log in to your account and view your detailed results, scores, and feedback.

Thank you for participating!
AlgoCore Team`,
    },
    {
        id: 'welcome',
        label: '👋 Welcome Email',
        subject: 'Welcome to AlgoCore!',
        body: `Dear {{to_name}},

Welcome to AlgoCore! We're excited to have you on board.

You now have access to:
  • Coding practice problems
  • Online exams and assessments
  • Detailed performance tracking

Get started by visiting your profile and exploring the available courses.

Warm regards,
AlgoCore Team`,
    },
    {
        id: 'custom',
        label: '✏️ Custom Template',
        subject: '',
        body: '',
    },
];

// ─── RecipientPicker ───────────────────────────────────────────────────────────
const RecipientPicker = ({ allStudents, selected, setSelected }) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const dropRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = allStudents.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase())
    );

    const toggleAll = () => {
        if (selected.size === allStudents.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(allStudents.map((s) => s.email)));
        }
    };

    const toggle = (email) => {
        const next = new Set(selected);
        next.has(email) ? next.delete(email) : next.add(email);
        setSelected(next);
    };

    return (
        <div className="relative" ref={dropRef}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
                <span className="flex items-center gap-2 text-sm">
                    <FiUsers className="text-blue-500" />
                    {selected.size === 0
                        ? 'Select recipients…'
                        : `${selected.size} recipient${selected.size > 1 ? 's' : ''} selected`}
                </span>
                <FiChevronDown
                    className={`transition-transform ${open ? 'rotate-180' : ''} text-gray-400`}
                />
            </button>

            {/* Selected tags */}
            {selected.size > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {[...selected].map((email) => {
                        const s = allStudents.find((x) => x.email === email);
                        return (
                            <span
                                key={email}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                            >
                                {s?.name || email}
                                <button
                                    type="button"
                                    onClick={() => toggle(email)}
                                    className="hover:text-red-500 transition-colors"
                                >
                                    <FiX size={11} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search students…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </div>

                    {/* Select All */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            type="button"
                            onClick={toggleAll}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            {selected.size === allStudents.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    {/* List */}
                    <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                        {filtered.length === 0 ? (
                            <li className="p-4 text-center text-sm text-gray-400">No students found</li>
                        ) : (
                            filtered.map((s) => (
                                <li key={s.email}>
                                    <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(s.email)}
                                            onChange={() => toggle(s.email)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.email}</p>
                                        </div>
                                        {selected.has(s.email) && <FiCheck className="text-blue-500 flex-shrink-0" size={14} />}
                                    </label>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

// ─── Main EmailPage ────────────────────────────────────────────────────────────
const EmailPage = () => {
    // Config panel
    const [showConfig, setShowConfig] = useState(false);
    const [serviceId, setServiceId] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(true);

    // Students
    const [allStudents, setAllStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Recipients
    const [selected, setSelected] = useState(new Set());

    // Template
    const [templateIdx, setTemplateIdx] = useState(0);
    const [subject, setSubject] = useState(PRESET_TEMPLATES[0].subject);
    const [body, setBody] = useState(PRESET_TEMPLATES[0].body);
    const [preview, setPreview] = useState(false);

    // Sending state
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(null); // { sent, total, failed }
    const [delay, setDelay] = useState(1); // Delay in seconds between emails

    // ── Fetch EmailJS config from Firebase ──────────────────────────────────
    useEffect(() => {
        const loadConfig = async () => {
            setLoadingConfig(true);
            try {
                const snap = await get(ref(database, 'adminConfig/emailjs'));
                if (snap.exists()) {
                    const cfg = snap.val();
                    setServiceId(cfg.serviceId || '');
                    setTemplateId(cfg.templateId || '');
                    setPublicKey(cfg.publicKey || '');
                }
            } catch (err) {
                console.error('Failed to load EmailJS config:', err);
            } finally {
                setLoadingConfig(false);
            }
        };
        loadConfig();
    }, []);

    // ── Fetch all users directly from the 'users' collection ─────────────────
    useEffect(() => {
        const load = async () => {
            setLoadingStudents(true);
            try {
                const usersSnap = await get(ref(database, 'users'));
                if (!usersSnap.exists()) { setAllStudents([]); return; }

                const usersData = usersSnap.val(); // { uid: { name, email, ... } }

                const list = Object.entries(usersData)
                    .filter(([, u]) => u && u.email)           // skip entries without email
                    .map(([uid, u]) => ({
                        uid,
                        email: u.email,
                        name: u.name || u.displayName || u.email,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name)); // A-Z by name

                setAllStudents(list);
            } catch (err) {
                console.error('Failed to load users:', err);
                toast.error('Failed to load users from database');
            } finally {
                setLoadingStudents(false);
            }
        };
        load();
    }, []);

    // ── Template change ───────────────────────────────────────────────────────
    const handleTemplateChange = (idx) => {
        setTemplateIdx(idx);
        setSubject(PRESET_TEMPLATES[idx].subject);
        setBody(PRESET_TEMPLATES[idx].body);
        setPreview(false);
    };

    // Config functions removed as EmailJS is no longer used
    const saveConfig = () => { };

    // ── Send emails ───────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (selected.size === 0) { toast.error('Please select at least one recipient.'); return; }
        if (!subject.trim()) { toast.error('Subject cannot be empty.'); return; }
        if (!body.trim()) { toast.error('Email body cannot be empty.'); return; }

        // Keys are loaded from Firebase into state on mount
        if (!serviceId.trim() || !templateId.trim() || !publicKey.trim()) {
            toast.error('Please configure your EmailJS credentials first (⚙ button).');
            setShowConfig(true);
            return;
        }

        const recipients = allStudents.filter((s) => selected.has(s.email));
        setSending(true);
        setProgress({ sent: 0, total: recipients.length, failed: 0 });

        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        let sent = 0, failed = 0;
        for (let i = 0; i < recipients.length; i++) {
            const student = recipients[i];

            // Apply delay between emails (except for the first one)
            if (i > 0 && delay > 0) {
                await wait(delay * 1000);
            }

            try {
                const result = await sendEmailService({
                    to: student.email,
                    subject,
                    text: body.replace(/\{\{to_name\}\}/g, student.name),
                    html: wrapInHtmlTemplate(subject, body, student.name)
                });
                if (result.success) {
                    sent++;
                } else {
                    console.error(`Status failed for ${student.email}:`, result.error);
                    failed++;
                }
            } catch (err) {
                console.error(`Failed to send to ${student.email}:`, err);
                failed++;
            }
            setProgress({ sent, total: recipients.length, failed });
        }

        setSending(false);

        if (failed === 0) {
            toast.success(`✅ All ${sent} email${sent > 1 ? 's' : ''} sent successfully!`);
        } else {
            toast.error(`⚠ Sent ${sent}, failed ${failed}`);
        }

        setTimeout(() => setProgress(null), 3000);
    };

    const progressPct = progress
        ? Math.round(((progress.sent + progress.failed) / progress.total) * 100)
        : 0;

    return (
        <div className="min-h-full bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-blue-500 text-white shadow-lg">
                            <FiMail size={22} />
                        </span>
                        Email Center
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Compose and send emails to students via EmailJS
                    </p>
                </div>

                {/* Config button hidden as it's no longer needed */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT: Recipients + Template selector ──────────────────────── */}
                <div className="lg:col-span-1 space-y-5">
                    {/* Recipients card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            <FiUsers className="text-blue-500" /> Recipients
                        </h2>
                        {loadingStudents ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                                Loading users…
                            </div>
                        ) : (
                            <RecipientPicker
                                allStudents={allStudents}
                                selected={selected}
                                setSelected={setSelected}
                            />
                        )}
                        {allStudents.length > 0 && (
                            <p className="mt-2 text-xs text-gray-400">
                                {allStudents.length} user{allStudents.length !== 1 ? 's' : ''} in database
                            </p>
                        )}
                    </div>

                    {/* Template selector card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            <FiEdit3 className="text-purple-500" /> Template
                        </h2>
                        <div className="space-y-2">
                            {PRESET_TEMPLATES.map((t, idx) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleTemplateChange(idx)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${templateIdx === idx
                                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tip card */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                        <div className="flex gap-2">
                            <FiAlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                Use <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">{'{{to_name}}'}</code> in your template body — it will be replaced with each recipient's name automatically.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Compose ───────────────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Compose Email</span>
                            <button
                                type="button"
                                onClick={() => setPreview((p) => !p)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${preview
                                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {preview ? <FiEdit3 size={13} /> : <FiEye size={13} />}
                                {preview ? 'Edit' : 'Preview'}
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* To field (display only) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">To</label>
                                <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 min-h-[2.5rem]">
                                    {selected.size === 0
                                        ? <span className="text-gray-400">No recipients selected</span>
                                        : [...selected].join(', ')}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Subject</label>
                                {preview ? (
                                    <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-white">
                                        {subject || <span className="text-gray-400 italic">Empty subject</span>}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Enter email subject…"
                                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                                    />
                                )}
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Message</label>
                                {preview ? (
                                    <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-white whitespace-pre-wrap min-h-[280px] leading-relaxed font-mono">
                                        {body || <span className="text-gray-400 italic">Empty message</span>}
                                    </div>
                                ) : (
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder={`Dear {{to_name}},\n\nWrite your email message here…`}
                                        rows={12}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm font-mono focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors resize-y"
                                    />
                                )}
                            </div>

                            {/* Delay Setting */}
                            <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Sending Interval</h4>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">Time delay between consecutive emails to prevent rate limiting.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={delay}
                                        onChange={(e) => setDelay(Number(e.target.value))}
                                        className="w-20 px-3 py-1.5 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all text-center"
                                    />
                                    <span className="text-xs font-medium text-blue-500 uppercase">sec</span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            {progress && (
                                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                                    <div className="flex justify-between text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                                        <span>Sending… {progress.sent + progress.failed}/{progress.total}</span>
                                        <span>{progressPct}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-blue-200 dark:bg-blue-800 overflow-hidden">
                                        <div
                                            className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    {progress.failed > 0 && (
                                        <p className="mt-1 text-xs text-red-500">{progress.failed} failed</p>
                                    )}
                                </div>
                            )}

                            {/* Send button */}
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-gray-400">
                                    {selected.size > 0
                                        ? `Ready to send to ${selected.size} recipient${selected.size > 1 ? 's' : ''}`
                                        : 'Select recipients to send'}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={sending || selected.size === 0}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {sending ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                            Sending…
                                        </>
                                    ) : (
                                        <>
                                            <FiSend size={15} />
                                            Send Email{selected.size > 1 ? 's' : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuration modal removed as service is now centralized */}
        </div>
    );
};

export default EmailPage;
