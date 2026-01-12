import React from 'react';
import { MedicalRecord } from '../../types/medical.types';

interface PatientListProps {
  patients: string[];
  records: MedicalRecord[];
  onSelectPatient: (patientName: string) => void;
  selectedPatient?: string;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  records,
  onSelectPatient,
  selectedPatient,
}) => {
  const getPatientInfo = (patientName: string) => {
  const patientRecords = records.filter(r => r.participantName === patientName);
  
  // Get all records count (not sessions)
  const recordCount = patientRecords.length;
  
  // Get health status
  const health = patientRecords[0]?.participantHealth || 'unknown';
  
  // Get most recent date properly
  let lastDate = '';
  if (patientRecords.length > 0) {
    // Filter out invalid dates
    const validDates = patientRecords
      .filter(r => r.recordDate && !isNaN(r.recordDate.getTime()))
      .map(r => r.recordDate);
    
    if (validDates.length > 0) {
      const latestDate = validDates.reduce((latest, current) => 
        current > latest ? current : latest
      );
      lastDate = latestDate.toISOString();
    }
  }
  
  // Get gender for avatar
  const gender = patientRecords[0]?.gender || 'U';
  
  return {
    recordCount: recordCount, // Changed from sessionCount to recordCount
    healthStatus: health,
    lastDate: lastDate,
    gender: gender,
  };
};

  const getHealthColor = (health: string) => {
    switch(health) {
      case 'healthy': return 'from-green-500 to-emerald-500';
      case 'healthy*': return 'from-yellow-500 to-amber-500';
      case 'patient': return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-3 p-4">
      {patients.map(patient => {
        const info = getPatientInfo(patient);
        const isSelected = patient === selectedPatient;

        return (
          <div
            key={patient}
            onClick={() => onSelectPatient(patient)}
            className={`group cursor-pointer transition-all duration-300 ${
              isSelected 
                ? 'transform scale-[1.02]' 
                : 'hover:transform hover:scale-[1.01]'
            }`}
          >
            <div className={`rounded-2xl p-4 border transition-all duration-300 ${
              isSelected
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 shadow-xl shadow-blue-500/10'
                : 'bg-gray-800/30 hover:bg-gray-800/50 border-gray-700/50 hover:border-gray-700'
            }`}>
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-br ${
                    getHealthColor(info.healthStatus || '')
                  }`}>
                    <span className="text-white font-semibold">
                      {info.gender === 'M' ? '👨' : info.gender === 'F' ? '👩' : '👤'}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white truncate max-w-[140px]">{patient}</h3>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        info.healthStatus === 'healthy' 
                          ? 'bg-green-500/20 text-green-300'
                          : info.healthStatus === 'healthy*'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {info.healthStatus}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Selection Indicator */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-600 group-hover:border-gray-500'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              
              {/* Stats */}
<div className="flex items-center justify-between text-sm">
  <div className="flex items-center text-gray-400">
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>{info.recordCount} record{info.recordCount !== 1 ? 's' : ''}</span>
  </div>
  
  {info.lastDate && (
    <div className="text-xs text-gray-500">
      {new Date(info.lastDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}
    </div>
  )}
</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PatientList;