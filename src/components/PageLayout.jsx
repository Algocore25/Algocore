import React from 'react';
import Navbar from './Navbar';

const PageLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-dark-primary transition-colors duration-200">
      {/* Navbar (fixed positioning) */}
      <Navbar />
      
      {/* Main Content - accounts for fixed navbar */}
      <main className="flex-1 pt-16 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
