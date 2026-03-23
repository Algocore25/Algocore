import React, { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';

// Default avatar component
const DefaultAvatar = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto">
    <circle cx="100" cy="100" r="80" fill="#4F46E5" />
    <circle cx="100" cy="85" r="40" fill="#F3F4F6" />
    <circle cx="82" cy="80" r="5" fill="#374151" />
    <circle cx="118" cy="80" r="5" fill="#374151" />
    <path d="M80 120 Q100 140 120 120" stroke="#374151" strokeWidth="4" fill="none" />
  </svg>
);

// Component to render SVG from string
const SvgRenderer = ({ svgString, className = '' }) => {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};

const ContactPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const teamRef = ref(database, 'teamMembers');

    const processTeamMember = (member) => {
      // If avatar is an object with an svg property, use it
      if (member.avatar && typeof member.avatar === 'object' && member.avatar.svg) {
        return {
          ...member,
          avatar: <SvgRenderer
            svgString={member.avatar.svg}
            className="w-32 h-32 mx-auto"
          />
        };
      }
      // If avatar is a string, use it as SVG string
      if (member.avatar && typeof member.avatar === 'string') {
        return {
          ...member,
          avatar: <SvgRenderer
            svgString={member.avatar}
            className="w-32 h-32 mx-auto"
          />
        };
      }
      // Default avatar if none provided
      return {
        ...member,
        avatar: <DefaultAvatar />
      };
    };

    const unsubscribe = onValue(teamRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          // Convert the object of team members to an array and process each member
          const membersArray = Object.entries(data).map(([id, member]) => ({
            id,
            ...processTeamMember(member)
          }));
          setTeamMembers(membersArray);
        } else {
          setTeamMembers([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError('Failed to load team members. Please try again later.');
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase error:', error);
      setError('Error connecting to the server. Please check your connection.');
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-300">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 sm:py-32 z-10 relative">
        <div className="mx-auto max-w-2xl text-center mb-24">
          <h2 className="text-lg font-semibold leading-7 text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Our Team</h2>
          <p className="mt-4 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Meet the minds behind <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">AlgoCore</span>
          </p>
          <p className="mt-8 text-xl leading-8 text-gray-600 dark:text-gray-300">
            We're a passionate group of educators, engineers, and designers dedicated to making technical learning accessible and effective for everyone.
          </p>
        </div>

        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-40">
            {teamMembers.map((member) => (
              <div key={member.id} className="group relative bg-white/70 dark:bg-dark-secondary/70 backdrop-blur-md rounded-[2.5rem] p-10 shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-4">
                <div className="relative -mt-24 flex justify-center">
                  <div className="h-44 w-44 rounded-[2rem] bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <div className="h-full w-full rounded-[1.8rem] overflow-hidden bg-white dark:bg-dark-primary flex items-center justify-center">
                      {member.avatar || <DefaultAvatar />}
                    </div>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 text-lg font-semibold mb-6 uppercase tracking-wider">{member.role}</p>
                  <div className="flex justify-center space-x-6">
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 transition-all duration-300 shadow-sm border border-transparent hover:border-blue-400">
                      <FaLinkedin size={22} />
                    </a>
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-900 dark:hover:bg-white dark:hover:text-black transition-all duration-300 shadow-sm border border-transparent hover:border-gray-400">
                      <FaGithub size={22} />
                    </a>
                    <a href={`mailto:${member.email}`} className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 transition-all duration-300 shadow-sm border border-transparent hover:border-rose-400">
                      <FaEnvelope size={22} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/50 dark:bg-dark-secondary/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-gray-300 dark:border-gray-700 mb-40">
            <p className="text-gray-500 dark:text-gray-400 text-2xl font-medium italic">Our team members are currently hard at work. Check back soon! 🚀</p>
          </div>
        )}

        {/* Get in Touch Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-[4rem] p-16 lg:p-24 text-center overflow-hidden relative shadow-2xl group">
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-white/10 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-black/10 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl font-extrabold text-white sm:text-6xl mb-8 tracking-tight">Have Questions? <br />Get in Touch</h2>
            <p className="text-blue-50 text-xl mb-12 leading-relaxed opacity-90">
              Whether you're an educator looking to implement AlgoCore or a student needing support, our team is ready to assist you.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="mailto:support@algocore.com" className="inline-flex items-center justify-center px-10 py-5 rounded-[2rem] bg-white text-blue-600 text-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-xl hover:-translate-y-1">
                <FaEnvelope className="mr-3" /> Email Support
              </a>
              <a href="/" className="inline-flex items-center justify-center px-10 py-5 rounded-[2rem] bg-white/10 text-white text-xl font-bold hover:bg-white/20 transition-all duration-300 border-2 border-white/30 backdrop-blur-md hover:-translate-y-1">
                <FaLinkedin className="mr-3" /> Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
