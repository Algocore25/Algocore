import React from 'react';
import { Clock, RotateCcw, Zap, Activity } from 'lucide-react';

const MetricsTable = ({ result }) => {
  if (!result.processes.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Analysis</h3>
      
      {/* Individual Process Metrics */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Process</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Arrival</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Burst</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Completion</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Waiting</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Turnaround</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Response</th>
            </tr>
          </thead>
          <tbody>
            {result.processes.map((process, index) => (
              <tr 
                key={process.id} 
                className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="py-4 px-4 font-bold text-gray-800 bg-gradient-to-r from-blue-100 to-transparent">
                  {process.name}
                </td>
                <td className="py-4 px-4 text-gray-600">{process.arrivalTime}</td>
                <td className="py-4 px-4 text-gray-600">{process.burstTime}</td>
                <td className="py-4 px-4 text-gray-600">{process.completionTime}</td>
                <td className="py-4 px-4 text-gray-600 font-medium">
                  <span className={process.waitingTime === 0 ? 'text-green-600' : 'text-orange-600'}>
                    {process.waitingTime}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-600">{process.turnaroundTime}</td>
                <td className="py-4 px-4 text-gray-600">{process.responseTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Average Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-blue-700">Avg Waiting Time</h4>
          </div>
          <p className="text-3xl font-bold text-blue-800 mb-1">
            {result.averageWaitingTime.toFixed(2)}
          </p>
          <p className="text-xs text-blue-600">time units</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <RotateCcw className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-green-700">Avg Turnaround Time</h4>
          </div>
          <p className="text-3xl font-bold text-green-800 mb-1">
            {result.averageTurnaroundTime.toFixed(2)}
          </p>
          <p className="text-xs text-green-600">time units</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-purple-700">Avg Response Time</h4>
          </div>
          <p className="text-3xl font-bold text-purple-800 mb-1">
            {result.averageResponseTime.toFixed(2)}
          </p>
          <p className="text-xs text-purple-600">time units</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-orange-700">CPU Utilization</h4>
          </div>
          <p className="text-3xl font-bold text-orange-800 mb-1">
            {result.cpuUtilization.toFixed(1)}%
          </p>
          <p className="text-xs text-orange-600">efficiency</p>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">Performance Insights</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Best Performer:</span> {
                result.processes.reduce((min, p) => 
                  p.waitingTime < min.waitingTime ? p : min
                ).name
              } (lowest waiting time)
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Total Execution Time:</span> {
                Math.max(...result.processes.map(p => p.completionTime))
              } time units
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsTable;