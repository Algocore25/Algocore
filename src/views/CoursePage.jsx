import React, { useState, useEffect, useCallback } from 'react';
import algocoreLogo from '../assets/LOGO-1.png';
import { FaChevronDown, FaCheck, FaBook, FaDownload, FaEnvelope, FaCertificate } from 'react-icons/fa';
import { ref, get, child } from 'firebase/database';
import { database } from '../firebase';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronRight, Lock, PlayCircle, StopCircle, RefreshCw, XCircle, Code, Database, CheckCircle, FileText } from 'lucide-react';
import LoadingPage from './LoadingPage';
import { encodeShort, decodeShort } from '../utils/urlEncoder';
import FloatingChatbot from '../components/FloatingChatbot';
import { jsPDF } from 'jspdf';
import { sendEmailService, getUserEmail } from '../utils/emailService';
import toast from 'react-hot-toast';

// ─── Difficulty badge colour ───────────────────────────────────────────────────
const diffColor = (d = '') => {
  const l = d.toLowerCase();
  if (l === 'easy') return 'text-emerald-600 dark:text-emerald-400';
  if (l === 'medium') return 'text-amber-500 dark:text-amber-400';
  if (l === 'hard') return 'text-red-500 dark:text-red-400';
  return 'text-gray-500 dark:text-gray-400';
};

// Get type icon
const getTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'programming': return <Code size={16} />;
    case 'sql': return <Database size={16} />;
    case 'mcq': return <CheckCircle size={16} />;
    case 'msq': return <CheckCircle size={16} />;
    case 'numeric': return <FileText size={16} />;
    default: return <FileText size={16} />;
  }
};

// ─── Skeleton loader for topics ───────────────────────────────────────────────
const TopicSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white dark:bg-dark-tertiary rounded-lg shadow-sm border border-gray-200 dark:border-dark-tertiary p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
          </div>
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full hidden sm:block" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Helper: topic progress ────────────────────────────────────────────────────
const calcTopicProgress = (topic) => {
  const total = topic?.problems?.length || 0;
  const completed = (topic?.problems || []).filter(p => p.status === 'Completed').length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
};

// ─── Component ─────────────────────────────────────────────────────────────────
const CoursePage = () => {
  const { course: encodedCourse } = useParams();
  const course = decodeShort(encodedCourse);
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  // Phase 1 — schema
  const [courseData, setCourseData] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState(null);

  // Phase 2 — topics + progress
  const [practiceTopics, setPracticeTopics] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [topicsLoading, setTopicsLoading] = useState(true);

  // UI state
  const [openTopic, setOpenTopic] = useState(null);
  const [emailing, setEmailing] = useState(false);
  const [certificatesEnabled, setCertificatesEnabled] = useState(false);

  // localStorage keys
  const openTopicKey = `coursePageOpenTopic:${course}`;
  const scrollKey = `coursePageScroll:${course}`;

  // ── Restore open topic ──────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(openTopicKey);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!Number.isNaN(idx)) setOpenTopic(idx);
    }
  }, [course]);

  useEffect(() => {
    if (openTopic === null || openTopic === undefined) {
      localStorage.removeItem(openTopicKey);
    } else {
      localStorage.setItem(openTopicKey, String(openTopic));
    }
  }, [openTopic, openTopicKey]);

  // ── Restore & track scroll ──────────────────────────────────────────────────
  useEffect(() => {
    if (!topicsLoading) {
      const savedY = localStorage.getItem(scrollKey);
      if (savedY !== null) {
        const y = parseInt(savedY, 10);
        if (!Number.isNaN(y)) requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }
  }, [topicsLoading, scrollKey]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          try { localStorage.setItem(scrollKey, String(window.scrollY || 0)); }
          catch (_) { }
          finally { ticking = false; }
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollKey]);

  // ── PHASE 1 — fetch course schema (fast, tiny payload) ─────────────────────
  useEffect(() => {
    let cancelled = false;
    setSchemaLoading(true);
    setSchemaError(null);

    get(child(ref(database), `AlgoCore/${course}/course`))
      .then(snap => {
        if (cancelled) return;
        if (snap.exists()) {
          setCourseData(snap.val());
        } else {
          setSchemaError('Course not found.');
        }
      })
      .catch(err => {
        if (!cancelled) setSchemaError(err.message);
      })
      .finally(() => {
        if (!cancelled) setSchemaLoading(false);
      });

    return () => { cancelled = true; };
  }, [course]);

  // Fetch certificate settings
  useEffect(() => {
    if (!user?.uid) return;
    get(ref(database, `users/${user.uid}/profile/settings/certificatesEnabled`))
      .then(snap => {
        if (snap.exists()) setCertificatesEnabled(snap.val() === true);
      })
      .catch(() => {});
  }, [user]);

  // ── PHASE 2 — fetch lessons + all question difficulties IN PARALLEL ─────────
  useEffect(() => {
    if (schemaLoading || schemaError) return; // wait for phase 1

    let cancelled = false;
    setTopicsLoading(true);

    async function loadTopicsAndProgress() {
      try {
        const dbRef = ref(database);

        // Fire lessons + user-progress in parallel (2 requests)
        const [lessonsSnap, progressSnap] = await Promise.all([
          get(child(dbRef, `AlgoCore/${course}/lessons`)),
          user?.uid ? get(child(dbRef, `userprogress/${user.uid}/${course}`)) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const progressData = progressSnap?.exists() ? progressSnap.val() : {};

        if (!lessonsSnap.exists()) {
          setPracticeTopics([]);
          setTopicsLoading(false);
          return;
        }

        const lessonsData = lessonsSnap.val();

        // Collect all unique question names across all topics (deduplicated)
        const allQuestionNames = new Set();
        Object.values(lessonsData).forEach(topicData => {
          if (typeof topicData === 'object' && topicData.description && Array.isArray(topicData.questions)) {
            topicData.questions.forEach(q => allQuestionNames.add(q));
          }
        });

        // Fetch ALL question details in one parallel burst
        const detailsMap = {};
        await Promise.all(
          [...allQuestionNames].map(async qName => {
            try {
              const snap = await get(child(dbRef, `questions/${qName}`));
              if (snap.exists()) {
                const data = snap.val();
                detailsMap[qName] = {
                  difficulty: data.difficulty || 'Easy',
                  type: data.type || 'Programming'
                };
              } else {
                detailsMap[qName] = { difficulty: 'Easy', type: 'Programming' };
              }
            } catch (_) {
              detailsMap[qName] = { difficulty: 'Easy', type: 'Programming' };
            }
          })
        );

        if (cancelled) return;

        // Build topic objects
        const topics = [];
        Object.keys(lessonsData).forEach(topicKey => {
          const td = lessonsData[topicKey];
          if (typeof td !== 'object' || !td.description) return;

          const topicProgress = progressData[topicKey] || {};

          const problems = (td.questions || []).map(qName => {
            let status = 'Not Started';
            if (qName in topicProgress) {
              status = topicProgress[qName] === true ? 'Completed' : 'Not Completed';
            }
            const details = detailsMap[qName] || { difficulty: 'Easy', type: 'Programming' };
            return { name: qName, difficulty: details.difficulty, type: details.type, status };
          });

          topics.push({
            title: topicKey,
            description: td.description,
            status: td.status,
            order: td.order || 0,
            problems,
          });
        });

        topics.sort((a, b) => a.order - b.order);

        // Calculate overall progress %
        let total = 0, completed = 0;
        topics.forEach(t => t.problems.forEach(p => {
          total++;
          if (p.status === 'Completed') completed++;
        }));

        if (!cancelled) {
          setPracticeTopics(topics);
          setProgressPercent(total > 0 ? Math.round((completed / total) * 100) : 0);
          setTopicsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading topics:', err);
          setTopicsLoading(false);
        }
      }
    }

    loadTopicsAndProgress();
    return () => { cancelled = true; };
  }, [course, user, schemaLoading, schemaError]);

  // Track scroll position per course
  useEffect(() => {
    const handleScroll = () => {
      if (course) {
        sessionStorage.setItem(`courseScroll_${course}`, window.scrollY.toString());
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [course]);

  // Restore scroll position when completely loaded
  useEffect(() => {
    if (!topicsLoading && !schemaLoading && course) {
      const savedPosition = sessionStorage.getItem(`courseScroll_${course}`);
      if (savedPosition) {
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant'
          });
        }, 0);
      }
    }
  }, [topicsLoading, schemaLoading, course]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (schemaLoading) return <LoadingPage />;
  if (schemaError) return (
    <div className="flex justify-center items-center min-h-screen text-red-500">{schemaError}</div>
  );
  if (!courseData) return null;

  const { title, description, stats } = courseData;
  const totalProblems = practiceTopics.reduce((n, t) => n + t.problems.length, 0);
  const completedProblems = practiceTopics.reduce((n, t) => n + t.problems.filter(p => p.status === 'Completed').length, 0);

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();   // 297
    const H = doc.internal.pageSize.getHeight();  // 210

    // Colors
    const NAVY = [15, 23, 42];
    const GOLD = [180, 140, 60]; // Premium Metallic Gold
    const SLATE = [71, 85, 105];
    const DARK_SLATE = [30, 41, 59];

    // ── 1. Page Background ──────────────────────────────────────────────
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    // ── 2. Decorative Borders ───────────────────────────────────────────
    // Thick Navy Outer
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(5, 5, W - 10, H - 10, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(7, 7, W - 14, H - 14, 'F');

    // Gold Inner Border
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setLineWidth(0.8);
    doc.rect(10, 10, W - 20, H - 20, 'S');

    // Thin Navy Border
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(0.2);
    doc.rect(12, 12, W - 24, H - 24, 'S');

    // ── 3. Corner Brackets (Gold) ───────────────────────────────────────
    doc.setLineWidth(1.5);
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    const gap = 11;
    const len = 15;
    // Top Left
    doc.line(gap, gap, gap + len, gap);
    doc.line(gap, gap, gap, gap + len);
    // Top Right
    doc.line(W - gap, gap, W - gap - len, gap);
    doc.line(W - gap, gap, W - gap, gap + len);
    // Bottom Left
    doc.line(gap, H - gap, gap + len, H - gap);
    doc.line(gap, H - gap, gap, H - gap - len);
    // Bottom Right
    doc.line(W - gap, H - gap, W - gap - len, H - gap);
    doc.line(W - gap, H - gap, W - gap, H - gap - len);

    // ── 4. Logo & Title ────────────────────────────────────────────────
    try {
      doc.addImage(algocoreLogo, 'PNG', (W - 55) / 2, 22, 55, 18);
    } catch (e) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.setFontSize(24);
      doc.text('AlgoCore', W / 2, 35, { align: 'center' });
    }

    doc.setFont('times', 'italic');
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setFontSize(14);
    doc.text('Certificate of Excellence', W / 2, 52, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK_SLATE[0], DARK_SLATE[1], DARK_SLATE[2]);
    doc.setFontSize(28);
    doc.text('ACHIEVEMENT AWARD', W / 2, 65, { align: 'center', charSpace: 1 });

    // ── 5. Main Content ────────────────────────────────────────────────
    doc.setFont('times', 'italic');
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    doc.setFontSize(14);
    doc.text('This record is officially presented to', W / 2, 85, { align: 'center' });

    // User Name (The Hero)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFontSize(42);
    doc.text((user?.name || 'STUDENT').toUpperCase(), W / 2, 105, { align: 'center' });

    // Email
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    doc.setFontSize(10);
    doc.text(user?.email || '', W / 2, 112, { align: 'center' });

    // Separator line
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setLineWidth(0.5);
    doc.line(W / 2 - 40, 116, W / 2 + 40, 116);

    // Completion Message
    doc.setFont('times', 'italic');
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    doc.setFontSize(14);
    doc.text('for completing the professional technical course in', W / 2, 128, { align: 'center' });

    // Course Name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setFontSize(22);
    doc.text(title || course, W / 2, 142, { align: 'center' });

    // ── 6. Seal of Authenticity (Bottom Left) ──────────────────────────
    const sealX = 60;
    const sealY = 175;
    // Ribbons
    doc.setFillColor(190, 40, 40); // Dark Red Ribbons
    doc.triangle(sealX - 8, sealY, sealX - 12, sealY + 22, sealX - 4, sealY + 22, 'F');
    doc.triangle(sealX + 8, sealY, sealX + 4, sealY + 22, sealX + 12, sealY + 22, 'F');

    // Outer Circle (Jagged/Sunburst look via small circles)
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    for (let i = 0; i < 360; i += 15) {
      const rad = (i * Math.PI) / 180;
      doc.circle(sealX + Math.cos(rad) * 14, sealY + Math.sin(rad) * 14, 2, 'F');
    }
    doc.circle(sealX, sealY, 14, 'F');

    // Inner Circle
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.circle(sealX, sealY, 11, 'F');

    // Seal Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFIED', sealX, sealY - 1, { align: 'center' });
    doc.text('ALGOCORE', sealX, sealY + 2, { align: 'center' });

    // ── 7. Signatures & Info (Bottom) ─────────────────────────────────
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const certId = `AC-${Date.now().toString(36).toUpperCase().slice(-8)}`;

    // Date/ID (Centered Bottom)
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Certificate ID: ${certId}`, W / 2, 175, { align: 'center' });
    doc.text(`Issued on: ${date}`, W / 2, 181, { align: 'center' });

    // Signature Area (Bottom Right)
    const sigX = W - 65;
    const sigY = 175;

    // Draw rough signature first
    doc.setFont('times', 'italic');
    doc.setTextColor(20, 30, 60); // Dark Blue-ish for ink
    doc.setFontSize(22);
    doc.text('AlgoCore', sigX, sigY - 4, { align: 'center', angle: -2 });

    // Add some "scribble" lines to make it look real
    doc.setDrawColor(20, 30, 60);
    doc.setLineWidth(0.2);

    doc.setDrawColor(DARK_SLATE[0], DARK_SLATE[1], DARK_SLATE[2]);
    doc.setLineWidth(0.4);
    doc.line(sigX - 25, sigY, sigX + 25, sigY);

    doc.setTextColor(DARK_SLATE[0], DARK_SLATE[1], DARK_SLATE[2]);
    doc.setFontSize(10);
    doc.setFont('times', 'italic');
    doc.text('Founder & Director', sigX, sigY + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('AlgoCore Education', sigX, sigY + 9, { align: 'center' });

    return doc;
  };

  const handleDownloadCertificate = () => {
    const doc = generatePDF();
    doc.save(`${title || course}_Certificate.pdf`);
  };

  const handleEmailCertificate = async () => {
    if (!user) return;
    setEmailing(true);
    try {
      const email = await getUserEmail(user.uid);
      if (!email) {
        toast.error("Could not find your email address.");
        setEmailing(false);
        return;
      }

      const htmlContent = `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h1 style="color: #2563eb;">Congratulations!</h1>
          <p>Hi ${user?.name || 'Student'},</p>
          <p>You have successfully completed the course: <strong>${title || course}</strong>.</p>
          <p>Your dedication and hard work have paid off!</p>
          <p>Log in to AlgoCore to download your certificate anytime.</p>
        </div>
      `;

      const res = await sendEmailService({
        to: email,
        subject: `Certificate of Completion: ${title || course}`,
        text: `Congratulations on completing ${title || course}! Log in to download your certificate.`,
        html: htmlContent
      });

      if (res.success) {
        toast.success("Certificate email sent successfully!");
      } else {
        toast.error("Failed to send email.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending email.");
    }
    setEmailing(false);
  };

  return (
    <div className="relative text-gray-900 dark:text-gray-100 min-h-screen flex flex-col w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* ── Course Header ── */}
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg mr-4">
                <FaBook className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold">{title}</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>

            {/* ── Progress Bar ── */}
            {user && !topicsLoading && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Course Progress</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{progressPercent}% Completed</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{completedProblems} Problems Completed</p>
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
              {topicsLoading
                ? <span className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                : <span>{totalProblems} Problems</span>}
              <span>{stats?.level}</span>
            </div>

            {!user && (
              <div className="border-t border-b border-gray-200 dark:border-dark-tertiary py-4 mb-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">login</a> to track your progress
                </p>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-4">Problems</h2>

            {/* ── Topics ── */}
            <div>
              {topicsLoading ? (
                <TopicSkeleton />
              ) : practiceTopics.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No topics found for this course.</p>
              ) : (
                <div className="space-y-4">
                  {practiceTopics.map((topic, index) => {
                    const { total, completed, percent } = calcTopicProgress(topic);
                    const isOpen = openTopic === index;
                    return (
                      <div key={index} className="bg-white dark:bg-dark-tertiary rounded-lg shadow-sm border border-gray-200 dark:border-dark-tertiary">
                        {/* Topic header */}
                        <div
                          className="p-4 flex justify-between items-center cursor-pointer"
                          onClick={() => setOpenTopic(isOpen ? null : index)}
                        >
                          <div className="flex items-center">
                            <div className="bg-gray-100 dark:bg-dark-tertiary rounded-full w-10 h-10 flex items-center justify-center mr-4 font-bold text-lg shrink-0">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {topic.title.replace(/^[^a-zA-Z]*([a-zA-Z].*)$/, '$1')}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{topic.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">{completed}/{total}</div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 sm:hidden">{percent}%</span>
                            <FaChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {/* Problem list */}
                        {isOpen && topic.problems.length > 0 && (
                          <div className="border-t border-gray-200 dark:border-dark-tertiary">
                            <table className="w-full text-left text-sm">
                              <thead className="text-gray-500 dark:text-gray-400">
                                <tr>
                                  <th className="p-4 font-medium">Problem Name</th>
                                  <th className="p-4 font-medium">Type</th>
                                  <th className="p-4 font-medium">Status</th>
                                  <th className="p-4 font-medium">Difficulty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {topic.problems.map((problem, pIndex) => (
                                  <tr
                                    key={pIndex}
                                    className={`border-t border-gray-200 dark:border-dark-tertiary ${topic.status === 'blocked'
                                      ? 'opacity-60 cursor-not-allowed'
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                                      }`}
                                    onClick={() => {
                                      if (topic.status !== 'blocked') {
                                        const encSub = encodeShort(topic.title);
                                        const encQ = encodeShort(problem.name);
                                        router.push(`/problem/${encodedCourse}/${encSub}/${encQ}`);
                                      }
                                    }}
                                  >
                                    <td className={`p-4 flex items-center ${topic.status === 'blocked'
                                      ? 'text-gray-400 dark:text-gray-500'
                                      : 'text-blue-600 dark:text-blue-400'
                                      }`}>
                                      {problem.status === 'Completed' && <FaCheck className="text-green-500 mr-2 shrink-0" />}
                                      {problem.name}
                                      {topic.status === 'blocked' && (
                                        <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                                          Locked
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                          {problem.type || 'Programming'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-2 py-1 rounded-full text-xs ${problem.status === 'Completed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : problem.status === 'Not Completed'
                                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {problem.status}
                                      </span>
                                    </td>
                                    <td className={`p-4 font-medium ${diffColor(problem.difficulty)}`}>
                                      {problem.difficulty}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Certificate ── */}
          {(progressPercent === 100 || isAdmin) && certificatesEnabled && (
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-dark-tertiary rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-tertiary flex flex-col items-center relative overflow-hidden">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaCertificate className="text-yellow-500" /> Course Certification
                </h3>
                
                {/* Certificate Preview */}
                <div 
                  className="w-full bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/30 dark:to-dark-tertiary rounded-xl border-2 border-blue-300 dark:border-blue-700/60 p-4 flex flex-col items-center text-center relative overflow-hidden"
                  style={{ minHeight: '220px' }}
                >
                  {/* Corner decorations */}
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br" />

                  {/* AlgoCore Logo */}
                  <img src={algocoreLogo.src} alt="AlgoCore" className="h-7 object-contain mb-2 mt-1" />

                  <div className="w-20 h-px bg-blue-300 dark:bg-blue-600 mb-2" />

                  <h4 className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-[0.15em] mb-2">
                    Certificate of Completion
                  </h4>

                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Presented to</p>

                  {/* Display Name */}
                  <p className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-wider leading-tight px-2 mb-1">
                    {user?.name || 'Student'}
                  </p>
                  {user?.email && (
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-2">{user.email}</p>
                  )}

                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">for successfully completing</p>

                  {/* Course Name */}
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300 px-3 leading-snug">
                    {title || course}
                  </p>

                  <div className="relative mt-3 mb-1 flex flex-col items-center">
                    <p className="font-serif italic text-lg text-blue-600 dark:text-blue-400 opacity-80 -rotate-2 select-none">
                      AlgoCore
                    </p>
                  </div>

                  <div className="w-20 h-px bg-blue-300 dark:bg-blue-600 mt-1" />
                  <p className="text-[9px] text-blue-500 dark:text-blue-400 mt-1 font-medium tracking-widest uppercase">AlgoCore Platform</p>
                </div>

                {/* Buttons — always visible since we only show when complete */}
                <div className="w-full mt-6 space-y-3">
                  <button
                     onClick={handleDownloadCertificate}
                     className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <FaDownload /> Download PDF
                  </button>
                  <button
                     onClick={handleEmailCertificate}
                     disabled={emailing}
                     className="w-full py-2.5 px-4 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-dark-tertiary shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {emailing ? <RefreshCw className="animate-spin w-4 h-4" /> : <FaEnvelope />}
                    {emailing ? 'Sending...' : 'Email to Me'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      <FloatingChatbot />
    </div>
  );
};

export default CoursePage;