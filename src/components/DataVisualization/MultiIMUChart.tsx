import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { UplotService } from '../../services/uplotService';

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
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

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

  // Generate colors for each IMU
  const imuColors: Record<string, { acc: string; gyro: string }> = {
    IMU0: { acc: '#EF4444', gyro: '#F59E0B' }, // Red/Orange
    IMU1: { acc: '#10B981', gyro: '#3B82F6' }, // Green/Blue
    IMU2: { acc: '#8B5CF6', gyro: '#EC4899' }, // Purple/Pink
  };

  useEffect(() => {
    if (!chartRef.current || !imuKeys.length) return;

    // Build data series
    const dataSeries: Record<string, number[]> = {};
    
    imuKeys.forEach(imuKey => {
      const imu = multiSensorData.imus[imuKey];
      
      // Add acceleration
      dataSeries[`${imuKey}_Acc_X`] = imu.acceleration.x;
      dataSeries[`${imuKey}_Acc_Y`] = imu.acceleration.y;
      dataSeries[`${imuKey}_Acc_Z`] = imu.acceleration.z;
      
      // Add gyroscope
      dataSeries[`${imuKey}_Gyro_X`] = imu.gyroscope.x;
      dataSeries[`${imuKey}_Gyro_Y`] = imu.gyroscope.y;
      dataSeries[`${imuKey}_Gyro_Z`] = imu.gyroscope.z;
    });

    const data = UplotService.prepareChartData(multiSensorData.timestamps, dataSeries);

    // Create options
    const opts = UplotService.createMultiIMUChartOptions(
      chartRef.current.clientWidth || 800,
      height,
      title
    );

    // Add series for each IMU
    imuKeys.forEach(imuKey => {
      // Acceleration
      opts.series!.push(UplotService.createIMUSeries(imuKey, 'x', 'acc'));
      opts.series!.push(UplotService.createIMUSeries(imuKey, 'y', 'acc'));
      opts.series!.push(UplotService.createIMUSeries(imuKey, 'z', 'acc'));
      
      // Gyroscope
      opts.series!.push(UplotService.createIMUSeries(imuKey, 'x', 'gyro'));
      opts.series!.push(UplotService.createIMUSeries(imuKey, 'y', 'gyro'));
      opts.series!.push(UplotService.createIMUSeries(imuKey, 'z', 'gyro'));
    });

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
  }, [multiSensorData, height, title, imuKeys]);

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      <p className="text-sm text-gray-400 mb-6">
        Showing {imuKeys.length} IMU(s) with {multiSensorData.timestamps.length} data points | Zoom: Drag | Pan: Click+Drag | Reset: Double-click
      </p>
      
      <div
        ref={chartRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
      
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