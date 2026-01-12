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

interface FilteredSensorChartProps {
  filteredData: {
    acceleration: { x: number[]; y: number[]; z: number[] };
    gyroscope: { x: number[]; y: number[]; z: number[] };
    timestamps: number[];
  };
  sensorType: 'acceleration' | 'gyroscope';
  title?: string;
  height?: number;
  selectedSensors?: string[];
}

export const FilteredSensorChart: React.FC<FilteredSensorChartProps> = ({
  filteredData,
  sensorType,
  title,
  height = 350,
}) => {
  // Prepare chart data
  const dataSource = sensorType === 'acceleration' ? filteredData.acceleration : filteredData.gyroscope;
  const timestamps = filteredData.timestamps;
  
  // Create chart data points
  const chartData = timestamps.map((time, index) => {
    const point: any = { time };
    
    // Add X axis if it has data and is selected
    if (dataSource.x.length > index) {
      point.x = dataSource.x[index];
    }
    
    // Add Y axis if it has data and is selected
    if (dataSource.y.length > index) {
      point.y = dataSource.y[index];
    }
    
    // Add Z axis if it has data and is selected
    if (dataSource.z.length > index) {
      point.z = dataSource.z[index];
    }
    
    return point;
  });

  // Determine which axes have data
  const hasX = dataSource.x.length > 0;
  const hasY = dataSource.y.length > 0;
  const hasZ = dataSource.z.length > 0;
  console.log(`FilteredSensorChart rendering:`, {
  sensorType,
  hasX,
  hasY,
  hasZ,
  dataLength: chartData.length,
  timestamps: timestamps.length,
  accelerationData: {
    x: dataSource.x?.length || 0,
    y: dataSource.y?.length || 0,
    z: dataSource.z?.length || 0,
  },
  gyroscopeData: {
    x: dataSource.x?.length || 0,
    y: dataSource.y?.length || 0,
    z: dataSource.z?.length || 0,
  },
});

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {sensorType === 'acceleration' 
                ? 'Acceleration in gravitational units (g)' 
                : 'Angular velocity in degrees per second (°/s)'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {hasX && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
            {hasY && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
            {hasZ && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
          </div>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}> {/* Limit points for performance */}
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }}
            stroke="#9CA3AF"
          />
          <YAxis
            label={{
              value: sensorType === 'acceleration' ? 'Acceleration (g)' : 'Angular Velocity (°/s)',
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
            labelStyle={{ color: '#D1D5DB' }}
          />
          <Legend />
          
          {hasX && (
            <Line
              type="monotone"
              dataKey="x"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              name="X Axis"
              activeDot={{ r: 4 }}
            />
          )}
          
          {hasY && (
            <Line
              type="monotone"
              dataKey="y"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Y Axis"
              activeDot={{ r: 4 }}
            />
          )}
          
          {hasZ && (
            <Line
              type="monotone"
              dataKey="z"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="Z Axis"
              activeDot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend showing active sensors */}
      <div className="mt-4 flex flex-wrap gap-3">
        {hasX && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-300">X Axis</span>
          </div>
        )}
        {hasY && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-300">Y Axis</span>
          </div>
        )}
        {hasZ && (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-300">Z Axis</span>
          </div>
        )}
        
        {!hasX && !hasY && !hasZ && (
          <div className="text-sm text-gray-500 italic">
            No {sensorType} data selected. Use the sensor filter to enable axes.
          </div>
        )}
      </div>
    </div>
  );
};