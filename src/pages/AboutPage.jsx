import React from 'react';

const AboutPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        About AlgoCore
      </h1>
      <div className="space-y-6 text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
        <p>
          AlgoCore is an AI-powered, instructor-led coding platform designed to modernize technical education within academic institutions. Developed by a team of four engineering students, the platform empowers faculty to create, manage, and evaluate customized technical courses with ease. Unlike traditional platforms, AlgoCore incorporates intelligent code assessment using AI and NLP to deliver personalized feedback, automate evaluations, and enhance student engagement.
        </p>
        <p>
          Built on a secure and scalable Microsoft Azure cloud infrastructure, AlgoCore offers real-time dashboards for both faculty and students, enabling transparent progress tracking and increased academic productivity. The platform promotes flexibility in course delivery, sustainability through full digitization, and adaptability to evolving educational and industry needs. With a vision to expand into a wide range of technical fields, AlgoCore aims to become a comprehensive academic companion for future-ready learning.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;

