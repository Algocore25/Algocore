import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ref, get, set, push, update } from 'firebase/database';
import { database } from '../../firebase';
import toast from 'react-hot-toast';

const AddQuestionModal = ({ isOpen, onClose, question, onAddQuestions }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterType, setFilterType] = useState('All');
  const [filterDiff, setFilterDiff] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    questionname: '',
    question: '',
    difficulty: 'Easy',
    type: 'MCQ',
    // MCQ/MSQ specific fields
    options: ['', '', '', ''],
    correctAnswer: 1,
    correctAnswers: [],
    explanation: '',
    // Numeric specific fields
    numericAnswer: '',
    // Programming specific fields
    constraints: [],
    Example: [],
    testcases: [],
    solution: '',
    // SQL specific fields
    schema: ''
  });

  const isEditMode = !!question;

  useEffect(() => {
    if (isEditMode) {
      const questionType = question.type || 'MCQ';
      setFormData({
        questionname: question.questionname || '',
        question: question.question || '',
        difficulty: question.difficulty || 'Easy',
        type: questionType,
        // MCQ/MSQ specific fields
        options: question.options || ['', '', '', ''],
        correctAnswer: question.correctAnswer || 1,
        correctAnswers: question.correctAnswers || [],
        explanation: question.explanation || '',
        // Numeric specific fields
        numericAnswer: question.numericAnswer || '',
        // Programming specific fields
        constraints: question.constraints || [],
        Example: question.Example || [],
        testcases: question.testcases || [],
        solution: question.solution || '',
        // SQL specific fields
        schema: question.schema || ''
      });
      setActiveTab('create');
    } else {
      setFormData({
        questionname: '',
        question: '',
        difficulty: 'Easy',
        type: 'MCQ',
        // MCQ/MSQ specific fields
        options: ['', '', '', ''],
        correctAnswer: 1,
        correctAnswers: [],
        explanation: '',
        // Numeric specific fields
        numericAnswer: '',
        // Programming specific fields
        constraints: [],
        Example: [],
        testcases: [],
        solution: '',
        // SQL specific fields
        schema: ''
      });
    }
  }, [isOpen, question, isEditMode]);

  useEffect(() => {
    if (isOpen) {
      const loadQuestions = async () => {
        try {
          const questionsRef = ref(database, 'questions');
          const snapshot = await get(questionsRef);
          if (snapshot.exists()) {
            const questionsData = snapshot.val();
            const questionsArray = Object.entries(questionsData).map(([id, questionData]) => ({
              id,
              ...questionData
            }));
            setQuestions(questionsArray);
            setFilteredQuestions(questionsArray);
          }
        } catch (error) {
          console.error('Error loading questions:', error);
          toast.error('Failed to load questions.');
        } finally {
          setIsLoading(false);
        }
      };
      loadQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    let result = [...questions];

    // Filter by Search Term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(q =>
        (q.questionname && q.questionname.toLowerCase().includes(searchLower)) ||
        (q.question && q.question.toLowerCase().includes(searchLower))
      );
    }

    // Filter by Type
    if (filterType !== 'All') {
      result = result.filter(q => q.type === filterType);
    }

    // Filter by Difficulty
    if (filterDiff !== 'All') {
      result = result.filter(q => q.difficulty === filterDiff);
    }

    // Sort
    result.sort((a, b) => {
      const nameA = (a.questionname || '').toLowerCase();
      const nameB = (b.questionname || '').toLowerCase();

      const diffMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      const diffA = diffMap[a.difficulty] || 0;
      const diffB = diffMap[b.difficulty] || 0;

      if (sortBy === 'name-asc') return nameA.localeCompare(nameB);
      if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
      if (sortBy === 'diff-asc') return diffA - diffB;
      if (sortBy === 'diff-desc') return diffB - diffA;

      return 0;
    });

    setFilteredQuestions(result);
  }, [searchTerm, filterType, filterDiff, sortBy, questions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.questionname || !formData.question) {
      toast.error('Title and Description are required.');
      return;
    }

    // Validate based on question type
    if (formData.type === 'MCQ' || formData.type === 'MSQ') {
      if (formData.options.some(option => !option.trim())) {
        toast.error(`All ${formData.type} options are required.`);
        return;
      }
      if (formData.type === 'MSQ' && formData.correctAnswers.length === 0) {
        toast.error('At least one correct answer must be selected for MSQ.');
        return;
      }
      if (!formData.explanation.trim()) {
        toast.error(`Explanation is required for ${formData.type} questions.`);
        return;
      }
    } else if (formData.type === 'Numeric') {
      if (formData.numericAnswer === null || formData.numericAnswer === undefined || formData.numericAnswer.toString().trim() === '') {
        toast.error('Numeric answer is required.');
        return;
      }
      if (!formData.explanation.trim()) {
        toast.error('Explanation is required for Numeric questions.');
        return;
      }
    } else if (formData.type === 'Programming') {
      if (formData.constraints.length === 0) {
        toast.error('At least one constraint is required for Programming questions.');
        return;
      }
      if (formData.testcases.length === 0) {
        toast.error('At least one test case is required for Programming questions.');
        return;
      }
    } else if (formData.type === 'SQL') {
      if (!formData.schema || !formData.schema.trim()) {
        toast.error('Database schema is required for SQL questions.');
        return;
      }
      if (formData.testcases.length === 0) {
        toast.error('At least one test case is required for SQL questions.');
        return;
      }
    }

    // Prepare question data based on type
    let questionData = {
      questionname: formData.questionname,
      question: formData.question,
      difficulty: formData.difficulty,
      type: formData.type
    };

    if (formData.type === 'MCQ') {
      questionData = {
        ...questionData,
        options: formData.options,
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation
      };
    } else if (formData.type === 'MSQ') {
      questionData = {
        ...questionData,
        options: formData.options,
        correctAnswers: formData.correctAnswers,
        explanation: formData.explanation
      };
    } else if (formData.type === 'Numeric') {
      questionData = {
        ...questionData,
        numericAnswer: formData.numericAnswer,
        explanation: formData.explanation
      };
    } else if (formData.type === 'Programming') {
      questionData = {
        ...questionData,
        constraints: formData.constraints,
        Example: formData.Example,
        testcases: formData.testcases,
        solution: formData.solution
      };
    } else if (formData.type === 'SQL') {
      questionData = {
        ...questionData,
        schema: formData.schema,
        testcases: formData.testcases,
        solution: formData.solution
      };
    }

    try {
      if (isEditMode) {
        // Find existing ID. We use question.id.
        const questionRef = ref(database, `questions/${question.id}`);
        // Instead of replacing, update fields and delete others safely or just update.
        // wait, we can just update the whole object, but wait, if it's SQL, it doesn't have options.
        await update(questionRef, questionData);
        toast.success('Question updated successfully!');
      } else {
        const questionRef = ref(database, `questions/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        await set(questionRef, questionData);
        toast.success('Question added successfully!');
      }
      onClose();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question.');
    }
  };

  const handleQuestionToggle = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleAddSelected = () => {
    if (typeof onAddQuestions === 'function') {
      const selected = questions.filter(q => selectedQuestions.includes(q.id));
      onAddQuestions(selected);
      onClose();
    } else {
      toast.error('Cannot add questions to test. Functionality not available.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-dark-secondary p-6 shadow-xl">
          <button
            className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-md ${activeTab === 'create' ? 'bg-blue-600 text-white dark:text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              onClick={() => setActiveTab('create')}
            >
              {isEditMode ? 'Edit Question' : 'Create New Question'}
            </button>
            <button
              className={`px-4 py-2 rounded-md ${activeTab === 'select' ? 'bg-blue-600 text-white dark:text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              onClick={() => setActiveTab('select')}
            >
              Select Existing Questions
            </button>
          </div>

          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 bg-white dark:bg-dark-secondary">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  type="text"
                  name="questionname"
                  value={formData.questionname}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  placeholder="Enter question title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  rows="4"
                  placeholder="Enter question description"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="MSQ">MSQ</option>
                    <option value="Numeric">Numeric</option>
                    <option value="Programming">Programming</option>
                    <option value="SQL">SQL</option>
                  </select>
                </div>
              </div>

              {/* MCQ/MSQ Specific Fields */}
              {(formData.type === 'MCQ' || formData.type === 'MSQ') && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Options</label>
                    {formData.options.map((option, index) => (
                      <input
                        key={index}
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index] = e.target.value;
                          setFormData(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="w-full p-2 border rounded-md mt-1"
                        placeholder={`Option ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Correct Answer{formData.type === 'MSQ' ? 's' : ''}</label>
                    {formData.type === 'MCQ' ? (
                      <select
                        value={formData.correctAnswer}
                        onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: parseInt(e.target.value) }))}
                        className="w-full p-2 border rounded-md mt-1"
                      >
                        {formData.options.map((_, index) => (
                          <option key={index} value={index + 1}>
                            Option {index + 1}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex flex-wrap gap-4 mt-2">
                        {formData.options.map((_, index) => (
                          <label key={index} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.correctAnswers.includes(index + 1)}
                              onChange={(e) => {
                                const val = index + 1;
                                setFormData(prev => {
                                  const currentAnswers = prev.correctAnswers || [];
                                  if (e.target.checked) {
                                    return { ...prev, correctAnswers: [...currentAnswers, val] };
                                  } else {
                                    return { ...prev, correctAnswers: currentAnswers.filter(a => a !== val) };
                                  }
                                });
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm">Option {index + 1}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Explanation</label>
                    <textarea
                      value={formData.explanation}
                      onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1"
                      rows="3"
                      placeholder="Explain why this is the correct answer"
                    />
                  </div>
                </>
              )}

              {/* Numeric Specific Fields */}
              {formData.type === 'Numeric' && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Correct Answer (Numeric)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.numericAnswer}
                      onChange={(e) => setFormData(prev => ({ ...prev, numericAnswer: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1"
                      placeholder="Enter the numeric answer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Explanation</label>
                    <textarea
                      value={formData.explanation}
                      onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1"
                      rows="3"
                      placeholder="Explain the solution"
                    />
                  </div>
                </>
              )}

              {/* Programming Specific Fields */}
              {formData.type === 'Programming' && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Constraints</label>
                    {formData.constraints.map((constraint, index) => (
                      <div key={index} className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={constraint}
                          onChange={(e) => {
                            const newConstraints = [...formData.constraints];
                            newConstraints[index] = e.target.value;
                            setFormData(prev => ({ ...prev, constraints: newConstraints }));
                          }}
                          className="flex-1 p-2 border rounded-md"
                          placeholder={`Constraint ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newConstraints = formData.constraints.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, constraints: newConstraints }));
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, constraints: [...prev.constraints, ''] }))}
                      className="mt-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add Constraint
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Examples</label>
                    {formData.Example.map((example, index) => (
                      <div key={index} className="flex gap-2 mt-1">
                        <textarea
                          value={example}
                          onChange={(e) => {
                            const newExamples = [...formData.Example];
                            newExamples[index] = e.target.value;
                            setFormData(prev => ({ ...prev, Example: newExamples }));
                          }}
                          className="flex-1 p-2 border rounded-md font-mono"
                          rows="3"
                          placeholder={`Example ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newExamples = formData.Example.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, Example: newExamples }));
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, Example: [...prev.Example, ''] }))}
                      className="mt-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add Example
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Test Cases</label>
                    {formData.testcases.map((testcase, index) => (
                      <div key={index} className="border rounded-md p-3 mt-2">
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Input</label>
                            <textarea
                              value={testcase.input || ''}
                              onChange={(e) => {
                                const newTestcases = [...formData.testcases];
                                newTestcases[index] = { ...newTestcases[index], input: e.target.value };
                                setFormData(prev => ({ ...prev, testcases: newTestcases }));
                              }}
                              className="w-full p-2 border rounded-md font-mono text-sm"
                              rows="2"
                              placeholder="Test case input"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Expected Output</label>
                            <textarea
                              value={testcase.expectedOutput || ''}
                              onChange={(e) => {
                                const newTestcases = [...formData.testcases];
                                newTestcases[index] = { ...newTestcases[index], expectedOutput: e.target.value };
                                setFormData(prev => ({ ...prev, testcases: newTestcases }));
                              }}
                              className="w-full p-2 border rounded-md font-mono text-sm"
                              rows="2"
                              placeholder="Expected output"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newTestcases = formData.testcases.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, testcases: newTestcases }));
                            }}
                            className="self-start px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                          >
                            Remove Test Case
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, testcases: [...prev.testcases, { input: '', expectedOutput: '' }] }))}
                      className="mt-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add Test Case
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Solution (Optional)</label>
                    <textarea
                      value={formData.solution}
                      onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1 font-mono"
                      rows="6"
                      placeholder="Enter the solution code (optional)"
                    />
                  </div>
                </>
              )}

              {/* SQL Specific Fields */}
              {formData.type === 'SQL' && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Database Schema (SQL)</label>
                    <textarea
                      value={formData.schema}
                      onChange={(e) => setFormData(prev => ({ ...prev, schema: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1 font-mono text-sm"
                      rows="6"
                      placeholder="CREATE TABLE ...&#10;INSERT INTO ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Test Cases</label>
                    {formData.testcases.map((testcase, index) => (
                      <div key={index} className="border rounded-md p-3 mt-2">
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Test Case Name / Regex / Input</label>
                            <textarea
                              value={testcase.input || ''}
                              onChange={(e) => {
                                const newTestcases = [...formData.testcases];
                                newTestcases[index] = { ...newTestcases[index], input: e.target.value };
                                setFormData(prev => ({ ...prev, testcases: newTestcases }));
                              }}
                              className="w-full p-2 border rounded-md font-mono text-sm"
                              rows="2"
                              placeholder="Test case input or regex"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Expected Output</label>
                            <textarea
                              value={testcase.expectedOutput || ''}
                              onChange={(e) => {
                                const newTestcases = [...formData.testcases];
                                newTestcases[index] = { ...newTestcases[index], expectedOutput: e.target.value };
                                setFormData(prev => ({ ...prev, testcases: newTestcases }));
                              }}
                              className="w-full p-2 border rounded-md font-mono text-sm"
                              rows="2"
                              placeholder="Expected output"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newTestcases = formData.testcases.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, testcases: newTestcases }));
                            }}
                            className="self-start px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                          >
                            Remove Test Case
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, testcases: [...prev.testcases, { input: '', expectedOutput: '' }] }))}
                      className="mt-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add Test Case
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Solution Query (Optional)</label>
                    <textarea
                      value={formData.solution}
                      onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                      className="w-full p-2 border rounded-md mt-1 font-mono text-sm"
                      rows="4"
                      placeholder="SELECT * FROM ..."
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isEditMode ? 'Save Changes' : 'Create Question'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Search questions by name or description..."
                  className="w-full p-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="MCQ">MCQ</option>
                  <option value="MSQ">MSQ</option>
                  <option value="Numeric">Numeric</option>
                  <option value="Programming">Programming</option>
                  <option value="SQL">SQL</option>
                </select>
                <select
                  value={filterDiff}
                  onChange={(e) => setFilterDiff(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white cursor-pointer"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white cursor-pointer"
                >
                  <option value="name-asc">Sort by Name (A-Z)</option>
                  <option value="name-desc">Sort by Name (Z-A)</option>
                  <option value="diff-asc">Sort by Difficulty (Easy to Hard)</option>
                  <option value="diff-desc">Sort by Difficulty (Hard to Easy)</option>
                </select>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-4">
                {isLoading ? (
                  <div>Loading questions...</div>
                ) : filteredQuestions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    {searchTerm ? 'No questions match your search.' : 'No questions available.'}
                  </p>
                ) : (
                  filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border ${selectedQuestions.includes(question.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'}`}
                      onClick={() => handleQuestionToggle(question.id)}
                    >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => { }}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-900">
                            {question.questionname}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {question.question || 'No description available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 ${selectedQuestions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleAddSelected}
                  disabled={selectedQuestions.length === 0}
                >
                  Add Selected ({selectedQuestions.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddQuestionModal;