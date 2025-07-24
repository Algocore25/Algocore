import React, { useState, useEffect } from 'react';
import { FaChevronRight, FaStar, FaBook, FaAward, FaChevronDown, FaCheck, FaLock, FaPlay } from 'react-icons/fa';
import { ref, get, child } from 'firebase/database';
import { database } from '../firebase';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

import LoadingPage from './LoadingPage';

const CoursePage = () => {
  const [courseData, setCourseData] = useState(null);
  const [practiceTopics, setPracticeTopics] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [progressPercent, setProgressPercent] = useState(0);
  const [nextUncompletedProblem, setNextUncompletedProblem] = useState(null);
  const [hasStartedCourse, setHasStartedCourse] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openTopic, setOpenTopic] = useState(null);
  const { course } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchUserProgress = async () => {
    if (!user) {
      return {};
    }

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `userprogress/${user.uid}/${course}`));

      console.log(`userprogress/${user.uid}/${course}`);
      console.log("Snapshot:", snapshot.val());

      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {};
    }
  };

  const fetchPracticeTopics = async () => {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `/AlgoCore/${course}/lessons`));

      if (!snapshot.exists()) {
        console.log('No data available');
        return [];
      }

      const data = snapshot.val();
      const practiceTopics = [];
      const progressData = await fetchUserProgress();

      console.log(data);

      // Process each topic
      Object.keys(data).forEach(topicKey => {
        const topicData = data[topicKey];

        // Skip if it's not a topic object
        if (typeof topicData !== 'object' || !topicData.description) {
          return;
        }

        const problems = [];

        console.log(topicData);

        topicData.questions.forEach(problemData => {
          console.log(problemData);

          problems.push({
            name: problemData,
            status: 'Not Started', // Default status
            difficulty: "Easy",
            question: problemData,
            isLocked: true, // All problems start locked
          });
        });

        // Create the topic object
        practiceTopics.push({
          title: topicKey,
          description: topicData.description,
          problems: problems
        });
      });

      return practiceTopics;
    } catch (error) {
      console.error('Error fetching data from Firebase:', error);
      throw error;
    }
  };

  // Enhanced function to determine which problems should be unlocked based on progress
  const calculateUnlockedProblems = (topics, progress) => {
    if (!topics || topics.length === 0) return topics;

    // Create a flat list of all problems with their positions
    const allProblems = [];
    topics.forEach((topic, topicIndex) => {
      topic.problems.forEach((problem, problemIndex) => {
        allProblems.push({
          topicIndex,
          problemIndex,
          topicTitle: topic.title,
          problemName: problem.name,
          isCompleted: progress[topic.title] && progress[topic.title][problem.name] === true
        });
      });
    });

    // Find the first uncompleted problem for the continue functionality
    let firstUncompletedIndex = -1;
    let hasAnyProgress = false;

    for (let i = 0; i < allProblems.length; i++) {
      if (allProblems[i].isCompleted) {
        hasAnyProgress = true;
      } else if (firstUncompletedIndex === -1) {
        firstUncompletedIndex = i;
        break;
      }
    }

    // Set the next uncompleted problem for navigation
    if (firstUncompletedIndex !== -1) {
      const nextProblem = allProblems[firstUncompletedIndex];
      setNextUncompletedProblem({
        topicTitle: nextProblem.topicTitle,
        problemName: nextProblem.problemName
      });
    } else {
      // All problems completed
      setNextUncompletedProblem(null);
    }

    // Set whether user has started the course
    setHasStartedCourse(hasAnyProgress);

    // Progressive unlocking logic
    const updatedTopics = topics.map((topic, topicIndex) => {
      const updatedProblems = topic.problems.map((problem, problemIndex) => {
        // Find this problem's global index
        const globalIndex = allProblems.findIndex(p => 
          p.topicIndex === topicIndex && p.problemIndex === problemIndex
        );

        let isUnlocked = false;

        if (globalIndex === 0) {
          // First problem is always unlocked
          isUnlocked = true;
        } else {
          // Check if previous problem is completed
          const previousProblem = allProblems[globalIndex - 1];
          if (previousProblem && previousProblem.isCompleted) {
            isUnlocked = true;
          }
          
          // Special case: if this is the first problem of a topic (not the first topic)
          // it should be unlocked only if the previous topic is fully completed
          if (problemIndex === 0 && topicIndex > 0) {
            const previousTopic = topics[topicIndex - 1];
            const previousTopicCompleted = previousTopic.problems.every(p => 
              progress[previousTopic.title] && progress[previousTopic.title][p.name] === true
            );
            isUnlocked = previousTopicCompleted;
          }
        }

        // Determine status based on progress
        let status = 'Not Started';
        if (progress[topic.title] && problem.name in progress[topic.title]) {
          status = progress[topic.title][problem.name] === true ? 'Completed' : 'In Progress';
        }

        return {
          ...problem,
          status: status,
          isLocked: !isUnlocked
        };
      });

      return {
        ...topic,
        problems: updatedProblems
      };
    });

    return updatedTopics;
  };

  const updateProblemStatusesWithProgress = (topics, progress) => {
    if (!progress || typeof progress !== 'object') {
      // If no progress, unlock only the first problem
      return calculateUnlockedProblems(topics, {});
    }

    return calculateUnlockedProblems(topics, progress);
  };

  const calculateProgressPercent = (topics) => {
    let total = 0;
    let completed = 0;

    topics.forEach(topic => {
      topic.problems.forEach(problem => {
        total++;
        if (problem.status === 'Completed') completed++;
      });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleProblemClick = (topic, problem) => {
    if (problem.isLocked) {
      // Show a message or do nothing when clicking locked problems
      return;
    }
    navigate(`/problem/${course}/${topic.title}/${problem.name}`);
  };

  const handleStartJourney = () => {
    if (practiceTopics.length > 0 && practiceTopics[0].problems.length > 0) {
      const firstTopic = practiceTopics[0];
      const firstProblem = firstTopic.problems[0];
      navigate(`/problem/${course}/${firstTopic.title}/${firstProblem.name}`);
    }
  };

  const handleContinueJourney = () => {
    if (nextUncompletedProblem) {
      navigate(`/problem/${course}/${nextUncompletedProblem.topicTitle}/${nextUncompletedProblem.problemName}`);
    }
  };

  useEffect(() => {
    async function executeAfterBoth() {
      try {
        setLoading(true);

        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `AlgoCore/${course}/course`));

        if (snapshot.exists()) {
          const data = snapshot.val();
          setCourseData(data);
        } else {
          throw new Error('Failed to fetch course data');
        }

        const [topics, progress] = await Promise.all([
          fetchPracticeTopics(),
          fetchUserProgress()
        ]);

        setUserProgress(progress);
        const updatedTopics = updateProblemStatusesWithProgress(topics, progress);
        setPracticeTopics(updatedTopics);

        // Set the % value
        const progressVal = calculateProgressPercent(updatedTopics);
        setProgressPercent(progressVal);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setPracticeTopics(null);
      } finally {
        setLoading(false);
      }
    }

    executeAfterBoth();
  }, [course, user]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen">Error: {error}</div>;
  }

  if (!courseData) {
    return null;
  }

  const { title, description, stats } = courseData;
  const totalProblems = practiceTopics.reduce((count, topic) => count + topic.problems.length, 0);

  const completedProblems = practiceTopics.reduce(
    (count, topic) => count + topic.problems.filter(p => p.status === 'Completed').length,
    0
  );

  const isAllCompleted = completedProblems === totalProblems && totalProblems > 0;

  return (
    <div className="bg-gray-50 dark:bg-dark-primary text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg mr-4">
                <FaBook className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold">{title}</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>

            {/* Journey Button */}
            {user && (
              <div className="mb-6">
                {!hasStartedCourse ? (
                  <button
                    onClick={handleStartJourney}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                  >
                    <FaPlay className="w-4 h-4" />
                    <span>Start My Journey</span>
                  </button>
                ) : !isAllCompleted && nextUncompletedProblem ? (
                  <button
                    onClick={handleContinueJourney}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                  >
                    <FaChevronRight className="w-4 h-4" />
                    <span>Continue Journey</span>
                  </button>
                ) : isAllCompleted ? (
                  <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <FaAward className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-green-800 dark:text-green-300 font-semibold">
                        Congratulations! You've completed the entire course!
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Progress Bar */}
            {user && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Course Progress</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{progressPercent}% Completed</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{completedProblems} of {totalProblems} Problems Completed</p>
              </div>
            )}

            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <span>{totalProblems} Problems</span>
              <span>{stats.level}</span>
            </div>

            {!user && (
              <div className="border-t border-b border-gray-200 dark:border-dark-tertiary py-4 mb-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">login</a> to track your progress and unlock problems
                </p>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-4">Problems</h2>
            <div className="space-y-4">
              {practiceTopics.map((topic, index) => {
                const topicCompletedProblems = topic.problems.filter(p => p.status === 'Completed').length;
                const topicTotalProblems = topic.problems.length;
                const topicProgress = topicTotalProblems > 0 ? Math.round((topicCompletedProblems / topicTotalProblems) * 100) : 0;
                
                return (
                  <div key={index} className="bg-white dark:bg-dark-tertiary rounded-lg shadow-sm border border-gray-200 dark:border-dark-tertiary">
                    <div
                      className="p-4 flex justify-between items-center cursor-pointer"
                      onClick={() => setOpenTopic(openTopic === index ? null : index)}
                    >
                      <div className="flex items-center">
                        <div className="bg-gray-100 dark:bg-dark-tertiary rounded-full w-10 h-10 flex items-center justify-center mr-4 font-bold text-lg">{index + 1}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{topic.title.substring(3)}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{topic.description}</p>
                          {user && (
                            <div className="flex items-center mt-1">
                              <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${topicProgress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {topicCompletedProblems}/{topicTotalProblems}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <FaChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openTopic === index ? 'rotate-180' : ''}`} />
                    </div>
                    {openTopic === index && topic.problems.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-dark-tertiary">
                        <table className="w-full text-left text-sm">
                          <thead className="text-gray-500 dark:text-gray-400">
                            <tr>
                              <th className="p-4 font-medium">Problem Name</th>
                              <th className="p-4 font-medium">Status</th>
                              <th className="p-4 font-medium">Difficulty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topic.problems.map((problem, pIndex) => (
                              <tr 
                                key={pIndex} 
                                className={`border-t border-gray-200 dark:border-dark-tertiary ${
                                  problem.isLocked 
                                    ? 'opacity-50' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                              >
                                <td
                                  className={`p-4 flex items-center ${
                                    problem.isLocked
                                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                      : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                                  }`}
                                  onClick={() => handleProblemClick(topic, problem)}
                                >
                                  {problem.isLocked ? (
                                    <FaLock className="text-gray-400 mr-2" />
                                  ) : problem.status === 'Completed' ? (
                                    <FaCheck className="text-green-500 mr-2" />
                                  ) : problem.status === 'In Progress' ? (
                                    <div className="w-4 h-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  ) : null}
                                  {problem.name}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    problem.isLocked
                                      ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                      : problem.status === 'Completed'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                      : problem.status === 'In Progress'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {problem.isLocked ? 'Locked' : problem.status}
                                  </span>
                                </td>
                                <td className={`p-4 ${
                                  problem.isLocked 
                                    ? 'text-gray-400 dark:text-gray-500' 
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
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
          </div>

          <div className="space-y-8">
            {/* <div className="bg-white dark:bg-dark-tertiary p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-tertiary">
              <div className="flex items-start">
                <FaAward className="w-10 h-10 text-yellow-500 mr-4" />
                <div>
                  <h3 className="font-bold">Earn certificate after completing all the problems.</h3>
                </div>
              </div>
            </div> */}
            
            {/* Progress Info */}
            {user && (
              <div className="bg-white dark:bg-dark-tertiary p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-tertiary">
                <h3 className="font-bold mb-3">Your Progress</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{completedProblems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-semibold">{totalProblems - completedProblems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-semibold">{totalProblems}</span>
                  </div>
                  {nextUncompletedProblem && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Next Problem:</div>
                      <div className="font-medium text-blue-600 dark:text-blue-400 truncate">
                        {nextUncompletedProblem.problemName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;