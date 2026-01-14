import React, { useEffect, useRef, useMemo } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { UplotService } from '../../services/uplotService';

interface IMUAccelerationChartProps {
  // Support both data formats
  imuData?: {
    acceleration: { x: number[]; y: number[]; z: number[] };
    timestamps: number[];
  };
  imuKey?: string;
  // Alternative props for direct data
  timestamps?: number[];
  xData?: number[];
  yData?: number[];
  zData?: number[];
  title?: string;
  height?: number;
}

export const IMUAccelerationChart: React.FC<IMUAccelerationChartProps> = ({
  imuData,
  imuKey,
  timestamps: directTimestamps,
  xData,
  yData,
  zData,
  title,
  height = 300,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  // Normalize data from either props format
  const normalizedData = useMemo(() => {
    if (imuData) {
      return {
        timestamps: imuData.timestamps || [],
        x: imuData.acceleration?.x || [],
        y: imuData.acceleration?.y || [],
        z: imuData.acceleration?.z || [],
        title: imuKey ? `${imuKey} - Acceleration` : 'Acceleration',
      };
    } else {
      return {
        timestamps: directTimestamps || [],
        x: xData || [],
        y: yData || [],
        z: zData || [],
        title: title || 'Acceleration',
      };
    }
  }, [imuData, imuKey, directTimestamps, xData, yData, zData, title]);

  // Calculate statistics
  const stats = useMemo(() => ({
    x: {
      min: normalizedData.x.length > 0 ? Math.min(...normalizedData.x) : 0,
      max: normalizedData.x.length > 0 ? Math.max(...normalizedData.x) : 0,
      mean: normalizedData.x.length > 0 ? 
        normalizedData.x.reduce((a, b) => a + b, 0) / normalizedData.x.length : 0,
    },
    y: {
      min: normalizedData.y.length > 0 ? Math.min(...normalizedData.y) : 0,
      max: normalizedData.y.length > 0 ? Math.max(...normalizedData.y) : 0,
      mean: normalizedData.y.length > 0 ? 
        normalizedData.y.reduce((a, b) => a + b, 0) / normalizedData.y.length : 0,
    },
    z: {
      min: normalizedData.z.length > 0 ? Math.min(...normalizedData.z) : 0,
      max: normalizedData.z.length > 0 ? Math.max(...normalizedData.z) : 0,
      mean: normalizedData.z.length > 0 ? 
        normalizedData.z.reduce((a, b) => a + b, 0) / normalizedData.z.length : 0,
    },
  }), [normalizedData]);

  // Check if we have valid data
  const hasData = normalizedData.timestamps.length > 0;

  useEffect(() => {
    if (!chartRef.current || !hasData) return;

    // Prepare data
    const dataSeries = {
      x: normalizedData.x,
      y: normalizedData.y,
      z: normalizedData.z,
    };

    const data = UplotService.prepareChartData(normalizedData.timestamps, dataSeries);

    // Create options
    const opts = UplotService.createIMUChartOptions(
      chartRef.current.clientWidth || 800,
      height,
      `${normalizedData.title} (g)`
    );

    // Add series for each axis
    opts.series!.push(UplotService.createAxisSeries('x', true));
    opts.series!.push(UplotService.createAxisSeries('y', true));
    opts.series!.push(UplotService.createAxisSeries('z', true));

    // Destroy previous chart if exists
    if (uplotRef.current) {
      uplotRef.current.destroy();
    }

    // Create new chart
    const u = new uPlot(opts, data, chartRef.current);
    uplotRef.current = u;

    // Add double-click to reset zoom
    UplotService.addResetZoom(u, data);

    // Cleanup
    return () => {
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [normalizedData, height, hasData]);

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{normalizedData.title}</h3>
            <p className="text-sm text-gray-500">Units: g (gravity)</p>
          </div>
        </div>
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <p className="text-gray-500">No acceleration data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{normalizedData.title}</h3>
          <p className="text-sm text-gray-500">Units: g (gravity) | Zoom: Drag to select | Reset: Double-click</p>
        </div>
        <div className="text-sm text-gray-600 font-medium">
          {normalizedData.timestamps.length.toLocaleString()} samples
        </div>
      </div>
      
      <div
        ref={chartRef}
        className="w-full rounded-lg overflow-hidden bg-gray-50 border border-gray-100"
        style={{ height: `${height}px` }}
      />
      
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
          <div className="text-xs text-gray-600 mb-1 font-medium">X Axis</div>
          <div className="space-y-1">
            <div className="text-sm text-red-600">Min: {stats.x.min.toFixed(4)}</div>
            <div className="text-sm text-red-600">Max: {stats.x.max.toFixed(4)}</div>
            <div className="text-sm text-red-600 font-medium">Mean: {stats.x.mean.toFixed(4)}</div>
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
          <div className="text-xs text-gray-600 mb-1 font-medium">Y Axis</div>
          <div className="space-y-1">
            <div className="text-sm text-green-600">Min: {stats.y.min.toFixed(4)}</div>
            <div className="text-sm text-green-600">Max: {stats.y.max.toFixed(4)}</div>
            <div className="text-sm text-green-600 font-medium">Mean: {stats.y.mean.toFixed(4)}</div>
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="text-xs text-gray-600 mb-1 font-medium">Z Axis</div>
          <div className="space-y-1">
            <div className="text-sm text-blue-600">Min: {stats.z.min.toFixed(4)}</div>
            <div className="text-sm text-blue-600">Max: {stats.z.max.toFixed(4)}</div>
            <div className="text-sm text-blue-600 font-medium">Mean: {stats.z.mean.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};