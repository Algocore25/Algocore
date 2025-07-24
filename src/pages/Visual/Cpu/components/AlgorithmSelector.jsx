import React from 'react';
import { Clock, Zap, RotateCcw, Timer, Star, Layers } from 'lucide-react';

const algorithms = [
  {
    id: 'fcfs',
    name: 'First Come First Serve',
    description: 'Processes are executed in the order they arrive',
    icon: Clock,
    color: 'blue'
  },
  {
    id: 'sjf',
    name: 'Shortest Job First',
    description: 'Process with shortest burst time is executed first',
    icon: Zap,
    color: 'green'
  },
  {
    id: 'srtf',
    name: 'Shortest Remaining Time First',
    description: 'Preemptive version of SJF',
    icon: Timer,
    color: 'yellow'
  },
  {
    id: 'rr',
    name: 'Round Robin',
    description: 'Each process gets a fixed time quantum',
    icon: RotateCcw,
    color: 'purple'
  },
  {
    id: 'priority',
    name: 'Priority Scheduling',
    description: 'Process with highest priority is executed first',
    icon: Star,
    color: 'pink'
  },
  {
    id: 'multilevel',
    name: 'Multilevel Queue',
    description: 'Multiple queues with different scheduling algorithms',
    icon: Layers,
    color: 'indigo'
  }
];

const AlgorithmSelector = ({ selectedAlgorithm, onAlgorithmChange }) => {
  const getColorClasses = (color, isSelected) => {
    const baseClasses = 'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105';
    
    if (isSelected) {
      switch (color) {
        case 'blue': return `${baseClasses} bg-blue-50 border-blue-500 text-blue-700 shadow-lg`;
        case 'green': return `${baseClasses} bg-green-50 border-green-500 text-green-700 shadow-lg`;
        case 'yellow': return `${baseClasses} bg-yellow-50 border-yellow-500 text-yellow-700 shadow-lg`;
        case 'purple': return `${baseClasses} bg-purple-50 border-purple-500 text-purple-700 shadow-lg`;
        case 'pink': return `${baseClasses} bg-pink-50 border-pink-500 text-pink-700 shadow-lg`;
        case 'indigo': return `${baseClasses} bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg`;
        default: return `${baseClasses} bg-gray-50 border-gray-500 text-gray-700 shadow-lg`;
      }
    } else {
      return `${baseClasses} bg-white border-gray-200 text-gray-600 hover:border-gray-300`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Scheduling Algorithm</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {algorithms.map((algorithm) => {
          const Icon = algorithm.icon;
          const isSelected = selectedAlgorithm === algorithm.id;
          
          return (
            <div
              key={algorithm.id}
              className={getColorClasses(algorithm.color, isSelected)}
              onClick={() => onAlgorithmChange(algorithm.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon size={24} />
                <h4 className="font-medium text-sm leading-tight">{algorithm.name}</h4>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">{algorithm.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlgorithmSelector;