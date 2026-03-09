import React, { useState, useEffect, useCallback } from 'react';
import { FaChevronDown, FaCheck, FaBook } from 'react-icons/fa';
import { ref, get, child } from 'firebase/database';
import { database } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronRight, Lock, PlayCircle, StopCircle, RefreshCw, XCircle, Code, Database, CheckCircle, FileText } from 'lucide-react';
import LoadingPage from './LoadingPage';
import { encodeShort, decodeShort } from '../utils/urlEncoder';
import FloatingChatbot from '../components/FloatingChatbot';

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
  const navigate = useNavigate();
  const { user } = useAuth();

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
                                        navigate(`/problem/${encodedCourse}/${encSub}/${encQ}`);
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
        </div>
      </div>
      <FloatingChatbot />
    </div>
  );
};

export default CoursePage;