import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiUsers, FiSettings, FiTrash2, FiEdit2, FiX, FiCheck, FiUserPlus, FiMail, FiEye } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { ref, onValue, set, push, update, remove, get } from 'firebase/database';
import { database } from '../../firebase';
import Questions from './Questions';
import Students from './Students';
import LoadingPage from '../LoadingPage';
import ExamPreview from './ExamPreview';
import UnifiedMonitorResults from './UnifiedMonitorResults';

const TestManage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  // State management
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Load the saved tab from localStorage, default to 'questions'
    const saved = localStorage.getItem('testManageActiveTab') || 'questions';
    // If legacy 'monitor' tab is saved, default to 'results' (combined tab)
    return saved === 'monitor' ? 'results' : saved;
  }); // 'students', 'questions', 'results' (includes monitor & edit)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [forceStartTime, setForceStartTime] = useState('');
  const [forceEndTime, setForceEndTime] = useState('');
  const [schedulingType, setSchedulingType] = useState('anytime'); // 'anytime' or 'scheduled'
  const [isSaving, setIsSaving] = useState(false);
  const [enableVideoProctoring, setEnableVideoProctoring] = useState(true);
  const [blockOnViolations, setBlockOnViolations] = useState(false);
  const [maxViolationCount, setMaxViolationCount] = useState(3);
  const [violationCounts, setViolationCounts] = useState({}); // Store violation counts for students
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // Test visibility to students
  const [allowedLanguages, setAllowedLanguages] = useState(['python', 'javascript', 'java', 'cpp', 'c']);

  const availableLanguages = [
    { id: 'python', label: 'Python' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C++' },
    { id: 'c', label: 'C' }
  ];
  // Initialize state with default values
  const [questionsPerType, setQuestionsPerType] = useState({
    mcq: 0,
    msq: 0,
    programming: 0,
    sql: 0,
    nat: 0
  });

  // Categorize questions
  const getQuestionCategories = useCallback((questions = []) => {
    const categories = {
      mcq: { name: 'MCQ', count: 0, selected: 0 },
      msq: { name: 'MSQ', count: 0, selected: 0 },
      programming: { name: 'Programming', count: 0, selected: 0 },
      sql: { name: 'SQL', count: 0, selected: 0 },
      nat: { name: 'NAT', count: 0, selected: 0 }
    };

    if (!questions || typeof questions !== 'object') return categories;

    // Get all question types
    const questionTypes = Object.values(questions);

    // Count total questions by type
    questionTypes.forEach(type => {
      const typeStr = String(type || '').toLowerCase();

      if (typeStr === 'mcq') {
        categories.mcq.count++;
      } else if (typeStr === 'msq') {
        categories.msq.count++;
      } else if (typeStr === 'programming') {
        categories.programming.count++;
      } else if (typeStr === 'sql') {
        categories.sql.count++;
      } else if (typeStr === 'numeric' || typeStr === 'nat') {
        categories.nat.count++;
      }
    });

    // Count selected questions (assuming selected questions are stored in test.selectedQuestions)
    if (test?.selectedQuestions) {
      const selectedTypes = Object.values(test.selectedQuestions).map(q =>
        String(q.type || '').toLowerCase()
      );

      selectedTypes.forEach(type => {
        if (type === 'mcq') categories.mcq.selected++;
        else if (type === 'msq') categories.msq.selected++;
        else if (type === 'programming') categories.programming.selected++;
        else if (type === 'sql') categories.sql.selected++;
        else if (type === 'numeric' || type === 'nat') categories.nat.selected++;
      });
    }

    return categories;
  }, []);

  // Calculate question statistics
  const questionStats = useMemo(() => {
    if (!test?.questions) return { total: 0, categories: {} };

    const categories = getQuestionCategories(test.questions);
    const total = Object.values(categories).reduce((sum, cat) => sum + cat.count, 0);

    return { total, categories };
  }, [test?.questions, getQuestionCategories]);

  // Initialize questionsPerType only once when test data is first loaded
  useEffect(() => {
    if (test?.configure?.questionsPerType) {
      // Use the configuration from the test object
      const config = test.configure.questionsPerType;
      setQuestionsPerType({
        mcq: Number(config.mcq) || 0,
        msq: Number(config.msq) || 0,
        programming: Number(config.programming) || 0,
        sql: Number(config.sql) || 0,
        nat: Number(config.nat) || 0
      });
    } else if (test?.questions) {
      // Initialize with default values if no config exists
      const defaultValues = {
        mcq: 0,
        msq: 0,
        programming: 0,
        sql: 0,
        nat: 0
      };
      setQuestionsPerType(defaultValues);

      // Save default config to Firebase if it doesn't exist
      const saveDefaultConfig = async () => {
        try {
          await set(ref(database, `Exam/${testId}/configure`), {
            questionsPerType: defaultValues,
            updatedAt: Date.now()
          });
        } catch (error) {
          console.error('Error saving default config:', error);
        }
      };
      saveDefaultConfig();
    }
  }, [test?.questions, test?.configure?.questionsPerType, testId]);

  // Fetch test data and configuration
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const testRef = ref(database, `Exam/${testId}`);
        const testSnapshot = await get(testRef);

        if (testSnapshot.exists()) {
          const testData = testSnapshot.val();
          setTest(testData);

          // Set test title from database
          if (testData.name) {
            setTestTitle(testData.name);
          }

          // Calculate question statistics
          const stats = getQuestionCategories(testData.questions);
          setQuestionStats(stats);

          // Set duration if available
          if (testData.duration) {
            setDuration(testData.duration);
          }

          // Set proctoring settings if available
          if (testData.proctorSettings) {
            setEnableVideoProctoring(
              testData.proctorSettings.enableVideoProctoring === undefined
                ? true
                : testData.proctorSettings.enableVideoProctoring
            );
            setBlockOnViolations(
              testData.proctorSettings.blockOnViolations === true
            );
            setMaxViolationCount(
              testData.proctorSettings.maxViolationCount || 3
            );
          }

          // Set visibility if available
          if (testData.isVisible !== undefined) {
            setIsVisible(testData.isVisible);
          }

          // Set scheduling if available
          if (testData.Properties) {
            setStartTime(testData.Properties.startTime || '');
            setEndTime(testData.Properties.endTime || '');
            setForceStartTime(testData.Properties.forceStartTime || '');
            setForceEndTime(testData.Properties.forceEndTime || '');
            setSchedulingType(testData.Properties.type || 'anytime');
          }

          // Load saved configuration if exists
          const configRef = ref(database, `Exam/${testId}/configure`);
          const configSnapshot = await get(configRef);

          if (configSnapshot.exists() && configSnapshot.val().questionsPerType) {
            const savedConfig = configSnapshot.val().questionsPerType;
            // Update questionsPerType state with saved values
            const updatedQuestionsPerType = {
              mcq: Number(savedConfig.mcq) || 0,
              programming: Number(savedConfig.programming) || 0,
              sql: Number(savedConfig.sql) || 0,
              other: Number(savedConfig.other) || 0
            };

            setQuestionsPerType(updatedQuestionsPerType);

            // Update test data with the loaded config
            setTest(prev => ({
              ...prev,
              configure: {
                questionsPerType: updatedQuestionsPerType,
                updatedAt: configSnapshot.val().updatedAt || Date.now()
              }
            }));
          }
        } else {
          console.error('Test not found');
          setTest(null);
        }
      } catch (error) {
        console.error('Error fetching test data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchTestData();
    }
  }, [testId, getQuestionCategories]);

  // Real-time listener for proctorSettings changes
  useEffect(() => {
    if (!testId) return;

    const proctorSettingsRef = ref(database, `Exam/${testId}/proctorSettings`);
    const unsubscribe = onValue(proctorSettingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.val();
        console.log('[TestManage] ProctorSettings from Firebase:', settings);

        setEnableVideoProctoring(
          settings.enableVideoProctoring === undefined
            ? true
            : settings.enableVideoProctoring
        );
        setBlockOnViolations(
          settings.blockOnViolations === true
        );
        setMaxViolationCount(
          settings.maxViolationCount || 3
        );

        // Update test state
        setTest(prev => ({
          ...prev,
          proctorSettings: settings
        }));
      } else {
        console.log('[TestManage] No proctorSettings found in Firebase, using defaults');
        // Set defaults if no settings exist
        setEnableVideoProctoring(true);
        setBlockOnViolations(false);
        setMaxViolationCount(3);
      }
    });

    return () => unsubscribe();
  }, [testId]);

  // Real-time listener for duration changes
  useEffect(() => {
    if (!testId) return;

    const durationRef = ref(database, `Exam/${testId}/duration`);
    const unsubscribe = onValue(durationRef, (snapshot) => {
      if (snapshot.exists()) {
        const durationValue = snapshot.val();
        console.log('[TestManage] Duration from Firebase:', durationValue);
        setDuration(durationValue);

        // Update test state
        setTest(prev => ({
          ...prev,
          duration: durationValue
        }));
      } else {
        console.log('[TestManage] No duration found in Firebase, using default');
        setDuration(60); // Default 60 minutes
      }
    });

    return () => unsubscribe();
  }, [testId]);

  // Real-time listener for scheduling changes
  useEffect(() => {
    if (!testId) return;

    const propsRef = ref(database, `Exam/${testId}/Properties`);
    const unsubscribe = onValue(propsRef, (snapshot) => {
      if (snapshot.exists()) {
        const props = snapshot.val();
        setStartTime(props.startTime || '');
        setEndTime(props.endTime || '');
        setForceStartTime(props.forceStartTime || '');
        setForceEndTime(props.forceEndTime || '');
        setSchedulingType(props.schedulingType || 'anytime');

        setTest(prev => ({
          ...prev,
          Properties: {
            ...prev?.Properties,
            ...props
          }
        }));
      }
    });

    return () => unsubscribe();
  }, [testId]);

  // Real-time listener for allowedLanguages changes
  useEffect(() => {
    if (!testId) return;

    const allowedLanguagesRef = ref(database, `Exam/${testId}/allowedLanguages`);
    const unsubscribe = onValue(allowedLanguagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const langs = snapshot.val();
        console.log('[TestManage] allowedLanguages from Firebase:', langs);
        setAllowedLanguages(langs);

        // Update test state
        setTest(prev => ({
          ...prev,
          allowedLanguages: langs
        }));
      } else {
        console.log('[TestManage] No allowedLanguages found in Firebase, using default');
        setAllowedLanguages(['python', 'javascript', 'java', 'cpp', 'c']);
      }
    });

    return () => unsubscribe();
  }, [testId]);

  // Fetch violation counts when violation blocking is enabled
  useEffect(() => {
    const loadViolationCounts = async () => {
      if (!blockOnViolations || !testId) {
        setViolationCounts({});
        return;
      }

      setLoadingViolations(true);
      try {
        const counts = await fetchViolationCounts(testId);
        setViolationCounts(counts);
      } catch (error) {
        console.error('Error loading violation counts:', error);
        toast.error('Failed to load violation counts');
      } finally {
        setLoadingViolations(false);
      }
    };

    loadViolationCounts();
  }, [blockOnViolations, testId]);

  // Real-time listener for test name changes
  useEffect(() => {
    if (!testId) return;

    const nameRef = ref(database, `Exam/${testId}/name`);
    const unsubscribe = onValue(nameRef, (snapshot) => {
      if (snapshot.exists()) {
        const nameValue = snapshot.val();
        console.log('[TestManage] Test name from Firebase:', nameValue);
        setTestTitle(nameValue);

        // Update test state
        setTest(prev => ({
          ...prev,
          name: nameValue
        }));
      }
    });

    return () => unsubscribe();
  }, [testId]);

  // Real-time listener for visibility changes
  useEffect(() => {
    if (!testId) return;

    const visibilityRef = ref(database, `Exam/${testId}/isVisible`);
    const unsubscribe = onValue(visibilityRef, (snapshot) => {
      if (snapshot.exists()) {
        const visibleValue = snapshot.val();
        console.log('[TestManage] Test visibility from Firebase:', visibleValue);
        setIsVisible(visibleValue);

        // Update test state
        setTest(prev => ({
          ...prev,
          isVisible: visibleValue
        }));
      } else {
        // Default to visible if not set
        setIsVisible(true);
      }
    });

    return () => unsubscribe();
  }, [testId]);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('testManageActiveTab', activeTab);
  }, [activeTab]);

  // Fetch students
  const fetchStudents = async (testId) => {
    try {
      const eligibleRef = ref(database, `Exam/${testId}/Eligible`);
      const snapshot = await get(eligibleRef);

      if (!snapshot.exists()) {
        console.log('No student data found in Firebase');
        return { eligibleStudents: {}, enrolledStudents: [] };
      }

      const eligibleData = snapshot.val();
      console.log('Raw student data from Firebase:', eligibleData);

      // The data is already in the desired { name: email } format or similar.
      // We will ensure it's a clean object.
      const eligibleStudents = (typeof eligibleData === 'object' && eligibleData !== null) ? eligibleData : {};

      console.log('Processed students:', eligibleStudents);
      return {
        eligibleStudents,
        // enrolledStudents can be derived from the keys of the eligible object
        enrolledStudents: Object.keys(eligibleStudents)
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      return { eligibleStudents: {}, enrolledStudents: [] };
    }
  };

  // Fetch violation counts for all students when violation blocking is enabled
  const fetchViolationCounts = async (testId) => {
    if (!blockOnViolations) return {};

    try {
      const violationsRef = ref(database, `Exam/${testId}/Properties2/Progress`);
      const snapshot = await get(violationsRef);

      if (!snapshot.exists()) {
        console.log('No violation data found in Firebase');
        return {};
      }

      const violationData = snapshot.val();
      console.log('Violation data from Firebase:', violationData);

      // Process violation counts for each student
      const violationCounts = {};
      Object.keys(violationData).forEach(userId => {
        const count = violationData[userId] ?? 0;
        if (count > 0) {
          violationCounts[userId] = count;
        }
      });

      console.log('Processed violation counts:', violationCounts);
      return violationCounts;
    } catch (error) {
      console.error('Error fetching violation counts:', error);
      return {};
    }
  };

  // Test management methods
  const updateTest = async (updates) => {
    try {
      await update(ref(database, `Exam/${testId}`), updates);
      toast.success('Test updated successfully');
    } catch (err) {
      toast.error('Failed to update test');
      throw err;
    }
  };

  const handleSaveTest = useCallback(async (updatedData) => {
    if (!test) return;

    try {
      setIsSaving(true);
      await updateTest(updatedData);
      toast.success('Test updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error('Failed to update test');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [test, updateTest]);

  const handleUpdateTitle = useCallback(async () => {
    if (!testTitle.trim()) {
      toast.error('Test title cannot be empty');
      return;
    }

    const success = await handleSaveTest({ ...test, name: testTitle });
    if (success) {
      setIsEditingTitle(false);
    }
  }, [test, testTitle, handleSaveTest]);

  // Auto-save test title on blur
  const handleTitleBlur = useCallback(async () => {
    if (!testTitle.trim()) {
      toast.error('Test title cannot be empty');
      setTestTitle(test?.name || '');
      return;
    }
    if (testTitle !== test?.name) {
      await handleSaveTest({ name: testTitle });
      setTest(prev => ({ ...prev, name: testTitle }));
    }
  }, [testTitle, test, handleSaveTest]);

  // Function to handle question type changes
  const handleQuestionTypeChange = useCallback(async (key, value, max) => {
    const numValue = Math.min(parseInt(value) || 0, max);

    // Optimistically update local state
    setQuestionsPerType(prev => {
      const newState = {
        ...prev,
        [key]: numValue
      };

      // Update Firebase in the background
      const updateFirebase = async () => {
        try {
          await set(ref(database, `Exam/${testId}/configure`), {
            questionsPerType: newState,
            updatedAt: Date.now()
          });

          // Update the test state with the new configuration
          setTest(prevTest => ({
            ...prevTest,
            configure: {
              ...prevTest?.configure,
              questionsPerType: newState,
              updatedAt: Date.now()
            }
          }));
        } catch (error) {
          console.error('Error updating question configuration:', error);
          toast.error('Failed to update configuration');

          // Revert local state on error
          setQuestionsPerType(prev => ({
            ...prev,
            [key]: prev[key]
          }));
        }
      };

      updateFirebase();

      return newState;
    });
  }, [testId]);

  if (loading) {
    return (
      <LoadingPage message="Loading test, please wait..." />
    );
  }

  if (!test) {
    return (
      <div className="min-h-[calc(100vh-4rem)] -mt-4 -mx-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Test not found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">The requested test could not be found.</p>
          <button
            onClick={() => navigate('/tests')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] -mt-4 -mx-4 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Back to tests"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center">
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="text-xl font-semibold bg-transparent border-b border-blue-500 focus:outline-none focus:ring-0 px-1 py-0.5"
                      autoFocus
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={handleUpdateTitle}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        disabled={isSaving}
                      >
                        <FiCheck className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingTitle(false);
                          setTestTitle(test.name || '');
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        disabled={isSaving}
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {test.name}
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Edit title"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                  </h1>
                )}
              </div>

              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                  {Object.keys(test?.questions || {}).length} Questions
                </span>
              </div>
            </div>

          </div>

          {/* Tabs */}
          <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">

              <button
                onClick={() => setActiveTab('questions')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                  }`}
              >
                Questions
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                  }`}
              >
                Manage Students
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                  }`}
              >
                <FiEye className="inline mr-1.5 h-4 w-4" />
                Preview
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                  }`}
              >
                <FiSettings className="inline mr-1.5 h-4 w-4" />
                Settings
              </button>

              <button
                onClick={() => setActiveTab('results')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'results'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                  }`}
              >
                Monitor & Results
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'questions' && (
          <Questions test={test} setTest={setTest} testId={testId} />
        )}
        {activeTab === 'students' && (
          <Students test={test} testId={testId} />
        )}
        {activeTab === 'preview' && (
          <ExamPreview test={test} testId={testId} duration={duration} />
        )}
        {activeTab === 'results' && (
          <UnifiedMonitorResults />
        )}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Test Settings</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configure the test settings and rules.

                <br></br>

                Future Updates
              </p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
              {/* Question Summary */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Question Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Questions</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {Object.keys(test?.questions || {}).length}
                      </p>
                    </div>
                    {Object.entries(questionStats.categories).map(([key, category]) => (
                      category.count > 0 && (
                        <div key={key} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {category.name} Questions
                            {category.selected > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                {category.selected} selected
                              </span>
                            )}
                          </p>
                          <div className="mt-1">
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {category.count}
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                ({(() => {
                                  const totalQuestions = Object.keys(test?.questions || {}).length || 1;
                                  const percentage = (category.count / totalQuestions) * 100;
                                  return Math.round(percentage) + '%';
                                })()})
                              </span>
                            </p>
                            {category.selected > 0 && (
                              <div className="mt-1">
                                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(category.selected / category.count) * 100}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {category.selected} of {category.count} selected ({Math.round((category.selected / category.count) * 100)}%)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Question Configuration */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Question Configuration
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-4">
                    {Object.entries(questionStats.categories).map(([key, category]) => (
                      category.count > 0 && (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {category.name} Questions
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                (Max: {category.count} available)
                              </span>
                            </p>
                            {category.selected > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {category.selected} currently selected
                              </p>
                            )}
                          </div>
                          <select
                            value={questionsPerType[key] || 0}
                            onChange={(e) => handleQuestionTypeChange(key, e.target.value, category.count)}
                            className="mt-1 block w-24 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          >
                            {Array.from({ length: category.count + 1 }, (_, i) => i).map(num => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      {isSaving ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        <span className="text-green-500">
                          <svg className="h-4 w-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Changes saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="test-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Test Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="test-name"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      onBlur={handleTitleBlur}
                      className="flex-1 min-w-0 block w-full sm:text-sm border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white rounded-md p-2"
                      placeholder="Enter test name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration (minutes)
                  </label>
                  <div className="mt-1">
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="duration"
                        min="1"
                        value={duration}
                        onChange={(e) => {
                          const newDuration = Math.max(1, parseInt(e.target.value) || 0);
                          setDuration(newDuration);
                        }}
                        onBlur={() => handleSaveTest({ duration })}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white pr-16 p-2"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">minutes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scheduling Section */}
                <div className="col-span-1 sm:col-span-2 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Scheduling
                    </h3>
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button
                        onClick={() => {
                          setSchedulingType('anytime');
                          update(ref(database, `Exam/${testId}/Properties`), { type: 'anytime' });
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${schedulingType === 'anytime'
                          ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                      >
                        Anytime
                      </button>
                      <button
                        onClick={() => {
                          setSchedulingType('scheduled');
                          update(ref(database, `Exam/${testId}/Properties`), { type: 'timeRange' });
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${schedulingType === 'scheduled'
                          ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                      >
                        Time Range
                      </button>
                    </div>
                  </div>

                  {schedulingType === 'scheduled' ? (
                    <div className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Availability Window</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Window Start Time
                            </label>
                            <input
                              type="datetime-local"
                              id="startTime"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              onBlur={() => update(ref(database, `Exam/${testId}/Properties`), { startTime })}
                              className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white rounded-md p-2"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">When students can start the exam</p>
                          </div>
                          <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Window End Time
                            </label>
                            <input
                              type="datetime-local"
                              id="endTime"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              onBlur={() => update(ref(database, `Exam/${testId}/Properties`), { endTime })}
                              className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white rounded-md p-2"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last time to start the exam</p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            ℹ️ Students can start the exam anytime between these times. Once they start, they'll have <strong>{duration} minutes</strong> to complete it.
                          </p>
                        </div>
                      </div>

                      <hr className="border-gray-300 dark:border-gray-600" />

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Force Start/End (Optional)</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          Set specific times to automatically start or end the exam for all students. Leave blank if not needed.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="forceStartTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Force Start Time (Optional)
                            </label>
                            <input
                              type="datetime-local"
                              id="forceStartTime"
                              value={forceStartTime}
                              onChange={(e) => setForceStartTime(e.target.value)}
                              onBlur={() => update(ref(database, `Exam/${testId}/Properties`), { forceStartTime })}
                              className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white rounded-md p-2"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically start exam for all students at this time</p>
                          </div>
                          <div>
                            <label htmlFor="forceEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Force End Time (Optional)
                            </label>
                            <input
                              type="datetime-local"
                              id="forceEndTime"
                              value={forceEndTime}
                              onChange={(e) => setForceEndTime(e.target.value)}
                              onBlur={() => update(ref(database, `Exam/${testId}/Properties`), { forceEndTime })}
                              className="block w-full sm:text-sm border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white rounded-md p-2"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically end exam for all students at this time</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Anytime Access Enabled:</strong> Students can start this test whenever they want.
                        Once they click "Start Test", they will have exactly <strong>{duration} minutes</strong> to complete it.
                      </p>
                    </div>
                  )}

                  {schedulingType === 'scheduled' && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <strong>How it works:</strong>
                      <ul className="mt-1 space-y-1">
                        <li>• Students can start the exam anytime between the availability window times</li>
                        <li>• Each student gets {duration} minutes from when they click "Start"</li>
                        <li>• Force Start/End times override student preferences and automatically start/end for all students</li>
                      </ul>
                    </p>
                  )}
                </div>

                {/* Proctoring Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Proctoring Settings
                  </label>
                  <div className="space-y-4">
                    {/* Video Proctoring Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Video Proctoring
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Enable AI-powered video monitoring to detect multiple persons or no person during the exam
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const newValue = !enableVideoProctoring;
                          setEnableVideoProctoring(newValue);
                          await handleSaveTest({
                            proctorSettings: {
                              enableVideoProctoring: newValue,
                              enableFullscreen: true,
                              blockOnViolations: blockOnViolations
                            }
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${enableVideoProctoring ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enableVideoProctoring ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Block on Violations Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Block on Excessive Violations
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Automatically block students from continuing the exam when they exceed the violation threshold.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const newValue = !blockOnViolations;
                          setBlockOnViolations(newValue);
                          await handleSaveTest({
                            proctorSettings: {
                              enableVideoProctoring: enableVideoProctoring,
                              enableFullscreen: true,
                              blockOnViolations: newValue,
                              maxViolationCount: maxViolationCount
                            }
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${blockOnViolations ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${blockOnViolations ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Maximum Violation Count - Only show when blockOnViolations is enabled */}
                    {blockOnViolations && (
                      <div className="ml-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label htmlFor="maxViolationCount" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                              Maximum Violation Count
                            </label>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Number of violations allowed before blocking the student. Must be at least 1.
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              id="maxViolationCount"
                              min="1"
                              value={maxViolationCount}
                              onChange={(e) => {
                                const value = Math.max(1, parseInt(e.target.value) || 1);
                                setMaxViolationCount(value);
                              }}
                              onBlur={() => {
                                handleSaveTest({
                                  proctorSettings: {
                                    enableVideoProctoring: enableVideoProctoring,
                                    enableFullscreen: true,
                                    blockOnViolations: blockOnViolations,
                                    maxViolationCount: maxViolationCount
                                  }
                                });
                              }}
                              className="w-20 sm:text-sm border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white rounded-md p-2 text-center"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">violations</span>
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-800/30 rounded">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            ⚠️ Students will be blocked after <strong>{maxViolationCount}</strong> violation(s).
                            Current violations are tracked in the monitoring dashboard.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current Violation Status - Only show when blockOnViolations is enabled */}
                    {blockOnViolations && (
                      <div className="ml-4 mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            Current Violation Status
                          </h4>
                          <button
                            onClick={async () => {
                              setLoadingViolations(true);
                              try {
                                const counts = await fetchViolationCounts(testId);
                                setViolationCounts(counts);
                                toast.success('Violation counts refreshed');
                              } catch (error) {
                                console.error('Error refreshing violation counts:', error);
                                toast.error('Failed to refresh violation counts');
                              } finally {
                                setLoadingViolations(false);
                              }
                            }}
                            className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                            disabled={loadingViolations}
                          >
                            {loadingViolations ? 'Loading...' : 'Refresh'}
                          </button>
                        </div>
                        
                        {loadingViolations ? (
                          <div className="text-center py-4 text-orange-600 dark:text-orange-400">
                            <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                            Loading violation counts...
                          </div>
                        ) : Object.keys(violationCounts).length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                              Found {Object.keys(violationCounts).length} student(s) with violations:
                            </p>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {Object.entries(violationCounts).map(([userId, count]) => (
                                <div key={userId} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-orange-200 dark:border-orange-700">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Student ID: {userId.slice(-8)}
                                  </span>
                                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                                    count >= maxViolationCount 
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : count >= maxViolationCount - 1
                                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  }`}>
                                    {count} / {maxViolationCount}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                              💡 Students at or above the threshold will be blocked from continuing the exam.
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-green-600 dark:text-green-400">
                            <div className="text-sm mb-1">✅ No violations recorded</div>
                            <div className="text-xs">All students are within the allowed violation limit</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Test Visibility
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Visible to Students
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Toggle whether students can see and access this test
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const newValue = !isVisible;
                          setIsVisible(newValue);
                          await update(ref(database, `Exam/${testId}`), { isVisible: newValue });
                          toast.success(newValue ? 'Test is now visible to students' : 'Test is now hidden from students');
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isVisible ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isVisible ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Allowed Languages Configuration */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allowed Languages for Coding Questions</label>
                  <div className="flex flex-wrap gap-3 p-3 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                    {availableLanguages.map((lang) => (
                      <label key={lang.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowedLanguages.includes(lang.id)}
                          onChange={async (e) => {
                            let newLangs;
                            if (e.target.checked) {
                              newLangs = [...allowedLanguages, lang.id];
                            } else {
                              if (allowedLanguages.length > 1) {
                                newLangs = allowedLanguages.filter(l => l !== lang.id);
                              } else {
                                toast.error("At least one language must be allowed.");
                                return;
                              }
                            }
                            setAllowedLanguages(newLangs);
                            await handleSaveTest({ allowedLanguages: newLangs });
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{lang.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Select which programming languages test takers are allowed to use.
                  </p>
                </div>

              </div>

              {/* Save status indicator */}
              <div className="mt-4 flex justify-end">
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="text-green-500">
                      <svg className="h-4 w-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Changes saved
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestManage;
