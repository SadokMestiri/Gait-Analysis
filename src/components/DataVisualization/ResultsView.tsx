// components/DataVisualization/ResultsView.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { ResultsChart } from './ResultsChart';
import { ResultsParser } from '../../services/resultsParser';

interface ResultsViewProps {
  patientName: string;
  records: any[];
}

interface ResultsData {
  pitch: {
    timestamps: number[];
    values: number[][];
    columnCount: number;
    phaseIncrement: number;
  };
  roll: {
    timestamps: number[];
    values: number[][];
    columnCount: number;
    phaseIncrement: number;
  };
  yaw: {
    timestamps: number[];
    values: number[][];
    columnCount: number;
    phaseIncrement: number;
  };
  loadedFiles: string[];
  loading: boolean;
  error: string | null;
  sensorRecordName?: string;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  patientName,
  records,
}) => {
  const [resultsData, setResultsData] = useState<ResultsData>({
    pitch: { timestamps: [], values: [], columnCount: 0, phaseIncrement: 0.01 },
    roll: { timestamps: [], values: [], columnCount: 0, phaseIncrement: 0.01 },
    yaw: { timestamps: [], values: [], columnCount: 0, phaseIncrement: 0.01 },
    loadedFiles: [],
    loading: false,
    error: null,
    sensorRecordName: '',
  });

  const [availableResults, setAvailableResults] = useState<Array<{
    type: 'Yaw' | 'Roll' | 'Pitch';
    fileName: string;
    baseFileName: string;
    session: string;
  }>>([]);

  // Get the sensor record name from the CSV
  const getSensorRecordName = (): string => {
    const patientRecord = records.find(r => r.participantName === patientName);
    return patientRecord?.sensorRecords || '';
  };

  useEffect(() => {
    if (patientName && records.length > 0) {
      const sensorRecord = getSensorRecordName();
      if (sensorRecord) {
        loadResults(sensorRecord);
      } else {
        setResultsData(prev => ({
          ...prev,
          loading: false,
          error: `No sensor record found in CSV for patient: ${patientName}`,
        }));
      }
    }
  }, [patientName, records]);

  const loadResults = async (sensorRecord: string) => {
    setResultsData(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      sensorRecordName: sensorRecord,
    }));

    try {
      // Get available results files for this sensor record
      const available = ResultsParser.getAvailableResultsForSensorRecord(sensorRecord, records);
      setAvailableResults(available);

      if (available.length === 0) {
        setResultsData(prev => ({
          ...prev,
          loading: false,
          error: `No results files found for sensor record: ${sensorRecord}`,
        }));
        return;
      }

      // Load all results
      const loadedData = await ResultsParser.loadAllResultsForSensorRecord(sensorRecord);
      
      setResultsData({
        pitch: loadedData.pitch,
        roll: loadedData.roll,
        yaw: loadedData.yaw,
        loadedFiles: loadedData.loadedFiles,
        loading: false,
        error: loadedData.errors.length > 0 ? loadedData.errors.join('; ') : null,
        sensorRecordName: sensorRecord,
      });

    } catch (error: any) {
      setResultsData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load results',
      }));
    }
  };

  const reloadResults = () => {
    const sensorRecord = getSensorRecordName();
    if (sensorRecord) {
      loadResults(sensorRecord);
    }
  };

  if (resultsData.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading gait analysis results...</p>
          {resultsData.sensorRecordName && (
            <p className="text-xs text-gray-500 mt-2">
              Searching for: {resultsData.sensorRecordName}*.MicroHub.txt
            </p>
          )}
          <button
            onClick={reloadResults}
            className="mt-4 px-4 py-2 text-sm bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (resultsData.error && resultsData.loadedFiles.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start">
            <div className="bg-red-500/20 w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-red-300">Error Loading Results</h3>
              <p className="text-sm text-red-400/70 mt-2">{resultsData.error}</p>
              
              <div className="mt-6">
                <h4 className="text-lg font-medium text-red-200 mb-3">Troubleshooting Steps:</h4>
                <ul className="space-y-2 text-sm text-red-300/80">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Check that result files exist in /records-one-folder/result/</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Verify file naming pattern: {resultsData.sensorRecordName}GaitAnalysisId0*.MicroHub.txt</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Check browser console for detailed error messages</span>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={reloadResults}
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Retry Loading Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasData = resultsData.pitch.values.length > 0 || 
                  resultsData.roll.values.length > 0 || 
                  resultsData.yaw.values.length > 0;

  if (!hasData) {
    const sensorRecord = getSensorRecordName();
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/30 w-full max-w-2xl">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">No Gait Analysis Results Found</h3>
          
          {sensorRecord ? (
            <>
              <p className="text-gray-400 mb-6">
                Looking for results files based on sensor record:
                <span className="font-mono text-blue-300 ml-2 px-3 py-1.5 bg-blue-500/10 rounded-lg">
                  {sensorRecord}
                </span>
              </p>
              <div className="bg-gray-800/30 rounded-xl p-6 mb-6 border border-gray-700/30">
                <h4 className="font-semibold text-gray-300 mb-4">Expected file patterns:</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="font-mono text-sm text-gray-300">Yaw Results</span>
                    </div>
                    <code className="text-xs text-gray-400">
                      {sensorRecord}GaitAnalysisId0Yaw.MicroHub.txt
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-mono text-sm text-gray-300">Roll Results</span>
                    </div>
                    <code className="text-xs text-gray-400">
                      {sensorRecord}GaitAnalysisId0Roll.MicroHub.txt
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                      <span className="font-mono text-sm text-gray-300">Pitch Results</span>
                    </div>
                    <code className="text-xs text-gray-400">
                      {sensorRecord}GaitAnalysisId0Pitch.MicroHub.txt
                    </code>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400 mb-6">
              No sensor record found in CSV for patient: {patientName}
            </p>
          )}
          
          <div className="text-sm text-gray-500 space-y-3">
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Location: /records-one-folder/result/</span>
            </div>
            <div className="text-xs text-gray-600 mt-4">
              These files contain processed gait analysis results with phase-normalized data
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with loaded files info */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 backdrop-blur-lg border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-indigo-500 to-violet-600 w-14 h-14 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Gait Analysis Results</h3>
                <p className="text-sm text-gray-400">
                  Phase-normalized analysis across gait cycle (0-1)
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-gray-400">
                Patient: <span className="text-white font-medium">{patientName}</span>
              </span>
              <span className="text-gray-400">
                Sensor record: <span className="text-blue-300 font-mono">{resultsData.sensorRecordName}</span>
              </span>
              <span className="text-gray-400">
                Files: <span className="text-white">{resultsData.loadedFiles.length}</span>
              </span>
              <span className="text-gray-400">
                Data loaded: <span className="text-green-300">✓</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {resultsData.yaw.values.length > 0 && (
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 px-4 py-3 rounded-xl border border-blue-500/30">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-sm text-blue-300">Yaw</div>
                    <div className="text-lg font-bold text-white">
                      {resultsData.yaw.values.length}×{resultsData.yaw.columnCount}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {resultsData.roll.values.length > 0 && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 px-4 py-3 rounded-xl border border-green-500/30">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-sm text-green-300">Roll</div>
                    <div className="text-lg font-bold text-white">
                      {resultsData.roll.values.length}×{resultsData.roll.columnCount}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {resultsData.pitch.values.length > 0 && (
              <div className="bg-gradient-to-r from-purple-500/20 to-violet-600/20 px-4 py-3 rounded-xl border border-purple-500/30">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <div>
                    <div className="text-sm text-purple-300">Pitch</div>
                    <div className="text-lg font-bold text-white">
                      {resultsData.pitch.values.length}×{resultsData.pitch.columnCount}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error warning if any */}
        {resultsData.error && (
          <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <span className="text-sm text-yellow-300 font-medium">Partial load:</span>
                <span className="text-sm text-yellow-400/70 ml-2">{resultsData.error}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="space-y-8">
        {/* Yaw Chart */}
        {resultsData.yaw.values.length > 0 && (
          <ResultsChart
            data={{
              timestamps: resultsData.yaw.timestamps,
              values: resultsData.yaw.values,
              columnCount: resultsData.yaw.columnCount,
              phaseIncrement: resultsData.yaw.phaseIncrement,
            }}
            title={`Yaw Analysis (${resultsData.yaw.columnCount || 0} measurements)`}
            color="#3B82F6"
            yAxisLabel="Yaw Angle (°)"
            height={450}
          />
        )}
        
        {/* Roll Chart */}
        {resultsData.roll.values.length > 0 && (
          <ResultsChart
            data={{
              timestamps: resultsData.roll.timestamps,
              values: resultsData.roll.values,
              columnCount: resultsData.roll.columnCount,
              phaseIncrement: resultsData.roll.phaseIncrement,
            }}
            title={`Roll Analysis (${resultsData.roll.columnCount || 0} measurements)`}
            color="#10B981"
            yAxisLabel="Roll Angle (°)"
            height={450}
          />
        )}
        
        {/* Pitch Chart */}
        {resultsData.pitch.values.length > 0 && (
          <ResultsChart
            data={{
              timestamps: resultsData.pitch.timestamps,
              values: resultsData.pitch.values,
              columnCount: resultsData.pitch.columnCount,
              phaseIncrement: resultsData.pitch.phaseIncrement,
            }}
            title={`Pitch Analysis (${resultsData.pitch.columnCount || 0} measurements)`}
            color="#8B5CF6"
            yAxisLabel="Pitch Angle (°)"
            height={450}
          />
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Analysis Summary</h3>
          <div className="text-sm text-gray-400">
            Phase-normalized gait cycle analysis
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Loaded Files */}
          {resultsData.loadedFiles.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-300 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Successfully Loaded Files
              </h4>
              <div className="bg-gray-800/30 rounded-xl p-4 max-h-60 overflow-y-auto">
                {resultsData.loadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center py-2 border-b border-gray-700/30 last:border-b-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-300 font-mono truncate">{file}</span>
                    <span className="ml-auto text-xs text-gray-500 px-2 py-1 bg-gray-700/50 rounded">
                      ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Statistics Grid */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-300 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Statistical Analysis
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resultsData.yaw.values.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    <h5 className="font-medium text-gray-300">Yaw Statistics</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Phases:</span>
                      <span className="text-white font-medium">{resultsData.yaw.values.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Measurements:</span>
                      <span className="text-white font-medium">{resultsData.yaw.columnCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total points:</span>
                      <span className="text-white font-medium">
                        {resultsData.yaw.values.length * (resultsData.yaw.columnCount + 1)}
                      </span>
                    </div>
                    {(() => {
                      const meanValues = resultsData.yaw.values.map(row => row[0] || 0);
                      const min = meanValues.length > 0 ? Math.min(...meanValues) : 0;
                      const max = meanValues.length > 0 ? Math.max(...meanValues) : 0;
                      const mean = meanValues.length > 0 ? 
                        meanValues.reduce((a, b) => a + b, 0) / meanValues.length : 0;
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Mean of means:</span>
                            <span className="text-white font-mono">{mean.toFixed(2)}°</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Phase Range:</span>
                            <span className="text-white">
                              {resultsData.yaw.timestamps[0]?.toFixed(2) || 0} - {resultsData.yaw.timestamps[resultsData.yaw.timestamps.length - 1]?.toFixed(2) || 0}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {resultsData.roll.values.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <h5 className="font-medium text-gray-300">Roll Statistics</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Phases:</span>
                      <span className="text-white font-medium">{resultsData.roll.values.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Measurements:</span>
                      <span className="text-white font-medium">{resultsData.roll.columnCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total points:</span>
                      <span className="text-white font-medium">
                        {resultsData.roll.values.length * (resultsData.roll.columnCount + 1)}
                      </span>
                    </div>
                    {(() => {
                      const meanValues = resultsData.roll.values.map(row => row[0] || 0);
                      const min = meanValues.length > 0 ? Math.min(...meanValues) : 0;
                      const max = meanValues.length > 0 ? Math.max(...meanValues) : 0;
                      const mean = meanValues.length > 0 ? 
                        meanValues.reduce((a, b) => a + b, 0) / meanValues.length : 0;
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Mean of means:</span>
                            <span className="text-white font-mono">{mean.toFixed(2)}°</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Phase Range:</span>
                            <span className="text-white">
                              {resultsData.roll.timestamps[0]?.toFixed(2) || 0} - {resultsData.roll.timestamps[resultsData.roll.timestamps.length - 1]?.toFixed(2) || 0}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {resultsData.pitch.values.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                    <h5 className="font-medium text-gray-300">Pitch Statistics</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Phases:</span>
                      <span className="text-white font-medium">{resultsData.pitch.values.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Measurements:</span>
                      <span className="text-white font-medium">{resultsData.pitch.columnCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total points:</span>
                      <span className="text-white font-medium">
                        {resultsData.pitch.values.length * (resultsData.pitch.columnCount + 1)}
                      </span>
                    </div>
                    {(() => {
                      const meanValues = resultsData.pitch.values.map(row => row[0] || 0);
                      const min = meanValues.length > 0 ? Math.min(...meanValues) : 0;
                      const max = meanValues.length > 0 ? Math.max(...meanValues) : 0;
                      const mean = meanValues.length > 0 ? 
                        meanValues.reduce((a, b) => a + b, 0) / meanValues.length : 0;
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Mean of means:</span>
                            <span className="text-white font-mono">{mean.toFixed(2)}°</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Phase Range:</span>
                            <span className="text-white">
                              {resultsData.pitch.timestamps[0]?.toFixed(2) || 0} - {resultsData.pitch.timestamps[resultsData.pitch.timestamps.length - 1]?.toFixed(2) || 0}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Phase Analysis Info */}
        <div className="mt-8 pt-6 border-t border-gray-700/50">
          <h4 className="font-medium text-gray-300 mb-4">About Phase Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/20 p-4 rounded-xl">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Normalized Gait Cycle</h5>
              <p className="text-sm text-gray-400">
                The x-axis represents normalized time from 0 (start of gait cycle) to 1 (end of gait cycle). 
                This allows comparison across different walking speeds and conditions.
              </p>
            </div>
            <div className="bg-gray-800/20 p-4 rounded-xl">
              <h5 className="text-sm font-medium text-gray-300 mb-2">Multiple Measurements</h5>
              <p className="text-sm text-gray-400">
                Each chart shows mean value (thick line) plus all individual measurements (thin lines).
                The number of measurements varies (e.g., 13x, 17x, 53x) depending on the analysis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Help */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 backdrop-blur-lg rounded-2xl p-6 border border-indigo-500/30">
        <div className="flex items-center mb-6">
          <div className="bg-indigo-500/20 w-10 h-10 rounded-xl flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">Understanding These Results</h4>
            <p className="text-sm text-gray-400">Key insights for clinical interpretation</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <h5 className="font-medium text-blue-300">Yaw Analysis</h5>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Rotation around vertical (Z) axis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Indicates turning direction and body rotation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Important for balance and stability</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h5 className="font-medium text-green-300">Roll Analysis</h5>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Rotation around forward (X) axis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Indicates side-to-side leaning</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Related to weight shifting during gait</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <h5 className="font-medium text-purple-300">Pitch Analysis</h5>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Rotation around lateral (Y) axis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Indicates forward/backward leaning</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Important for propulsion and braking</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>These angles are derived from processed IMU data through advanced gait analysis algorithms.</span>
          </div>
        </div>
      </div>
    </div>
  );
};