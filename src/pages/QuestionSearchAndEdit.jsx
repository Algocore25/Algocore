import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, get, set, child, push, getDatabase } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

const QuestionSearchAndEdit = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDevelopment, setIsDevelopment] = useState(false);
    const [bulkUploadData, setBulkUploadData] = useState('');
    const [bulkUploadMode, setBulkUploadMode] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Check if we're in development mode
    useEffect(() => {
        setIsDevelopment(process.env.NODE_ENV === 'development');
    }, []);

    // Search questions
    const performSearch = async (generateSuggestions = true) => {
        if (!searchTerm.trim()) {
            setQuestions([]);
            if (generateSuggestions) {
                setSearchSuggestions([]);
                setShowSuggestions(false);
            }
            return;
        }

        setLoading(true);
        try {
            const dbRef = ref(getDatabase());
            console.log('[Search Debug] Searching Firebase path: AlgoCore');
            const snapshot = await get(child(dbRef, 'AlgoCore'));
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('[Search Debug] Firebase data structure:', data);
                console.log('[Search Debug] Data keys:', Object.keys(data));
                const allQuestions = [];
                
                // Recursively search through all courses, subcourses, and questions
                const searchInObject = (obj, path = '') => {
                    Object.keys(obj).forEach(key => {
                        const currentPath = path ? `${path}/${key}` : key;
                        const value = obj[key];
                        
                        console.log('[Search Debug] Checking path:', currentPath, 'value type:', typeof value, 'has questionname:', !!(value.questionname || value.questionId || value.id));
                        
                        if (typeof value === 'object' && value !== null) {
                            // Check if this object has question properties
                            if (value.questionname || value.questionId || value.id) {
                                const questionName = (value.questionname || '').toLowerCase();
                                const questionId = (value.questionId || value.id || '').toLowerCase();
                                const searchLower = searchTerm.toLowerCase();
                                
                                if (questionName.includes(searchLower) || 
                                    questionId.includes(searchLower) || 
                                    currentPath.includes(searchLower)) {
                                    allQuestions.push({
                                        ...value,
                                        fullPath: currentPath,
                                        displayName: value.questionname || value.id || 'Unknown'
                                    });
                                }
                            } else {
                                // Recursively search deeper
                                searchInObject(value, currentPath);
                            }
                        }
                    });
                };
                
                searchInObject(data);
                console.log('[Search Debug] Total questions found:', allQuestions.length);
                setQuestions(allQuestions);
                
                // Generate suggestions from matching questions
                if (generateSuggestions) {
                    const suggestions = allQuestions.slice(0, 5).map(q => ({
                        id: q.id || q.questionId,
                        name: q.questionname || q.displayName,
                        path: q.fullPath
                    }));
                    console.log('[Search Debug] Generated suggestions:', suggestions);
                    setSearchSuggestions(suggestions);
                    setShowSuggestions(suggestions.length > 0);
                }
            } else {
                console.log('[Search Debug] No data found at AlgoCore path');
            }
        } catch (error) {
            console.error('Error searching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Manual search function (for button click)
    const searchQuestions = () => {
        performSearch(true);
    };

    // Debounced search for suggestions
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('[Search Debug] searchTerm:', searchTerm, 'length:', searchTerm.trim().length);
            if (searchTerm.trim().length >= 2) {
                console.log('[Search Debug] Triggering performSearch');
                performSearch(true);
            } else {
                console.log('[Search Debug] Clearing suggestions');
                setSearchSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle suggestion selection
    const handleSuggestionClick = (suggestion) => {
        console.log('[Search Debug] Suggestion clicked:', suggestion);
        setSearchTerm(suggestion.name);
        setShowSuggestions(false);
        // Load the selected question
        const question = questions.find(q => 
            (q.id === suggestion.id || q.questionId === suggestion.id) ||
            (q.questionname === suggestion.name)
        );
        if (question) {
            console.log('[Search Debug] Loading question:', question);
            loadQuestion(question);
        } else {
            console.log('[Search Debug] Question not found in results');
        }
    };

    // Load selected question
    const loadQuestion = async (question) => {
        try {
            const dbRef = ref(getDatabase());
            const snapshot = await get(child(dbRef, `AlgoCore/${question.fullPath}`));
            
            if (snapshot.exists()) {
                setSelectedQuestion({
                    ...snapshot.val(),
                    fullPath: question.fullPath
                });
            }
        } catch (error) {
            console.error('Error loading question:', error);
        }
    };

    // Save question
    const saveQuestion = async () => {
        if (!selectedQuestion) return;

        try {
            const dbRef = ref(getDatabase());
            await set(child(dbRef, `AlgoCore/${selectedQuestion.fullPath}`), selectedQuestion);
            alert('Question saved successfully!');
        } catch (error) {
            console.error('Error saving question:', error);
            alert('Error saving question. Please try again.');
        }
    };

    // Bulk upload questions
    const bulkUploadQuestions = async () => {
        if (!bulkUploadData.trim()) {
            alert('Please enter question data to upload');
            return;
        }

        try {
            const questions = JSON.parse(bulkUploadData);
            
            if (!Array.isArray(questions)) {
                alert('Data must be an array of questions');
                return;
            }

            setLoading(true);
            const dbRef = ref(getDatabase());
            let successCount = 0;
            let errorCount = 0;

            for (const question of questions) {
                try {
                    // Generate unique path for each question
                    const questionId = question.id || question.questionname?.replace(/\s+/g, '_') || `question_${Date.now()}`;
                    const course = question.course || 'General';
                    const subcourse = question.subcourse || 'Programming';
                    
                    // Create the question structure
                    const questionData = {
                        id: questionId,
                        questionname: question.questionname || question.id,
                        difficulty: question.difficulty || 'Easy',
                        type: question.type || 'Programming',
                        question: question.question || '',
                        Example: question.Example || [],
                        constraints: question.constraints || [],
                        allowedLanguages: question.allowedLanguages || ['cpp', 'java', 'python'],
                        defaultCode: question.defaultCode || {},
                        testcases: question.testcases || []
                    };

                    // Save to Firebase
                    await set(child(dbRef, `AlgoCore/${course}/lessons/${subcourse}/questions/${questionId}`), questionData);
                    successCount++;
                } catch (error) {
                    console.error('Error uploading question:', question.id || 'unknown', error);
                    errorCount++;
                }
            }

            alert(`Bulk upload completed!\n✅ Success: ${successCount} questions\n❌ Errors: ${errorCount} questions`);
            setBulkUploadData('');
            setLoading(false);
        } catch (error) {
            console.error('Error parsing bulk upload data:', error);
            alert('Invalid JSON format. Please check your data and try again.');
            setLoading(false);
        }
    };

    // Handle input changes
    const handleInputChange = (field, value) => {
        setSelectedQuestion(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Only show in development mode
    if (!isDevelopment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                        Development Mode Only
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        This page is only available in development mode.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Question Search & Edit (Development)
                        </h1>
                        <button 
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            Back to Home
                        </button>
                    </div>

                    {/* Search Section */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchQuestions()}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder="Search by question name or ID..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                                
                                {/* Suggestions Dropdown */}
                                {showSuggestions && searchSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {console.log('[Search Debug] Rendering suggestions dropdown, count:', searchSuggestions.length)}
                                        {searchSuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {suggestion.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {suggestion.path}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={searchQuestions}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        
                        {/* Bulk Upload Toggle */}
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={() => setBulkUploadMode(!bulkUploadMode)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                            >
                                {bulkUploadMode ? 'Hide Bulk Upload' : 'Show Bulk Upload'}
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Upload multiple questions at once
                            </span>
                        </div>
                    </div>

                    {/* Bulk Upload Section */}
                    {bulkUploadMode && (
                        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                Bulk Upload Questions
                            </h2>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Questions Data (JSON Array)
                                </label>
                                <textarea
                                    value={bulkUploadData}
                                    onChange={(e) => setBulkUploadData(e.target.value)}
                                    placeholder={`[
  {
    "id": "Class and Object",
    "questionname": "Class and Object",
    "difficulty": "Easy",
    "type": "Programming",
    "question": "Create a class 'Rectangle' with length and width fields...",
    "allowedLanguages": ["java", "cpp", "python"],
    "defaultCode": {
      "cpp": {
        "order": ["main", "Drivecode"],
        "main": {
          "code": "#include <iostream>",
          "editable": false,
          "visible": true
        }
      }
    },
    "testcases": [
      { "input": "5\\n3", "expectedOutput": "15" }
    ]
  }
]`}
                                    rows={12}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white font-mono text-sm"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={bulkUploadQuestions}
                                    disabled={loading}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {loading ? 'Uploading...' : 'Upload Questions'}
                                </button>
                                <button
                                    onClick={() => setBulkUploadData('')}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    Clear
                                </button>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                    📝 Instructions:
                                </h3>
                                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                                    <li>Enter questions as a JSON array (start with [ and end with ])</li>
                                    <li>Each question should have: id, questionname, difficulty, type, question, allowedLanguages</li>
                                    <li>defaultCode supports multi-file structure with order field</li>
                                    <li>testcases should be an array of input/expectedOutput pairs</li>
                                    <li>Questions will be saved to: AlgoCore/{course}/lessons/{subcourse}/questions/{id}</li>
                                    <li>Default course: "General", Default subcourse: "Programming"</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {questions.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                Search Results ({questions.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {questions.map((question, index) => (
                                    <div 
                                        key={index}
                                        onClick={() => loadQuestion(question)}
                                        className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    >
                                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                            {question.displayName}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            ID: {question.questionId || question.id}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Path: {question.fullPath}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Question Editor */}
                    {selectedQuestion && (
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Edit Question: {selectedQuestion.questionname || selectedQuestion.id}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={saveQuestion}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => setSelectedQuestion(null)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Question Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Question Name
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedQuestion.questionname || ''}
                                        onChange={(e) => handleInputChange('questionname', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {/* Question ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Question ID
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedQuestion.questionId || selectedQuestion.id || ''}
                                        onChange={(e) => handleInputChange('questionId', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {/* Question Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Question Description
                                    </label>
                                    <textarea
                                        value={selectedQuestion.questiondescription || ''}
                                        onChange={(e) => handleInputChange('questiondescription', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {/* Test Cases */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Test Cases (JSON format)
                                    </label>
                                    <textarea
                                        value={JSON.stringify(selectedQuestion.testcases || [], null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const testcases = JSON.parse(e.target.value);
                                                handleInputChange('testcases', testcases);
                                            } catch (error) {
                                                // Invalid JSON, don't update
                                            }
                                        }}
                                        rows={8}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-mono text-sm"
                                    />
                                </div>

                                {/* Default Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Default Code (JSON format)
                                    </label>
                                    <textarea
                                        value={JSON.stringify(selectedQuestion.defaultCode || {}, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const defaultCode = JSON.parse(e.target.value);
                                                handleInputChange('defaultCode', defaultCode);
                                            } catch (error) {
                                                // Invalid JSON, don't update
                                            }
                                        }}
                                        rows={12}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-mono text-sm"
                                    />
                                </div>

                                {/* Allowed Languages */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Allowed Languages (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={(selectedQuestion.allowedLanguages || []).join(', ')}
                                        onChange={(e) => {
                                            const languages = e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang);
                                            handleInputChange('allowedLanguages', languages);
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionSearchAndEdit;
