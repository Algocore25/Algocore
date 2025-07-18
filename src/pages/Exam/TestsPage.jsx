import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TestsSidebar from '../../components/TestsSidebarStudent';
import AvailableTests from './AvailableTests';
import Results from './Results';

const TestsPage = () => {
  const [activeTab, setActiveTab] = useState('available-tests');


  return (
        <div className="flex h-screen bg-gray-50 dark:bg-dark-primary">
      <TestsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tests</h1>
        </div>
        
        {activeTab === 'available-tests' && (
  
          <AvailableTests/>


        )}

        {activeTab === 'download-results' && (

          <Results/>

        )}


      </main>
    </div>
  );
};

export default TestsPage;
