import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { GaitAnalysis } from '../../types/gait.types';
import { useGaitAnalysis } from '../../hooks/useGaitAnalysis';

interface ComparisonChartProps {
  currentAnalysis: GaitAnalysis;
  patientId: string;
  title?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  currentAnalysis,
  patientId,
  title = 'Comparative Analysis',
}) => {
  const { getPatientAnalyses } = useGaitAnalysis();
  const [patientAnalyses, setPatientAnalyses] = useState<GaitAnalysis[]>([]);

  useEffect(() => {
    const analyses = getPatientAnalyses(patientId);
    setPatientAnalyses(analyses);
  }, [patientId, getPatientAnalyses]);

  // Comparison data - simple format
  const comparisonData = [
    {
      metric: 'Symmetry',
      patient: currentAnalysis.symmetryIndex,
      average: 90,
      healthyMin: 85,
      healthyMax: 100,
      unit: '%',
    },
    {
      metric: 'Deviation',
      patient: currentAnalysis.gaitDeviationIndex,
      average: 15,
      healthyMin: 0,
      healthyMax: 20,
      unit: '',
    },
    {
      metric: 'Cadence',
      patient: currentAnalysis.stepMetrics.cadence,
      average: 105,
      healthyMin: 90,
      healthyMax: 120,
      unit: 'steps/min',
    },
    {
      metric: 'Velocity',
      patient: currentAnalysis.stepMetrics.velocity,
      average: 1.2,
      healthyMin: 1.0,
      healthyMax: 1.5,
      unit: 'm/s',
    },
    {
      metric: 'Step Length',
      patient: currentAnalysis.stepMetrics.stepLength,
      average: 0.7,
      healthyMin: 0.6,
      healthyMax: 0.8,
      unit: 'm',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow space-y-8">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{title}</h3>

      {/* Bar Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="metric" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                borderColor: '#374151',
                color: '#D1D5DB'
              }}
              formatter={(value, name) => [
                <span key={name as string}>{value as string}</span>,
                name
              ]}
            />
            <Legend />
            <Bar 
              dataKey="patient" 
              name="Patient" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="average" 
              name="Population Average" 
              fill="#6B7280" 
              radius={[4, 4, 0, 0]}
              opacity={0.7}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {comparisonData.map((item, index) => {
          const isHealthy = item.patient >= item.healthyMin && item.patient <= item.healthyMax;
          
          return (
            <div 
              key={index}
              className={`p-4 rounded-lg ${
                isHealthy 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.metric}
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 my-2">
                {item.patient.toFixed(item.metric === 'Velocity' || item.metric === 'Step Length' ? 2 : 0)}
                {item.unit}
              </div>
              <div className={`text-xs font-medium ${
                isHealthy ? 'text-green-600' : 'text-red-600'
              }`}>
                {isHealthy ? '✓ Within Normal Range' : '✗ Outside Normal Range'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Normal: {item.healthyMin}-{item.healthyMax}{item.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Comparison (if available) */}
      {patientAnalyses.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Progress Across Sessions
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Symmetry</th>
                  <th className="px-4 py-3">Deviation</th>
                  <th className="px-4 py-3">Cadence</th>
                  <th className="px-4 py-3">Velocity</th>
                </tr>
              </thead>
              <tbody>
                {patientAnalyses.map((analysis, idx) => (
                  <tr key={idx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      Session {idx + 1}
                    </td>
                    <td className="px-4 py-3">{analysis.symmetryIndex.toFixed(0)}%</td>
                    <td className="px-4 py-3">{analysis.gaitDeviationIndex.toFixed(1)}</td>
                    <td className="px-4 py-3">{analysis.stepMetrics.cadence.toFixed(0)}</td>
                    <td className="px-4 py-3">{analysis.stepMetrics.velocity.toFixed(2)} m/s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};