import React from 'react';

interface DataStructureViewerProps {
  format: { columns: number; sample: number[]; header: string } | null;
}

export const DataStructureViewer: React.FC<DataStructureViewerProps> = ({ format }) => {
  if (!format) return null;

  const columnDescriptions = [
    { index: 0, description: 'Timestamp (s)', color: 'bg-blue-500' },
    { index: 1, description: 'Acceleration X (g)', color: 'bg-red-500' },
    { index: 2, description: 'Acceleration Y (g)', color: 'bg-green-500' },
    { index: 3, description: 'Acceleration Z (g)', color: 'bg-purple-500' },
    { index: 4, description: 'Gyroscope X (°/s)', color: 'bg-orange-500' },
    { index: 5, description: 'Gyroscope Y (°/s)', color: 'bg-pink-500' },
    { index: 6, description: 'Gyroscope Z (°/s)', color: 'bg-yellow-500' },
  ];

  return (
    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
      <h4 className="font-medium text-white mb-3">Data Structure Analysis</h4>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-400 mb-2">Column Layout</div>
          <div className="flex flex-wrap gap-2">
            {columnDescriptions.map((col, index) => (
              <div 
                key={index}
                className="flex items-center px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600/50"
              >
                <div className={`w-2 h-2 rounded-full ${col.color} mr-2`}></div>
                <span className="text-xs text-gray-300">
                  Col {col.index + 1}: {col.description}
                </span>
              </div>
            ))}
            
            {format.columns > 7 && (
              <div className="flex items-center px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600/50">
                <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                <span className="text-xs text-gray-300">
                  +{format.columns - 7} more columns
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-2">First Sample Values</div>
          <div className="bg-gray-900/50 rounded-lg p-3 overflow-x-auto">
            <div className="flex space-x-4">
              {format.sample.slice(0, 10).map((value, index) => (
                <div key={index} className="text-center min-w-[80px]">
                  <div className="text-xs text-gray-500 mb-1">Col {index + 1}</div>
                  <div className="text-sm font-mono text-white bg-gray-800/50 px-2 py-1 rounded">
                    {value.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>This file contains {format.columns} columns of sensor data including multiple sensors and gait parameters</span>
          </div>
        </div>
      </div>
    </div>
  );
};