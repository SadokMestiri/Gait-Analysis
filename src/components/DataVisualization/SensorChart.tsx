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
import { SensorDataPoint } from '../../types/sensor.types';

interface SensorChartProps {
  data: SensorDataPoint[];
  sensorType: 'acceleration' | 'gyroscope';
  title?: string;
  height?: number;
}

export const SensorChart: React.FC<SensorChartProps> = ({
  data,
  sensorType,
  title,
  height = 300,
}) => {
  const chartData = data.map((point, index) => ({
    time: index,
    x: sensorType === 'acceleration' ? point.acceleration.x : point.gyroscope.x,
    y: sensorType === 'acceleration' ? point.acceleration.y : point.gyroscope.y,
    z: sensorType === 'acceleration' ? point.acceleration.z : point.gyroscope.z,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            label={{ value: 'Time (samples)', position: 'insideBottom', offset: -5 }}
            stroke="#9CA3AF"
          />
          <YAxis
            label={{
              value: sensorType === 'acceleration' ? 'Acceleration (g)' : 'Angular Velocity (°/s)',
              angle: -90,
              position: 'insideLeft',
            }}
            stroke="#9CA3AF"
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
            labelStyle={{ color: '#D1D5DB' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="x"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
            name="X Axis"
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            name="Y Axis"
          />
          <Line
            type="monotone"
            dataKey="z"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Z Axis"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};