import React, { useState, useEffect } from 'react';
import { 
  FiFile, FiFolder, FiExternalLink, FiSearch, FiRefreshCw, 
  FiDownload, FiTrash2, FiInfo, FiChevronRight, FiCpu, FiSettings, FiPlay
} from 'react-icons/fi';
import LoadingPage from '../LoadingPage';
import toast from 'react-hot-toast';

const AdminFiles = () => {
    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [blobs, setBlobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [downloadingBlob, setDownloadingBlob] = useState(null); // stores blob name
    const [convertingBlob, setConvertingBlob] = useState(null);   // stores blob name
    const [conversionProgress, setConversionProgress] = useState(null);

    const fetchContainers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/list-blobs');
            const data = await res.json();
            if (data.containers) {
                setContainers(data.containers);
                if (data.containers.length > 0) {
                    setSelectedContainer(data.containers[0]);
                }
            }
        } catch (error) {
            console.error('Fetch containers error:', error);
            toast.error("Failed to load containers.");
        } finally {
            setLoading(false);
        }
    };

    const fetchBlobs = async (containerName) => {
        if (!containerName) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/list-blobs?container=${containerName}`);
            const data = await res.json();
            if (data.blobs) {
                setBlobs(data.blobs);
            }
        } catch (error) {
            console.error('Fetch blobs error:', error);
            toast.error("Failed to load blobs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContainers();
    }, []);

    useEffect(() => {
        if (selectedContainer) {
            fetchBlobs(selectedContainer);
        }
    }, [selectedContainer]);

    const handleDownload = async (blob, containerName) => {
        if (downloadingBlob) return;
        const fileName = blob.name.split('/').pop() || 'file';
        setDownloadingBlob(blob.name);
        const toastId = toast.loading(`Preparing ${fileName} for download...`);
        try {
            // Use proxy to bypass CORS and set attachment headers
            const proxyUrl = `/api/proxy-blob?container=${containerName}&blobName=${encodeURIComponent(blob.name)}&downloadName=${encodeURIComponent(fileName)}`;
            
            const a = document.createElement('a');
            a.href = proxyUrl;
            a.setAttribute('download', fileName);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            toast.success(`Download started for ${fileName}`, { id: toastId });
        } catch (err) {
            console.error('Download failed:', err);
            toast.error(`Download failed: ${err.message}`, { id: toastId });
        } finally {
            setTimeout(() => setDownloadingBlob(null), 1000);
        }
    };

    const handleConvertToMp4 = async (blob, containerName) => {
        if (convertingBlob) return;
        setConvertingBlob(blob.name);
        setConversionProgress(0);
        const fileName = blob.name.split('/').pop() || 'recording.webm';
        const toastId = toast.loading(`Initializing conversion for ${fileName}...`, { duration: 0 });
        
        try {
            const response = await fetch('/api/convert-to-mp4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blobName: blob.name, container: containerName })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let lastData = null;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(Boolean);

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        lastData = data;

                        if (data.status === 'converting') {
                            setConversionProgress(data.progress);
                            toast.loading(`Converting ${fileName}: ${data.progress}%`, { id: toastId });
                        } else if (data.status === 'downloading') {
                            toast.loading(`Downloading source from Azure...`, { id: toastId });
                        } else if (data.status === 'uploading') {
                            toast.loading(`Uploading formatted MP4...`, { id: toastId });
                        } else if (data.status === 'error') {
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
            }
            
            if (lastData && lastData.status === 'completed') {
                const mp4Url = lastData.url;
                const mp4FileName = fileName.replace('.webm', '.mp4');
                
                toast.success(lastData.isCached ? 'Found cached MP4!' : 'Conversion complete!', { id: toastId });
                
                // Trigger download using proxy for the newly created MP4
                const proxyUrl = `/api/proxy-blob?container=${containerName}&blobName=${encodeURIComponent(lastData.blobName)}&downloadName=${encodeURIComponent(mp4FileName)}`;
                const a = document.createElement('a');
                a.href = proxyUrl;
                a.setAttribute('download', mp4FileName);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                throw new Error('Conversion ended prematurely');
            }
        } catch (err) {
            console.error('Conversion failed:', err);
            toast.error(`Conversion error: ${err.message}`, { id: toastId });
        } finally {
            setConvertingBlob(null);
            setConversionProgress(null);
            setTimeout(() => toast.dismiss(toastId), 3000);
            fetchBlobs(containerName); // Refresh to show NEW mp4 if it was created
        }
    };

    const filteredBlobs = blobs.filter(blob => 
        blob.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (containerName, blobName) => {
        if (!window.confirm(`Are you sure you want to delete "${blobName}"? This action cannot be undone.`)) {
            return;
        }

        const deletePromise = fetch(`/api/delete-blob?container=${containerName}&blob=${encodeURIComponent(blobName)}`, {
            method: 'DELETE'
        });

        toast.promise(deletePromise, {
            loading: 'Deleting file...',
            success: (res) => {
                if (!res.ok) throw new Error('Delete failed');
                fetchBlobs(containerName);
                return 'File deleted successfully!';
            },
            error: (err) => `Failed to delete: ${err.message}`
        });
    };

    const handleDeleteAll = async (containerName) => {
        if (!window.confirm(`Are you sure you want to delete ALL files from "${containerName}"? This action is permanent and cannot be undone.`)) {
            return;
        }

        const deletePromise = fetch(`/api/delete-blob?container=${containerName}&blob=all`, {
            method: 'DELETE'
        });

        toast.promise(deletePromise, {
            loading: `Deleting all files in ${containerName}...`,
            success: (res) => {
                if (!res.ok) throw new Error('Failed to delete files');
                fetchBlobs(containerName);
                return `All files in "${containerName}" deleted successfully!`;
            },
            error: (err) => `Failed to delete: ${err.message}`
        });
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading && containers.length === 0) return <LoadingPage message="Connecting to Azure Storage..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Azure Blob Storage</h1>
                    <p className="text-gray-600 dark:text-gray-400">Browse and manage all hosted files</p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedContainer && filteredBlobs.length > 0 && (
                        <button 
                            onClick={() => handleDeleteAll(selectedContainer)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-all border border-red-200 dark:border-red-900/50"
                            title="Delete All Blobs in Container"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            <span>Delete All Files</span>
                        </button>
                    )}
                    <button 
                        onClick={() => selectedContainer ? fetchBlobs(selectedContainer) : fetchContainers()} 
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-all"
                        title="Refresh"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="relative w-full md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search blobs..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Containers Sidebar */}
                <div className="lg:col-span-1 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-2 overflow-hidden flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 p-3 flex items-center gap-2">
                        <FiFolder /> Containers
                    </h3>
                    <div className="space-y-1 overflow-y-auto max-h-[60vh]">
                        {containers.map(container => (
                            <button
                                key={container}
                                onClick={() => setSelectedContainer(container)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                    selectedContainer === container
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <FiFolder className={selectedContainer === container ? 'text-blue-500' : 'text-gray-400'} />
                                    {container}
                                </span>
                                <FiChevronRight className={`transition-transform ${selectedContainer === container ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Blobs List */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-300 border-b dark:border-gray-700 text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">File Name</th>
                                        <th className="px-6 py-4">Size</th>
                                        <th className="px-6 py-4">Last Modified</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                                                Loading files in "{selectedContainer}"...
                                            </td>
                                        </tr>
                                    ) : filteredBlobs.length > 0 ? (
                                        filteredBlobs.map((blob) => (
                                            <tr key={blob.name} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 transition-all bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-500 dark:bg-gray-700 dark:text-gray-400 rounded-lg">
                                                            <FiFile />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs md:max-w-md" title={blob.name}>
                                                                {blob.name}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {blob.properties?.contentType || 'Unknown type'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    {formatSize(blob.properties?.contentLength)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(blob.properties?.lastModified).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {blob.name.toLowerCase().endsWith('.webm') && (
                                                            <button 
                                                                onClick={() => handleConvertToMp4(blob, selectedContainer)}
                                                                disabled={Boolean(convertingBlob)}
                                                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-all disabled:opacity-50"
                                                                title="Convert to MP4"
                                                            >
                                                                {convertingBlob === blob.name ? <FiRefreshCw className="animate-spin" /> : <FiCpu />}
                                                            </button>
                                                        )}
                                                        <a 
                                                            href={blob.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                            title="Preview"
                                                        >
                                                            <FiExternalLink />
                                                        </a>
                                                        <button 
                                                            onClick={() => handleDownload(blob, selectedContainer)}
                                                            disabled={Boolean(downloadingBlob)}
                                                            className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-all disabled:opacity-50"
                                                            title="Download"
                                                        >
                                                            {downloadingBlob === blob.name ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(selectedContainer, blob.name)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-medium">
                                                No files found in "{selectedContainer}".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminFiles;
