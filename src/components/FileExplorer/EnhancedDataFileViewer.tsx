import React, { useState, useEffect } from 'react';
import { HeaderParser } from '../../services/headerParser';
import { EnhancedGaitParser } from '../../services/enhancedGaitParser';

interface EnhancedDataFileViewerProps {
  filePath?: string;
  fileContent?: string;
  patientId?: string;
  sessionId?: string;
  fileName?: string;
  fileAnalysis?: any;
}

export const EnhancedDataFileViewer: React.FC<EnhancedDataFileViewerProps> = ({
  filePath,
  fileContent,
  patientId,
  sessionId,
  fileName,
  fileAnalysis,
}) => {
  const [fileContentState, setFileContentState] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headerAnalysis, setHeaderAnalysis] = useState<any>(null);
  const [sensors, setSensors] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fileStats, setFileStats] = useState<any>(null);

  useEffect(() => {
    if (fileContent) {
      // Use the provided content directly
      console.log('Using provided file content');
      loadContent(fileContent);
    } else if (filePath) {
      loadFile(filePath);
    } else {
      resetState();
    }
  }, [filePath, fileContent]);

  const loadContent = (content: string) => {
    setLoading(true);
    setError(null);
    
    try {
      setFileContentState(content);
      
      // Analyze the file structure
      try {
        const analysis = HeaderParser.analyzeFileStructure(content);
        setHeaderAnalysis(analysis);
        
        // Get available sensors
        const availableSensors = EnhancedGaitParser.getAvailableSensors(content);
        setSensors(availableSensors);
        
        // Get preview data
        const extractedData = EnhancedGaitParser.extractSensorDataByColumn(content);
        setPreviewData([
          { label: 'Acceleration X', data: extractedData.acceleration.x.slice(0, 100) },
          { label: 'Acceleration Y', data: extractedData.acceleration.y.slice(0, 100) },
          { label: 'Acceleration Z', data: extractedData.acceleration.z.slice(0, 100) },
          { label: 'Gyroscope X', data: extractedData.gyroscope.x.slice(0, 100) },
          { label: 'Gyroscope Y', data: extractedData.gyroscope.y.slice(0, 100) },
          { label: 'Gyroscope Z', data: extractedData.gyroscope.z.slice(0, 100) },
        ]);
        
        // Calculate file statistics
        const lines = content.split('\n').filter(line => line.trim() !== '');
        const dataLines = lines.filter(line => !line.startsWith('#'));
        const bytes = new Blob([content]).size;
        
        setFileStats({
          totalLines: lines.length,
          dataLines: dataLines.length,
          fileSize: formatFileSize(bytes),
          timestamp: analysis.header?.timestamp || new Date(),
        });
        
      } catch (parseError) {
        console.error('Error analyzing file:', parseError);
        setError('Failed to parse file format');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file content');
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }
      
      const content = await response.text();
      loadContent(content);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setFileContentState('');
    setHeaderAnalysis(null);
    setSensors([]);
    setPreviewData([]);
    setFileStats(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Analyzing sensor file format...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-300">Error Loading File</h3>
              <p className="text-sm text-red-400/70 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {fileContentState && headerAnalysis ? (
        <div className="space-y-6 p-6">
          {/* File Header Analysis */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">File Structure Analysis</h3>
                {fileName && (
                  <p className="text-sm text-gray-400 mt-1 font-mono">{fileName}</p>
                )}
                {patientId && (
                  <p className="text-sm text-gray-400">Patient: {patientId}</p>
                )}
                {sessionId && (
                  <p className="text-sm text-gray-400">Session: {sessionId}</p>
                )}
              </div>
              <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
                {fileStats?.fileSize || 'Unknown size'}
              </div>
            </div>
            
            {/* File Statistics */}
            {fileStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                  <div className="text-sm text-gray-400">Total Lines</div>
                  <div className="text-2xl font-bold text-white">{fileStats.totalLines}</div>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                  <div className="text-sm text-gray-400">Data Lines</div>
                  <div className="text-2xl font-bold text-white">{fileStats.dataLines}</div>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                  <div className="text-sm text-gray-400">File Size</div>
                  <div className="text-2xl font-bold text-white">{fileStats.fileSize}</div>
                </div>
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                  <div className="text-sm text-gray-400">Recorded</div>
                  <div className="text-lg font-bold text-white">{formatDate(fileStats.timestamp)}</div>
                </div>
              </div>
            )}
            
            {/* Column Analysis */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-3">Column Structure</h4>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Total Columns</div>
                    <div className="text-2xl font-bold text-white">{headerAnalysis.columns.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Sensor Types</div>
                    <div className="text-white">
                      {headerAnalysis.header.sensorTypes.join(', ')}
                    </div>
                  </div>
                </div>
                
                {/* Column Breakdown */}
                <div className="mt-4">
                  <div className="text-sm text-gray-400 mb-2">Column Breakdown</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {headerAnalysis.columns.map((col: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 hover:bg-gray-800/30 rounded">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            col.type === 'timestamp' ? 'bg-blue-500' :
                            col.type === 'acceleration' ? 'bg-green-500' :
                            col.type === 'gyroscope' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}></div>
                          <span className="text-gray-300">
                            {col.name} {col.axis ? `(${col.axis})` : ''}
                          </span>
                        </div>
                        <span className="text-gray-400">
                          {col.type} • {col.unit || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Available Sensors */}
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Available Sensors</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sensors.map((sensor, index) => (
                  <div key={index} className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                    <div className="flex items-center mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                        sensor.type === 'acceleration' ? 'bg-green-500/20' : 'bg-purple-500/20'
                      }`}>
                        <span className="text-xl">
                          {sensor.type === 'acceleration' ? '📈' : '🔄'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {sensor.type === 'acceleration' ? 'Accelerometer' : 'Gyroscope'}
                        </div>
                        <div className="text-xs text-gray-400">ID: {sensor.id}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Axes: {sensor.availableAxes.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Preview */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Data Preview</h3>
              <div className="text-sm text-gray-400">
                First 100 samples
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-left text-gray-400">Channel</th>
                    <th className="py-3 px-4 text-left text-gray-400">Min</th>
                    <th className="py-3 px-4 text-left text-gray-400">Max</th>
                    <th className="py-3 px-4 text-left text-gray-400">Mean</th>
                    <th className="py-3 px-4 text-left text-gray-400">Std Dev</th>
                    <th className="py-3 px-4 text-left text-gray-400">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((channel, index) => {
                    if (channel.data.length === 0) return null;
                    
                    const min = Math.min(...channel.data);
                    const max = Math.max(...channel.data);
                    const mean = channel.data.reduce((a, b) => a + b, 0) / channel.data.length;
                    const variance = channel.data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / channel.data.length;
                    const stdDev = Math.sqrt(variance);
                    
                    return (
                      <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                        <td className="py-3 px-4 text-white font-medium">{channel.label}</td>
                        <td className="py-3 px-4 text-gray-300">{min.toFixed(4)}</td>
                        <td className="py-3 px-4 text-gray-300">{max.toFixed(4)}</td>
                        <td className="py-3 px-4 text-gray-300">{mean.toFixed(4)}</td>
                        <td className="py-3 px-4 text-gray-300">{stdDev.toFixed(4)}</td>
                        <td className="py-3 px-4 text-gray-300">{channel.data.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/30 w-full max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-3">No Sensor File Selected</h3>
            <p className="text-gray-400 mb-6">
              Select a sensor file to analyze its structure and data
            </p>
            
            <div className="text-sm text-gray-500 space-y-2">
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Supports IAW Data Logger format</span>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>Location: /records-one-folder/raw/</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};