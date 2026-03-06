'use client';

import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, get, remove, update } from 'firebase/database';
import { Trash2, Edit, Eye, Search, Filter, Download, Upload, Copy, CheckCircle, XCircle, AlertCircle, BookOpen, Code, Database, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AllQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedMapping, setSelectedMapping] = useState('all'); // all, mapped, unmapped
  const [viewMode, setViewMode] = useState('grid'); // grid, table, cards
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [showMappingStats, setShowMappingStats] = useState(true);

  // Fetch all questions and courses
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch questions and courses from Firebase
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all questions
      const questionsRef = ref(database, 'questions');
      const questionsSnapshot = await get(questionsRef);

      // Fetch all courses from the Courses list (for metadata)
      const coursesRef = ref(database, 'Courses');
      const coursesSnapshot = await get(coursesRef);

      // Fetch AlgoCore (where lessons/questions are actually stored)
      const algoCoreRef = ref(database, 'AlgoCore');
      const algoCoreSnapshot = await get(algoCoreRef);

      const questionsData = [];
      const coursesData = [];

      // Process questions
      if (questionsSnapshot.exists()) {
        const data = questionsSnapshot.val();
        Object.keys(data).forEach(questionId => {
          const question = data[questionId];
          questionsData.push({
            id: questionId,
            ...question,
            // Add metadata
            hasTestCase: !!(question.testcases && question.testcases.length > 0),
            hasExample: !!(question.Example && question.Example.length > 0),
            hasConstraints: !!(question.constraints && question.constraints.length > 0),
            wordCount: question.question ? question.question.split(' ').length : 0,
          });
        });
      }

      // Build a map of courseId -> course metadata from Courses list
      const courseMeta = {};
      if (coursesSnapshot.exists()) {
        const data = coursesSnapshot.val();
        Object.values(data).forEach(course => {
          if (course && course.id) {
            courseMeta[course.id] = course;
          }
        });
      }

      // Process courses from AlgoCore (this is where lessons are stored by CourseEdit)
      if (algoCoreSnapshot.exists()) {
        const data = algoCoreSnapshot.val();
        console.log('🔍 Raw AlgoCore data keys:', Object.keys(data));
        Object.keys(data).forEach(courseId => {
          const algoCourse = data[courseId];
          const meta = courseMeta[courseId] || {};
          console.log(`🔍 AlgoCore course ${courseId}:`, algoCourse);
          coursesData.push({
            id: courseId,
            coursename: algoCourse.course?.title || meta.title || meta.coursename || courseId,
            lessons: algoCourse.lessons || null,
            questions: algoCourse.questions || null,
            questionCount: 0, // Will be calculated below
          });
        });
      }

      // If no AlgoCore data, fall back to Courses
      if (coursesData.length === 0 && coursesSnapshot.exists()) {
        const data = coursesSnapshot.val();
        console.log('🔍 Falling back to Courses data:', data);
        Object.keys(data).forEach(courseKey => {
          const course = data[courseKey];
          console.log(`🔍 Course ${courseKey}:`, course);
          coursesData.push({
            id: courseKey,
            ...course,
            questionCount: 0,
          });
        });
      }

      // Map questions to courses
      const questionsWithCourses = questionsData.map(question => {

        // Helper: check if a value matches this question (by ID or questionname)
        const matchesQuestion = (q) => {
          if (typeof q === 'string') {
            return q === question.id || q === question.questionname;
          }
          if (typeof q === 'object' && q !== null) {
            return q.questionId === question.id || q.id === question.id ||
              q.questionname === question.questionname;
          }
          return false;
        };

        const mappedCourses = coursesData.filter(course => {
          // Structure 1: Direct question references in course.questions
          if (course.questions) {
            const qValues = Array.isArray(course.questions)
              ? course.questions
              : Object.values(course.questions);
            if (qValues.some(matchesQuestion)) {
              console.log(`✅ Direct match in course ${course.id}`);
              return true;
            }
          }

          // Structure 2: Nested lessons (CourseEdit stores in AlgoCore/courseId/lessons)
          // Each lesson has a `questions` array of question names or IDs
          if (course.lessons) {
            const found = Object.values(course.lessons).some(lesson => {
              if (lesson.questions) {
                const qVals = Array.isArray(lesson.questions)
                  ? lesson.questions
                  : Object.values(lesson.questions);
                return qVals.some(matchesQuestion);
              }
              // topics sub-structure
              if (lesson.topics) {
                return Object.values(lesson.topics).some(topic => {
                  if (topic.questions) {
                    const qVals = Array.isArray(topic.questions)
                      ? topic.questions
                      : Object.values(topic.questions);
                    return qVals.some(matchesQuestion);
                  }
                  return false;
                });
              }
              return false;
            });
            if (found) {
              console.log(`✅ Lesson match in course ${course.id}`);
              return true;
            }
          }

          console.log(`❌ No match found in course ${course.id}`);
          return false;
        });

        console.log(`🔍 Question ${question.id} mapped to courses:`, mappedCourses.map(c => c.id));

        return {
          ...question,
          mappedCourses: mappedCourses.map(c => ({ id: c.id, name: c.coursename || c.name || 'Unknown Course' })),
          isMapped: mappedCourses.length > 0
        };
      });

      // Update course question counts
      const coursesWithCounts = coursesData.map(course => {
        const questionCount = questionsWithCourses.filter(q =>
          q.mappedCourses.some(c => c.id === course.id)
        ).length;

        return {
          ...course,
          questionCount
        };
      });

      setQuestions(questionsWithCourses);
      setFilteredQuestions(questionsWithCourses);
      setCourses(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load questions and courses');
    } finally {
      setLoading(false);
    }
  };

  // Filter questions based on search and filters
  useEffect(() => {
    let filtered = questions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.questionname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Course filter
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(q =>
        q.mappedCourses.some(c => c.id === selectedCourse)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(q => q.type === selectedType);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    // Mapping status filter
    if (selectedMapping !== 'all') {
      filtered = filtered.filter(q =>
        selectedMapping === 'mapped' ? q.isMapped : !q.isMapped
      );
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, selectedCourse, selectedType, selectedDifficulty, selectedMapping]);

  // Calculate mapping statistics
  const mappedCount = questions.filter(q => q.isMapped).length;
  const unmappedCount = questions.filter(q => !q.isMapped).length;
  const mappingPercentage = questions.length > 0 ? ((mappedCount / questions.length) * 100).toFixed(1) : 0;

  // Delete single question
  const deleteQuestion = async (questionId) => {
    try {
      const questionRef = ref(database, `questions/${questionId}`);
      await remove(questionRef);

      // Remove from all courses
      const updatedCourses = courses.map(course => {
        if (course.questions) {
          const updatedQuestions = { ...course.questions };
          Object.keys(updatedQuestions).forEach(key => {
            if (updatedQuestions[key] === questionId ||
              updatedQuestions[key].questionId === questionId) {
              delete updatedQuestions[key];
            }
          });

          if (Object.keys(updatedQuestions).length > 0) {
            // Update course in Firebase
            const courseRef = ref(database, `courses/${course.id}`);
            update(courseRef, { questions: updatedQuestions });
          }
        }
        return course;
      });

      setQuestions(questions.filter(q => q.id !== questionId));
      toast.success('Question deleted successfully');
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  // Bulk delete questions
  const bulkDeleteQuestions = async () => {
    try {
      const deletePromises = Array.from(selectedQuestions).map(async (questionId) => {
        const questionRef = ref(database, `questions/${questionId}`);
        await remove(questionRef);
      });

      await Promise.all(deletePromises);

      // Remove from courses
      const updatedCourses = courses.map(course => {
        if (course.questions) {
          const updatedQuestions = { ...course.questions };
          Object.keys(updatedQuestions).forEach(key => {
            if (selectedQuestions.has(updatedQuestions[key]) ||
              selectedQuestions.has(updatedQuestions[key].questionId)) {
              delete updatedQuestions[key];
            }
          });

          if (Object.keys(updatedQuestions).length > 0) {
            const courseRef = ref(database, `courses/${course.id}`);
            update(courseRef, { questions: updatedQuestions });
          }
        }
        return course;
      });

      setQuestions(questions.filter(q => !selectedQuestions.has(q.id)));
      setSelectedQuestions(new Set());
      toast.success(`${selectedQuestions.size} questions deleted successfully`);
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Error bulk deleting questions:', error);
      toast.error('Failed to delete questions');
    }
  };

  // Toggle question selection
  const toggleQuestionSelection = (questionId) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedQuestions(newSelection);
  };

  // Toggle all questions selection
  const toggleAllQuestionsSelection = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  // Toggle all unmapped questions selection
  const selectUnmappedQuestions = () => {
    const unmappedIds = filteredQuestions
      .filter(q => !q.isMapped)
      .map(q => q.id);

    if (unmappedIds.length === 0) return;

    // Check if all unmapped are already selected
    const allUnmappedSelected = unmappedIds.every(id => selectedQuestions.has(id));

    const newSelection = new Set(selectedQuestions);

    if (allUnmappedSelected) {
      // Deselect all unmapped
      unmappedIds.forEach(id => newSelection.delete(id));
    } else {
      // Select all unmapped
      unmappedIds.forEach(id => newSelection.add(id));
    }

    setSelectedQuestions(newSelection);
  };

  // Toggle question expansion
  const toggleQuestionExpansion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  // Export questions data
  const exportQuestions = () => {
    const dataToExport = filteredQuestions.map(q => ({
      id: q.id,
      name: q.questionname,
      type: q.type,
      difficulty: q.difficulty,
      question: q.question,
      mappedCourses: q.mappedCourses.map(c => c.name),
      hasTestCase: q.hasTestCase,
      hasExample: q.hasExample,
      hasConstraints: q.hasConstraints,
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Questions exported successfully');
  };

  // Copy question ID
  const copyQuestionId = (questionId) => {
    navigator.clipboard.writeText(questionId);
    toast.success('Question ID copied to clipboard');
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-dark-secondary shadow-sm border-b border-gray-200 dark:border-dark-tertiary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Questions Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredQuestions.length} of {questions.length} questions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportQuestions}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
              {selectedQuestions.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete ({selectedQuestions.size})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mapping Statistics */}
      {showMappingStats && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Course Mapping Statistics:
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  ✓ {mappedCount} Mapped ({mappingPercentage}%)
                </span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  ✗ {unmappedCount} Unmapped ({(100 - mappingPercentage).toFixed(1)}%)
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Total: {questions.length} questions
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowMappingStats(!showMappingStats)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              <Eye size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-tertiary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-tertiary bg-gray-50 dark:bg-dark-tertiary text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Course Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-tertiary bg-gray-50 dark:bg-dark-tertiary text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.coursename} ({course.questionCount})
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-tertiary bg-gray-50 dark:bg-dark-tertiary text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Types</option>
              <option value="Programming">Programming</option>
              <option value="SQL">SQL</option>
              <option value="MCQ">MCQ</option>
              <option value="MSQ">MSQ</option>
              <option value="Numeric">Numeric</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-tertiary bg-gray-50 dark:bg-dark-tertiary text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {/* Mapping Status Filter */}
            <select
              value={selectedMapping}
              onChange={(e) => setSelectedMapping(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-tertiary bg-gray-50 dark:bg-dark-tertiary text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Questions</option>
              <option value="mapped">✓ Mapped Only</option>
              <option value="unmapped">✗ Unmapped Only</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-2 border border-gray-300 dark:border-dark-tertiary rounded-lg bg-gray-50 dark:bg-dark-tertiary overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-inner' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-secondary'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-inner' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-secondary'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-inner' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-secondary'}`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Select All */}
        {filteredQuestions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedQuestions.size === filteredQuestions.length}
                onChange={toggleAllQuestionsSelection}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-tertiary rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Select all ({filteredQuestions.length} questions)
              </span>
            </div>

            {filteredQuestions.filter(q => !q.isMapped).length > 0 && (
              <button
                onClick={selectUnmappedQuestions}
                className="px-3 py-1.5 bg-white dark:bg-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-tertiary text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors border border-gray-300 dark:border-dark-tertiary shadow-sm"
              >
                Select All Unmapped ({filteredQuestions.filter(q => !q.isMapped).length})
              </button>
            )}
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map(question => (
              <div key={question.id} className="bg-white dark:bg-dark-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-tertiary hover:shadow-md transition-all duration-200">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-tertiary rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 dark:text-gray-400">
                          {getTypeIcon(question.type)}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full ${question.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : question.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {question.difficulty || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyQuestionId(question.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Copy ID"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => setQuestionToDelete(question)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 leading-tight">
                    {question.questionname || 'Unnamed Question'}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                    {question.question || 'No description available'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-mono bg-gray-100 dark:bg-dark-tertiary px-1.5 py-0.5 rounded">ID: {question.id}</span>
                    <span>•</span>
                    <span>{question.wordCount} words</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.hasTestCase && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-[10px] font-bold uppercase rounded border border-green-100 dark:border-green-800/50">TC</span>
                    )}
                    {question.hasExample && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-100 dark:border-blue-800/50">EX</span>
                    )}
                    {question.hasConstraints && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 text-[10px] font-bold uppercase rounded border border-purple-100 dark:border-purple-800/50">CO</span>
                    )}
                  </div>

                  <div className="border-t border-gray-100 dark:border-dark-tertiary pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Course Mapping</span>
                      {question.isMapped ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                          ✓ {question.mappedCourses.length} Courses
                        </span>
                      ) : (
                        <span className="text-xs text-red-500 dark:text-red-400 font-bold uppercase tracking-tighter italic">✗ Unmapped</span>
                      )}
                    </div>
                    {question.mappedCourses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {question.mappedCourses.map(course => (
                          <span key={course.id} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] rounded font-bold border border-blue-100 dark:border-blue-800/50 truncate max-w-[120px]">
                            {course.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-tertiary overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-tertiary">
              <thead className="bg-gray-50 dark:bg-dark-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.size === filteredQuestions.length}
                      onChange={toggleAllQuestionsSelection}
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-secondary divide-y divide-gray-200 dark:divide-dark-tertiary">
                {filteredQuestions.map(question => (
                  <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-dark-tertiary/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {question.questionname || 'Unnamed Question'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {question.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        {getTypeIcon(question.type)}
                        <span className="text-sm">{question.type || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full ${question.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : question.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {question.difficulty || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {question.isMapped ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-green-600 dark:text-green-400 font-bold">✓</span>
                            <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium">{question.mappedCourses.length} Course(s)</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {question.mappedCourses.map(course => (
                              <span key={course.id} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] rounded border border-blue-100 dark:border-blue-800/50">
                                {course.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-red-500 dark:text-red-400 font-bold">✗</span>
                          <span className="text-[11px] text-red-500 dark:text-red-400 font-bold uppercase tracking-tight">Not mapped</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1.5">
                        {question.hasTestCase && (
                          <span className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-black uppercase rounded border border-green-100 dark:border-green-800/50">TC</span>
                        )}
                        {question.hasExample && (
                          <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[9px] font-black uppercase rounded border border-blue-100 dark:border-blue-800/50">EX</span>
                        )}
                        {question.hasConstraints && (
                          <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[9px] font-black uppercase rounded border border-purple-100 dark:border-purple-800/50">CO</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyQuestionId(question.id)}
                          className="p-1 px-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Copy ID"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => setQuestionToDelete(question)}
                          className="p-1 px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div className="space-y-4">
            {filteredQuestions.map(question => (
              <div key={question.id} className="bg-white dark:bg-dark-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-tertiary hover:shadow-md transition-all duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-tertiary rounded focus:ring-blue-500"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {question.questionname || 'Unnamed Question'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">ID: {question.id}</span>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            {getTypeIcon(question.type)}
                            <span className="text-sm font-medium">{question.type || 'Unknown'}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full ${question.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : question.difficulty?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {question.difficulty || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleQuestionExpansion(question.id)}
                        className={`p-2 rounded transition-colors ${expandedQuestions.has(question.id) ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:bg-dark-tertiary'}`}
                        title="Expand/Collapse"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => copyQuestionId(question.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:bg-dark-tertiary rounded transition-colors"
                        title="Copy ID"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => setQuestionToDelete(question)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 dark:hover:bg-dark-tertiary rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {expandedQuestions.has(question.id)
                        ? question.question || 'No description available'
                        : (question.question || 'No description available').substring(0, 300) +
                        ((question.question || '').length > 300 ? '...' : '')
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-gray-50 dark:bg-dark-tertiary/40 p-3 rounded-lg border border-gray-100 dark:border-dark-tertiary">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Word Count</span>
                      <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">{question.wordCount}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-tertiary/40 p-3 rounded-lg border border-gray-100 dark:border-dark-tertiary">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Test Cases</span>
                      <p className={`text-base font-semibold mt-1 ${question.hasTestCase ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {question.hasTestCase ? 'Available' : 'None'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-tertiary/40 p-3 rounded-lg border border-gray-100 dark:border-dark-tertiary">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Examples</span>
                      <p className={`text-base font-semibold mt-1 ${question.hasExample ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {question.hasExample ? 'Available' : 'None'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-tertiary/40 p-3 rounded-lg border border-gray-100 dark:border-dark-tertiary">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Constraints</span>
                      <p className={`text-base font-semibold mt-1 ${question.hasConstraints ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {question.hasConstraints ? 'Available' : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-dark-tertiary pt-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Course Mapping:</span>
                        {question.isMapped ? (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ {question.mappedCourses.length} course(s)
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">✗ Not mapped</span>
                        )}
                      </div>
                      {question.isMapped && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {question.mappedCourses.map(course => (
                            <span key={course.id} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium border border-blue-200">
                              📘 {course.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {!question.isMapped && (
                        <div className="text-xs text-gray-500 italic">
                          This question is not assigned to any course
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* No Results */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-tertiary shadow-sm">
          <div className="text-gray-400 dark:text-gray-600 mb-6">
            <Search size={64} className="mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No questions found</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find any questions matching your current search or filter criteria. Try adjusting them.
          </p>
        </div>
      )}
    </div>

    {/* Delete Confirmation Modal */}
    {showDeleteModal && questionToDelete && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl" onClick={() => setShowDeleteModal(false)}></div>
        <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative z-10 animate-slideUp">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Question</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="mb-8 p-4 bg-gray-50 dark:bg-dark-tertiary/50 rounded-xl border border-gray-100 dark:border-dark-tertiary">
              <p className="text-base font-bold text-gray-900 dark:text-white">{questionToDelete.questionname}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">ID: {questionToDelete.id}</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setQuestionToDelete(null);
                }}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-tertiary hover:bg-gray-200 dark:hover:bg-dark-tertiary/80 rounded-xl transition-all"
              >
                Keep Question
              </button>
              <button
                onClick={() => deleteQuestion(questionToDelete.id)}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 rounded-xl transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Bulk Delete Confirmation Modal */}
    {showBulkDeleteModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl" onClick={() => setShowBulkDeleteModal(false)}></div>
        <div className="bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative z-10 animate-slideUp">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Bulk Delete</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  You are about to delete multiple questions.
                </p>
              </div>
            </div>

            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/40 text-center">
              <span className="text-3xl font-black text-red-600 dark:text-red-400">{selectedQuestions.size}</span>
              <p className="text-sm font-bold text-red-700 dark:text-red-300 mt-1 uppercase tracking-wider">Questions Selected</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-tertiary hover:bg-gray-200 dark:hover:bg-dark-tertiary/80 rounded-xl transition-all"
              >
                Keep Questions
              </button>
              <button
                onClick={bulkDeleteQuestions}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 rounded-xl transition-all"
              >
                Delete {selectedQuestions.size} Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default AllQuestionsPage;
