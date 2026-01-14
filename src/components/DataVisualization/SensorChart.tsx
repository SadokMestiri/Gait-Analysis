import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { UplotService } from '../../services/uplotService';
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
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    // Extract data
    const timestamps = data.map((_, i) => i);
    const dataSeries = {
      x: data.map(p => sensorType === 'acceleration' ? p.acceleration.x : p.gyroscope.x),
      y: data.map(p => sensorType === 'acceleration' ? p.acceleration.y : p.gyroscope.y),
      z: data.map(p => sensorType === 'acceleration' ? p.acceleration.z : p.gyroscope.z),
    };

    const chartData = UplotService.prepareChartData(timestamps, dataSeries);

    // Create options
    const chartTitle = title || (sensorType === 'acceleration' ? 'Acceleration' : 'Gyroscope');
    const opts = UplotService.createIMUChartOptions(
      chartRef.current.clientWidth || 800,
      height,
      chartTitle
    );

    // Add series
    opts.series!.push(UplotService.createAxisSeries('x', sensorType === 'acceleration'));
    opts.series!.push(UplotService.createAxisSeries('y', sensorType === 'acceleration'));
    opts.series!.push(UplotService.createAxisSeries('z', sensorType === 'acceleration'));

    // Destroy previous chart if exists
    if (uplotRef.current) {
      uplotRef.current.destroy();
    }

    // Create new chart
    const u = new uPlot(opts, chartData, chartRef.current);
    uplotRef.current = u;

    // Cleanup
    return () => {
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [data, sensorType, height, title]);

  return (
    <div className="bg-gray-900/60 dark:bg-gray-900 rounded-lg p-4 shadow border border-gray-700/30">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-white dark:text-gray-200">
          {title}
        </h3>
      )}
      <div
        ref={chartRef}
        className="w-full rounded overflow-hidden"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};