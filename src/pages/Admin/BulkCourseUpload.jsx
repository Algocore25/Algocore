import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, set, update } from 'firebase/database';
import { database } from '../../firebase';
import toast from 'react-hot-toast';
import { FiUpload, FiDownload, FiX, FiFileText, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const BulkCourseUpload = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Sample template for download
    const sampleTemplate = [
        {
            "id": "optional_course_id",
            "title": "Sample Bulk Course",
            "description": "A comprehensive course covering programming fundamentals and databases.",
            "level": "Beginner",
            "accessType": "open",
            "allowedLanguages": ["python", "javascript", "java", "cpp"],
            "sections": {
                "Section 1: Programming Basics": {
                    "description": "Introduction to core programming concepts including data types, loops, and functions.",
                    "questions": [
                        {
                            "questionname": "Sum of Two Numbers",
                            "type": "Programming",
                            "difficulty": "Easy",
                            "question": "Write a function to return the sum of two numbers.",
                            "constraints": ["1 <= a, b <= 100"],
                            "Example": ["Input: 1\\n2\\nOutput: 3"],
                            "testcases": [
                                { "input": "1\\n2", "expectedOutput": "3" },
                                { "input": "5\\n5", "expectedOutput": "10" }
                            ]
                        }
                    ]
                }
            }
        }
    ];

    const downloadTemplate = () => {
        const dataStr = JSON.stringify(sampleTemplate, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'bulk-course-template.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const validateCourseData = (course) => {
        const errors = [];
        
        if (!course.title || typeof course.title !== 'string') {
            errors.push('Course title is required and must be a string');
        }
        
        if (!course.description || typeof course.description !== 'string') {
            errors.push('Course description is required and must be a string');
        }
        
        if (!course.level || !['Beginner', 'Intermediate', 'Advanced'].includes(course.level)) {
            errors.push('Course level must be one of: Beginner, Intermediate, Advanced');
        }
        
        if (!course.accessType || !['open', 'restricted'].includes(course.accessType)) {
            errors.push('Access type must be either "open" or "restricted"');
        }
        
        if (!course.allowedLanguages || !Array.isArray(course.allowedLanguages)) {
            errors.push('Allowed languages must be an array');
        }
        
        if (!course.sections || typeof course.sections !== 'object') {
            errors.push('Course sections are required and must be an object');
        } else {
            Object.entries(course.sections).forEach(([sectionName, section]) => {
                if (!section.description || typeof section.description !== 'string') {
                    errors.push(`Section "${sectionName}" must have a description`);
                }
                
                if (!section.questions || !Array.isArray(section.questions)) {
                    errors.push(`Section "${sectionName}" must have a questions array`);
                } else {
                    section.questions.forEach((question, qIndex) => {
                        if (!question.questionname || typeof question.questionname !== 'string') {
                            errors.push(`Question ${qIndex + 1} in section "${sectionName}" must have a questionname`);
                        }
                        
                        if (!question.type || typeof question.type !== 'string') {
                            errors.push(`Question ${qIndex + 1} in section "${sectionName}" must have a type`);
                        }
                        
                        if (!question.difficulty || !['Easy', 'Medium', 'Hard'].includes(question.difficulty)) {
                            errors.push(`Question ${qIndex + 1} in section "${sectionName}" must have a valid difficulty (Easy, Medium, Hard)`);
                        }
                        
                        if (!question.question || typeof question.question !== 'string') {
                            errors.push(`Question ${qIndex + 1} in section "${sectionName}" must have a question text`);
                        }
                    });
                }
            });
        }
        
        return errors;
    };

    const processBulkUpload = async (coursesData) => {
        const results = {
            successful: [],
            failed: [],
            total: coursesData.length
        };

        for (let i = 0; i < coursesData.length; i++) {
            const courseData = coursesData[i];
            
            try {
                // Validate course data
                const validationErrors = validateCourseData(courseData);
                if (validationErrors.length > 0) {
                    results.failed.push({
                        course: courseData.title || `Course ${i + 1}`,
                        error: validationErrors.join('; ')
                    });
                    continue;
                }

                // Generate unique course ID if not provided
                const courseId = courseData.id || 'course_' + Math.random().toString(36).substr(2, 9);

                // Get next index for Courses array
                const snap = await get(ref(database, 'Courses'));
                let nextIndex = 0;
                if (snap.exists()) {
                    const data = snap.val();
                    if (Array.isArray(data)) {
                        nextIndex = data.length;
                    } else {
                        const keys = Object.keys(data).filter(k => !isNaN(k)).map(Number);
                        nextIndex = keys.length > 0 ? Math.max(...keys) + 1 : 0;
                    }
                }

                // Prepare course data for Courses array
                const courseListData = {
                    id: courseId,
                    title: courseData.title,
                    description: courseData.description,
                    section: courseData.section || '',
                    icon: courseData.icon || ''
                };

                // Add to Courses array
                await set(ref(database, `Courses/${nextIndex}`), courseListData);

                // Prepare lessons data from sections
                const lessons = {};
                Object.entries(courseData.sections).forEach(([sectionName, section], index) => {
                    lessons[sectionName] = {
                        description: section.description,
                        status: 'Started',
                        questions: section.questions.map(q => q.questionname),
                        order: index
                    };
                });

                // Add to AlgoCore
                await update(ref(database, `AlgoCore/${courseId}/course`), {
                    title: courseData.title,
                    description: courseData.description,
                    section: courseData.section || '',
                    icon: courseData.icon || '',
                    stats: { level: courseData.level },
                    accessType: courseData.accessType,
                    allowedUsers: courseData.accessType === 'restricted' ? (courseData.allowedUsers || '').join(', ') : '',
                    allowedLanguages: courseData.allowedLanguages
                });

                await set(ref(database, `AlgoCore/${courseId}/lessons`), lessons);

                // Add questions to questions database if they don't exist
                for (const section of Object.values(courseData.sections)) {
                    for (const question of section.questions) {
                        const questionId = question.questionname.replace(/\s+/g, '_').toLowerCase();
                        await set(ref(database, `questions/${questionId}`), question);
                    }
                }

                results.successful.push({
                    course: courseData.title,
                    courseId: courseId,
                    index: nextIndex
                });

            } catch (error) {
                console.error(`Error processing course ${courseData.title || i + 1}:`, error);
                results.failed.push({
                    course: courseData.title || `Course ${i + 1}`,
                    error: error.message
                });
            }
        }

        return results;
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        if (file.type !== 'application/json') {
            toast.error('Please upload a JSON file');
            return;
        }

        setUploading(true);
        setUploadResults(null);

        try {
            const fileContent = await file.text();
            const coursesData = JSON.parse(fileContent);

            if (!Array.isArray(coursesData)) {
                toast.error('Invalid file format. Expected an array of courses.');
                return;
            }

            if (coursesData.length === 0) {
                toast.error('No courses found in the file.');
                return;
            }

            const results = await processBulkUpload(coursesData);
            setUploadResults(results);

            if (results.successful.length > 0) {
                toast.success(`Successfully uploaded ${results.successful.length} course(s)`);
            }
            
            if (results.failed.length > 0) {
                toast.error(`${results.failed.length} course(s) failed to upload`);
            }

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error processing file: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <FiArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Course Upload</h1>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                    <FiDownload className="mr-2" />
                    Download Template
                </button>
            </div>

            {/* Upload Area */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive 
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleChange}
                        className="hidden"
                        disabled={uploading}
                    />
                    
                    <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Upload Course Data
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Drag and drop your JSON file here, or click to browse
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Select File'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {uploadResults && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Results</h2>
                    
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{uploadResults.total}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Courses</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResults.successful.length}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadResults.failed.length}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                        </div>
                    </div>

                    {/* Successful Courses */}
                    {uploadResults.successful.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-md font-medium text-green-700 dark:text-green-400 mb-3 flex items-center">
                                <FiCheckCircle className="mr-2" />
                                Successful Uploads
                            </h3>
                            <div className="space-y-2">
                                {uploadResults.successful.map((result, index) => (
                                    <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                        <div className="font-medium text-gray-900 dark:text-white">{result.course}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            ID: {result.courseId} | Index: {result.index}
                                        </div>
                                        <button
                                            onClick={() => navigate(`/courseedit/${result.courseId}?index=${result.index}`)}
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Edit Course →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Failed Courses */}
                    {uploadResults.failed.length > 0 && (
                        <div>
                            <h3 className="text-md font-medium text-red-700 dark:text-red-400 mb-3 flex items-center">
                                <FiAlertCircle className="mr-2" />
                                Failed Uploads
                            </h3>
                            <div className="space-y-2">
                                {uploadResults.failed.map((result, index) => (
                                    <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                        <div className="font-medium text-gray-900 dark:text-white">{result.course}</div>
                                        <div className="text-sm text-red-600 dark:text-red-400">{result.error}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BulkCourseUpload;
