// components/DataVisualization/CompleteDataViewer.tsx
import React from 'react';

interface CompleteDataViewerProps {
  data: {
    imus: Record<string, {
      acceleration: { x: number[]; y: number[]; z: number[] };
      gyroscope: { x: number[]; y: number[]; z: number[] };
    }>;
    gaitParameters: Record<string, number[]>;
    timestamps: number[];
    metadata: {
      columnCount: number;
      totalRows: number;
      sampleRate: number;
      sensorIds: string[];
      hasGaitParameters: boolean;
    };
  };
  title?: string;
}

export const CompleteDataViewer: React.FC<CompleteDataViewerProps> = ({ data, title = 'Complete Data Analysis' }) => {
  if (!data || Object.keys(data.imus).length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/30 shadow-xl">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-gray-400">Load a sensor file to view complete data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metadata Card */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
            <div className="text-sm text-gray-400">Total Rows</div>
            <div className="text-2xl font-bold text-white">{data.metadata.totalRows}</div>
          </div>
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
            <div className="text-sm text-gray-400">IMUs</div>
            <div className="text-2xl font-bold text-white">{Object.keys(data.imus).length}</div>
          </div>
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
            <div className="text-sm text-gray-400">Sample Rate</div>
            <div className="text-2xl font-bold text-white">{data.metadata.sampleRate.toFixed(1)} Hz</div>
          </div>
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
            <div className="text-sm text-gray-400">Duration</div>
            <div className="text-2xl font-bold text-white">
              {(data.timestamps[data.timestamps.length - 1] - data.timestamps[0]).toFixed(2)}s
            </div>
          </div>
        </div>

        {/* IMU List */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-3">Available IMUs</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(data.imus).map(([imuKey, imuData]) => {
              const accelCount = Object.values(imuData.acceleration).reduce((sum, arr) => sum + arr.length, 0);
              const gyroCount = Object.values(imuData.gyroscope).reduce((sum, arr) => sum + arr.length, 0);
              
              return (
                <div key={imuKey} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
                  <div className="font-medium text-white mb-2">{imuKey}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Acceleration:</span>
                      <span className="text-green-400">{accelCount} points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gyroscope:</span>
                      <span className="text-purple-400">{gyroCount} points</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gait Parameters (if available) */}
        {data.metadata.hasGaitParameters && Object.keys(data.gaitParameters).length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Gait Parameters</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 px-3 text-left text-gray-400">Parameter</th>
                    <th className="py-2 px-3 text-left text-gray-400">Min</th>
                    <th className="py-2 px-3 text-left text-gray-400">Max</th>
                    <th className="py-2 px-3 text-left text-gray-400">Mean</th>
                    <th className="py-2 px-3 text-left text-gray-400">Std Dev</th>
                    <th className="py-2 px-3 text-left text-gray-400">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.gaitParameters).map(([param, values]) => {
                    if (values.length === 0) return null;
                    
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                    const stdDev = Math.sqrt(variance);
                    
                    return (
                      <tr key={param} className="border-b border-gray-700/50">
                        <td className="py-2 px-3 text-white">{param}</td>
                        <td className="py-2 px-3 text-gray-300">{min.toFixed(4)}</td>
                        <td className="py-2 px-3 text-gray-300">{max.toFixed(4)}</td>
                        <td className="py-2 px-3 text-gray-300">{mean.toFixed(4)}</td>
                        <td className="py-2 px-3 text-gray-300">{stdDev.toFixed(4)}</td>
                        <td className="py-2 px-3 text-gray-300">{values.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Raw Data Preview */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
        <h4 className="text-lg font-semibold text-white mb-4">Data Sample (First 5 Rows)</h4>
        <div className="bg-gray-900/50 rounded-lg p-4 overflow-x-auto">
          <div className="text-sm font-mono">
            <div className="flex mb-2 text-gray-400">
              <div className="w-16 flex-shrink-0">Index</div>
              <div className="w-24 flex-shrink-0">Timestamp</div>
              {Object.keys(data.imus).map(imuKey => (
                <React.Fragment key={imuKey}>
                  <div className="w-20 flex-shrink-0 text-red-400">{imuKey} Acc X</div>
                  <div className="w-20 flex-shrink-0 text-green-400">{imuKey} Acc Y</div>
                  <div className="w-20 flex-shrink-0 text-blue-400">{imuKey} Acc Z</div>
                  <div className="w-20 flex-shrink-0 text-yellow-400">{imuKey} Gyro X</div>
                  <div className="w-20 flex-shrink-0 text-pink-400">{imuKey} Gyro Y</div>
                  <div className="w-20 flex-shrink-0 text-purple-400">{imuKey} Gyro Z</div>
                </React.Fragment>
              ))}
            </div>
            
            {Array.from({ length: Math.min(5, data.timestamps.length) }).map((_, index) => (
              <div key={index} className="flex mb-1 hover:bg-gray-800/50 p-1 rounded">
                <div className="w-16 flex-shrink-0 text-gray-500">{index}</div>
                <div className="w-24 flex-shrink-0 text-gray-300">{data.timestamps[index].toFixed(3)}</div>
                
                {Object.entries(data.imus).map(([imuKey, imuData]) => (
                  <React.Fragment key={imuKey}>
                    <div className="w-20 flex-shrink-0 text-red-300">
                      {imuData.acceleration.x[index]?.toFixed(4) || 'N/A'}
                    </div>
                    <div className="w-20 flex-shrink-0 text-green-300">
                      {imuData.acceleration.y[index]?.toFixed(4) || 'N/A'}
                    </div>
                    <div className="w-20 flex-shrink-0 text-blue-300">
                      {imuData.acceleration.z[index]?.toFixed(4) || 'N/A'}
                    </div>
                    <div className="w-20 flex-shrink-0 text-yellow-300">
                      {imuData.gyroscope.x[index]?.toFixed(4) || 'N/A'}
                    </div>
                    <div className="w-20 flex-shrink-0 text-pink-300">
                      {imuData.gyroscope.y[index]?.toFixed(4) || 'N/A'}
                    </div>
                    <div className="w-20 flex-shrink-0 text-purple-300">
                      {imuData.gyroscope.z[index]?.toFixed(4) || 'N/A'}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};