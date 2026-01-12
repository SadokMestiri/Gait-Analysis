import React, { useState, useEffect } from 'react';
import {
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { GaitAnalysis } from '../../types/gait.types';
import { SensorDataPoint } from '../../types/sensor.types';
import { calculateStepDetection } from '../../utils/gaitCalculations';

interface StepAnalysisProps {
  analysis: GaitAnalysis;
  sensorData: SensorDataPoint[];
  title?: string;
}

export const StepAnalysis: React.FC<StepAnalysisProps> = ({
  analysis,
  sensorData,
  title = 'Step-by-Step Analysis',
}) => {
  const [stepEvents, setStepEvents] = useState<number[]>([]);
  const [stepIntervals, setStepIntervals] = useState<number[]>([]);
  const [stepForces, setStepForces] = useState<number[]>([]);

  useEffect(() => {
    if (sensorData.length > 0) {
      // Detect steps from vertical acceleration
      const detectedSteps = calculateStepDetection(sensorData);
      setStepEvents(detectedSteps);

      // Calculate step intervals
      const intervals: number[] = [];
      for (let i = 1; i < detectedSteps.length; i++) {
        const interval = (sensorData[detectedSteps[i]].timestamp - 
                         sensorData[detectedSteps[i-1]].timestamp) * 1000; // Convert to ms
        intervals.push(interval);
      }
      setStepIntervals(intervals);

      // Calculate step forces (approximate from acceleration peaks)
      const forces = detectedSteps.map(stepIndex => 
        Math.abs(sensorData[stepIndex].acceleration.y)
      );
      setStepForces(forces);
    }
  }, [sensorData]);

  // Prepare data for charts
  const stepData = stepEvents.map((stepIndex, i) => ({
    step: i + 1,
    time: sensorData[stepIndex]?.timestamp.toFixed(2),
    acceleration: sensorData[stepIndex]?.acceleration.y.toFixed(3),
    force: stepForces[i]?.toFixed(3),
    interval: i > 0 ? stepIntervals[i-1]?.toFixed(0) : 0,
  }));

  const intervalData = stepIntervals.map((interval, i) => ({
    step: i + 1,
    interval,
    deviation: Math.abs(interval - analysis.stepMetrics.stepTime * 1000),
  }));

  const statistics = {
    totalSteps: stepEvents.length,
    avgStepTime: stepIntervals.length > 0 
      ? stepIntervals.reduce((a, b) => a + b, 0) / stepIntervals.length 
      : 0,
    stepTimeVariability: stepIntervals.length > 0
      ? Math.sqrt(stepIntervals.reduce((sum, interval) => 
          sum + Math.pow(interval - analysis.stepMetrics.stepTime * 1000, 2), 0) / stepIntervals.length)
      : 0,
    cadence: stepIntervals.length > 0
      ? (60 / (analysis.stepMetrics.stepTime || 1))
      : 0,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow space-y-8">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{title}</h3>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {statistics.totalSteps}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Steps</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {statistics.avgStepTime.toFixed(0)}ms
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Step Time</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            {statistics.cadence.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Cadence</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            {statistics.stepTimeVariability.toFixed(1)}ms
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Variability</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step Intervals Chart */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Step Time Intervals
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={intervalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="step" 
                label={{ value: 'Step Number', position: 'insideBottom', offset: -5 }}
                stroke="#9CA3AF"
              />
              <YAxis 
                label={{ 
                  value: 'Time (ms)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: '#9CA3AF' }
                }}
                stroke="#9CA3AF"
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  borderColor: '#374151',
                  color: '#D1D5DB'
                }}
                formatter={(value) => [`${value} ms`, 'Interval']}
              />
              <Bar dataKey="interval" name="Step Interval" fill="#3B82F6" />
              <Line 
                type="monotone" 
                dataKey={() => statistics.avgStepTime} 
                name="Average" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Step Force Distribution */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Step Force Pattern
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stepData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="step" 
                stroke="#9CA3AF"
              />
              <YAxis 
                stroke="#9CA3AF"
                label={{ 
                  value: 'Force (g)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: '#9CA3AF' }
                }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  borderColor: '#374151',
                  color: '#D1D5DB'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="force" 
                name="Step Force" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Step Table */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-300 dark:border-gray-600">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Step-by-Step Details
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing first 10 detected steps
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Step #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Time (s)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Acceleration (g)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Force (g)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Interval (ms)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stepData.slice(0, 10).map((step, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {step.step}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {step.time}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {step.acceleration}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {step.force}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {step.interval}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step Pattern Analysis */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
        <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Step Pattern Analysis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Regularity</h5>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.max(0, 100 - statistics.stepTimeVariability * 2)}%` }}
                ></div>
              </div>
              <span className="ml-3 text-sm font-medium">
                {statistics.stepTimeVariability < 50 ? 'Regular' : 
                 statistics.stepTimeVariability < 100 ? 'Moderate' : 'Irregular'}
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Force Consistency</h5>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, stepForces.length > 0 ? 
                    (1 - (Math.max(...stepForces) - Math.min(...stepForces))) * 100 : 0)}%` }}
                ></div>
              </div>
              <span className="ml-3 text-sm font-medium">
                {stepForces.length > 0 && (Math.max(...stepForces) - Math.min(...stepForces)) < 0.1 
                  ? 'Consistent' : 'Variable'}
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Step Rhythm</h5>
            <div className="text-center">
              <span className={`text-2xl font-bold ${
                statistics.avgStepTime > 500 && statistics.avgStepTime < 700 
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {statistics.avgStepTime > 500 && statistics.avgStepTime < 700 
                  ? 'Normal Rhythm' 
                  : 'Altered Rhythm'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};