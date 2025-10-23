import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { database } from '../../firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import LoadingPage from '../LoadingPage';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { X, Code as CodeIcon, List, Download, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [sortColumn, setSortColumn] = useState('studentId');
  const [sortDirection, setSortDirection] = useState('asc');
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

        console.log(codeSubmissionsSnapshots);

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
            if (questionType === 'Programming' && codeSubmissions[questionKey]?.cpp) {
              codeData =  codeSubmissions[questionKey].cpp
            }

            console.log(marks);
            questionDetails.push({
              id: questionKey || "No name",
              originalId: questionId,
              correct: isCorrect,
              type: questionType,
              code: codeData,
              mcqanswer: codeSubmissions[questionKey] || null,
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

  // Sorting function
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort results based on current sort settings
  const sortedResults = [...results].sort((a, b) => {
    let aValue, bValue;

    switch (sortColumn) {
      case 'studentId':
        aValue = a.studentId.toLowerCase();
        bValue = b.studentId.toLowerCase();
        break;
      case 'mail':
        aValue = a.mail.toLowerCase();
        bValue = b.mail.toLowerCase();
        break;
      case 'totalMarks':
        // Handle NaN values by treating them as -1 for sorting
        aValue = isNaN(a.totalMarks) ? -1 : a.totalMarks;
        bValue = isNaN(b.totalMarks) ? -1 : b.totalMarks;
        break;
      case 'correctCount':
        // Sort by percentage of correct answers
        aValue = a.totalQuestions > 0 ? (a.correctCount / a.totalQuestions) : 0;
        bValue = b.totalQuestions > 0 ? (b.correctCount / b.totalQuestions) : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalStudents = results.length;
  const attendedResults = results.filter(result => !isNaN(result.totalMarks));
  const totalAttended = attendedResults.length;
  const averageScore = totalAttended > 0
    ? attendedResults.reduce((sum, result) => sum + result.totalMarks, 0) / totalAttended
    : null;
  const topScore = totalAttended > 0
    ? Math.max(...attendedResults.map(result => result.totalMarks))
    : null;

  const downloadAllResultsPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Title Page
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Test Results Summary', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Test: ${testName || testid}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    pdf.text(`Total Students: ${sortedResults.length}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Summary Table
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Overall Performance Summary', margin, yPosition);
    yPosition += 8;

    // Table Headers
    pdf.setFillColor(70, 130, 180);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(margin, yPosition - 6, pageWidth - 2 * margin, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.text('#', margin + 2, yPosition);
    pdf.text('Student Name', margin + 8, yPosition);
    pdf.text('Email', margin + 60, yPosition);
    pdf.text('Score', margin + 120, yPosition);
    pdf.text('Correct', margin + 140, yPosition);
    pdf.text('Total', margin + 165, yPosition);
    
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;

    // Table Rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    sortedResults.forEach((result, index) => {
      if (checkNewPage(8)) {
        // Redraw header on new page
        pdf.setFillColor(70, 130, 180);
        pdf.setTextColor(255, 255, 255);
        pdf.rect(margin, yPosition - 6, pageWidth - 2 * margin, 8, 'F');
        pdf.setFontSize(9);
        pdf.text('#', margin + 2, yPosition);
        pdf.text('Student Name', margin + 8, yPosition);
        pdf.text('Email', margin + 60, yPosition);
        pdf.text('Score', margin + 120, yPosition);
        pdf.text('Correct', margin + 140, yPosition);
        pdf.text('Total', margin + 165, yPosition);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        yPosition += 8;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPosition - 6, pageWidth - 2 * margin, 7, 'F');
      }

      pdf.text(`${index + 1}`, margin + 2, yPosition);
      
      const studentName = result.studentId.length > 20 ? result.studentId.substring(0, 20) + '...' : result.studentId;
      pdf.text(studentName, margin + 8, yPosition);
      
      const email = result.mail.length > 25 ? result.mail.substring(0, 25) + '...' : result.mail;
      pdf.text(email, margin + 60, yPosition);
      
      const scoreText = isNaN(result.totalMarks) ? 'N/A' : `${result.totalMarks.toFixed(1)}%`;
      pdf.text(scoreText, margin + 120, yPosition);
      
      pdf.text(`${result.correctCount}`, margin + 145, yPosition);
      pdf.text(`${result.totalQuestions}`, margin + 168, yPosition);
      
      yPosition += 7;
    });

    yPosition += 10;

    // Statistics
    checkNewPage(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Test Statistics', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    const validScores = sortedResults.filter(r => !isNaN(r.totalMarks)).map(r => r.totalMarks);
    const avgScore = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2) : 'N/A';
    const maxScore = validScores.length > 0 ? Math.max(...validScores).toFixed(2) : 'N/A';
    const minScore = validScores.length > 0 ? Math.min(...validScores).toFixed(2) : 'N/A';

    pdf.text(`Average Score: ${avgScore}%`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Highest Score: ${maxScore}%`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Lowest Score: ${minScore}%`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Students Attended: ${validScores.length} / ${sortedResults.length}`, margin + 5, yPosition);

    // Footer on all pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${totalPages} - ${testName || testid}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    pdf.save(`${testName || testid}_all_results.pdf`);
  };

  const downloadStudentPDF = async (result) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    console.log(result);

    // Fetch all question details for this student
    const questionDetailsMap = {};
    
    try {
      for (const q of result.questions) {
        try {
          // Fetch question details from database
          const questionRef = ref(database, `questions/${q.id}`);
          const questionSnapshot = await get(questionRef);
          const questionData = questionSnapshot.val() || {};

          // Fetch student's answer for MCQ
          const submissionRef = ref(database, `ExamSubmissions/${testid}/${result.uid}/${q.id}`);
          const submissionSnapshot = await get(submissionRef);
          const studentAnswer = submissionSnapshot.val();

          // Fetch code for programming questions
          let codeSubmission = null;
          if (q.type === 'Programming') {
            const codeRef = ref(database, `ExamCode/${testid}/${result.uid}/${q.originalId}/cpp`);
            const codeSnapshot = await get(codeRef);
            if (codeSnapshot.exists()) {
              codeSubmission = codeSnapshot.val();
            }
          }

          questionDetailsMap[q.id] = {
            ...questionData,
            studentAnswer: studentAnswer || null,
            isCorrect: q.correct,
            marks: q.marks,
            type: q.type,
            codeSubmission: codeSubmission
          };
        } catch (error) {
          console.error(`Error fetching details for question ${q.id}:`, error);
          questionDetailsMap[q.id] = {
            questionname: q.id,
            studentAnswer: null,
            isCorrect: q.correct,
            marks: q.marks,
            type: q.type
          };
        }
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrap
    const addText = (text, x, y, maxWidth, fontSize = 10) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return lines.length * (fontSize * 0.35); // Return height used
    };

    // Convert option key (0,1,2,3) to display format (1,2,3,4)
    const convertOptionKey = (key) => {
      const numKey = parseInt(key);
      return isNaN(numKey) ? key : (numKey + 1).toString();
    };

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Student Performance Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Test Name
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Test: ${testName || testid}`, margin, yPosition);
    yPosition += 8;

    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Student Information
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Student Information', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${result.studentId}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Email: ${result.mail}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Student ID: ${result.uid.substring(0, 10)}...`, margin, yPosition);
    yPosition += 10;

    // Performance Summary
    checkNewPage(40);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Summary', margin, yPosition);
    yPosition += 7;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Score: ${isNaN(result.totalMarks) ? 'Not Attended' : result.totalMarks.toFixed(2) + '%'}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Questions Attempted: ${result.totalQuestions}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Correct Answers: ${result.correctCount}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Incorrect Answers: ${result.totalQuestions - result.correctCount}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Accuracy: ${result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0}%`, margin, yPosition);
    yPosition += 12;

    // Detailed Question-wise Analysis
    checkNewPage(40);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detailed Question Analysis', margin, yPosition);
    yPosition += 10;

    // Iterate through each question
    for (let i = 0; i < result.questions.length; i++) {
      const q = result.questions[i];
      const qDetails = questionDetailsMap[q.id] || {};
      
      checkNewPage(40);

      // Question header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Question ${i + 1}`, margin + 2, yPosition);
      
      // Status badge
      if (qDetails.studentAnswer === null || qDetails.studentAnswer === undefined) {
        pdf.setTextColor(150, 150, 150);
        pdf.text('Not Attended', pageWidth - margin - 30, yPosition);
      } else if (q.correct) {
        pdf.setTextColor(0, 128, 0);
        pdf.text(`Correct (+${q.marks.toFixed(2)})`, pageWidth - margin - 35, yPosition);
      } else {
        pdf.setTextColor(255, 0, 0);
        pdf.text(`Wrong (${q.marks.toFixed(2)})`, pageWidth - margin - 30, yPosition);
      }
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 10;

      // Question text
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const questionText = qDetails.question;
      const questionHeight = addText(questionText, margin + 2, yPosition, pageWidth - 2 * margin - 4, 10);
      yPosition += questionHeight + 3;

      // Description if exists
      if (qDetails.description) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        const descHeight = addText(qDetails.description, margin + 2, yPosition, pageWidth - 2 * margin - 4, 9);
        yPosition += descHeight + 3;
      }

      // For MCQ questions
      if (q.type !== 'Programming' && qDetails.options) {
        checkNewPage(30);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text('Options:', margin + 2, yPosition);
        yPosition += 5;

        // Display all options with converted keys (1,2,3,4)
        const optionEntries = Object.entries(qDetails.options);
        for (const [optKey, optValue] of optionEntries) {
          checkNewPage(8);
          
          const displayKey = convertOptionKey(optKey);
          const isCorrectAnswer = optKey === qDetails.correctAnswer;
          const isStudentAnswer = optKey === qDetails.studentAnswer;
          
          // Highlight boxes
          if (isCorrectAnswer) {
            pdf.setFillColor(200, 255, 200); // Light green for correct
            pdf.rect(margin + 4, yPosition - 4, pageWidth - 2 * margin - 8, 6, 'F');
          } else if (isStudentAnswer && !isCorrectAnswer) {
            pdf.setFillColor(255, 200, 200); // Light red for wrong selection
            pdf.rect(margin + 4, yPosition - 4, pageWidth - 2 * margin - 8, 6, 'F');
          }

          // Option text with converted key
          pdf.setFont('helvetica', 'normal');
          const optionText = `${displayKey}. ${optValue}`;
          const optHeight = addText(optionText, margin + 6, yPosition, pageWidth - 2 * margin - 12, 9);
          
          // Add badges
          let badgeX = margin + 8 + pdf.getTextWidth(optionText);
          if (isCorrectAnswer) {
            pdf.setTextColor(0, 128, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.text(' [CORRECT]', badgeX, yPosition);
          }
          if (isStudentAnswer) {
            pdf.setTextColor(0, 0, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text(' [SELECTED]', badgeX + (isCorrectAnswer ? 25 : 0), yPosition);
          }
          pdf.setTextColor(0, 0, 0);
          
          yPosition += optHeight + 2;
        }

        // Student's answer summary with converted key
        yPosition += 2;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        if (qDetails.studentAnswer === null || qDetails.studentAnswer === undefined) {
          pdf.setTextColor(150, 150, 150);
          pdf.text(`Student's Answer: Not Attended`, margin + 2, yPosition);
        } else {
          const studentDisplayKey = convertOptionKey(q.mcqanswer);
          pdf.text(`Student's Answer: ${q.mcqanswer+1}`, margin + 2, yPosition);
        }
        pdf.setTextColor(0, 0, 0);
        yPosition += 5;

        const correctDisplayKey = qDetails.correctAnswer;
        pdf.text(`Correct Answer: Option ${correctDisplayKey}`, margin + 2, yPosition);
        yPosition += 7;
      }

      // For Programming questions - SHOW ALL CODE WITHOUT OMISSION
      if (q.type === 'Programming') {
        checkNewPage(30);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Code Submission:', margin + 2, yPosition);
        yPosition += 6;

        const codeToDisplay = q.code;

        if (codeToDisplay) {
          pdf.setFont('courier', 'normal');
          pdf.setFontSize(7);
          
          // Split code into lines and display ALL of them
          const codeLines = codeToDisplay.split('\n');
          
          for (const line of codeLines) {
            // Check if we need a new page before adding each line
            if (checkNewPage(5)) {
              pdf.setFont('courier', 'normal');
              pdf.setFontSize(7);
            }
            
            // Truncate only extremely long lines to fit the page width
            const truncatedLine = line.length > 95 ? line.substring(0, 95) + '...' : line;
            pdf.text(truncatedLine, margin + 4, yPosition);
            yPosition += 3.5;
          }
          
          yPosition += 5;
        } else {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text('No code submitted', margin + 4, yPosition);
          pdf.setTextColor(0, 0, 0);
          yPosition += 7;
        }
      }

           // Get test cases from question data
        const testCases = qDetails.testcases || [];
        
        if (testCases.length > 0) {
          for (let tcIndex = 0; tcIndex < testCases.length; tcIndex++) {
            const testCase = testCases[tcIndex];
            checkNewPage(25);
            
            // Test case header with status
            const testCaseStatus = q.correct ? 'PASSED' : 'FAILED'; // Simplified - in real implementation, you'd need individual test case results
            const statusColor = q.correct ? [0, 128, 0] : [255, 0, 0];
            
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
            
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Test Case ${tcIndex + 1}`, margin + 2, yPosition);
            
            pdf.setTextColor(...statusColor);
            pdf.text(testCaseStatus, pageWidth - margin - 20, yPosition);
            pdf.setTextColor(0, 0, 0);
            
            yPosition += 8;
            
            // Input
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.text('Input:', margin + 4, yPosition);
            yPosition += 4;
            
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(7);
            const inputText = testCase.input || 'No input';
            const inputLines = pdf.splitTextToSize(inputText, pageWidth - 2 * margin - 8);
            pdf.text(inputLines, margin + 6, yPosition);
            yPosition += inputLines.length * 3.5 + 2;
            
            // Expected Output
            checkNewPage(15);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(0, 128, 0);
            pdf.text('Expected Output:', margin + 4, yPosition);
            yPosition += 4;
            
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(0, 0, 0);
            const expectedText = testCase.expectedOutput || 'No expected output';
            const expectedLines = pdf.splitTextToSize(expectedText, pageWidth - 2 * margin - 8);
            pdf.text(expectedLines, margin + 6, yPosition);
            yPosition += expectedLines.length * 3.5 + 2;
            
            // Actual Output (if available)
            if (qDetails.codeSubmission && testCaseStatus === 'FAILED') {
              checkNewPage(15);
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(8);
              pdf.setTextColor(255, 0, 0);
              pdf.text('Actual Output:', margin + 4, yPosition);
              yPosition += 4;
              
              pdf.setFont('courier', 'normal');
              pdf.setFontSize(7);
              pdf.setTextColor(0, 0, 0);
              const actualText = 'Code execution output would be shown here'; // In real implementation, you'd need to store/re-run test results
              const actualLines = pdf.splitTextToSize(actualText, pageWidth - 2 * margin - 8);
              pdf.text(actualLines, margin + 6, yPosition);
              yPosition += actualLines.length * 3.5 + 4;
            }
            
            yPosition += 3; // Space between test cases
          }
        } else {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text('No test cases available', margin + 4, yPosition);
          pdf.setTextColor(0, 0, 0);
          yPosition += 7;
        }

        yPosition += 5; // Extra space after test cases


      // Explanation if exists
      if (qDetails.explanation) {
        checkNewPage(15);
        pdf.setFillColor(230, 240, 255);
        const explStartY = yPosition - 3;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text('Explanation:', margin + 2, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        const explHeight = addText(qDetails.explanation, margin + 2, yPosition, pageWidth - 2 * margin - 4, 8);
        
        // Draw explanation box
        pdf.rect(margin, explStartY, pageWidth - 2 * margin, explHeight + 8, 'S');
        yPosition += explHeight + 5;
      }

      yPosition += 5; // Space between questions
    }
    

    // Footer
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    pdf.save(`${result.studentId}_${testName || testid}_detailed_report.pdf`);
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

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6" ref={pdfRef}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {testName || 'Test Results'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed performance analysis of all students
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700/40 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Total Attended
              </p>
              <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                {totalAttended} / {totalStudents}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-700/40 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                Average Score
              </p>
              <p className="text-2xl font-semibold text-green-900 dark:text-green-100">
                {averageScore !== null ? `${averageScore.toFixed(2)}%` : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-700/40 rounded-lg">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                Top Score
              </p>
              <p className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
                {topScore !== null ? `${topScore.toFixed(2)}%` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={downloadAllResultsPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Download All Results
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600">
                    <button
                      onClick={() => handleSort('studentId')}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                    >
                      <span>Student ID</span>
                      <div className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={`${sortColumn === 'studentId' && sortDirection === 'asc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400'
                            }`}
                        />
                        <ChevronDown
                          size={12}
                          className={`${sortColumn === 'studentId' && sortDirection === 'desc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400 -mt-1'
                            }`}
                        />
                      </div>
                    </button>
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600">
                    <button
                      onClick={() => handleSort('mail')}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                    >
                      <span>Email</span>
                      <div className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={`${sortColumn === 'mail' && sortDirection === 'asc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400'
                            }`}
                        />
                        <ChevronDown
                          size={12}
                          className={`${sortColumn === 'mail' && sortDirection === 'desc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400 -mt-1'
                            }`}
                        />
                      </div>
                    </button>
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600">
                    <button
                      onClick={() => handleSort('totalMarks')}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                    >
                      <span>Score</span>
                      <div className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={`${sortColumn === 'totalMarks' && sortDirection === 'asc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400'
                            }`}
                        />
                        <ChevronDown
                          size={12}
                          className={`${sortColumn === 'totalMarks' && sortDirection === 'desc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400 -mt-1'
                            }`}
                        />
                      </div>
                    </button>
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600">
                    <button
                      onClick={() => handleSort('correctCount')}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                    >
                      <span>Correct</span>
                      <div className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={`${sortColumn === 'correctCount' && sortDirection === 'asc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400'
                            }`}
                        />
                        <ChevronDown
                          size={12}
                          className={`${sortColumn === 'correctCount' && sortDirection === 'desc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-blue-400 -mt-1'
                            }`}
                        />
                      </div>
                    </button>
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.length > 0 ? (
                  sortedResults.map((result, index) => (
                    <React.Fragment key={index}>
                      <tr
                        className={`${selectedRow === index
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          } transition-colors cursor-pointer border-b border-gray-200 dark:border-gray-700`}
                        onClick={() => setSelectedRow(selectedRow === index ? null : index)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {result.studentId.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {result.studentId}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {result.uid.substring(0, 6)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {result.mail}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${result.totalMarks >= 70 ? 'bg-green-100 text-green-800' : result.totalMarks >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {
                              isNaN(result.totalMarks) ? (
                                "Not Attended"
                              ) : (
                                `${result.totalMarks.toFixed(2)}%`
                              )
                            }
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">
                            {result.correctCount} / {result.totalQuestions}
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadStudentPDF(result);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm"
                            title="Download detailed student report"
                          >
                            <Download size={16} />
                            Download PDF
                          </button>
                        </td>
                        {/* <td className="p-3">
                          <div className="flex gap-1">
                            {result.questions.map((q, i) => (
                              <div
                                key={i}
                                className={`w-2 h-8 rounded ${q.correct ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                title={`${q.id}: ${q.marks} points`}
                              />
                            ))}
                          </div>
                        </td> */}
                      </tr>
                      {selectedRow === index && (
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan="6" className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Question Details:
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {result.questions.map((q, i) => (
                                <div
                                  key={i}
                                  onClick={() =>
                                    fetchQuestionDetails(q.id, result.studentId, result.uid, q.correct, q.type, q.originalId, q.code)
                                  }
                                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-900 text-sm">
                                      {q.id || `Question ${i + 1}`}
                                    </h4>
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${q.marks > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                      {q.marks || 0} points
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs ${q.correct
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                      {q.correct ? '✓ Correct' : '✗ Wrong'}
                                    </span>
                                    {q.code && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center gap-1">
                                        <CodeIcon size={12} />
                                        Code
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No results found for this exam
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Question Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Question Details
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {isLoadingQuestion ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${selectedQuestion?.isCorrect
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                    >
                      {selectedQuestion?.isCorrect ? '✓ Correct Answer' : '✗ Incorrect Answer'}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium">
                      {questionDetails?.type || 'MCQ'}
                    </span>
                  </div>

                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {questionDetails?.question}
                  </h4>

                  {questionDetails?.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {questionDetails.description}
                    </p>
                  )}
                </div>

                {userCode && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CodeIcon size={18} className="text-purple-600" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Student's Code Submission
                      </h4>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-100">
                        <code>{userCode.code}</code>
                      </pre>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {questionDetails?.options && Object.keys(questionDetails.options).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Options:</h4>
                      <div className="space-y-2">
                        {Object.entries(questionDetails.options).map(([key, value]) => {
                          const displayKey = parseInt(key);
                          const displayLabel = isNaN(displayKey) ? key : (displayKey + 1).toString();
                          
                          return (
                            <div
                              key={key}
                              className={`p-3 rounded-lg border ${key === questionDetails?.correctAnswer
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                                }`}
                            >
                              <span className="font-medium">{displayLabel}:</span> {value}
                              {key === questionDetails?.correctAnswer && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                  (Correct Answer)
                                </span>
                              )}
                            </div>
                          );
                        })}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
