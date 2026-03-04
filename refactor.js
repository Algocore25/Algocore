const fs = require('fs');

function refactorFile(sourceFile, examFile) {
    let content = fs.readFileSync(sourceFile, 'utf8');

    // 1. Params and Props
    content = content.replace(/function (CodePageSingle|CodePageMultifile)\(\{\s*data,\s*navigation,\s*questionData:\s*propQuestionData,\s*selectedLanguage:\s*propSelectedLanguage\s*\}\) \{/g,
        "function $1({ question, data, navigation, questionData: propQuestionData, selectedLanguage: propSelectedLanguage }) {");

    content = content.replace(/const \{ course: encCourse, subcourse: encSubcourse, questionId: encQuestionId \} = useParams\(\);\n\s*const course = decodeShort\(encCourse\);\n\s*const subcourse = decodeShort\(encSubcourse\);\n\s*const questionId = decodeShort\(encQuestionId\);/g,
        `const { testid } = useParams();\n  const questionId = question;\n  const userId = user?.uid;`);

    content = content.replace(/const safeCourse = sanitizeKey\(course\);\n\s*const safeSubcourse = sanitizeKey\(subcourse\);\n/g, "");
    content = content.replace(/safeCourse/g, "testid");
    content = content.replace(/safeSubcourse/g, "''");

    content = content.replace(/user\.uid/g, "userId");

    // 2. Paths
    content = content.replace(/Submissions\/\$\{userId\}\/\$\{testid\}\/\$\{''\}\/\$\{safeQuestionId\}\/\$\{safeTimestamp\}/g, "ExamCodeSubmissions/${testid}/${userId}/${question}/${safeTimestamp}");
    content = content.replace(/Submissions\/\$\{userId\}\/\$\{testid\}\/\$\{''\}\/\$\{safeQuestionId\}/g, "ExamCodeSubmissions/${testid}/${userId}/${question}");
    content = content.replace(/savedCode\/\$\{userId\}\/\$\{course\}\/\$\{questionId\}\/\$\{selectedLanguage\}/g, "ExamCode/${testid}/${userId}/${question}/${selectedLanguage}");
    content = content.replace(/\/AlgoCore\/\$\{course\}\/course\/allowedLanguages/g, "Exam/${testid}/allowedLanguages");

    // 3. fetchCompletionStatus -> fetchSubmissionStatus
    content = content.replace(/const fetchCompletionStatus[\s\S]*?fetchCompletionStatus\(\);\n\s*\}/g, "");
    const replSubmissionStatus = `const fetchSubmissionStatus = async () => {
      if (userId && questionData) {
        const resultRef = ref(database, \`ExamSubmissions/\${testid}/\${userId}/\${question}/\`);
        const snapshot = await get(resultRef);
        if (snapshot.exists()) {
          const result = snapshot.val();
          setIsCompleted(result === 'true');
        } else {
          setIsCompleted(false);
        }
      }
    };
    fetchSubmissionStatus();`;
    content = content.replace(/useEffect\(\(\) => \{\n\s*const fetchCourseData = async \(\) => \{/, replSubmissionStatus + '\n\n  useEffect(() => {\n    const fetchCourseData = async () => {');

    // 4. handleSubmit2 logic
    content = content.replace(/const logSubmission = async \(status, submittedCode\) => \{/g,
        "const logSubmission = async (status, submittedCode, marks, updatedResults) => {");

    content = content.replace(/await set\(ref\(database, path\), \{\n\s*language: selectedLanguage,\n\s*status,\n\s*code: submittedCode,\n\s*\}\);/g,
        `await set(ref(database, path), {
        language: selectedLanguage,
        status,
        code: submittedCode,
        marks: marks * 100 || 0,
        testResults: updatedResults || [],
      });`);

    const examCalcMarksStr = `    const allPassed = updatedResults.every(tc => tc.passed);
    let vm = 0;
    let hm = 0;
    let tclen = updatedResults.length;

    updatedResults.forEach((tc, index) => {
      if (tc.passed) {
        if (index < 2) {
          vm += 1;  // first two test cases
        } else {
          hm += 1;  // remaining test cases
        }
      }
    });

    let marks = (vm / 2) * 0.3 + (hm / (tclen - 2)) * 0.7;

    if (updatedResults.length <= 2) {
      marks = (vm / 2) * 1.0;
    }

    await logSubmission(allPassed ? 'correct' : 'wrong', __SOURCE_CODE__, marks, updatedResults);
    
    // Save marks
    const finalResult = allPassed ? 'true' : 'false';
    const resultRef = ref(database, \`ExamSubmissions/\${testid}/\${userId}/\${question}/\`);
    const markRef = ref(database, \`Marks/\${testid}/\${userId}/\${question}/\`);

    const prevmark = await get(markRef);
    if (!prevmark.exists() || prevmark.val() < (marks * 100)) {
      await set(resultRef, finalResult);
      await set(markRef, (marks) * 100);
    }
    
    setIsCompleted(allPassed);`;

    if (content.includes("await logSubmission(allPassed ? 'correct' : 'wrong', sourceCode);")) {
        content = content.split("    await markProblemAsCompleted(allPassed);\n    await logSubmission(allPassed ? 'correct' : 'wrong', sourceCode);").join(examCalcMarksStr.replace('__SOURCE_CODE__', 'sourceCode'));
    }

    if (content.includes("await logSubmission(allPassed ? 'correct' : 'wrong', getCombinedCode());")) {
        content = content.split("    await markProblemAsCompleted(allPassed);\n    await logSubmission(allPassed ? 'correct' : 'wrong', getCombinedCode());").join(examCalcMarksStr.replace('__SOURCE_CODE__', 'getCombinedCode()'));
    }

    // Remove markProblemAsCompleted definition
    content = content.replace(/const markProblemAsCompleted = async \(isCorrect\) => \{[\s\S]*?catch \(error\) \{\n\s*console\.error\("Error saving user progress:", error\);\n\s*\}\n\s*\};/g, '');

    fs.writeFileSync(examFile, content, 'utf8');
    console.log('Processed', examFile);
}

refactorFile('src/pages/CodePageSingle.jsx', 'src/pages/Exam/CodePageSingle.jsx');
refactorFile('src/pages/CodePageMultifile.jsx', 'src/pages/Exam/CodePageMultifile.jsx');
