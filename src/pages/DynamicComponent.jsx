import React, { useEffect, useState } from "react";
import { ref, onValue , get} from "firebase/database";
import { database } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";
import CodePage from "./CodePage";
import MCQPage from "./MCQPage";
import LoadingPage from "./LoadingPage";




const DynamicComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { course, subcourse, questionId } = useParams();



  // Fetch question data from Firebase
  useEffect(() => {

    const fetchData = async () => {
      try {
        // Single call for both question data and next question URL
        const questionRef = ref(
          database,
          `questions/${questionId}`);

        // Get both question data and all questions in parallel
        const [questionSnapshot] = await Promise.all([
          get(questionRef),
        ]);

        console.log( questionSnapshot.val() );

        if (questionSnapshot.exists()) {
          const question = questionSnapshot.val();

          console.log(question);
          setData(question);
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

        console.log( questionSnapshot.val() );

        if (questionSnapshot.exists()) {
          const question = questionSnapshot.val();

          console.log(question);
        }
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    };

    fetchData();
    fetchDataQuestions();
    setLoading(false);

  }, []); // Dependencies adjusted




  if (loading) return <LoadingPage/>;

  if (!data) return <LoadingPage message= "Slow internet, loading...." />;

  return (
    <div>
      {data.type === "Programming" && <CodePage  />}
      {data.type === "MCQ" && <MCQPage  data= {data} />}
      {/* Add more conditional components as needed */}
    </div>
  );
};

export default DynamicComponent;
