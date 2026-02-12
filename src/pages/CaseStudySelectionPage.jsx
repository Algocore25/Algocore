import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { database } from "../firebase";
import { useTheme } from '../context/ThemeContext';

const CaseStudySelectionPage = () => {
    const [pdfs, setPdfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { theme } = useTheme();

    useEffect(() => {
        const fetchPdfs = async () => {
            try {
                // Fetch file list from GitHub repository
                const response = await fetch('https://api.github.com/repos/Algocore25/Images/contents/');
                if (!response.ok) {
                    throw new Error('Failed to fetch case studies');
                }
                const data = await response.json();

                // Filter for PDF files, excluding dark mode variants
                const pdfFiles = data.filter(file =>
                    file.name.toLowerCase().endsWith('.pdf') &&
                    !file.name.toLowerCase().endsWith('_dark.pdf')
                );
                setPdfs(pdfFiles);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching PDFs:", err);
                setError("Failed to load case studies. Please try again later.");
                setLoading(false);
            }
        };

        fetchPdfs();
    }, []);

    const handleSelectPdf = (fileName) => {
        // Navigate to the case study editor with the encoded file name
        // We use encodeURIComponent to handle spaces and special chars safely in URL
        navigate(`/case-study/${encodeURIComponent(fileName)}`);
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-lg font-medium">Loading Case Studies...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="text-center p-8 max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Oops!</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Available Case Studies
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Select a case study to begin your analysis. All notes are automatically saved for each document.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pdfs.map((file) => (
                        <div
                            key={file.sha}
                            onClick={() => handleSelectPdf(file.name)}
                            className={`group cursor-pointer rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden
                                ${theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 hover:border-purple-500'
                                    : 'bg-white border-gray-200 hover:border-blue-500'
                                }`}
                        >
                            <div className={`h-40 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                                <svg className={`w-16 h-16 ${theme === 'dark' ? 'text-gray-600 group-hover:text-purple-400' : 'text-gray-400 group-hover:text-blue-500'} transition-colors duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-purple-400 transition-colors">
                                    {file.name.replace('.pdf', '').replace(/[-_]/g, ' ')}
                                </h3>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                                        {formatBytes(file.size)}
                                    </span>
                                    <span className="text-xs font-bold text-blue-500 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        Open <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CaseStudySelectionPage;
