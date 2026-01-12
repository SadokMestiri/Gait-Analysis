import React from 'react';
import { SensorRecording } from '../../types/sensor.types';

interface SensorSidebarProps {
  sensorData?: SensorRecording;
  onFileSelect: (fileContent: string) => void;
  abnormalities?: string[];
}

export const SensorSidebar: React.FC<SensorSidebarProps> = ({
  sensorData,
  onFileSelect,
  abnormalities = [],
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileSelect(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-64 h-full bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-semibold text-gray-300">Sensor Data</h3>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        {sensorData ? (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded p-3">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Recording Info</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <div>
                  <span className="font-medium">Patient:</span> {sensorData.patientId}
                </div>
                <div>
                  <span className="font-medium">Session:</span> {sensorData.sessionId}
                </div>
                <div>
                  <span className="font-medium">Samples:</span> {sensorData.data.length}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {(
                    sensorData.data[sensorData.data.length - 1]?.timestamp - 
                    sensorData.data[0]?.timestamp
                  ).toFixed(2)}s
                </div>
              </div>
            </div>

            {/* Abnormalities Section */}
            {abnormalities.length > 0 && (
              <div className="bg-red-900/30 border border-red-700 rounded p-3">
                <h4 className="text-sm font-medium text-red-300 mb-2">⚠️ Abnormalities</h4>
                <ul className="text-xs text-red-200 space-y-1">
                  {abnormalities.slice(0, 3).map((abnormality, index) => (
                    <li key={index} className="truncate">• {abnormality}</li>
                  ))}
                  {abnormalities.length > 3 && (
                    <li className="text-red-400">+{abnormalities.length - 3} more...</li>
                  )}
                </ul>
              </div>
            )}

            <div className="bg-gray-700 rounded p-3">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Device Info</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <div>
                  <span className="font-medium">Software:</span> {sensorData.header.softwareVersion}
                </div>
                <div>
                  <span className="font-medium">Firmware:</span> {sensorData.header.firmwareVersion}
                </div>
                <div>
                  <span className="font-medium">Device ID:</span> {sensorData.header.deviceId.slice(0, 8)}...
                </div>
                <div>
                  <span className="font-medium">Sensors:</span> {sensorData.header.sensorTypes.join(', ')}
                </div>
                <div>
                  <span className="font-medium">Sample Rate:</span> {sensorData.header.sampleRate} Hz
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded p-3">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Data Preview</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>First sample timestamp: {sensorData.data[0]?.timestamp.toFixed(4)}</div>
                <div>Last sample timestamp: {sensorData.data[sensorData.data.length - 1]?.timestamp.toFixed(4)}</div>
                <div className="pt-2">
                  <div className="font-medium text-gray-300">Acceleration Range:</div>
                  <div>X: [{Math.min(...sensorData.data.map(d => d.acceleration.x)).toFixed(2)}, {Math.max(...sensorData.data.map(d => d.acceleration.x)).toFixed(2)}]</div>
                  <div>Y: [{Math.min(...sensorData.data.map(d => d.acceleration.y)).toFixed(2)}, {Math.max(...sensorData.data.map(d => d.acceleration.y)).toFixed(2)}]</div>
                  <div>Z: [{Math.min(...sensorData.data.map(d => d.acceleration.z)).toFixed(2)}, {Math.max(...sensorData.data.map(d => d.acceleration.z)).toFixed(2)}]</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-12 h-12 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm mb-4">No sensor data loaded</p>
            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer text-sm">
              Upload Sensor File
              <input
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <p className="text-xs text-gray-600 mt-2">Supported: .txt, .csv</p>
          </div>
        )}
      </div>

      {sensorData && (
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => onFileSelect('')}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Load Different File
          </button>
        </div>
      )}
    </div>
  );
};