import React from 'react';

interface StatusBarProps {
  patientCount: number;
  sessionCount: number;
  loading?: boolean;
  errors?: string[];
}

export const StatusBar: React.FC<StatusBarProps> = ({
  patientCount,
  sessionCount,
  loading = false,
  errors = [],
}) => {
  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className="text-gray-400">Patients:</span>
          <span className="ml-2 font-medium">{patientCount}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-400">Sessions:</span>
          <span className="ml-2 font-medium">{sessionCount}</span>
        </div>
        {loading && (
          <div className="flex items-center text-yellow-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400 mr-2"></div>
            <span>Loading...</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center">
        {errors.length > 0 ? (
          <span className="text-red-400">⚠️ {errors.length} error{errors.length !== 1 ? 's' : ''}</span>
        ) : (
          <span className="text-green-400">✓ Ready</span>
        )}
      </div>
    </div>
  );
};