import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase';
import LoadingPage from '../LoadingPage';
import toast from 'react-hot-toast';

const DatabaseBackup = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backupState, setBackupState] = useState({ show: false, current: 0, total: 0 });
  const [backupLogs, setBackupLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data from root. Note: doing this on a large database is not recommended for production.
        const snapshot = await get(ref(database, '/'));
        if (snapshot.exists()) {
          setData(snapshot.val());
        } else {
          setData({});
        }
      } catch (error) {
        console.error("Error fetching database:", error);
        toast.error("Failed to load database data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBackup = async () => {
    if (!data || Object.keys(data).length === 0) {
      return toast.error('No data to backup!');
    }

    const tableNames = Object.keys(data);
    setBackupState({ show: true, current: 0, total: tableNames.length });
    setBackupLogs([`[${new Date().toLocaleTimeString()}] Started Azure SQL Database Export...`]);
    let successCount = 0;

    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i];
      const tableData = data[tableName];

      setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Analysing collection: ${tableName}`]);

      try {
        const tablesData = {};
        if (typeof tableData === 'object' && tableData !== null) {
          const records = [];
          Object.keys(tableData).forEach(key => {
            const item = tableData[key];
            if (item && typeof item === 'object') {
              records.push({ _id: String(key), ...item });
            } else {
              records.push({ _id: String(key), Value: String(item) });
            }
          });
          tablesData[tableName] = records;
        } else {
          tablesData[tableName] = [{ _id: '1', Value: String(tableData) }];
        }

        const response = await fetch('/api/backup-azure-sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tablesData }),
        });

        const result = await response.json();

        if (response.ok) {
          successCount++;
          setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Exported ${tableName} (${tablesData[tableName].length} rows)`]);
          if (result.errors && result.errors.length > 0) {
             setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠️ Warnings on ${tableName}: ${result.errors.join(', ')}`]);
          }
        } else {
          setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Failed ${tableName}: ${result.error}`]);
        }
      } catch (error) {
        console.error('Backup request failed:', error);
        setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Network error on ${tableName}`]);
      }
      
      setBackupState(prev => ({ ...prev, current: i + 1 }));
    }

    setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Backup finished. Successfully exported ${successCount}/${tableNames.length} tables.`]);
    
    if (successCount === tableNames.length) {
      toast.success('Successfully backed up entire database directly to Azure SQL!');
    } else {
      toast.error('Backup finished with errors. Please review the logs.');
    }
  };

  if (loading) {
    return <LoadingPage message="Loading database records..." />;
  }

  const renderTables = () => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No data</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your Firebase database is currently empty.</p>
        </div>
      );
    }

    return Object.keys(data).map((tableName) => {
      const tableData = data[tableName];

      // Handle raw primitive root nodes (rare but possible)
      if (typeof tableData !== 'object' || tableData === null) {
        return (
          <div key={tableName} className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
               <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize flex items-center">
                 <span className="text-blue-600 dark:text-blue-400 mr-2">🗂️</span> {tableName}
               </h2>
             </div>
             <div className="p-6 text-sm text-gray-600 dark:text-gray-400">
               {String(tableData)}
             </div>
          </div>
        )
      }

      const recordKeys = Object.keys(tableData);
      const columnSet = new Set();
      
      // Analyze data to find all unique columns
      const records = recordKeys.map(key => {
        const item = tableData[key];
        if (item && typeof item === 'object') {
          // If the record is an object, its keys become columns
          Object.keys(item).forEach(k => columnSet.add(k));
          return { _id: key, ...item };
        } else {
          // If the record is a primitive, create a generic 'value' column
          columnSet.add('Value');
          return { _id: key, Value: item };
        }
      });

      // Convert Set to Array
      const columns = Array.from(columnSet);

      return (
        <div key={tableName} className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize flex items-center">
              <span className="text-blue-600 dark:text-blue-400 mr-2">🗂️</span> {tableName}
              <span className="ml-3 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {recordKeys.length} {recordKeys.length === 1 ? 'record' : 'records'}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase sticky top-0 bg-gray-100 dark:bg-gray-800 shadow-[0_1px_0_rgba(229,231,235,1)] dark:shadow-[0_1px_0_rgba(55,65,81,1)] z-20">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold sticky left-0 bg-gray-100 dark:bg-gray-800 shadow-[1px_0_0_rgba(229,231,235,1)] dark:shadow-[1px_0_0_rgba(55,65,81,1)] z-30">ID</th>
                  {columns.map(col => (
                    <th key={col} scope="col" className="px-6 py-3 font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 relative z-0">
                {records.length > 0 ? records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 shadow-[1px_0_0_rgba(229,231,235,1)] dark:shadow-[1px_0_0_rgba(55,65,81,1)] z-10">
                      {record._id}
                    </td>
                    {columns.map(col => {
                      const val = record[col];
                      let displayVal = '';

                      if (val === null || val === undefined) {
                        displayVal = '-';
                      } else if (typeof val === 'object') {
                        const str = JSON.stringify(val);
                        displayVal = str.length > 50 ? `${str.substring(0, 50)}...` : str;
                      } else {
                        displayVal = String(val);
                      }

                      return (
                         <td key={col} className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={typeof val !== 'object' && String(val).length > 30 ? String(val) : ''}>
                           {displayVal}
                         </td>
                      )
                    })}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <span className="mr-3">💾</span> Database Storage Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
            View collections and their records from your Firebase Realtime Database. Each collection is displayed as a separate table.
          </p>
        </div>
        <button
          onClick={handleBackup}
          className="flex-shrink-0 flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm shadow-blue-500/30 hover:shadow-blue-500/50"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
             <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Export Backup
        </button>
      </div>

      <div className="space-y-6">
        {renderTables()}
      </div>

      {/* Progress & Logs Modal */}
      {backupState.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                   <svg className="w-5 h-5 mr-2 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" style={{ display: backupState.current < backupState.total ? 'block' : 'none' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   {backupState.current < backupState.total ? 'Exporting Database...' : 'Export Complete'}
                </h3>
                {backupState.current === backupState.total && (
                  <button 
                    onClick={() => setBackupState({ show: false, current: 0, total: 0 })}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${(backupState.current / backupState.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>{Math.round((backupState.current / backupState.total) * 100) || 0}%</span>
                <span>{backupState.current} of {backupState.total} tables</span>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex-1 overflow-y-auto max-h-[50vh] font-mono text-xs text-gray-700 dark:text-gray-300 space-y-2">
               {backupLogs.map((log, idx) => (
                 <div key={idx} className={`${log.includes('❌') ? 'text-red-500' : log.includes('✓') ? 'text-green-500 dark:text-green-400' : ''}`}>
                   {log}
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseBackup;
