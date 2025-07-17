import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { database } from '../../firebase';
import { ref, get } from 'firebase/database';
import LoadingPage from '../LoadingPage';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function AdminResult() {
  const { testid } = useParams();
  const [results, setResults] = useState([]);
  const [testName, setTestName] = useState('');
  const [loading, setLoading] = useState(true);
  const user = useAuth();
  const pdfRef = useRef();

  useEffect(() => {
    const fetchreultdata = async () => {
      const resultsRef = ref(database, `ExamSubmissions/${testid}`);
      const resultsSnapshot = await get(resultsRef);

      const questionsRef = ref(database, `Exam/${testid}/questions`);
      const questionsSnapshot = await get(questionsRef);

      const usersRef = ref(database, `users`);
      const usersSnapshot = await get(usersRef);

      const testInfoRef = ref(database, `Exam/${testid}/name`);
      const testInfoSnapshot = await get(testInfoRef);
      setTestName(testInfoSnapshot.val() || '');

      const resultsData = resultsSnapshot.val();
      const questionsData = questionsSnapshot.val();
      const usersData = usersSnapshot.val();

      if (!resultsData || !questionsData) {
        setLoading(false);
        return;
      }


      const students = Object.keys(resultsData);

      console.log(students);

      const studentResults = students.map((studentId) => {
        const studentSubmission = resultsData[studentId];
        const correctCount = Object.keys(studentSubmission).filter((questionId) => studentSubmission[questionId] === 'true').length;
        const score = Math.round((correctCount / questionsData.length) * 100);

        console.log(questionsData);

        const questionDetails = questionsData.map(q => ({
          id: q,
          correct: studentSubmission[q] === 'true',
        }));

        console.log(questionDetails);

        const studentData = usersData[studentId];
        const mail = studentData?.email ?? 'Not Found';
        studentId = studentData?.name ?? 'Not Found';

        return {
          studentId,
          mail,
          correctCount,
          totalQuestions: questionsData.length,
          score,
          questions: questionDetails,
        };
      });

      setResults(studentResults);

      setLoading(false);
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

  if (loading) return <LoadingPage message="Loading results..." />;

  return (
    <div className="container mx-auto p-6">
      <div ref={pdfRef}>
        <h1 className="text-2xl font-bold mb-6">Exam Results: {testName || `Test ${testid}`}</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.length > 0 ? (
                  results.map((result) => (
                    <tr key={result.studentId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.mail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.score}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.correctCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.totalQuestions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {result.questions.map((q, i) => (
                            <span
                              key={i}
                              className={`px-2 py-1 rounded text-xs ${q.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              title={`Question ${q.id}: ${q.correct ? 'Correct' : 'Incorrect'}`}
                            >
                              Q{i + 1}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
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
    </div>
  );
}