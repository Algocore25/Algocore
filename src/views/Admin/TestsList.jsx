// ...existing code...
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { getDatabase, ref, onValue, push, set, update, remove, get } from 'firebase/database';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import TestsSidebar from './TestsSidebar';
import { database } from '../../firebase';
import toast from 'react-hot-toast'; // Assuming you have react-hot-toast installed

// Import card components
import EditTestCard from './EditTestCard';
import AvailableTestCard from './AvailableTestCard';
import ResultTestCard from './ResultTestCard';
import LoadingPage from '../LoadingPage';
import AddQuestions from './AddQuestions';
import ManageCourses from './ManageCourses';
import BulkAddData from './BulkAddData';
import EmailPage from './EmailPage';
import ReminderPage from './ReminderPage';

const TestsList = () => {
  // ...existing code...
  const router = useRouter();

  // Declare all state variables first
  const [tests, setTests] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    // Load the saved tab from localStorage, default to 'tests'
    const savedTab = localStorage.getItem('adminActiveTab');
    if (['available-tests', 'results', 'edit-tests'].includes(savedTab)) {
      return 'tests';
    }
    return savedTab || 'tests';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingTest, setCreatingTest] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(null);

  // Fetch tests from database
  useEffect(() => {
    const db = getDatabase();
    const testsRef = ref(db, 'Exam');

    const unsubscribe = onValue(testsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const testsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTests(testsArray);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Automatically publish results when conditions are met
  useEffect(() => {
    if (!Array.isArray(tests)) return;
    tests.forEach(async (test) => {

      // Condition 1: All eligible students have submitted
      const eligible = Object.values(test.Eligible || {});
      const submissionsRef = ref(database, `ExamSubmissions/${test.id}`);
      const submissionsSnap = await get(submissionsRef);
      const submissions = submissionsSnap.exists() ? Object.keys(submissionsSnap.val()) : [];
      const allSubmitted = eligible.length > 0 && eligible.every(email => {
        // Find userId by email (assuming you have a mapping)
        // If Eligible is {uid: email}, use Object.keys(test.Eligible)
        return submissions.includes(email) || submissions.includes(Object.keys(test.Eligible).find(uid => test.Eligible[uid] === email));
      });
      // Condition 2: End time has passed (for scheduled exams)
      let endTimePassed = false;
      if (test.Properties?.endTime) {
        const now = new Date().getTime();
        const endTime = new Date(test.Properties.endTime).getTime();
        endTimePassed = now > endTime;
      }

    });
  }, [tests]);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const createNewTest = async () => {
    if (creatingTest) return;

    setCreatingTest(true);
    try {
      const examsRef = ref(database, 'Exam');
      const newExamRef = push(examsRef);

      await set(newExamRef, {
        id: newExamRef.key,
        name: `Exam-${newExamRef.key.slice(0, 5)}`,
        createdAt: new Date().toISOString(),
        questions: [],
        Eligible: {},
        duration: 60
      });

      // Navigate to the test edit page
      router.push(`/testedit/${newExamRef.key}`);
    } catch (error) {
      console.error('Error creating test:', error);
    } finally {
      setCreatingTest(false);
    }
  };




  const filteredTests = useMemo(() => {
    if (!Array.isArray(tests)) {
      return [];
    }

    return tests.filter(test => {
      const matchesSearch = test?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      if (activeTab === 'tests') return matchesSearch;

      return matchesSearch;
    });
  }, [tests, searchTerm, activeTab]);

  const sortedTests = useMemo(() => {
    const testsToSort = [...filteredTests];

    return testsToSort.sort((a, b) => {
      if (sortField === 'name') {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        const comparison = nameA.localeCompare(nameB);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      const dateA = new Date(a.completedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.completedAt || b.createdAt || 0).getTime();
      const comparison = dateA - dateB;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTests, sortField, sortOrder]);

  const handleDeleteAllResults = async () => {
    if (sortedTests.length === 0) return;

    setDeletionProgress({ current: 0, total: sortedTests.length });
    setIsConfirmDeleteAllOpen(false);

    let deleted = 0;
    for (const test of sortedTests) {
      try {
        await remove(ref(database, `Exam/${test.id}`));
        deleted++;
        setDeletionProgress(prev => ({ ...prev, current: deleted }));
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }

    toast.success(`Successfully deleted ${deleted} test(s).`);
    // Briefly show 100% before closing
    setTimeout(() => {
      setDeletionProgress(null);
    }, 1000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 -mx-4">
      <TestsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-y-auto p-6">
        {(activeTab !== 'manage-courses' && activeTab !== 'bulk-add' && activeTab !== 'email-center' && activeTab !== 'reminder-service') && (
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tests</h1>
            <div className="flex flex-wrap items-center gap-4 justify-end">
              <input
                type="text"
                placeholder="Search tests..."
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <label htmlFor="sortField" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort
                </label>
                <select
                  id="sortField"
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sortOrder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order
                </label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
              {activeTab === 'tests' && <button
                onClick={createNewTest}
                disabled={creatingTest}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
              >
                <FiPlus className="mr-2" />
                {creatingTest ? 'Creating...' : 'Create Test'}
              </button>}
              {activeTab === 'tests' && sortedTests.length > 0 && (
                <button
                  onClick={() => setIsConfirmDeleteAllOpen(true)}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  <FiTrash2 className="mr-2" />
                  Delete All Tests
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <LoadingPage message="Loading tests, please wait..." />
        ) : activeTab === 'manage-courses' ? (
          <ManageCourses />
        ) : activeTab === 'add-questions' ? (
          <AddQuestions />
        ) : activeTab === 'bulk-add' ? (
          <BulkAddData />
        ) : activeTab === 'email-center' ? (
          <EmailPage />
        ) : activeTab === 'reminder-service' ? (
          <ReminderPage />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTests.map((test) => {
              return (
                <div key={test.id}>
                  {activeTab === 'tests' && <EditTestCard test={test} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete All Confirmation Modal */}
      {isConfirmDeleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete All Tests?</h4>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
              This action cannot be undone. You are about to permanently delete all {sortedTests.length} tests listed here.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmDeleteAllOpen(false)}
                className="px-5 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllResults}
                className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold focus:outline-none"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar Modal */}
      {deletionProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md text-center">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Deleting Tests...</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Please do not close this window.</p>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3 overflow-hidden">
              <div
                className="bg-red-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(deletionProgress.current / deletionProgress.total) * 100}%` }}
              ></div>
            </div>

            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {deletionProgress.current} / {deletionProgress.total} deleted
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestsList;
