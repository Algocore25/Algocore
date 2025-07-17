// components/TestCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const TestCard = ({ test, onStart }) => {
  console.log(test);

  const navigate = useNavigate();
  const status = test?.Properties?.status || "Unknown";

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <h3 className="text-xl font-semibold text-gray-800">{test.name}</h3>
      <p className="text-gray-600 mt-2">Duration: {test.duration} minutes</p>
      <p className="text-gray-600">Questions: {test.questions?.length || 0}</p>

      <div className="mt-4">
        {status === "NotStarted" && (
          <button
            className="w-full bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed"
            disabled
          >
            Available Soon
          </button>
        )}

        {status === "Started" && (
          <button
            onClick={() => onStart(test.id)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            View
          </button>
        )}

        {status === "Completed" && (
          <button
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md "
            onClick={() => navigate(`/studentresults/${test.id}`)}
          >
            view results
          </button>
        )}
        
      </div>
    </div>
  );
};

export default TestCard;
