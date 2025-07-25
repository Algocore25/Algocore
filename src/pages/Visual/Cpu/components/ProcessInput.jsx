import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

const ProcessInput = ({
  processes,
  setProcesses,
  algorithm,
  timeQuantum,
  setTimeQuantum
}) => {
  const [newProcess, setNewProcess] = useState({
    name: '',
    arrivalTime: 0,
    burstTime: 1,
    priority: 1
  });

  const addProcess = () => {
    if (!newProcess.name.trim()) return;
    
    const process = {
      id: Date.now(),
      name: newProcess.name,
      arrivalTime: newProcess.arrivalTime,
      burstTime: newProcess.burstTime,
      ...(algorithm === 'priority' && { priority: newProcess.priority })
    };
    
    setProcesses([...processes, process]);
    setNewProcess({
      name: '',
      arrivalTime: 0,
      burstTime: 1,
      priority: 1
    });
  };

  const removeProcess = (id) => {
    setProcesses(processes.filter(p => p.id !== id));
  };

  const clearProcesses = () => {
    setProcesses([]);
  };

  const addSampleProcesses = () => {
    const sampleProcesses = [
      { id: 1, name: 'P1', arrivalTime: 0, burstTime: 6, priority: 2 },
      { id: 2, name: 'P2', arrivalTime: 1, burstTime: 8, priority: 1 },
      { id: 3, name: 'P3', arrivalTime: 2, burstTime: 7, priority: 3 },
      { id: 4, name: 'P4', arrivalTime: 3, burstTime: 3, priority: 2 },
      { id: 5, name: 'P5', arrivalTime: 4, burstTime: 4, priority: 1 }
    ];
    setProcesses(sampleProcesses);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Process Configuration</h3>
        <div className="flex gap-2">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={clearProcesses}
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors text-sm w-full sm:w-auto justify-center"
            >
              <RefreshCw size={16} />
              Clear
            </button>
            <button
              onClick={addSampleProcesses}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors text-sm w-full sm:w-auto"
            >
              Load Sample
            </button>
          </div>
        </div>
      </div>

      {/* Time Quantum Input for Round Robin */}
      {algorithm === 'rr' && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800/50 transition-colors">
          <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
            Time Quantum (Time Slice)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={timeQuantum}
              onChange={(e) => setTimeQuantum(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">time units</span>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-300/80 mt-1">
            Each process will run for this many time units before switching
          </p>
        </div>
      )}

      {/* Add New Process Form */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Process Name
            </label>
            <input
              type="text"
              placeholder="P1"
              value={newProcess.name}
              onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Arrival Time
            </label>
            <input
              type="number"
              min="0"
              value={newProcess.arrivalTime}
              onChange={(e) => setNewProcess({ ...newProcess, arrivalTime: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Burst Time
            </label>
            <input
              type="number"
              min="1"
              value={newProcess.burstTime}
              onChange={(e) => setNewProcess({ ...newProcess, burstTime: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          {algorithm === 'priority' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority (1=Highest)
              </label>
              <input
                type="number"
                min="1"
                value={newProcess.priority}
                onChange={(e) => setNewProcess({ ...newProcess, priority: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
        </div>
        
        <button
          onClick={addProcess}
          disabled={!newProcess.name.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Process
        </button>
      </div>

      {/* Process List */}
      {processes.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Current Processes ({processes.length}):</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {processes.map((process) => (
              <div
                key={process.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-md border border-gray-200 dark:border-gray-600 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
                  <span className="font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm border border-gray-200 dark:border-gray-600">
                    {process.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Arrival: {process.arrivalTime}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Burst: {process.burstTime}</span>
                  {process.priority && (
                    <span className="text-sm text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded border border-purple-200 dark:border-purple-800">
                      Priority: {process.priority}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeProcess(process.id)}
                  className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors self-end sm:self-auto"
                  aria-label={`Remove process ${process.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessInput;