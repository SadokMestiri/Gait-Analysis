import React, { useState, useEffect } from 'react';
import { GaitParser } from '../../services/gaitParser';

interface DataFileViewerProps {
  filePath?: string;
  patientId?: string;
  sessionId?: string;
  fileName?: string;
}

export const DataFileViewer: React.FC<DataFileViewerProps> = ({
  filePath,
  patientId,
  sessionId,
  fileName
}) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const [dataFormat, setDataFormat] = useState<{ columns: number; sample: number[]; header: string } | null>(null);

  useEffect(() => {
    if (filePath) {
      loadFile(filePath);
    } else {
      setFileContent('');
      setPreviewLines([]);
      setDataFormat(null);
    }
  }, [filePath]);

  const loadFile = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }
      
      const content = await response.text();
      setFileContent(content);
      
      // Get preview lines
      const lines = content.split('\n').filter(line => line.trim() !== '');
      setPreviewLines(lines.slice(0, 30)); // Show first 30 lines
      
      // Analyze data format
      const format = GaitParser.getDataFormatPreview(content);
      setDataFormat(format);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const parseHeaderInfo = (headerLine: string) => {
  try {
    const parts = headerLine.split('_');
    const info = {
      softwareVersion: parts[1] || 'Unknown',
      firmwareVersion: parts[3] || 'Unknown',
      deviceId: parts[4]?.slice(0, 12) + '...' || 'Unknown',
      sensorTypes: 'Unknown',
      timestamp: 'Unknown',
    };

    // Parse sensor types
    const sensorTypesMatch = headerLine.match(/\(([^)]+)\)/);
    if (sensorTypesMatch) {
      const codes = sensorTypesMatch[1].split(',').map(Number);
      const sensorMap: Record<number, string> = {
        1: 'Acceleration',
        2: 'Gyroscope',
        3: 'Magnetometer',
      };
      info.sensorTypes = codes.map(code => sensorMap[code] || `Type${code}`).join(', ');
    }

    // Parse timestamp
    const timestampMatch = headerLine.match(/UTC_([^_]+)$/);
    if (timestampMatch) {
      const date = new Date(timestampMatch[1]);
      info.timestamp = date.toLocaleString();
    }

    return info;
  } catch (error) {
    console.error('Error parsing header:', error);
    return {
      softwareVersion: 'Error parsing',
      firmwareVersion: 'Error parsing',
      deviceId: 'Error parsing',
      sensorTypes: 'Error parsing',
      timestamp: 'Error parsing',
    };
  }
};

  const parseSecondHeader = (headerLine: string) => {
    if (!headerLine) return { columns: 'Unknown', description: 'Unknown' };
    
    // Remove leading # and split
    const cleanLine = headerLine.replace(/^#\s*/, '');
    const parts = cleanLine.split(/\s+/);
    
    if (parts.length >= 2) {
      return {
        columns: parts[0] || 'Unknown',
        description: parts.slice(1).join(' ') || 'Unknown',
      };
    }
    
    return { columns: 'Unknown', description: cleanLine };
  };

  const formatFileSize = (content: string): string => {
    const bytes = new Blob([content]).size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading sensor file...</p>
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

  const headerInfo = previewLines.length > 0 ? parseHeaderInfo(previewLines[0]) : null;
  const secondHeader = previewLines.length > 1 ? parseSecondHeader(previewLines[1]) : null;

  return (
    <div className="h-full overflow-auto">
      {fileContent ? (
        <div className="space-y-6 p-6">
          {/* File Header Card */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Sensor File Information</h3>
                {fileName && (
                  <p className="text-sm text-gray-400 mt-1 font-mono">{fileName}</p>
                )}
              </div>
              <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
                {formatFileSize(fileContent)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {headerInfo && (
                <>
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                    <div className="text-sm text-gray-400">Device ID</div>
                    <div className="text-white font-mono text-sm truncate">{headerInfo.deviceId}</div>
                  </div>
                  
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                    <div className="text-sm text-gray-400">Software Version</div>
                    <div className="text-white">{headerInfo.softwareVersion}</div>
                  </div>
                  
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                    <div className="text-sm text-gray-400">Firmware Version</div>
                    <div className="text-white">{headerInfo.firmwareVersion}</div>
                  </div>
                  
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                    <div className="text-sm text-gray-400">Sensor Types</div>
                    <div className="text-white">{headerInfo.sensorTypes}</div>
                  </div>
                  
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                    <div className="text-sm text-gray-400">Recording Time</div>
                    <div className="text-white">{headerInfo.timestamp}</div>
                  </div>
                </>
              )}
              
              {secondHeader && (
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                  <div className="text-sm text-gray-400">Data Columns</div>
                  <div className="text-white">{secondHeader.columns}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{secondHeader.description}</div>
                </div>
              )}
              
              {dataFormat && (
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                  <div className="text-sm text-gray-400">Data Format</div>
                  <div className="text-white">{dataFormat.columns} columns</div>
                  <div className="text-xs text-gray-500 mt-1">
                    First sample: {dataFormat.sample.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Structure Analysis */}
          {dataFormat && (
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
              <h3 className="text-xl font-semibold text-white mb-4">Data Structure Analysis</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Column Layout</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { index: 0, description: 'Timestamp (s)', color: 'bg-blue-500' },
                      { index: 1, description: 'Acceleration X (g)', color: 'bg-red-500' },
                      { index: 2, description: 'Acceleration Y (g)', color: 'bg-green-500' },
                      { index: 3, description: 'Acceleration Z (g)', color: 'bg-purple-500' },
                      { index: 4, description: 'Gyroscope X (°/s)', color: 'bg-orange-500' },
                      { index: 5, description: 'Gyroscope Y (°/s)', color: 'bg-pink-500' },
                      { index: 6, description: 'Gyroscope Z (°/s)', color: 'bg-yellow-500' },
                    ].map((col, index) => (
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
                    
                    {dataFormat.columns > 7 && (
                      <div className="flex items-center px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600/50">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                        <span className="text-xs text-gray-300">
                          +{dataFormat.columns - 7} more columns
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-2">First Sample Values</div>
                  <div className="bg-gray-900/50 rounded-lg p-3 overflow-x-auto">
                    <div className="flex space-x-4">
                      {dataFormat.sample.slice(0, 10).map((value, index) => (
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
              </div>
            </div>
          )}

          {/* Raw Data Preview */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Raw Data Preview</h3>
                <p className="text-sm text-gray-400 mt-1">First {previewLines.length} lines of the sensor file</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                  {previewLines.length} lines
                </div>
                <div className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  {dataFormat?.columns || 0} columns
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700/30">
              <div className="overflow-x-auto max-h-96">
                <div className="min-w-max">
                  {previewLines.map((line, index) => (
                    <div 
                      key={index}
                      className={`px-4 py-2 font-mono text-sm ${
                        index === 0 || index === 1
                          ? 'bg-blue-900/20 text-blue-300 border-b border-blue-800/30'
                          : index % 2 === 0
                          ? 'bg-gray-800/30 text-gray-300'
                          : 'bg-gray-900/30 text-gray-300'
                      }`}
                    >
                      <div className="flex">
                        <div className="w-12 flex-shrink-0 text-gray-500 pr-4 text-right">
                          {index + 1}
                        </div>
                        <div className="flex-1 overflow-x-auto">
                          {line.length > 200 ? line.substring(0, 200) + '...' : line}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              Select a sensor file from the file explorer to view its contents and metadata
            </p>
            
            <div className="text-sm text-gray-500">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Supported format: IAW Data Logger sensor files</span>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>Location: /records-one-folder/raw/*.txt</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};