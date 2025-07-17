import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResultTestCard({ test }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 relative border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white pr-6">{test.name}</h3>
      <p className="text-gray-600 dark:text-gray-300 mt-2">
        Created: {new Date(test.createdAt).toLocaleDateString()}
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        Status: <span className="capitalize">{test.Properties?.status || 'completed'}</span>
      </p>
      <div className="mt-4">
        <button
          onClick={() => navigate(`/adminresults/${test.id}`)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Show Results
        </button>
      </div>
    </div>
  );
}
