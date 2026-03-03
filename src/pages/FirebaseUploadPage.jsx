import React, { useState } from 'react';
import { database } from '../firebase';
import { ref, set } from 'firebase/database';
import toast from 'react-hot-toast';

const FirebaseUploadPage = () => {
    const [location, setLocation] = useState('');
    const [data, setData] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!location.trim() || !data.trim()) {
            toast.error('Location and Data are required.');
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch (err) {
            toast.error('Invalid JSON data. Please check your data format.');
            return;
        }

        setLoading(true);
        try {
            const dbRef = ref(database, location);
            await set(dbRef, parsedData);
            toast.success('Data uploaded successfully!');
        } catch (err) {
            console.error('Firebase upload error:', err);
            toast.error('Failed to upload data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-20">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Admin Firebase Upload (Dev Only)</h1>

            <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-md p-6 border border-gray-200 dark:border-dark-tertiary">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Realtime Firebase Location (Path)
                    </label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., AlgoCore/CourseName/lessons/0"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-primary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data to Upload (JSON)
                    </label>
                    <textarea
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        placeholder='{"key": "value"}'
                        rows={15}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-primary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
                    ></textarea>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors flex justify-center items-center ${loading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                        }`}
                >
                    {loading ? 'Uploading...' : 'Upload Data'}
                </button>
            </div>
        </div>
    );
};

export default FirebaseUploadPage;
