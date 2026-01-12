import React from 'react';

interface SensorFilterProps {
  selectedSensors: string[];
  onSensorFilterChange: (sensors: string[]) => void;
  abnormalities?: string[];
  availableSensors?: Array<{
    id: string;
    name: string;
    type: string;
    sensorId: string;
    axis: string;
  }>;
}

export const SensorFilter: React.FC<SensorFilterProps> = ({
  selectedSensors,
  onSensorFilterChange,
  abnormalities = [],
  availableSensors = [],
}) => {
  // Default sensors if none provided
  const sensors = availableSensors.length > 0 
    ? availableSensors.map(sensor => ({
        ...sensor,
        color: getColorForAxis(sensor.axis),
        icon: getIconForType(sensor.type, sensor.axis),
      }))
    : [
        { id: 'acceleration_0_x', name: 'Acceleration X', type: 'acceleration', sensorId: '0', axis: 'x', color: '#EF4444', icon: '↔️' },
        { id: 'acceleration_0_y', name: 'Acceleration Y', type: 'acceleration', sensorId: '0', axis: 'y', color: '#10B981', icon: '↕️' },
        { id: 'acceleration_0_z', name: 'Acceleration Z', type: 'acceleration', sensorId: '0', axis: 'z', color: '#3B82F6', icon: '↕️' },
        { id: 'gyroscope_0_x', name: 'Gyroscope X', type: 'gyroscope', sensorId: '0', axis: 'x', color: '#F59E0B', icon: '🔄' },
        { id: 'gyroscope_0_y', name: 'Gyroscope Y', type: 'gyroscope', sensorId: '0', axis: 'y', color: '#EC4899', icon: '🔄' },
        { id: 'gyroscope_0_z', name: 'Gyroscope Z', type: 'gyroscope', sensorId: '0', axis: 'z', color: '#8B5CF6', icon: '🔄' },
      ];

  const toggleSensor = (sensorId: string) => {
    const newSelected = selectedSensors.includes(sensorId)
      ? selectedSensors.filter(id => id !== sensorId)
      : [...selectedSensors, sensorId];
    onSensorFilterChange(newSelected);
  };

  const selectAll = () => {
    onSensorFilterChange(sensors.map(s => s.id));
  };

  const deselectAll = () => {
    onSensorFilterChange([]);
  };

  const selectByType = (type: string) => {
    const typeSensors = sensors.filter(s => s.type === type).map(s => s.id);
    const newSelected = [...new Set([...selectedSensors, ...typeSensors])];
    onSensorFilterChange(newSelected);
  };

  const deselectByType = (type: string) => {
    const typeSensors = sensors.filter(s => s.type === type).map(s => s.id);
    const newSelected = selectedSensors.filter(id => !typeSensors.includes(id));
    onSensorFilterChange(newSelected);
  };

  const activeCount = selectedSensors.length;
  const totalCount = sensors.length;

  const accelerationCount = sensors.filter(s => s.type === 'acceleration').length;
  const gyroscopeCount = sensors.filter(s => s.type === 'gyroscope').length;

  const activeAcceleration = selectedSensors.filter(id => 
    sensors.find(s => s.id === id)?.type === 'acceleration'
  ).length;
  
  const activeGyroscope = selectedSensors.filter(id => 
    sensors.find(s => s.id === id)?.type === 'gyroscope'
  ).length;

  // Calculate selection percentage
  const selectionPercentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center mb-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Sensor Controls</h2>
            <p className="text-sm text-gray-400">Toggle data streams</p>
          </div>
        </div>
        
        {/* Selection Status */}
        <div className="mt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Selection</div>
            <div className="text-lg font-bold text-white">
              {activeCount}<span className="text-gray-500">/{totalCount}</span>
              <span className="ml-2 text-sm font-normal text-gray-400">({selectionPercentage}%)</span>
            </div>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${selectionPercentage}%` }}
            />
          </div>
          
          {/* Type Breakdown */}
          <div className="flex justify-between mt-3 text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span className="text-gray-400">
                Accel: {activeAcceleration}/{accelerationCount}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
              <span className="text-gray-400">
                Gyro: {activeGyroscope}/{gyroscopeCount}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={selectAll}
            className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-blue-300 text-sm font-medium py-2.5 rounded-lg border border-blue-500/30 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            All On
          </button>
          <button
            onClick={deselectAll}
            className="bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 text-sm font-medium py-2.5 rounded-lg border border-gray-600/50 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            All Off
          </button>
        </div>

        {/* Type Filters */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={() => selectByType('acceleration')}
            className="bg-green-500/10 hover:bg-green-500/20 text-green-300 text-sm font-medium py-2 rounded-lg border border-green-500/30 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            All Accel
          </button>
          <button
            onClick={() => selectByType('gyroscope')}
            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-sm font-medium py-2 rounded-lg border border-purple-500/30 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            All Gyro
          </button>
        </div>
      </div>

      {/* Sensor List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {sensors.map((sensor) => {
            const isActive = selectedSensors.includes(sensor.id);
            
            return (
              <div
                key={sensor.id}
                onClick={() => toggleSensor(sensor.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  isActive
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 shadow-lg'
                    : 'bg-gray-800/30 hover:bg-gray-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                      isActive 
                        ? sensor.type === 'acceleration' 
                          ? 'bg-green-500/20' 
                          : 'bg-purple-500/20'
                        : 'bg-gray-700/50'
                    }`}>
                      <span className="text-lg">{sensor.icon}</span>
                    </div>
                    <div>
                      <div className={`font-medium ${
                        isActive ? 'text-white' : 'text-gray-200'
                      }`}>
                        {sensor.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {sensor.type === 'acceleration' ? 'Accelerometer' : 'Gyroscope'} 
                        {sensor.sensorId !== '0' ? ` (ID: ${sensor.sensorId})` : ''}
                      </div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive 
                      ? sensor.type === 'acceleration'
                        ? 'bg-green-500'
                        : 'bg-purple-500'
                      : 'bg-gray-700'
                  }`}>
                    {isActive && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                
                {isActive && (
                  <div className="mt-3 flex items-center">
                    <div 
                      className="w-full h-1.5 rounded-full"
                      style={{ backgroundColor: sensor.color }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Abnormalities */}
        {abnormalities.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center mb-3">
              <div className="bg-red-500/20 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-red-300">Detected Issues</h4>
            </div>
            <ul className="space-y-2">
              {abnormalities.slice(0, 3).map((abnormality, index) => (
                <li key={index} className="text-sm text-red-200 flex items-start">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <span>{abnormality}</span>
                </li>
              ))}
              {abnormalities.length > 3 && (
                <li className="text-xs text-red-300 ml-3">
                  +{abnormalities.length - 3} more issues...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/20">
        <div className="text-xs text-gray-500">
          <div className="flex items-center mb-1">
            <svg className="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Green: Acceleration sensors</span>
          </div>
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Purple: Gyroscope sensors</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getColorForAxis(axis: string): string {
  const colors: Record<string, string> = {
    x: '#EF4444', // Red
    y: '#10B981', // Green
    z: '#3B82F6', // Blue
  };
  return colors[axis] || '#6B7280';
}

function getIconForType(type: string, axis: string): string {
  if (type === 'acceleration') {
    return axis === 'x' ? '↔️' : '↕️';
  } else if (type === 'gyroscope') {
    return '🔄';
  }
  return '📊';
}

export default SensorFilter;