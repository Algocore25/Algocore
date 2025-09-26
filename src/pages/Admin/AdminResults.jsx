import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { database } from '../../firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import LoadingPage from '../LoadingPage';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { X, Code as CodeIcon, List } from 'lucide-react';

export default function AdminResult() {
  const { testid } = useParams();
  const [results, setResults] = useState([]);
  const [testName, setTestName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionDetails, setQuestionDetails] = useState(null);
  const [userCode, setUserCode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const user = useAuth();
  const pdfRef = useRef();

  useEffect(() => {
    const fetchreultdata = async () => {
      try {
        // Batch all database reads at once
        const [
          studentSnapshot,
          usersSnapshot,
          resultsSnapshot,
          testInfoSnapshot,
          examQuestionsSnapshot,
          marksSnapshot
        ] = await Promise.all([
          get(ref(database, `Exam/${testid}/Eligible`)),
          get(ref(database, 'users')),
          get(ref(database, `ExamSubmissions/${testid}`)),
          get(ref(database, `Exam/${testid}/name`)),
          get(ref(database, `Exam/${testid}/questions`)),
          get(ref(database, `Marks/${testid}`)),
        ]);

        // Process basic data
        const studentEmails = Object.values(studentSnapshot.val() || {});
        const usersData = usersSnapshot.val() || {};
        const resultsData = resultsSnapshot.val() || {};
        const examQuestions = examQuestionsSnapshot.val() || {};
        const marksData = marksSnapshot.val() || {};

        setTestName(testInfoSnapshot.val() || '');

        if (!studentEmails.length) {
          setLoading(false);
          return;
        }

        // Create email to UID mapping efficiently
        const emailToUidMap = Object.fromEntries(
          Object.entries(usersData).map(([uid, userData]) => [userData.email, uid])
        );

        // Get student UIDs from emails
        const studentIds = studentEmails
          .map(email => emailToUidMap[email])
          .filter(Boolean); // Remove undefined values

        if (!studentIds.length) {
          console.log('No matching users found for the provided emails');
          setLoading(false);
          return;
        }

        // Batch fetch all student questions and code submissions
        const studentQuestionsPromises = studentIds.map(studentId =>
          get(ref(database, `Exam/${testid}/myquestions/${studentId}`))
        );

        const codeSubmissionsPromises = studentIds.map(studentId =>
          get(ref(database, `ExamCode/${testid}/${studentId}`))
        );

        const [studentQuestionsSnapshots, codeSubmissionsSnapshots] = await Promise.all([
          Promise.all(studentQuestionsPromises),
          Promise.all(codeSubmissionsPromises)
        ]);

        // Process results for each student
        const studentResults = studentIds.map((studentId, index) => {
          const userData = usersData[studentId] || {};
          const studentQuestions = studentQuestionsSnapshots[index].val() || {};
          const answers = resultsData[studentId] || {};
          const codeSubmissions = codeSubmissionsSnapshots[index].val() || {};
          const marks = marksData[studentId] || {};


          const questionIds = Object.keys(studentQuestions);
          let correctCount = 0;
          const questionDetails = [];

          const totalMarks = Object.values(marks).reduce((acc, mark) => acc + mark, 0) / questionIds.length;


          for (const questionId of questionIds) {
            const questionKey = studentQuestions[questionId];
            const questionType = examQuestions[questionKey] || 'mcq';

            console.log(answers);

            const isCorrect = answers[questionKey] === "true";

            if (isCorrect) correctCount++;

            // Handle code data for programming questions
            let codeData = null;
            if (questionType === 'Programming' && codeSubmissions[questionId]?.cpp) {
              codeData = {
                code: codeSubmissions[questionId].cpp,
                language: 'cpp'
              };
            }

            console.log(marks);

            questionDetails.push({
              id: questionKey || "No name",
              originalId: questionId,
              correct: isCorrect,
              type: questionType,
              code: codeData,
              marks: marks[questionKey] || 0,
            });
          }

          // Calculate score
          const score = questionIds.length > 0
            ? Math.round((correctCount / questionIds.length) * 100)
            : 0;

          return {
            studentId: userData.name || studentId,
            mail: userData.email || 'No email',
            uid: studentId,
            correctCount,
            totalQuestions: questionIds.length,
            score,
            questions: questionDetails,
            totalMarks
          };
        });

        console.log('Processed student results:', studentResults);
        setResults(studentResults);

      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchreultdata();
  }, [testid]);

  const downloadPDF = () => {
    const input = pdfRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`results_${testName || testid}.pdf`);
    });
  };

  const fetchQuestionDetails = async (questionId, studentId, studentuid, isCorrect, questionType = 'mcq', originalId = null, codeData = null) => {
    // Use originalId if available (for programming questions)
    const effectiveQuestionId = originalId || questionId;

    console.log('Fetching question details:', {
      questionId,
      studentId,
      studentuid,
      questionType,
      originalId,
      codeData: !!codeData
    });

    if (!questionId || !studentId) return;

    setIsLoadingQuestion(true);
    try {
      // Get full question details from Questions node
      const questionDetailsRef = ref(database, `questions/${effectiveQuestionId}`);
      const questionDetailsSnapshot = await get(questionDetailsRef);
      const questionData = questionDetailsSnapshot.val() || {};

      console.log(questionId);

      // If codeData wasn't passed in and this is a programming question, try to fetch it
      let finalCodeData = codeData;
      if (questionType === 'Programming') {
        try {
          // First try with the student's UID (from the URL)
          const codeRef = ref(database, `ExamCode/${testid}/${studentuid}/${questionId}/cpp`);
          console.log(`Attempting to fetch code from: ExamCode/${testid}/${studentuid}/${questionId}/cpp`);
          const codeSnapshot = await get(codeRef);

          if (codeSnapshot.exists()) {
            const codeValue = codeSnapshot.val();
            console.log('Found code with UID:', codeValue);
            finalCodeData = {
              code: codeValue,
              language: 'cpp'
            };
          } else {
            // Fallback to studentId if UID didn't work
            const fallbackRef = ref(database, `ExamCode/${testid}/${studentId}/${questionId}/cpp`);
            console.log(`Code not found with UID, trying with studentId: ExamCode/${testid}/${studentId}/${questionId}/cpp`);
            const fallbackSnapshot = await get(fallbackRef);

            if (fallbackSnapshot.exists()) {
              const codeValue = fallbackSnapshot.val();
              console.log('Found code with studentId:', codeValue);
              finalCodeData = {
                code: codeValue,
                language: 'cpp'
              };
            }
          }
        } catch (error) {
          console.error('Error fetching code:', error);
        }
      }

      console.log(finalCodeData);

      // Format the question data for display
      const questionDetails = {
        id: questionId,
        type: questionType,
        question: questionData.questionname || 'No question text available',
        description: questionData.description || '',
        options: questionData.options || {},
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation || '',
        difficulty: questionData.difficulty || 'Not specified',
        isCorrect,

        // Include any additional fields from your question data structure
        ...questionData
      };

      setQuestionDetails(questionDetails);
      setUserCode(finalCodeData || null);

      setSelectedQuestion({
        id: questionId,
        studentId,
        type: questionType,
        isCorrect
      });

      console.log(questionDetails);

      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching question details:', error);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
    setQuestionDetails(null);
    setUserCode(null);
  };

  if (loading) return <LoadingPage message="Loading results..." />;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div ref={pdfRef} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">
            <span className="text-indigo-600">Exam:</span> {testName || `Test ${testid}`}
          </h1>
          <p className="text-gray-500 mt-1">Detailed performance analysis of all students</p>
        </div>

        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                  {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th> */}

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.length > 0 ? (
                  results.map((result) => (
                    <React.Fragment key={result.studentId}>
                      <tr
                        onClick={() => setSelectedRow(selectedRow === result.studentId ? null : result.studentId)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                              {result.studentId.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{result.studentId}</div>
                              <div className="text-xs text-gray-500">ID: {result.uid.substring(0, 6)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {result.mail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${result.totalMarks >= 70 ? 'bg-green-100 text-green-800' : result.totalMarks >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {result.totalMarks}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 font-medium">{result.correctCount}</span>
                            <span className="text-xs text-gray-500 ml-1">/ {result.totalQuestions}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${(result.correctCount / result.totalQuestions) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1.5">
                            {result.questions.map((q, i) => (
                              <button
                                key={i}
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all hover:scale-105 ${q.correct
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                  : q.marks > 0 ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                  }`}
                                title={`Q${i + 1}: ${q.correct ? 'Correct' : q.marks > 0 ? 'Partially Correct' : 'Incorrect'}`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {result.questions.map((q, i) => (
                            <div 
                              key={`marks-${i}`}
                              className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-medium ${
                                q.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                              title={`${q.correct ? 'Correct' : 'Incorrect'} (${q.marks} marks)`}
                            >
                              {q.marks}
                            </div>
                          ))}
                        </div>
                      </td> */}
                      </tr>
                      {selectedRow === result.studentId && (
                        <tr className="bg-gray-50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium text-gray-700 mb-2">Question Details:</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {result.questions.map((q, i) => (
                                  <div key={i} onClick={() => fetchQuestionDetails(q.id, result.studentId, result.uid, q.correct, q.type)} className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium text-gray-900">
                                          {q.id || `Question ${i + 1}`}
                                        </h4>
                                        <div className="mt-2 flex items-center space-x-2">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${q.correct ? 'bg-green-100 text-green-800' :  q.marks > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {q.marks || 0} points
                                          </span>
                                          {q.code && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                fetchQuestionDetails(q.id, result.studentId, result.uid, q.correct, q.type);
                                              }}
                                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200"
                                            >
                                              <CodeIcon className="h-3 w-3 mr-1" />
                                              View Code
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded-full ${q.correct ? 'bg-green-50 text-green-700' :  q.marks > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {q.correct ? 'Correct' :  q.marks > 0 ? 'Partially Correct' : 'Incorrect'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No results found for this exam
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={downloadPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Download PDF
        </button>
      </div>

      {/* Question Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {questionDetails?.type === 'Programming' ? (
                    <div className="flex items-center gap-2">
                      <CodeIcon className="w-5 h-5 text-blue-500" />
                      <span>Programming Question</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <List className="w-5 h-5 text-blue-500" />
                      <span>Multiple Choice Question</span>
                    </div>
                  )}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mr-2">
                        {questionDetails.difficulty}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Question ID: {questionDetails.id}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${questionDetails.isCorrect
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                      {questionDetails.isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Question:</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {questionDetails.id}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
                      <div className="prose dark:prose-invert max-w-none">
                        {questionDetails.question || 'No question text available'}
                      </div>
                      {questionDetails.description && (
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                          {questionDetails.description}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Difficulty: <span className="font-medium">{questionDetails.difficulty || 'Not specified'}</span>
                    </div>
                  </div>

                  {isLoadingQuestion ? (
                    <div className="flex justify-center p-4">
                      <span className="animate-spin">↻</span>
                      <span className="ml-2">Loading details...</span>
                    </div>
                  ) : questionDetails?.type === 'Programming' ? (
                    <div>
                      <h4 className="font-medium mb-2">Submitted Code</h4>
                      {userCode?.code ? (
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-96">
                          <div className="text-xs text-gray-400 mb-2">
                            Language: {userCode.language || 'cpp'}
                          </div>
                          <pre className="whitespace-pre-wrap">
                            <code>{userCode.code}</code>
                          </pre>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">No code submission found</div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium mb-2">Options:</h4>
                      <div className="space-y-2">
                        {Object.entries(questionDetails.options || {}).map(([key, value]) => (
                          <div
                            key={key}
                            className={`p-2 rounded ${key === questionDetails?.correctAnswer
                              ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-700/50'
                              }`}
                          >
                            <span className="font-medium">{key}:</span> {value}
                            {key === questionDetails?.correctAnswer && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                (Correct Answer)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {questionDetails.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Explanation:</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {questionDetails.explanation}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Status:</span> {
                      selectedQuestion?.isCorrect
                        ? <span className="text-green-600 dark:text-green-400 ml-1">Answered Correctly</span>
                        : <span className="text-red-600 dark:text-red-400 ml-1">Incorrect Answer</span>
                    }
                  </div>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}