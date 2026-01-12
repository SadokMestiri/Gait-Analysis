import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { GaitAnalysis } from '../../types/gait.types';

interface RangeOfMotionProps {
  analysis: GaitAnalysis;
  title?: string;
  height?: number;
}

export const RangeOfMotion: React.FC<RangeOfMotionProps> = ({
  analysis,
  title = 'Range of Motion Analysis',
  height = 400,
}) => {
  const romData = [
    { joint: 'Hip Flexion', value: analysis.rangeOfMotion.hipFlexion, normalRange: [40, 120] },
    { joint: 'Hip Extension', value: Math.abs(analysis.rangeOfMotion.hipExtension), normalRange: [0, 30] },
    { joint: 'Knee Flexion', value: analysis.rangeOfMotion.kneeFlexion, normalRange: [0, 135] },
    { joint: 'Knee Extension', value: Math.abs(analysis.rangeOfMotion.kneeExtension), normalRange: [0, 10] },
    { joint: 'Ankle DF', value: analysis.rangeOfMotion.ankleDorsiflexion, normalRange: [10, 30] },
    { joint: 'Ankle PF', value: Math.abs(analysis.rangeOfMotion.anklePlantarflexion), normalRange: [20, 50] },
  ];

  const getColor = (value: number, normalRange: number[]) => {
    const [min, max] = normalRange;
    if (value >= min && value <= max) return '#10B981'; // Green - normal
    if (value < min * 0.8 || value > max * 1.2) return '#EF4444'; // Red - abnormal
    return '#F59E0B'; // Yellow - borderline
  };

  const getRomStatus = (value: number, normalRange: number[]) => {
    const [min, max] = normalRange;
    if (value >= min && value <= max) return 'Normal';
    if (value < min) return 'Limited';
    return 'Excessive';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">{title}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={romData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="joint" 
                angle={-45}
                textAnchor="end"
                height={60}
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                label={{ 
                  value: 'Degrees (°)', 
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
                formatter={(value, name, props) => [
                  `${value}°`,
                  `${props.payload.joint}`
                ]}
              />
              <Legend />
              <Bar dataKey="value" name="Measured ROM">
                {romData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry.value, entry.normalRange)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ROM Table */}
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Joint Movement</th>
                  <th className="px-4 py-3">Measured</th>
                  <th className="px-4 py-3">Normal Range</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {romData.map((item, index) => (
                  <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {item.joint}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.value.toFixed(1)}°
                    </td>
                    <td className="px-4 py-3">
                      {item.normalRange[0]}° - {item.normalRange[1]}°
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getRomStatus(item.value, item.normalRange) === 'Normal'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : getRomStatus(item.value, item.normalRange) === 'Limited'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {getRomStatus(item.value, item.normalRange)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              ROM Summary
            </h4>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Normal</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Limited</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Excessive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};