import React, { useState, useEffect } from 'react';
import { Cpu, BookOpen, BarChart3, Settings } from 'lucide-react';
import AlgorithmSelector from './components/AlgorithmSelector';
import ProcessInput from './components/ProcessInput';
import GanttChart from './components/GanttChart';
import MetricsTable from './components/MetricsTable';
import AlgorithmExplanation from './components/AlgorithmExplanation';
import { runSchedulingAlgorithm } from './utils/schedulingAlgorithms';
import { ref, get, child, set } from "firebase/database";
import { database } from "../../../firebase";
import { useAuth } from '../../../context/AuthContext';
import { useParams } from "react-router-dom";
function CpuApp() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fcfs');
  const [processes, setProcesses] = useState([]);
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('simulator');

  const { user } = useAuth();
  
    const { course, subcourse, questionId } = useParams();
  

  useEffect(() => {
    if (processes.length > 0) {
      const algorithmResult = runSchedulingAlgorithm(selectedAlgorithm, processes, timeQuantum);
      setResult(algorithmResult);
    } else {
      setResult(null);
    }
  }, [selectedAlgorithm, processes, timeQuantum]);

  useEffect(() => {
    if (!user || !course || !subcourse || !questionId) return;

    const setprogress = async () => {
    const answerRef = ref(database, `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`);
    console.log(answerRef);
        try {
          // Store both the selected option and submission status
          await set(answerRef, true);
        } catch (error) {
          console.error("Failed to save answer:", error);
        }
    };
    setprogress();
  }, [user, course, subcourse, questionId]);

  const tabs = [
    { id: 'simulator', label: 'Simulator', icon: Settings },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'compare', label: 'Compare', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CPU Scheduler</h1>
                <p className="text-sm text-gray-500">Learn & Visualize Scheduling Algorithms</p>
              </div>
            </div>
            
            <nav className="flex space-x-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'simulator' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <AlgorithmSelector
                  selectedAlgorithm={selectedAlgorithm}
                  onAlgorithmChange={setSelectedAlgorithm}
                />
                
                <ProcessInput
                  processes={processes}
                  setProcesses={setProcesses}
                  algorithm={selectedAlgorithm}
                  timeQuantum={timeQuantum}
                  setTimeQuantum={setTimeQuantum}
                />
              </div>
              
              <div className="lg:col-span-1">
                <AlgorithmExplanation algorithm={selectedAlgorithm} />
              </div>
            </div>

            {result && (
              <div className="space-y-6">
                <GanttChart
                  ganttChart={result.ganttChart}
                  title="Process Execution Timeline"
                />
                
                <MetricsTable result={result} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'learn' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                CPU Scheduling Algorithms Guide
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Learn about different CPU scheduling algorithms, their characteristics, 
                and when to use each one in operating systems.
              </p>
            </div>

            <div className="grid gap-8">
              {['fcfs', 'sjf', 'srtf', 'rr', 'priority', 'multilevel'].map(algorithm => (
                <AlgorithmExplanation key={algorithm} algorithm={algorithm} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Algorithm Comparison
              </h3>
              <p className="text-gray-600 mb-6">
                Compare performance metrics across different scheduling algorithms with the same process set.
              </p>
              <p className="text-sm text-blue-600 font-medium">
                Feature coming soon! Use the simulator to test different algorithms with the same processes.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CpuApp;