import React, { useEffect, useState } from "react";
import { ref, onValue, get } from "firebase/database";
import { database } from "../../firebase";
import MCQPage from "./MCQPage";
import MSQPage from "./MSQPage";
import NumericPage from "./NumericPage";
import CodePage from "./CodePage";
import SqlPage from "./SqlPage";
import LoadingPage from "../LoadingPage";




const DynamicComponent = ({ question }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);





  // Fetch question data from Firebase
  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);

      try {
        // Single call for both question data and next question URL
        const questionRef = ref(
          database,
          `questions/${question}`);

        // Get both question data and all questions in parallel
        const [questionSnapshot] = await Promise.all([
          get(questionRef),
        ]);

        console.log(questionSnapshot.val());

        if (questionSnapshot.exists()) {
          const question = questionSnapshot.val();

          console.log(question);
          setData(question);
        }
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      } finally {
        setLoading(false);
      }
    };


    console.log(data?.type);

    fetchData();

  }, [question]); // Dependencies adjusted




  if (loading) return <LoadingPage message="Loading question, please wait..." />;

  if (!data) return <p>No data found</p>;

  return (
    <div>
      {data?.type === "Programming" && <CodePage question={question} />}
      {data?.type === "SQL" && <SqlPage question={question} />}
      {data?.type === "MCQ" && <MCQPage data={data} />}
      {data?.type === "MSQ" && <MSQPage data={data} />}
      {data?.type === "Numeric" && <NumericPage data={data} />}
      {!["Programming", "SQL", "MCQ", "MSQ", "Numeric"].includes(data?.type) && (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 max-w-md">
            <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Unsupported Question Type</h3>
            <p className="text-sm text-red-600 dark:text-red-400">Question type "{data?.type}" is not supported yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicComponent;
