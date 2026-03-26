import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../../firebase';
import { 
  FiSearch, 
  FiVideo, 
  FiUser, 
  FiClock, 
  FiExternalLink, 
  FiCpu, 
  FiMonitor, 
  FiDownload,
  FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingPage from '../LoadingPage';

const AdminRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [users, setUsers] = useState({});
  const [exams, setExams] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recordingsSnap, usersSnap, examsSnap] = await Promise.all([
          get(ref(database, 'ExamRecordings')),
          get(ref(database, 'users')),
          get(ref(database, 'Exam'))
        ]);

        const recordingsData = recordingsSnap.val() || {};
        const usersData = usersSnap.val() || {};
        const examsData = examsSnap.val() || {};

        setUsers(usersData);
        setExams(examsData);

        const recordingsList = [];
        
        // Flatten ExamRecordings/{testid}/{uid}
        Object.entries(recordingsData).forEach(([testid, testRecordings]) => {
          Object.entries(testRecordings).forEach(([uid, data]) => {
            recordingsList.push({
              id: `${testid}-${uid}`,
              testid,
              uid,
              testName: examsData[testid]?.name || testid,
              userName: usersData[uid]?.name || 'Unknown Student',
              userEmail: usersData[uid]?.email || 'No Email',
              cameraUrl: data.cameraUrl,
              screenUrl: data.screenUrl,
              meta: data.meta || {},
              timestamp: data.meta?.startedAt ? new Date(data.meta.startedAt).getTime() : 0
            });
          });
        });

        // Sort by most recent
        setRecordings(recordingsList.sort((a, b) => b.timestamp - a.timestamp));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recordings:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRecordings = useMemo(() => {
    return recordings.filter(rec => 
      rec.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.testName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recordings, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingPage message="Loading proctoring recordings..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proctoring Recordings</h1>
          <p className="text-gray-600 dark:text-gray-400">View and review exam session recordings</p>
        </div>

        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student or exam..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Exam</th>
                <th className="px-6 py-4">Session Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Recordings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredRecordings.length > 0 ? (
                filteredRecordings.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <FiUser />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{rec.userName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{rec.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{rec.testName}</div>
                      <div className="text-xs text-gray-500">ID: {rec.testid.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiClock className="text-gray-400" />
                        {formatDate(rec.meta.startedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rec.meta.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {rec.meta.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {rec.cameraUrl && (
                          <button
                            onClick={() => setSelectedVideo({ url: rec.cameraUrl, title: `Camera: ${rec.userName}`, type: 'Camera' })}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            title="View Camera Feed"
                          >
                            <FiVideo />
                          </button>
                        )}
                        {rec.screenUrl && (
                          <button
                            onClick={() => setSelectedVideo({ url: rec.screenUrl, title: `Screen: ${rec.userName}`, type: 'Screen' })}
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-all"
                            title="View Screen Share"
                          >
                            <FiMonitor />
                          </button>
                        )}
                        {!rec.cameraUrl && !rec.screenUrl && (
                          <span className="text-xs text-gray-400 italic">No recordings</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-440">
                    No recordings found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedVideo.type === 'Camera' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {selectedVideo.type === 'Camera' ? <FiVideo /> : <FiMonitor />}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedVideo.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video bg-black flex items-center justify-center">
                <video
                  src={selectedVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              </div>

              <div className="p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Note: Videos are streamed directly from Azure Blob Storage.
                </p>
                <a
                  href={selectedVideo.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FiDownload />
                  Download
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRecordings;
