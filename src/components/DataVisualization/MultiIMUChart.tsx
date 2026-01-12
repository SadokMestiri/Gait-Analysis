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

interface MultiIMUChartProps {
  multiSensorData: {
    timestamps: number[];
    imus: Record<string, {
      acceleration: { x: number[]; y: number[]; z: number[] };
      gyroscope: { x: number[]; y: number[]; z: number[] };
    }>;
  };
  title?: string;
  height?: number;
}

export const MultiIMUChart: React.FC<MultiIMUChartProps> = ({
  multiSensorData,
  title = 'Multi-IMU Sensor Data',
  height = 400,
}) => {
  // Prepare chart data - combine all IMU data
  const imuKeys = Object.keys(multiSensorData.imus);
  
  if (imuKeys.length === 0 || multiSensorData.timestamps.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <div className="text-center text-gray-400 py-8">
          No IMU data available
        </div>
      </div>
    );
  }
  
  // Create chart data - limit to first 100 points for performance
  const maxPoints = 100;
  const chartData = [];
  
  for (let i = 0; i < Math.min(maxPoints, multiSensorData.timestamps.length); i++) {
    const point: any = {
      time: multiSensorData.timestamps[i],
    };
    
    // Add data from each IMU
    imuKeys.forEach(imuKey => {
      const imu = multiSensorData.imus[imuKey];
      
      // Acceleration
      if (imu.acceleration.x.length > i) {
        point[`${imuKey}_Acc_X`] = imu.acceleration.x[i];
      }
      if (imu.acceleration.y.length > i) {
        point[`${imuKey}_Acc_Y`] = imu.acceleration.y[i];
      }
      if (imu.acceleration.z.length > i) {
        point[`${imuKey}_Acc_Z`] = imu.acceleration.z[i];
      }
      
      // Gyroscope
      if (imu.gyroscope.x.length > i) {
        point[`${imuKey}_Gyro_X`] = imu.gyroscope.x[i];
      }
      if (imu.gyroscope.y.length > i) {
        point[`${imuKey}_Gyro_Y`] = imu.gyroscope.y[i];
      }
      if (imu.gyroscope.z.length > i) {
        point[`${imuKey}_Gyro_Z`] = imu.gyroscope.z[i];
      }
    });
    
    chartData.push(point);
  }
  
  // Generate colors for each IMU
  const imuColors: Record<string, { acc: string; gyro: string }> = {
    IMU0: { acc: '#EF4444', gyro: '#F59E0B' }, // Red/Orange
    IMU1: { acc: '#10B981', gyro: '#3B82F6' }, // Green/Blue
    IMU2: { acc: '#8B5CF6', gyro: '#EC4899' }, // Purple/Pink
  };
  
  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <p className="text-sm text-gray-400 mb-6">
        Showing {imuKeys.length} IMU(s) with {multiSensorData.timestamps.length} data points
      </p>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time"
              label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
              stroke="#9CA3AF"
            />
            <YAxis 
              stroke="#9CA3AF"
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                borderColor: '#374151',
                color: '#D1D5DB'
              }}
            />
            <Legend />
            
            {/* Render lines for each IMU */}
            {imuKeys.map(imuKey => (
              <React.Fragment key={imuKey}>
                {/* Acceleration X */}
                <Line
                  type="monotone"
                  dataKey={`${imuKey}_Acc_X`}
                  stroke={imuColors[imuKey]?.acc || '#EF4444'}
                  strokeWidth={1.5}
                  dot={false}
                  name={`${imuKey} Acc X`}
                  activeDot={{ r: 4 }}
                />
                {/* Acceleration Y */}
                <Line
                  type="monotone"
                  dataKey={`${imuKey}_Acc_Y`}
                  stroke={imuColors[imuKey]?.acc || '#10B981'}
                  strokeWidth={1.5}
                  dot={false}
                  name={`${imuKey} Acc Y`}
                  activeDot={{ r: 4 }}
                />
                {/* Acceleration Z */}
                <Line
                  type="monotone"
                  dataKey={`${imuKey}_Acc_Z`}
                  stroke={imuColors[imuKey]?.acc || '#3B82F6'}
                  strokeWidth={1.5}
                  dot={false}
                  name={`${imuKey} Acc Z`}
                  activeDot={{ r: 4 }}
                />
              </React.Fragment>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* IMU Legend */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {imuKeys.map(imuKey => (
          <div key={imuKey} className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
            <div className="font-medium text-white mb-2">{imuKey}</div>
            <div className="space-y-1">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" 
                     style={{ backgroundColor: imuColors[imuKey]?.acc || '#EF4444' }}></div>
                <span className="text-sm text-gray-300">Acceleration</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" 
                     style={{ backgroundColor: imuColors[imuKey]?.gyro || '#F59E0B' }}></div>
                <span className="text-sm text-gray-300">Gyroscope</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};