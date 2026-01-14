// components/DataVisualization/ResultsChart.tsx - Migrated to uPlot
import React, { useEffect, useRef, useMemo } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { UplotService } from '../../services/uplotService';

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
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  // Calculate statistics for the mean values
  const meanValues = useMemo(() => data.values.map(row => row[0] || 0), [data.values]);
  const mean = useMemo(() => 
    meanValues.length > 0 ? meanValues.reduce((a, b) => a + b, 0) / meanValues.length : 0, 
    [meanValues]
  );
  
  const stats = useMemo(() => ({
    min: meanValues.length > 0 ? Math.min(...meanValues) : 0,
    max: meanValues.length > 0 ? Math.max(...meanValues) : 0,
    mean: mean,
    stdDev: meanValues.length > 0 ? 
      Math.sqrt(meanValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / meanValues.length) : 0,
  }), [meanValues, mean]);

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
  const measurementColors = useMemo(() => 
    generateMeasurementColors(measurementCount), 
    [measurementCount, color]
  );

  // uPlot initialization
  useEffect(() => {
    if (!chartRef.current || data.timestamps.length === 0) return;

    // Prepare data for uPlot: [phases, mean, m1, m2, ...]
    const phases = data.timestamps;
    const chartDataArrays: (number | null)[][] = [phases];

    // Add mean values (first column of values)
    chartDataArrays.push(data.values.map(row => row[0] || null));

    // Add individual measurement series (limit to 20 for performance)
    const maxMeasurements = Math.min(measurementCount - 1, 20);
    for (let i = 1; i <= maxMeasurements; i++) {
      chartDataArrays.push(data.values.map(row => row[i] !== undefined ? row[i] : null));
    }

    const chartData = chartDataArrays as uPlot.AlignedData;

    const opts = UplotService.createResultsChartOptions(
      chartRef.current.clientWidth || 800,
      height,
      undefined,
      yAxisLabel
    );

    // Add mean series (thick, prominent line)
    opts.series!.push({
      label: 'Mean',
      stroke: measurementColors[0],
      width: 3,
      fill: undefined,
      points: { show: false },
    });

    // Add individual measurement series (thin, semi-transparent)
    for (let i = 1; i <= maxMeasurements; i++) {
      opts.series!.push({
        label: `M${i}`,
        stroke: measurementColors[i] || '#9CA3AF',
        width: 1,
        fill: undefined,
        points: { show: false },
        alpha: 0.4,
      });
    }

    // Configure axes for phase data (0-1) - light theme
    opts.axes = [
      {
        stroke: '#6b7280',
        grid: { stroke: '#e5e7eb', width: 1 },
        ticks: { stroke: '#d1d5db', width: 1 },
        values: (u: uPlot, vals: number[]) => vals.map(v => v.toFixed(2)),
      },
      {
        stroke: '#6b7280',
        grid: { stroke: '#e5e7eb', width: 1 },
        ticks: { stroke: '#d1d5db', width: 1 },
      },
    ];

    // Cleanup previous instance
    if (uplotRef.current) {
      uplotRef.current.destroy();
    }

    const u = new uPlot(opts, chartData, chartRef.current);
    uplotRef.current = u;

    // Add double-click to reset zoom
    UplotService.addResetZoom(u, chartData);

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && uplotRef.current) {
        uplotRef.current.setSize({
          width: chartRef.current.clientWidth,
          height: height,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [data, height, measurementColors, measurementCount, yAxisLabel]);

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
      <div
        ref={chartRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
      
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