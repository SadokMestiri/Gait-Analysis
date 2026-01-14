import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { UplotService } from '../../services/uplotService';

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
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  // Prepare chart data
  const dataSource = sensorType === 'acceleration' ? filteredData.acceleration : filteredData.gyroscope;
  const timestamps = filteredData.timestamps;
  
  // Determine which axes have data
  const hasX = dataSource.x.length > 0;
  const hasY = dataSource.y.length > 0;
  const hasZ = dataSource.z.length > 0;

  useEffect(() => {
    if (!chartRef.current || !timestamps.length) return;

    // Build data series
    const dataSeries: Record<string, number[]> = {};
    if (hasX) dataSeries.x = dataSource.x;
    if (hasY) dataSeries.y = dataSource.y;
    if (hasZ) dataSeries.z = dataSource.z;

    if (Object.keys(dataSeries).length === 0) return; // No data to display

    const data = UplotService.prepareChartData(timestamps, dataSeries);

    // Create options
    const chartTitle = title || (sensorType === 'acceleration' ? 'Acceleration' : 'Gyroscope');
    const opts = UplotService.createIMUChartOptions(
      chartRef.current.clientWidth || 800,
      height,
      chartTitle
    );

    // Add series for each axis
    if (hasX) opts.series!.push(UplotService.createAxisSeries('x', sensorType === 'acceleration'));
    if (hasY) opts.series!.push(UplotService.createAxisSeries('y', sensorType === 'acceleration'));
    if (hasZ) opts.series!.push(UplotService.createAxisSeries('z', sensorType === 'acceleration'));

    // Destroy previous chart if exists
    if (uplotRef.current) {
      uplotRef.current.destroy();
    }

    // Create new chart
    const u = new uPlot(opts, data, chartRef.current);
    uplotRef.current = u;

    // Cleanup
    return () => {
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [filteredData, sensorType, height, title, hasX, hasY, hasZ, dataSource, timestamps]);

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {sensorType === 'acceleration' 
                ? 'Acceleration in gravitational units (g) | Zoom: Drag | Pan: Click+Drag | Reset: Double-click' 
                : 'Angular velocity in degrees per second (°/s) | Zoom: Drag | Pan: Click+Drag | Reset: Double-click'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {hasX && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
            {hasY && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
            {hasZ && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
          </div>
        </div>
      )}
      
      {(hasX || hasY || hasZ) ? (
        <>
          <div
            ref={chartRef}
            className="w-full rounded-lg overflow-hidden"
            style={{ height: `${height}px` }}
          />
          
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
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-sm text-gray-500 italic">
            No {sensorType} data selected. Use the sensor filter to enable axes.
          </div>
        </div>
      )}
    </div>
  );
};