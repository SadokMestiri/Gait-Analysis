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

interface IMUAccelerationChartProps {
  imuData: {
    acceleration: { x: number[]; y: number[]; z: number[] };
    timestamps: number[];
  };
  imuKey: string;
  height?: number;
}

export const IMUAccelerationChart: React.FC<IMUAccelerationChartProps> = ({
  imuData,
  imuKey,
  height = 300,
}) => {
  // Check if we have valid data
  if (!imuData || !imuData.timestamps || imuData.timestamps.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{imuKey} - Acceleration</h3>
            <p className="text-sm text-gray-400">Units: g (gravity)</p>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-gray-400">No acceleration data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data - limit to first 200 points for performance
  const maxPoints = 200;
  const chartData = [];
  
  // Use the actual data length (minimum of all arrays)
  const dataLength = Math.min(
    maxPoints,
    imuData.timestamps.length,
    imuData.acceleration.x?.length || 0,
    imuData.acceleration.y?.length || 0,
    imuData.acceleration.z?.length || 0
  );
  
  for (let i = 0; i < dataLength; i++) {
    chartData.push({
      time: imuData.timestamps[i],
      x: imuData.acceleration.x[i] || 0,
      y: imuData.acceleration.y[i] || 0,
      z: imuData.acceleration.z[i] || 0,
    });
  }
  
  // Calculate statistics
  const stats = {
    x: {
      min: imuData.acceleration.x?.length > 0 ? Math.min(...imuData.acceleration.x) : 0,
      max: imuData.acceleration.x?.length > 0 ? Math.max(...imuData.acceleration.x) : 0,
      mean: imuData.acceleration.x?.length > 0 ? 
        imuData.acceleration.x.reduce((a, b) => a + b, 0) / imuData.acceleration.x.length : 0,
    },
    y: {
      min: imuData.acceleration.y?.length > 0 ? Math.min(...imuData.acceleration.y) : 0,
      max: imuData.acceleration.y?.length > 0 ? Math.max(...imuData.acceleration.y) : 0,
      mean: imuData.acceleration.y?.length > 0 ? 
        imuData.acceleration.y.reduce((a, b) => a + b, 0) / imuData.acceleration.y.length : 0,
    },
    z: {
      min: imuData.acceleration.z?.length > 0 ? Math.min(...imuData.acceleration.z) : 0,
      max: imuData.acceleration.z?.length > 0 ? Math.max(...imuData.acceleration.z) : 0,
      mean: imuData.acceleration.z?.length > 0 ? 
        imuData.acceleration.z.reduce((a, b) => a + b, 0) / imuData.acceleration.z.length : 0,
    },
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{imuKey} - Acceleration</h3>
          <p className="text-sm text-gray-400">Units: g (gravity)</p>
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
                value: 'Acceleration (g)', 
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
              formatter={(value) => [`${Number(value).toFixed(4)} g`, 'Acceleration']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="x"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="X Axis"
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Y Axis"
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="z"
              stroke="#3B82F6"
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
            <div className="text-sm text-red-300">Min: {stats.x.min.toFixed(4)}</div>
            <div className="text-sm text-red-300">Max: {stats.x.max.toFixed(4)}</div>
            <div className="text-sm text-red-300">Mean: {stats.x.mean.toFixed(4)}</div>
          </div>
        </div>
        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1">Y Axis</div>
          <div className="space-y-1">
            <div className="text-sm text-green-300">Min: {stats.y.min.toFixed(4)}</div>
            <div className="text-sm text-green-300">Max: {stats.y.max.toFixed(4)}</div>
            <div className="text-sm text-green-300">Mean: {stats.y.mean.toFixed(4)}</div>
          </div>
        </div>
        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-1">Z Axis</div>
          <div className="space-y-1">
            <div className="text-sm text-blue-300">Min: {stats.z.min.toFixed(4)}</div>
            <div className="text-sm text-blue-300">Max: {stats.z.max.toFixed(4)}</div>
            <div className="text-sm text-blue-300">Mean: {stats.z.mean.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};