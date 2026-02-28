import React, { useState } from 'react';
import { getDatabase, ref, get, set, child } from 'firebase/database';
import { database } from '../../firebase';
import toast from 'react-hot-toast';
import { FiSave, FiInfo, FiChevronDown, FiChevronUp, FiCode } from 'react-icons/fi';

// ---------------------------------------------------------------------------
// Template JSON – covers every supported question type including MySQL / SQL
// ---------------------------------------------------------------------------
const buildTemplate = () => JSON.stringify(
    [
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
                        },
                        {
                            "questionname": "Is Prime",
                            "type": "Programming",
                            "difficulty": "Medium",
                            "question": "Given a number N, print 'YES' if it is prime, else print 'NO'.",
                            "constraints": ["1 <= N <= 10^6"],
                            "Example": ["Input: 7\\nOutput: YES"],
                            "testcases": [
                                { "input": "7", "expectedOutput": "YES" },
                                { "input": "10", "expectedOutput": "NO" }
                            ]
                        }
                    ]
                },
                "Section 2: Multiple Choice": {
                    "description": "Test your knowledge with MCQ and MSQ questions on fundamental concepts.",
                    "questions": [
                        {
                            "questionname": "Basic Arithmetic MCQ",
                            "type": "MCQ",
                            "difficulty": "Easy",
                            "question": "What is 2 + 2?",
                            "options": ["3", "4", "5", "6"],
                            "correctAnswer": 1
                        },
                        {
                            "questionname": "Prime Numbers MSQ",
                            "type": "MSQ",
                            "difficulty": "Medium",
                            "question": "Which of the following are prime numbers?",
                            "options": ["2", "4", "5", "9"],
                            "correctAnswers": [0, 2]
                        },
                        {
                            "questionname": "Square Root Numeric",
                            "type": "Numeric",
                            "difficulty": "Medium",
                            "question": "What is the square root of 144?",
                            "numericAnswer": "12"
                        }
                    ]
                },
                "Section 3: SQL & Databases": {
                    "description": "Practice SQL queries using real schema designs. Each question provides table schemas and test cases that compare your query output against expected results.",
                    "questions": [
                        {
                            "questionname": "Select All Employees",
                            "type": "MySQL",
                            "difficulty": "Easy",
                            "question": "Write a SQL query to retrieve all columns from the `employees` table ordered by salary in descending order.",
                            "schema": "CREATE TABLE employees (\\n  id INT PRIMARY KEY,\\n  name VARCHAR(100),\\n  department VARCHAR(50),\\n  salary DECIMAL(10,2)\\n);\\nINSERT INTO employees VALUES (1, 'Alice', 'Engineering', 95000);\\nINSERT INTO employees VALUES (2, 'Bob', 'Marketing', 72000);\\nINSERT INTO employees VALUES (3, 'Carol', 'Engineering', 105000);\\nINSERT INTO employees VALUES (4, 'Dave', 'HR', 68000);",
                            "solution": "SELECT * FROM employees ORDER BY salary DESC;",
                            "testcases": [
                                {
                                    "input": "",
                                    "expectedOutput": "3|Carol|Engineering|105000.00\\n1|Alice|Engineering|95000.00\\n2|Bob|Marketing|72000.00\\n4|Dave|HR|68000.00"
                                }
                            ]
                        },
                        {
                            "questionname": "Count by Department",
                            "type": "MySQL",
                            "difficulty": "Medium",
                            "question": "Write a SQL query to count the number of employees in each department. Return `department` and `employee_count`, ordered by `employee_count` descending.",
                            "schema": "CREATE TABLE employees (\\n  id INT PRIMARY KEY,\\n  name VARCHAR(100),\\n  department VARCHAR(50),\\n  salary DECIMAL(10,2)\\n);\\nINSERT INTO employees VALUES (1, 'Alice', 'Engineering', 95000);\\nINSERT INTO employees VALUES (2, 'Bob', 'Marketing', 72000);\\nINSERT INTO employees VALUES (3, 'Carol', 'Engineering', 105000);\\nINSERT INTO employees VALUES (4, 'Dave', 'HR', 68000);",
                            "solution": "SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY department ORDER BY employee_count DESC;",
                            "testcases": [
                                {
                                    "input": "",
                                    "expectedOutput": "Engineering|2\\nMarketing|1\\nHR|1"
                                }
                            ]
                        },
                        {
                            "questionname": "Join Orders and Customers",
                            "type": "MySQL",
                            "difficulty": "Hard",
                            "question": "Write a SQL query to join the `orders` and `customers` tables and return the customer name along with their total order amount. Order by total_amount descending.",
                            "schema": "CREATE TABLE customers (\\n  id INT PRIMARY KEY,\\n  name VARCHAR(100)\\n);\\nCREATE TABLE orders (\\n  id INT PRIMARY KEY,\\n  customer_id INT,\\n  amount DECIMAL(10,2)\\n);\\nINSERT INTO customers VALUES (1, 'Alice');\\nINSERT INTO customers VALUES (2, 'Bob');\\nINSERT INTO orders VALUES (1, 1, 500.00);\\nINSERT INTO orders VALUES (2, 1, 300.00);\\nINSERT INTO orders VALUES (3, 2, 150.00);",
                            "solution": "SELECT c.name, SUM(o.amount) AS total_amount FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name ORDER BY total_amount DESC;",
                            "testcases": [
                                {
                                    "input": "",
                                    "expectedOutput": "Alice|800.00\\nBob|150.00"
                                }
                            ]
                        }
                    ]
                }
            }
        }
    ],
    null,
    2
);

// ---------------------------------------------------------------------------
// Section format guide data (shown as collapsible cards)
// ---------------------------------------------------------------------------
const SECTION_GUIDES = [
    {
        key: 'programming',
        label: 'Programming Question',
        color: 'blue',
        fields: [
            { name: 'questionname', req: true, desc: 'Unique display name for the question.' },
            { name: 'type', req: true, desc: '"Programming"' },
            { name: 'difficulty', req: false, desc: '"Easy" | "Medium" | "Hard"' },
            { name: 'question', req: true, desc: 'Full problem statement.' },
            { name: 'constraints', req: false, desc: 'Array of constraint strings.' },
            { name: 'Example', req: false, desc: 'Array of example strings.' },
            { name: 'testcases', req: true, desc: 'Array of { input, expectedOutput } objects.' },
        ],
    },
    {
        key: 'mcq',
        label: 'MCQ Question',
        color: 'violet',
        fields: [
            { name: 'type', req: true, desc: '"MCQ"' },
            { name: 'question', req: true, desc: 'The question text.' },
            { name: 'options', req: true, desc: 'Array of 4 option strings.' },
            { name: 'correctAnswer', req: true, desc: 'Zero-based index of the correct option.' },
        ],
    },
    {
        key: 'msq',
        label: 'MSQ Question',
        color: 'purple',
        fields: [
            { name: 'type', req: true, desc: '"MSQ"' },
            { name: 'question', req: true, desc: 'The question text.' },
            { name: 'options', req: true, desc: 'Array of option strings.' },
            { name: 'correctAnswers', req: true, desc: 'Array of zero-based indices of correct options.' },
        ],
    },
    {
        key: 'numeric',
        label: 'Numeric Question',
        color: 'teal',
        fields: [
            { name: 'type', req: true, desc: '"Numeric"' },
            { name: 'question', req: true, desc: 'The question text.' },
            { name: 'numericAnswer', req: true, desc: 'Expected numeric answer as a string.' },
        ],
    },
    {
        key: 'mysql',
        label: 'SQL / MySQL Question',
        color: 'orange',
        fields: [
            { name: 'type', req: true, desc: '"MySQL"' },
            { name: 'question', req: true, desc: 'The SQL problem statement.' },
            { name: 'schema', req: true, desc: 'Full SQL schema: CREATE TABLE + INSERT statements used to seed the database.' },
            { name: 'solution', req: false, desc: 'Reference solution query (stored but not shown to students).' },
            { name: 'testcases', req: true, desc: 'Array of { input, expectedOutput } — input is typically empty "", expectedOutput uses pipe "|" separated columns and newlines.' },
        ],
    },
];

const COLOR_MAP = {
    blue: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', header: 'bg-blue-50 dark:bg-blue-900/20' },
    violet: { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', header: 'bg-violet-50 dark:bg-violet-900/20' },
    purple: { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', header: 'bg-purple-50 dark:bg-purple-900/20' },
    teal: { badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', header: 'bg-teal-50 dark:bg-teal-900/20' },
    orange: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', header: 'bg-orange-50 dark:bg-orange-900/20' },
};

// ---------------------------------------------------------------------------
// GuideCard – collapsible info card for a question type
// ---------------------------------------------------------------------------
const GuideCard = ({ guide }) => {
    const [open, setOpen] = useState(false);
    const c = COLOR_MAP[guide.color];
    return (
        <div className={`rounded-lg border ${c.border} overflow-hidden`}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-3 ${c.header} text-left`}
            >
                <div className="flex items-center gap-2">
                    <FiCode className="flex-shrink-0" />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                        type: &quot;{guide.label.replace(' Question', '')}&quot;
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{guide.label}</span>
                </div>
                {open ? <FiChevronUp className="text-gray-500" /> : <FiChevronDown className="text-gray-500" />}
            </button>
            {open && (
                <div className="px-4 py-3 bg-white dark:bg-gray-800/60">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                <th className="pb-2 pr-4 font-semibold">Field</th>
                                <th className="pb-2 pr-4 font-semibold">Required</th>
                                <th className="pb-2 font-semibold">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/60">
                            {guide.fields.map(f => (
                                <tr key={f.name}>
                                    <td className="py-1.5 pr-4 font-mono text-gray-800 dark:text-gray-200 whitespace-nowrap">{f.name}</td>
                                    <td className="py-1.5 pr-4">
                                        {f.req
                                            ? <span className="text-red-500 font-semibold">Yes</span>
                                            : <span className="text-gray-400">No</span>}
                                    </td>
                                    <td className="py-1.5 text-gray-600 dark:text-gray-400">{f.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const BulkAddData = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [logs, setLogs] = useState([]);

    const handleApplyTemplate = () => {
        setJsonInput(buildTemplate());
    };

    const processBulkAdd = async () => {
        if (!jsonInput.trim()) {
            toast.error('Please enter valid JSON data.');
            return;
        }

        setLoading(true);
        setProgress({ current: 0, total: 0 });
        setLogs(['Starting bulk import process...']);
        try {
            const parsedData = JSON.parse(jsonInput);

            if (!Array.isArray(parsedData)) {
                toast.error('JSON root must be an array of course objects.');
                setLoading(false);
                return;
            }

            // Calculate total items (courses + questions) for granular progress
            let totalItems = 0;
            for (const c of parsedData) {
                totalItems++;
                if (c.sections) {
                    for (const sName in c.sections) {
                        if (c.sections[sName].questions && Array.isArray(c.sections[sName].questions)) {
                            totalItems += c.sections[sName].questions.length;
                        }
                    }
                }
            }

            setProgress({ current: 0, total: totalItems });
            const dbRef = ref(database);

            setLogs(prev => [`Connecting to Firebase database...`, ...prev]);

            // Get the existing Courses array so we know where to append
            const coursesSnapshot = await get(child(dbRef, 'Courses'));
            let existingCourses = [];
            let nextIndex = 0;

            if (coursesSnapshot.exists()) {
                const data = coursesSnapshot.val();
                if (Array.isArray(data)) {
                    existingCourses = data;
                    nextIndex = data.length;
                } else {
                    // If it's an object, find highest numeric key
                    const keys = Object.keys(data).filter(k => !isNaN(k)).map(Number);
                    nextIndex = keys.length > 0 ? Math.max(...keys) + 1 : 0;
                }
            }

            for (const course of parsedData) {
                if (!course.title || !course.sections) {
                    toast.error(`Skipping an invalid course entry (missing title or sections).`);
                    continue;
                }

                const courseId = course.id || 'course_' + Math.random().toString(36).substr(2, 9);
                const currentIndex = nextIndex++;

                // 1. Write to /Courses/index
                setLogs(prev => [`[${course.title}] Initializing course metadata...`, ...prev]);
                const courseMetadata = {
                    id: courseId,
                    title: course.title,
                    description: course.description || '',
                };
                await set(ref(database, `Courses/${currentIndex}`), courseMetadata);

                // 2. Write to AlgoCore/{courseId}/course
                setLogs(prev => [`[${course.title}] Saving primary course configurations...`, ...prev]);
                const algocoreCourseData = {
                    title: course.title,
                    description: course.description || '',
                    stats: {
                        level: course.level || 'Beginner'
                    },
                    accessType: course.accessType || 'open',
                    allowedLanguages: course.allowedLanguages || ['python', 'javascript', 'java', 'cpp']
                };
                await set(ref(database, `AlgoCore/${courseId}/course`), algocoreCourseData);

                // 3. Process sections/questions → write questions globally, keep only names in lessons
                const processedSections = {};

                for (const sectionName in course.sections) {
                    const section = course.sections[sectionName];

                    // Preserve section-level description
                    processedSections[sectionName] = {
                        description: section.description || '',
                        questions: [],
                    };

                    if (section.questions && Array.isArray(section.questions)) {
                        const newQuestionStrings = [];
                        for (const q of section.questions) {
                            if (typeof q === 'string') {
                                newQuestionStrings.push(q);
                                continue;
                            }

                            const qId = q.id || q.questionname || 'q_' + Math.random().toString(36).substr(2, 9);
                            const qToSave = { ...q, id: qId };

                            // Save to global questions table
                            setLogs(prev => [`[${course.title}] Writing question '${qToSave.questionname || qId}' to database...`, ...prev]);
                            await set(ref(database, `questions/${qId}`), qToSave);

                            // Only store the name / ID in the course section
                            newQuestionStrings.push(qToSave.questionname || qId);
                            setProgress(p => ({ ...p, current: p.current + 1 }));
                        }
                        processedSections[sectionName].questions = newQuestionStrings;
                    }
                }

                setLogs(prev => [`[${course.title}] Finalizing section relations...`, ...prev]);
                await set(ref(database, `AlgoCore/${courseId}/lessons`), processedSections);
                setProgress(p => ({ ...p, current: p.current + 1 }));
                setLogs(prev => [`[${course.title}] Successfully compiled course bundle!`, ...prev]);
            }

            setLogs(prev => [`All uploads successfully completed!`, ...prev]);
            toast.success('Bulk add completed successfully!');
            setTimeout(() => {
                setJsonInput('');
                setProgress({ current: 0, total: 0 });
                setLoading(false);
            }, 1000);
        } catch (err) {
            console.error('Error processing bulk add:', err);
            setLogs(prev => [`ERROR: ${err.message}`, ...prev]);
            toast.error('Failed to parse JSON or save data. Please check your syntax and format.');
            setLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Add Courses &amp; Questions</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Import multiple courses, sections, and questions at once using JSON.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleApplyTemplate}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Load Template Data
                    </button>
                    <button
                        onClick={processBulkAdd}
                        disabled={loading}
                        className="flex items-center px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 min-w-[160px] justify-center"
                    >
                        <FiSave className="mr-2" />
                        {loading ? `Processing ${progress.current}/${progress.total}...` : 'Save to Database'}
                    </button>
                </div>
            </div>

            {/* ── Processing Overlay ── */}
            {loading && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-3xl flex flex-col h-[70vh]">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Executing Import...</h3>
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-full">
                                {progress.current} / {progress.total} Parsed
                            </div>
                        </div>

                        {progress.total > 0 && (
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-6 shrink-0 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out relative"
                                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                                >
                                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto bg-gray-900 dark:bg-black rounded-lg p-5 font-mono text-sm space-y-2 border border-gray-700 shadow-inner">
                            {logs.map((log, i) => (
                                <div key={i} className={`flex items-start ${i === 0 ? 'text-white font-bold opacity-100' : 'text-gray-400 opacity-80'}`}>
                                    <span className="text-emerald-500 mr-3 mt-0.5">❯</span>
                                    <span className="break-words">{log}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── General Format Info ── */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-md">
                <div className="flex">
                    <FiInfo className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold mb-1">JSON Format Guidelines:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Must be an array of course objects <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">[{"{"}...{"}"}]</code>.</li>
                            <li>Each course requires <code className="font-mono">title</code> and <code className="font-mono">sections</code> properties.</li>
                            <li><code className="font-mono">sections</code> is a keyed object — each value has an optional <code className="font-mono">description</code> string and a <code className="font-mono">questions</code> array.</li>
                            <li>SQL/MySQL questions require a <code className="font-mono">schema</code> field with <code className="font-mono">CREATE TABLE</code> + <code className="font-mono">INSERT</code> statements, and <code className="font-mono">testcases</code> where <code className="font-mono">expectedOutput</code> uses pipe-separated columns.</li>
                            <li>Missing IDs and optional fields will be generated automatically.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Per-Type Field Guides ── */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Question Type Field Reference (click to expand):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {SECTION_GUIDES.map(g => <GuideCard key={g.key} guide={g} />)}
                </div>
            </div>

            {/* ── Section Description Note ── */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-4">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">📌 Section Descriptions</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                    Each section supports an optional <code className="font-mono bg-amber-100 dark:bg-amber-800 px-1 rounded">description</code> field that will be stored in the database and displayed to students. Example:
                </p>
                <pre className="mt-2 text-xs bg-amber-100 dark:bg-amber-900/40 p-2 rounded font-mono text-amber-800 dark:text-amber-300 overflow-x-auto">
                    {`"Section 3: SQL & Databases": {
  "description": "Practice SQL queries using real schema designs.",
  "questions": [ ... ]
}`}
                </pre>
            </div>

            {/* ── JSON Textarea ── */}
            <div className="flex-1 min-h-[400px]">
                <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste your JSON bulk data array here..."
                    className="w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 resize-none"
                />
            </div>
        </div>
    );
};

export default BulkAddData;
