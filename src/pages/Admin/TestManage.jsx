import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiUsers, FiSettings, FiSave, FiTrash2, FiEdit2, FiX, FiCheck, FiUserPlus, FiMail } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { ref, onValue, set, push, update, remove, get } from 'firebase/database';
import { database } from '../../firebase';
import Questions from './Questions';
import Students from './Students';
import LoadingPage from '../LoadingPage';

const TestManage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  // State management
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('questions'); // 'students', 'questions' or 'settings'
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch test data
  useEffect(() => {
    if (!testId) {
      setLoading(false);
      return;
    }

    const testRef = ref(database, `Exam/${testId}`);
    const unsubscribe = onValue(testRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Fetch students separately
        const { eligibleStudents, enrolledStudents } = await fetchStudents(testId);

        setTest({
          id: testId,
          ...data,
          Eligible: eligibleStudents,
          Properties: data.Properties || { status: 'NotStarted' },
          Progress: data.Progress || {}
        });

        // Update local state
        setTestTitle(data.name || '');
        setDuration(data.duration || 60);
      } else {
        setTest(null);
      }
      setLoading(false);
    }, (error) => {
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [testId]);

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

  if (loading) {
    return (
      <LoadingPage message="Loading test, please wait..."/>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                  {test?.questions?.length || 0} Questions
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
                onClick={() => setActiveTab('settings')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                  }`}
              >
                <FiSettings className="inline mr-1.5 h-4 w-4" />
                Settings
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="test-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Test Name
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="test-name"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="flex-1 min-w-0 block w-full sm:text-sm border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white rounded-md p-2"
                      placeholder="Enter test name"
                    />
                    <button
                      onClick={handleUpdateTitle}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
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
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white pr-16 text-gray-900 dark:text-gray-100"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">minutes</span>
                      </div>
                    </div>
                  </div>
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
