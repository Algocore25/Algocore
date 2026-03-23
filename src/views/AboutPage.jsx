import React from 'react';
import { FaCode, FaGraduationCap, FaChartLine, FaUsers, FaLightbulb, FaShieldAlt } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';

const AboutPage = () => {
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
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
      <AnimatedBackground />

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 sm:pt-32 sm:pb-24 z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl mb-8">
              About <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">AlgoCore</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-300">
              Revolutionizing technical education with AI-powered learning and assessment. We're building the future of algorithmic mastery through real-world practice.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 z-10">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-16 items-center">
          <div className="bg-white/80 dark:bg-dark-secondary/80 backdrop-blur-md p-10 rounded-[2.5rem] border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-8 border-l-8 border-blue-600 pl-6">
              Our Mission
            </h2>
            <p className="text-xl leading-relaxed text-gray-600 dark:text-gray-300">
              To transform technical education by providing an intelligent, accessible, and comprehensive platform that bridges the gap between academic learning and industry requirements. We believe everyone deserves high-quality, personalized technical training.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-10 rounded-[2.5rem] shadow-2xl self-stretch flex flex-col justify-center text-white relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center gap-x-4 mb-6">
              <div className="flex-none rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                <FaLightbulb className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold">Our Vision</h3>
            </div>
            <p className="text-lg leading-relaxed text-white/90">
              To become the leading platform for technical education, empowering millions of students and educators worldwide with cutting-edge learning technologies and data-driven insights.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative py-24 sm:py-32 z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-20">
            <h2 className="text-lg font-semibold leading-7 text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Why Choose Us</h2>
            <p className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Everything you need to master algorithms
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-start bg-white/70 dark:bg-dark-secondary/70 backdrop-blur-md p-10 rounded-[2rem] shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-3 group">
                  <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 mb-8 shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300">
                    <div className="h-8 w-8 text-white text-2xl flex items-center justify-center">
                      {feature.icon}
                    </div>
                  </div>
                  <dt className="text-2xl font-bold leading-7 text-gray-900 dark:text-white mb-6">
                    {feature.title}
                  </dt>
                  <dd className="flex flex-auto flex-col text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      {/* Call to Action Section */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 z-10">
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-[3rem] p-12 lg:p-20 text-center overflow-hidden relative shadow-2xl group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-black/10 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl font-extrabold text-white mb-8">Ready to Start Your Journey?</h2>
            <p className="text-blue-50 text-xl mb-12 opacity-90">
              Join thousands of students and master algorithms with AlgoCore's interactive platform.
            </p>
            <div className="flex justify-center">
              <a href="/" className="inline-flex items-center justify-center px-10 py-5 rounded-[2rem] bg-white text-blue-600 text-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-xl hover:-translate-y-1">
                Back to Home Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

