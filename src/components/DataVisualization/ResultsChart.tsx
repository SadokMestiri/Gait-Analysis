// components/DataVisualization/ResultsChart.tsx - FIXED
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

interface ResultsChartProps {
  data: {
    timestamps: number[]; // Phases (0-1)
    values: number[][];   // 2D array: [phaseIndex][measurementIndex]
    columnCount: number;  // Number of measurements (e.g., 17)
    phaseIncrement?: number;
  };
  title: string;
  color: string;
  yAxisLabel?: string;
  height?: number;
}

export const ResultsChart: React.FC<ResultsChartProps> = ({
  data,
  title,
  color,
  yAxisLabel = 'Value',
  height = 500,
}) => {
  // Prepare chart data - each phase point has all measurements
  const chartData = data.timestamps.map((phase, phaseIndex) => {
    const point: any = { phase };
    
    // Add each measurement value to the data point
    if (data.values[phaseIndex]) {
      data.values[phaseIndex].forEach((value, measurementIndex) => {
        if (measurementIndex === 0) {
          point.mean = value; // First value is always the mean
        } else {
          point[`m${measurementIndex}`] = value; // Individual measurements
        }
      });
    }
    
    return point;
  });

  // Calculate statistics for the mean values
  const meanValues = data.values.map(row => row[0] || 0);
  const mean = meanValues.length > 0 ? 
    meanValues.reduce((a, b) => a + b, 0) / meanValues.length : 0;
  
  const stats = {
    min: meanValues.length > 0 ? Math.min(...meanValues) : 0,
    max: meanValues.length > 0 ? Math.max(...meanValues) : 0,
    mean: mean,
    stdDev: meanValues.length > 0 ? 
      Math.sqrt(meanValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / meanValues.length) : 0,
  };

  // Generate colors for each measurement line
  const generateMeasurementColors = (count: number): string[] => {
    const colors = [];
    
    // Mean gets the base color (full opacity)
    colors.push(color);
    
    // Individual measurements get variations
    for (let i = 1; i < count; i++) {
      // Create a gradient from the base color to lighter variants
      const hue = color === '#3B82F6' ? 220 : 
                  color === '#10B981' ? 160 : 
                  color === '#8B5CF6' ? 260 : 200;
      
      // Alternate between different opacities
      const opacity = 0.2 + ((i % 5) * 0.15);
      colors.push(`hsla(${hue}, 70%, 60%, ${opacity})`);
    }
    
    return colors;
  };

  const measurementCount = data.columnCount || 1;
  const measurementColors = generateMeasurementColors(measurementCount);
  
  // Create phase tick marks
  const phaseIncrement = data.phaseIncrement || 0.01;
  const phaseTicks = Array.from(
    { length: Math.ceil(1 / phaseIncrement) + 1 },
    (_, i) => i * phaseIncrement
  ).filter(t => t <= 1);

  // Custom tooltip formatter
  const customTooltipFormatter = (value: number, name: string) => {
    const numValue = Number(value);
    if (name === 'mean') {
      return [`${numValue.toFixed(4)}`, 'Mean of all measurements'];
    } else {
      const measurementNum = name.replace('m', '');
      return [`${numValue.toFixed(4)}`, `Measurement #${measurementNum}`];
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {data.timestamps.length} phases × {measurementCount} measurements
              {data.phaseIncrement && ` (Δphase = ${data.phaseIncrement})`}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: color, border: '2px solid white' }}></div>
              <span className="text-xs text-gray-300">Mean</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: measurementColors[1] || '#9CA3AF' }}></div>
              <span className="text-xs text-gray-300">Measurements</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis 
              dataKey="phase"
              label={{ 
                value: 'Normalized Gait Cycle Phase (0-1)', 
                position: 'insideBottom', 
                offset: -5,
                style: { fill: '#9CA3AF' }
              }}
              stroke="#9CA3AF"
              domain={[0, 1]}
              ticks={phaseTicks}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <YAxis 
              label={{ 
                value: yAxisLabel, 
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
                color: '#D1D5DB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              }}
              formatter={customTooltipFormatter}
              labelFormatter={(label) => `Phase: ${Number(label).toFixed(3)}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'mean') return 'Mean';
                const num = value.toString().replace('m', '');
                return `M${num}`;
              }}
            />
            
            {/* MEAN LINE - Thick and prominent */}
            <Line
              type="monotone"
              dataKey="mean"
              stroke={measurementColors[0]}
              strokeWidth={3}
              strokeOpacity={1}
              dot={false}
              name="mean"
              activeDot={{ r: 8, fill: measurementColors[0], stroke: 'white', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            
            {/* INDIVIDUAL MEASUREMENT LINES - Thin and semi-transparent */}
            {measurementCount > 1 && Array.from({ length: Math.min(measurementCount - 1, 20) }).map((_, index) => (
              <Line
                key={`m${index + 1}`}
                type="monotone"
                dataKey={`m${index + 1}`}
                stroke={measurementColors[index + 1] || '#9CA3AF'}
                strokeWidth={1}
                strokeOpacity={0.4}
                dot={false}
                name={`m${index + 1}`}
                activeDot={{ r: 4, fill: measurementColors[index + 1] }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Statistics and Info */}
      <div className="mt-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
            <div className="text-xs text-gray-400 mb-1">Mean Value</div>
            <div className="text-lg font-bold text-white">{stats.mean.toFixed(4)}</div>
          </div>
          <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
            <div className="text-xs text-gray-400 mb-1">Min</div>
            <div className="text-lg font-bold text-white">{stats.min.toFixed(4)}</div>
          </div>
          <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
            <div className="text-xs text-gray-400 mb-1">Max</div>
            <div className="text-lg font-bold text-white">{stats.max.toFixed(4)}</div>
          </div>
          <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
            <div className="text-xs text-gray-400 mb-1">Std Dev</div>
            <div className="text-lg font-bold text-white">{stats.stdDev.toFixed(4)}</div>
          </div>
        </div>
        
        {/* Data Summary */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Showing {Math.min(measurementCount, 21)} of {measurementCount} lines 
              (mean + {Math.min(measurementCount - 1, 20)} measurements)
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Phase increment: {data.phaseIncrement || 0.01}
          </div>
        </div>
        
        {measurementCount > 21 && (
          <div className="mt-2 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
            Note: Displaying first 20 measurements for clarity. All {measurementCount} measurements are loaded and used in calculations.
          </div>
        )}
      </div>
    </div>
  );
};