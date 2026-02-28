import React, { useEffect, useState } from "react";
import { ref, onValue, get } from "firebase/database";
import { database } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import CodePage from "./CodePage";
import SqlPage from "./SqlPage";
import MCQPage from "./MCQPage";
import MSQPage from "./MSQPage";
import NumericPage from "./NumericPage";
import LoadingPage from "./LoadingPage";
import CpuApp from "./Visual/Cpu/CpuApp";

// Navigation Icons
const NavigationIcons = {
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
};

const DynamicComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { course, subcourse, questionId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("active");


  // Fetch question data from Firebase
  useEffect(() => {



    const fetchData = async () => {
      try {
        // Single call for both question data and next question URL
        const questionRef = ref(
          database,
          `questions/${questionId}`);

        const statusRef = ref(
          database,
          `AlgoCore/${course}/lessons/${subcourse}/status`);

        // Get both question data and all questions in parallel
        const [questionSnapshot, statusSnapshot] = await Promise.all([
          get(questionRef),
          get(statusRef)
        ]);

        console.log(questionId);

        console.log(questionSnapshot.val());
        console.log(statusSnapshot.val());

        if (questionSnapshot.exists()) {
          const question = questionSnapshot.val();

          console.log(question);
          setData(question);
          setStatus(statusSnapshot.val());
        }
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    };

    const fetchDataQuestions = async () => {
      try {
        // Single call for both question data and next question URL
        const questionRef = ref(
          database,
          `AlgoCore/${course}/lessons/${subcourse}/questions`);

        // Get both question data and all questions in parallel
        const [questionSnapshot] = await Promise.all([
          get(questionRef),
        ]);

        console.log(questionSnapshot.val());

        if (questionSnapshot.exists()) {
          const questions = questionSnapshot.val();
          console.log('Raw questions data:', questions);

          // Handle different data structures
          let questionsList;
          if (Array.isArray(questions)) {
            // If questions is already an array
            questionsList = questions;
          } else if (typeof questions === 'object') {
            // If questions is an object, get the keys (question IDs)
            questionsList = Object.keys(questions);
          } else {
            console.error('Unexpected questions data structure:', questions);
            questionsList = [];
          }

          console.log('Processed questions list:', questionsList);
          setAllQuestions(questionsList);

          // Find current question index
          const currentIndex = questionsList.findIndex(q => q === questionId);
          console.log('Current question ID:', questionId);
          console.log('Found index:', currentIndex);
          setCurrentQuestionIndex(currentIndex !== -1 ? currentIndex : 0);
        }
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    };

    fetchData();
    fetchDataQuestions();

    if (questionId === "CpuVisual") {
      setData({
        type: "CpuVisual"
      })
    }


    setLoading(false);


  }, [questionId, course, subcourse]); // Dependencies adjusted

  const handlePreviousQuestion = () => {
    console.log('Previous button clicked');
    console.log('Current index:', currentQuestionIndex);
    console.log('All questions:', allQuestions);

    if (currentQuestionIndex > 0) {
      const prevQuestion = allQuestions[currentQuestionIndex - 1];
      console.log('Navigating to previous question:', prevQuestion);
      const url = `/problem/${course}/${subcourse}/${prevQuestion}`;
      console.log('Navigation URL:', url);
      navigate(url);
    } else {
      console.log('Already at first question - redirecting to home');
      navigate(`/course/${course}`); // Redirect to home when at first question
    }
  };

  const handleNextQuestion = () => {
    console.log('Next button clicked');
    console.log('Current index:', currentQuestionIndex);
    console.log('All questions:', allQuestions);

    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextQuestion = allQuestions[currentQuestionIndex + 1];
      console.log('Navigating to next question:', nextQuestion);
      const url = `/problem/${course}/${subcourse}/${nextQuestion}`;
      console.log('Navigation URL:', url);
      navigate(url);
    } else {
      console.log('At last question - redirecting to home');
      navigate(`/course/${course}`); // Redirect to home when at last question
    }
  };

  if (loading) return <LoadingPage />;

  if (!data) return <LoadingPage message="Slow internet, loading...." />;

  // Navigation props to pass to child components
  const navigationProps = {
    showNavigation: allQuestions.length > 1,
    currentQuestionIndex,
    totalQuestions: allQuestions.length,
    onPrevious: handlePreviousQuestion,
    onNext: handleNextQuestion,
    NavigationIcons
  };

  if (status === "blocked") {
    return <LoadingPage message="This topic is blocked" />;
  }

  return (
    <div className="relative">
      {data.type === "Programming" && <CodePage data={data} navigation={navigationProps} />}
      {data.type === "SQL" && <SqlPage data={data} navigation={navigationProps} />}
      {data.type === "MCQ" && <MCQPage data={data} />}
      {data.type === "MSQ" && <MSQPage data={data} />}
      {data.type === "Numeric" && <NumericPage data={data} />}
      {data.type === "CpuVisual" && <CpuApp />}
      {!["Programming", "SQL", "MCQ", "MSQ", "Numeric", "CpuVisual"].includes(data.type) && (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 max-w-md">
            <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Unsupported Question Type</h3>
            <p className="text-sm text-red-600 dark:text-red-400">Question type "{data.type}" is not supported yet.</p>
          </div>
        </div>
      )}
      {/* Add more conditional components as needed */}



    </div>
  );
};

export default DynamicComponent;
