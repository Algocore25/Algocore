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
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    questionname: '',
    question: '',
    difficulty: 'Easy',
    type: '',
    constraints: '',
    Example: '',
    testcases: ''
  });

  const isEditMode = !!question;

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        questionname: question.questionname || '',
        question: question.question || '',
        difficulty: question.difficulty || 'Easy',
        type: question.type || '',
        constraints: question.constraints || '',
        Example: Array.isArray(question.Example) ? JSON.stringify(question.Example, null, 2) : (question.Example || ''),
        testcases: Array.isArray(question.testcases) ? JSON.stringify(question.testcases, null, 2) : (question.testcases || '')
      });
      setActiveTab('create');
    } else {
      setFormData({
        questionname: '',
        question: '',
        difficulty: 'Easy',
        type: '',
        constraints: '',
        Example: '',
        testcases: ''
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
    if (searchTerm.trim() === '') {
      setFilteredQuestions(questions);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = questions.filter(q => 
        (q.questionname && q.questionname.toLowerCase().includes(searchLower)) ||
        (q.question && q.question.toLowerCase().includes(searchLower))
      );
      setFilteredQuestions(filtered);
    }
  }, [searchTerm, questions]);

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

    let questionData = { ...formData };

    try {
      if (formData.Example.trim()) {
        questionData.Example = JSON.parse(formData.Example);
      }
      if (formData.testcases.trim()) {
        questionData.testcases = JSON.parse(formData.testcases);
      }
    } catch (error) {
      toast.error('Invalid JSON format in Examples or Test Cases.');
      return;
    }

    try {
      if (isEditMode) {
        const questionRef = ref(database, `questions/${question.id}`);
        await update(questionRef, questionData);
        toast.success('Question updated successfully!');
      } else {
        const questionsRef = ref(database, 'questions');
        const newQuestionRef = push(questionsRef);
        await set(newQuestionRef, questionData);
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
        <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
          <button 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-md ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveTab('create')}
            >
              {isEditMode ? 'Edit Question' : 'Create New Question'}
            </button>
            <button
              className={`px-4 py-2 rounded-md ${activeTab === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveTab('select')}
            >
              Select Existing Questions
            </button>
          </div>

          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  type="text"
                  name="questionname"
                  value={formData.questionname}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1"
                  placeholder="Enter question title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1"
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
                    className="w-full p-2 border rounded-md mt-1"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Type</label>
                  <input
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md mt-1"
                    placeholder="e.g., Array, String, DP"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Constraints</label>
                <textarea
                  name="constraints"
                  value={formData.constraints}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1"
                  rows="2"
                  placeholder="Enter constraints"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Examples </label>
                <textarea
                  name="Example"
                  value={formData.Example}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1 font-mono"
                  rows="4"
                  placeholder='Type Here'
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Test Cases </label>
                <textarea
                  name="testcases"
                  value={formData.testcases}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md mt-1 font-mono"
                  rows="4"
                  placeholder='Type Here'
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {isEditMode ? 'Save Changes' : 'Create Question'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="w-full p-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
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
                      className={`p-4 rounded-lg border ${selectedQuestions.includes(question.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      onClick={() => handleQuestionToggle(question.id)}
                    >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => {}}
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 ${selectedQuestions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
