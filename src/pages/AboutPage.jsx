import React from 'react';
import { FaCode, FaGraduationCap, FaChartLine, FaUsers, FaLightbulb, FaShieldAlt } from 'react-icons/fa';

const AboutPage = () => {
  // Background elements
  const backgroundElements = [
    { top: '20%', left: '10%', size: 'w-20 h-20', color: 'bg-blue-200' },
    { top: '40%', right: '10%', size: 'w-16 h-16', color: 'bg-purple-200' },
    { bottom: '40%', left: '15%', size: 'w-12 h-12', color: 'bg-green-200' },
    { bottom: '60%', right: '20%', size: 'w-24 h-24', color: 'bg-yellow-200' },
  ];

  const features = [
    {
      icon: <FaCode className="w-8 h-8 text-indigo-600" />,
      title: 'AI-Powered Learning',
      description: 'Intelligent code assessment with real-time feedback using advanced AI and NLP technologies.'
    },
    {
      icon: <FaGraduationCap className="w-8 h-8 text-indigo-600" />,
      title: 'Instructor-Led',
      description: 'Empowering educators with tools to create and manage customized technical courses.'
    },
    {
      icon: <FaChartLine className="w-8 h-8 text-indigo-600" />,
      title: 'Performance Analytics',
      description: 'Comprehensive dashboards for tracking student progress and course effectiveness.'
    },
    {
      icon: <FaShieldAlt className="w-8 h-8 text-indigo-600" />,
      title: 'Secure & Scalable',
      description: 'Built on Microsoft Azure for enterprise-grade security and reliability.'
    }
  ];



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern dark:bg-dark-grid-pattern bg-20"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {backgroundElements.map((element, index) => (
          <div 
            key={index}
            className={`absolute ${element.top} ${element.left || ''} ${element.right || ''} 
                       ${element.size} ${element.color} rounded-full opacity-20 animate-pulse`}
            style={{
              animationDelay: `${index * 2}s`,
              animationDuration: '8s'
            }}
          ></div>
        ))}
      </div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-800 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">About AlgoCore</h1>
          <p className="text-xl max-w-3xl mx-auto opacity-90">
            Revolutionizing technical education with AI-powered learning and assessment
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                To transform technical education by providing an intelligent, accessible, and comprehensive platform that bridges the gap between academic learning and industry requirements.
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-gray-700 p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <FaLightbulb className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Vision</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                To become the leading platform for technical education, empowering millions of students and educators worldwide with cutting-edge learning technologies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose AlgoCore?
            </h2>
            <div className="w-20 h-1 bg-indigo-600 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

    
    </div>
  );
};

export default AboutPage;

