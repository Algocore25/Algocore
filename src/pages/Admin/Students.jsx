import React, { useState, useEffect, useCallback } from 'react';
import { FiTrash2, FiUserPlus, FiMail } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { ref, get, set, remove, push, update } from 'firebase/database';
import { database } from '../../firebase';

const Students = ({ test, setTest, testId }) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [manualStudents, setManualStudents] = useState({});
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      const eligibleRef = ref(database, `Exam/${testId}/Eligible`);
      const snapshot = await get(eligibleRef);

      if (!snapshot.exists()) {
        return { eligibleStudents: {}, enrolledStudents: [] };
      }

      const eligibleData = snapshot.val();
      let eligibleStudents = {};

      // Handle both formats: {email:name} and array/object formats
      if (eligibleData && typeof eligibleData === 'object' && !Array.isArray(eligibleData)) {
        // New format: {name:email}
        eligibleStudents = eligibleData;
      } else if (Array.isArray(eligibleData)) {
        // Old array format
        eligibleStudents = eligibleData.reduce((acc, student) => {
          acc[student.name] = student.email;
          return acc;
        }, {});
      } else if (eligibleData && typeof eligibleData === 'object') {
        // Old object format
        eligibleStudents = Object.entries(eligibleData).reduce((acc, [key, value]) => {
          if (typeof value === 'string') {
            acc[key] = value;
          } else {
            acc[value.name] = value.email;
          }
          return acc;
        }, {});
      }

      return {
        eligibleStudents,
        enrolledStudents: Object.keys(eligibleStudents)
      };
    } catch (error) {
      console.error('Error fetching students:', error);
      return { eligibleStudents: {}, enrolledStudents: [] };
    }
  }, [testId]);

  useEffect(() => {
    const loadStudents = async () => {
      const { eligibleStudents, enrolledStudents } = await fetchStudents();
      setManualStudents(eligibleStudents);
      setEnrolledStudents(enrolledStudents);
      setLoading(false);
    };

    if (testId) {
      loadStudents();
    }
  }, [testId, fetchStudents]);

  // Add student
  const addStudent = useCallback(async (student) => {
    try {
      if (!student.email || !student.name) {
        toast.error('Both email and name are required');
        return;
      }

      setIsSaving(true);

      // Get current students
      const eligibleRef = ref(database, `Exam/${testId}/Eligible`);
      const snapshot = await get(eligibleRef);
      const currentStudents = snapshot.exists() ? snapshot.val() : {};

      // Check for duplicate name
      if (currentStudents[student.name]) {
        toast.error('Student with this name already exists');
        return;
      }

      // Check for duplicate email
      const emailExists = Object.values(currentStudents).includes(student.email);
      if (emailExists) {
        toast.error('This email is already registered');
        return;
      }

      // Update Firebase with new student in name:mail format
      await update(eligibleRef, {
        [student.name]: student.email
      });

      // Update local state
      setManualStudents(prev => ({ ...prev, [student.name]: student.email }));
      setEnrolledStudents(prev => [...prev, student.name]);
      setNewStudent({ name: '', email: '' });

      toast.success('Student added successfully');
    } catch (err) {
      console.error('Add student error:', err);
      toast.error(`Failed to add student: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [testId]);

  // Delete student
  const deleteStudent = useCallback(async (studentId) => {
    try {
      setIsSaving(true);

      // For name:mail format, studentId is the name
      const updates = {};
      updates[`Exam/${testId}/Eligible/${studentId}`] = null;

      await update(ref(database), updates);

      setManualStudents(prev => {
        const newStudents = { ...prev };
        delete newStudents[studentId];
        return newStudents;
      });
      setEnrolledStudents(prev => prev.filter(id => id !== studentId));

      toast.success('Student deleted successfully');
    } catch (err) {
      toast.error('Failed to delete student');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [testId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      {/* Search and Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white p-2"
          />
        </div>
        <button
          onClick={() => {
            const filteredStudents = Object.entries(manualStudents).filter(([name, email]) =>
              name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setEnrolledStudents(filteredStudents.map(([name]) => name));
            toast.success(`Found ${filteredStudents.length} matching students`);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiMail className="mr-1.5 h-4 w-4" />
          Search
        </button>
      </div>

      {/* Student List */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden mb-4">
        <div className="max-h-96 overflow-y-auto">
          {enrolledStudents.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {enrolledStudents.map(studentName => {
                const studentEmail = manualStudents[studentName];
                return studentEmail ? (
                  <li key={studentName} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{studentName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{studentEmail}</p>
                    </div>
                    <button
                      onClick={() => deleteStudent(studentName)}
                      className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </li>
                ) : null;
              })}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No students found
            </div>
          )}
        </div>
      </div>

      {/* Add Student Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Students</h4>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            placeholder="Name"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white p-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white p-2"
          />
          <button
            onClick={async () => {
              if (newStudent.name && newStudent.email) {
                try {
                  await addStudent(newStudent);
                } catch (err) {
                  console.error(err);
                }
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiUserPlus className="mr-1.5 h-4 w-4" />
            Add Student
          </button>
        </div>
      </div>
    </div>
  );
};

export default Students;
