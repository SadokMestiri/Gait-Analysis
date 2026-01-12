import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface IMUGyroscopeChartProps {
  imuData: {
    gyroscope: { x: number[]; y: number[]; z: number[] };
    timestamps: number[];
  };
  imuKey: string;
  height?: number;
}

export const IMUGyroscopeChart: React.FC<IMUGyroscopeChartProps> = ({
  imuData,
  imuKey,
  height = 300,
}) => {
  // Prepare chart data - limit to first 200 points for performance
  const maxPoints = 200;
  const chartData = [];
  
  for (let i = 0; i < Math.min(maxPoints, imuData.timestamps.length); i++) {
    chartData.push({
      time: imuData.timestamps[i],
      x: imuData.gyroscope.x[i] || 0,
      y: imuData.gyroscope.y[i] || 0,
      z: imuData.gyroscope.z[i] || 0,
    });
  }
  
  // Calculate statistics
  const stats = {
    x: {
      min: imuData.gyroscope.x.length > 0 ? Math.min(...imuData.gyroscope.x) : 0,
      max: imuData.gyroscope.x.length > 0 ? Math.max(...imuData.gyroscope.x) : 0,
      mean: imuData.gyroscope.x.length > 0 ? 
        imuData.gyroscope.x.reduce((a, b) => a + b, 0) / imuData.gyroscope.x.length : 0,
    },
    y: {
      min: imuData.gyroscope.y.length > 0 ? Math.min(...imuData.gyroscope.y) : 0,
      max: imuData.gyroscope.y.length > 0 ? Math.max(...imuData.gyroscope.y) : 0,
      mean: imuData.gyroscope.y.length > 0 ? 
        imuData.gyroscope.y.reduce((a, b) => a + b, 0) / imuData.gyroscope.y.length : 0,
    },
    z: {
      min: imuData.gyroscope.z.length > 0 ? Math.min(...imuData.gyroscope.z) : 0,
      max: imuData.gyroscope.z.length > 0 ? Math.max(...imuData.gyroscope.z) : 0,
      mean: imuData.gyroscope.z.length > 0 ? 
        imuData.gyroscope.z.reduce((a, b) => a + b, 0) / imuData.gyroscope.z.length : 0,
    },
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{imuKey} - Gyroscope</h3>
          <p className="text-sm text-gray-400">Units: °/s (degrees per second)</p>
        </div>
        <div className="text-sm text-gray-400">
          {imuData.timestamps.length} samples
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time"
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
              stroke="#9CA3AF"
            />
            <YAxis 
              label={{ 
                value: 'Angular Velocity (°/s)', 
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
              formatter={(value) => [`${Number(value).toFixed(4)} °/s`, 'Angular Velocity']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="x"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              name="X Axis"
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="#EC4899"
              strokeWidth={2}
              dot={false}
              name="Y Axis"
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="z"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              name="Z Axis"
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1">X Axis</div>
          <div className="space-y-1">
            <div className="text-sm text-yellow-300">Min: {stats.x.min.toFixed(4)}</div>
            <div className="text-sm text-yellow-300">Max: {stats.x.max.toFixed(4)}</div>
            <div className="text-sm text-yellow-300">Mean: {stats.x.mean.toFixed(4)}</div>
          </div>
        </div>
        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1">Y Axis</div>
          <div className="space-y-1">
            <div className="text-sm text-pink-300">Min: {stats.y.min.toFixed(4)}</div>
            <div className="text-sm text-pink-300">Max: {stats.y.max.toFixed(4)}</div>
            <div className="text-sm text-pink-300">Mean: {stats.y.mean.toFixed(4)}</div>
          </div>
        </div>
        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1">Z Axis</div>
          <div className="space-y-1">
            <div className="text-sm text-purple-300">Min: {stats.z.min.toFixed(4)}</div>
            <div className="text-sm text-purple-300">Max: {stats.z.max.toFixed(4)}</div>
            <div className="text-sm text-purple-300">Mean: {stats.z.mean.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};