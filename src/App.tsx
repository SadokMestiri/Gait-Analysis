import React, { useState, useEffect } from 'react';
import { PatientList } from './components/PatientManagement/PatientList';
import { GaitPhasePlot } from './components/DataVisualization/GaitPhasePlot';
import { RangeOfMotion } from './components/DataVisualization/RangeOfMotion';
import { StepAnalysis } from './components/DataVisualization/StepAnalysis';
import { SensorFilter } from './components/Layout/SensorFilter';
import { StatusBar } from './components/Layout/StatusBar';
import { EnhancedDataFileViewer } from './components/FileExplorer/EnhancedDataFileViewer';
import { FileTree } from './components/FileExplorer/FileTree';
import { MultiFileNavigator } from './components/FileExplorer/MultiFileNavigator';
import { CompleteDataViewer } from './components/DataVisualization/CompleteDataViewer';
import { IMUAccelerationChart } from './components/DataVisualization/IMUAccelerationChart';
import { IMUGyroscopeChart } from './components/DataVisualization/IMUGyroscopeChart';
import { useMedicalRecords } from './hooks/useMedicalRecords';
import { useSensorData } from './hooks/useSensorData';
import { useGaitAnalysis } from './hooks/useGaitAnalysis';
import { EnhancedGaitParser } from './services/enhancedGaitParser';
import { AdvancedHeaderParser } from './services/advancedHeaderParser';
import { HeaderParser } from './services/headerParser';
import * as XLSX from 'xlsx';
import { Tab } from '@headlessui/react';
import { ResultsView } from './components/DataVisualization/ResultsView';
import './styles/uplot-theme.css';

interface IMUAccelerationData {
  x: number[];
  y: number[];
  z: number[];
}

interface IMUGyroscopeData {
  x: number[];
  y: number[];
  z: number[];
}

interface IMUDataType {
  acceleration: IMUAccelerationData;
  gyroscope: IMUGyroscopeData;
}

interface MultiSensorDataType {
  timestamps: number[];
  imus: Record<string, IMUDataType>;
}

type ExcelData = any[][];

function App() {
  const [selectedPatient, setSelectedPatient] = useState<string>();
  const [excelData, setExcelData] = useState<ExcelData>([]);
  const [loadingExcel, setLoadingExcel] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [availableSensors, setAvailableSensors] = useState<any[]>([]);
  const [multiSensorData, setMultiSensorData] = useState<MultiSensorDataType | null>(null);
  const [completeSensorData, setCompleteSensorData] = useState<any>(null);
  const [filteredSensorData, setFilteredSensorData] = useState<{
    acceleration: { x: number[]; y: number[]; z: number[] };
    gyroscope: { x: number[]; y: number[]; z: number[] };
    timestamps: number[];
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // New states for multi-file support
  const [patientSensorFiles, setPatientSensorFiles] = useState<Array<{
    filePath: string;
    fileName: string;
    session: string;
    content: string;
    analysis: any;
    multiData: any;
    completeData: any;
  }>>([]);
  
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  const {
    records,
    loading: medicalLoading,
    error: medicalError,
    getPatientRecords,
    getUniquePatients,
  } = useMedicalRecords(excelData);

  const {
    currentRecording,
    loading: sensorLoading,
    error: sensorError,
    loadSensorFile,
    clearRecordings,
  } = useSensorData();

  const {
    currentAnalysis,
    loading: analysisLoading,
    error: analysisError,
    analyzeSensorData,
    detectAbnormalities,
  } = useGaitAnalysis();

  const [abnormalities, setAbnormalities] = useState<string[]>([]);

  // Load Excel file on component mount
  useEffect(() => {
    loadExcelFile();
  }, []);

  // Analyze sensor data when recording changes
  useEffect(() => {
    if (currentRecording && currentRecording.data.length > 0) {
      analyzeSensorData(
        currentRecording.data,
        currentRecording.patientId,
        currentRecording.sessionId
      );
      
      if (currentRecording.data.length > 100) {
        const detectedAbnormalities = detectAbnormalities(currentRecording.data.slice(0, 500));
        setAbnormalities(detectedAbnormalities);
      }
    }
  }, [currentRecording, analyzeSensorData, detectAbnormalities]);

  const loadExcelFile = async () => {
    try {
      setLoadingExcel(true);
      
      // Fetch the Excel file from public folder
      const response = await fetch('/Patient-Records.xlsx');
      if (!response.ok) {
        throw new Error(`Failed to load Excel file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Find "Copy Complete Table" sheet
      const sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('copy complete table') || 
        name.toLowerCase().includes('copy')
      ) || workbook.SheetNames[0];
      
      const worksheet = workbook.Sheets[sheetName];
      const excelDataArray = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      }) as ExcelData;
      
      setExcelData(excelDataArray);
      
    } catch (error) {
      console.error('Error loading Excel file:', error);
      setExcelData(getSampleExcelData());
    } finally {
      setLoadingExcel(false);
    }
  };

  const patients = getUniquePatients();
  const patientRecords = selectedPatient ? getPatientRecords(selectedPatient) : [];

  const handlePatientSelect = async (patientName: string) => {
    setSelectedPatient(patientName);
    clearRecordings();
    setAbnormalities([]);
    setSelectedFilePath('');
    setSelectedFileName('');
    setMultiSensorData(null);
    setCompleteSensorData(null);
    setFilteredSensorData(null);
    setSelectedSensors([]);
    setAvailableSensors([]);
    setFilterStatus('');
    setPatientSensorFiles([]);
    setCurrentFileIndex(0);
    
    // Load ALL sensor files for this patient
    await loadAllSensorFilesForPatient(patientName);
  };

  const loadAllSensorFilesForPatient = async (patientName: string) => {
    console.log(`📁 Loading ALL sensor files for ${patientName}`);
    setFilterStatus(`Loading sensor data for ${patientName}...`);
    
    try {
      // Get ALL sensor records for this patient
      const patientSensorRecords = records.filter(r => 
        r.participantName === patientName && 
        r.sensorRecords && 
        r.sensorRecords.trim() !== ''
      );
      
      console.log(`Found ${patientSensorRecords.length} sensor records for ${patientName}:`, 
        patientSensorRecords.map(r => ({ file: r.sensorRecords, session: r.session })));
      
      if (patientSensorRecords.length === 0) {
        setFilterStatus(`No sensor records found for ${patientName}`);
        return;
      }
      
      const loadedFiles: Array<{
        filePath: string;
        fileName: string;
        session: string;
        content: string;
        analysis: any;
        multiData: any;
        completeData: any;
      }> = [];
      
      // Try to load EACH sensor record
      for (const record of patientSensorRecords) {
        let sensorFileName = record.sensorRecords.trim();
        console.log(`Attempting to load sensor record: ${sensorFileName} for session ${record.session}`);
        
        // Try different filename patterns
        const filenamePatterns = [
          sensorFileName,
          `${sensorFileName}.txt`,
          `${sensorFileName}.microhub.txt`,
          `${sensorFileName}.MicroHub.txt`,
        ];
        
        let fileLoaded = false;
        
        for (const pattern of filenamePatterns) {
          const filePath = `/records-one-folder/raw/${pattern}`;
          
          try {
            console.log(`Trying to load: ${filePath}`);
            const response = await fetch(filePath);
            
            if (response.ok) {
              const content = await response.text();
              
              // Check if this is actual sensor data
              if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
                continue;
              }
              
              console.log(`✅ Successfully loaded: ${pattern}`);
              
              try {
                // Analyze the file
                const analysis = HeaderParser.analyzeFileStructure(content);
                const multiData = EnhancedGaitParser.extractMultiIMUData(content, []);
                const completeData = parseCompleteFile(content);
                
                loadedFiles.push({
                  filePath,
                  fileName: pattern,
                  session: record.session,
                  content,
                  analysis,
                  multiData,
                  completeData,
                });
                
                console.log(`✅ Added ${pattern} to loaded files list`);
                fileLoaded = true;
                break; // Stop trying other patterns for this file
                
              } catch (parseError) {
                console.warn(`Failed to parse ${pattern}:`, parseError);
                // Still add the file even if parse fails
                loadedFiles.push({
                  filePath,
                  fileName: pattern,
                  session: record.session,
                  content,
                  analysis: null,
                  multiData: null,
                  completeData: null,
                });
                fileLoaded = true;
                break;
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch ${pattern}:`, error);
            continue;
          }
        }
        
        if (!fileLoaded) {
          console.warn(`Could not load any version of ${sensorFileName}`);
        }
      }
      
      if (loadedFiles.length === 0) {
        setFilterStatus('Could not load any sensor files');
        return;
      }
      
      // Set the loaded files
      setPatientSensorFiles(loadedFiles);
      setCurrentFileIndex(0);
      
      // Set the first file as active
      if (loadedFiles.length > 0) {
        await setActiveFile(0, loadedFiles, patientName);
      }
      
    } catch (error) {
      console.error('Error in loadAllSensorFilesForPatient:', error);
      setFilterStatus('Error loading sensor data');
    }
  };

  const parseCompleteFile = (content: string) => {
  try {
    return AdvancedHeaderParser.parseFileContent(content);
  } catch (error) {
    console.error('Error in complete parsing:', error);
    
    // Fallback: parse manually while properly stopping at #16
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const result = {
      imus: {} as Record<string, any>,
      gaitParameters: {} as Record<string, number[]>,
      timestamps: [] as number[],
      metadata: {
        columnCount: 0,
        totalRows: 0,
        sampleRate: 100,
        sensorIds: [] as string[],
        hasGaitParameters: false,
      }
    };
    
    // Find where #16 is
    let dataEndLine = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('#16')) {
        dataEndLine = i;
        console.log(`Found #16 at line ${i} - data ends here`);
        break;
      }
    }
    
    // Find data start (skip #5, #103, etc.)
    let dataStartLine = 2;
    for (let i = 2; i < dataEndLine; i++) {
      if (!lines[i].startsWith('#') && lines[i].trim() !== '') {
        dataStartLine = i;
        break;
      }
    }
    
    console.log(`Parsing data from line ${dataStartLine} to ${dataEndLine - 1}`);
    
    // Initialize IMUs based on header analysis
    // Based on your file format, there should be IMU0 and IMU1
    result.imus['IMU0'] = {
      acceleration: { x: [], y: [], z: [] },
      gyroscope: { x: [], y: [], z: [] },
    };
    
    result.imus['IMU1'] = {
      acceleration: { x: [], y: [], z: [] },
      gyroscope: { x: [], y: [], z: [] },
    };
    
    // Parse only lines between dataStartLine and dataEndLine
    for (let i = dataStartLine; i < dataEndLine; i++) {
      const line = lines[i];
      if (line.startsWith('#') || line.trim() === '') continue;
      
      const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
      
      if (values.length >= 13) { // timestamp + 12 sensor values
        result.timestamps.push(values[0]);
        
        // Parse according to the column layout:
        // Column layout analysis (from your data format):
        // 0: timestamp
        // 1-3: IMU1 Acceleration X,Y,Z
        // 4-6: IMU1 Gyroscope X,Y,Z
        // 7-9: IMU0 Acceleration X,Y,Z
        // 10-12: IMU0 Gyroscope X,Y,Z
        
        // IMU1 Acceleration
        if (values[1] !== undefined) result.imus['IMU1'].acceleration.x.push(values[1]);
        if (values[2] !== undefined) result.imus['IMU1'].acceleration.y.push(values[2]);
        if (values[3] !== undefined) result.imus['IMU1'].acceleration.z.push(values[3]);
        
        // IMU1 Gyroscope
        if (values[4] !== undefined) result.imus['IMU1'].gyroscope.x.push(values[4]);
        if (values[5] !== undefined) result.imus['IMU1'].gyroscope.y.push(values[5]);
        if (values[6] !== undefined) result.imus['IMU1'].gyroscope.z.push(values[6]);
        
        // IMU0 Acceleration
        if (values[7] !== undefined) result.imus['IMU0'].acceleration.x.push(values[7]);
        if (values[8] !== undefined) result.imus['IMU0'].acceleration.y.push(values[8]);
        if (values[9] !== undefined) result.imus['IMU0'].acceleration.z.push(values[9]);
        
        // IMU0 Gyroscope
        if (values[10] !== undefined) result.imus['IMU0'].gyroscope.x.push(values[10]);
        if (values[11] !== undefined) result.imus['IMU0'].gyroscope.y.push(values[11]);
        if (values[12] !== undefined) result.imus['IMU0'].gyroscope.z.push(values[12]);
      }
    }
    
    result.metadata.totalRows = result.timestamps.length;
    result.metadata.sensorIds = Object.keys(result.imus);
    result.metadata.columnCount = 13; // timestamp + 12 sensor values
    
    console.log('Fallback parsing results:', {
      timestamps: result.timestamps.length,
      IMU0: {
        acc: result.imus['IMU0']?.acceleration?.x?.length || 0,
        gyro: result.imus['IMU0']?.gyroscope?.x?.length || 0,
      },
      IMU1: {
        acc: result.imus['IMU1']?.acceleration?.x?.length || 0,
        gyro: result.imus['IMU1']?.gyroscope?.x?.length || 0,
      },
      firstTimestamps: result.timestamps.slice(0, 3),
    });
    
    return result;
  }
};

  const setActiveFile = async (index: number, files = patientSensorFiles, patientName = selectedPatient) => {
    if (index < 0 || index >= files.length || !patientName) return;
    
    const file = files[index];
    setCurrentFileIndex(index);
    setSelectedFilePath(file.filePath);
    setSelectedFileName(file.fileName);
    
    if (file.completeData) {
      setCompleteSensorData(file.completeData);
      setMultiSensorData({
        timestamps: file.completeData.timestamps,
        imus: file.completeData.imus,
      });
      
      // Build available sensors list from complete data
      const sensors: any[] = [];
      Object.keys(file.completeData.imus || {}).forEach(imuKey => {
        const imuId = imuKey.replace('IMU', '');
        
        // Add acceleration sensors
        ['x', 'y', 'z'].forEach(axis => {
          sensors.push({
            id: `acceleration_${imuId}_${axis}`,
            name: `Acceleration ${axis.toUpperCase()} (${imuKey})`,
            type: 'acceleration',
            sensorId: imuId,
            axis: axis as 'x' | 'y' | 'z',
          });
        });
        
        // Add gyroscope sensors
        ['x', 'y', 'z'].forEach(axis => {
          sensors.push({
            id: `gyroscope_${imuId}_${axis}`,
            name: `Gyroscope ${axis.toUpperCase()} (${imuKey})`,
            type: 'gyroscope',
            sensorId: imuId,
            axis: axis as 'x' | 'y' | 'z',
          });
        });
      });
      
      setAvailableSensors(sensors);
      setSelectedSensors(sensors.map(s => s.id));
      
      console.log(`Loaded ${sensors.length} sensors from complete data`);
    } else if (file.multiData) {
      setMultiSensorData(file.multiData);
      
      // Build sensors list from multiData
      const sensors: any[] = [];
      Object.keys(file.multiData.imus || {}).forEach(imuKey => {
        const imuId = imuKey.replace('IMU', '');
        
        ['x', 'y', 'z'].forEach(axis => {
          sensors.push({
            id: `acceleration_${imuId}_${axis}`,
            name: `Acceleration ${axis.toUpperCase()} (${imuKey})`,
            type: 'acceleration',
            sensorId: imuId,
            axis: axis as 'x' | 'y' | 'z',
          });
        });
        
        ['x', 'y', 'z'].forEach(axis => {
          sensors.push({
            id: `gyroscope_${imuId}_${axis}`,
            name: `Gyroscope ${axis.toUpperCase()} (${imuKey})`,
            type: 'gyroscope',
            sensorId: imuId,
            axis: axis as 'x' | 'y' | 'z',
          });
        });
      });
      
      setAvailableSensors(sensors);
      setSelectedSensors(sensors.map(s => s.id));
    }
    
    // Load for gait analysis
    if (file.content) {
      await loadSensorFile(file.content, patientName, file.session);
    }
    
    const rowCount = file.completeData?.metadata?.totalRows || file.multiData?.timestamps?.length || 0;
    const imuCount = file.completeData ? Object.keys(file.completeData.imus || {}).length : 
                     file.multiData ? Object.keys(file.multiData.imus || {}).length : 0;
    
    setFilterStatus(`Loaded ${file.fileName} (${file.session}) - ${imuCount} IMUs, ${rowCount} data points`);
  };

  const handleSelectFile = async (index: number) => {
    await setActiveFile(index);
  };

  const handleFileSelect = async (filePath: string, fileName: string) => {
    if (!selectedPatient) return;
    
    try {
      const response = await fetch(filePath);
      if (response.ok) {
        const content = await response.text();
        
        const session = patientRecords.find(r => 
          r.sensorRecords?.includes(fileName.replace('.MicroHub.txt', '').replace('.txt', ''))
        )?.session || 'default-session';
        
        // Create a new file entry
        try {
          const analysis = HeaderParser.analyzeFileStructure(content);
          const multiData = EnhancedGaitParser.extractMultiIMUData(content, []);
          const completeData = parseCompleteFile(content);
          
          const newFile = {
            filePath,
            fileName,
            session,
            content,
            analysis,
            multiData,
            completeData,
          };
          
          // Check if file already exists in the list
          const existingIndex = patientSensorFiles.findIndex(f => f.filePath === filePath);
          
          if (existingIndex >= 0) {
            // Switch to existing file
            await setActiveFile(existingIndex);
          } else {
            // Add new file to the list
            const updatedFiles = [...patientSensorFiles, newFile];
            setPatientSensorFiles(updatedFiles);
            await setActiveFile(updatedFiles.length - 1, updatedFiles, selectedPatient);
          }
          
        } catch (parseError) {
          console.error('Failed to parse file:', parseError);
          setFilterStatus(`File loaded but parse failed: ${parseError.message}`);
        }
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setFilterStatus(`Error loading file: ${error.message}`);
    }
  };

  const handleSensorFilterChange = (sensors: string[]) => {
    console.log('Sensor filter changed to:', sensors);
    setSelectedSensors(sensors);
    
    if (selectedFilePath && (multiSensorData || completeSensorData)) {
      setFilterStatus(`Showing ${sensors.length} of ${availableSensors.length} sensors`);
    }
  };

  const tabs = [
    { name: 'Complete Data', icon: '📊', color: 'from-blue-500 to-cyan-500' },
    { name: 'Records Data', icon: '📡', color: 'from-purple-500 to-pink-500' },
    { name: 'Gait Analysis', icon: '🚶', color: 'from-emerald-500 to-green-500' },
    { name: 'Range of Motion', icon: '🦵', color: 'from-orange-500 to-red-500' },
    { name: 'Step Analysis', icon: '👣', color: 'from-yellow-500 to-amber-500' },
    { name: 'File View', icon: '📄', color: 'from-gray-500 to-gray-600' },
    { name: 'Results View', icon: '📈', color: 'from-indigo-500 to-violet-500' }, 
  ];

  const getCurrentFileInfo = () => {
    if (patientSensorFiles.length === 0 || currentFileIndex >= patientSensorFiles.length) {
      return null;
    }
    return patientSensorFiles[currentFileIndex];
  };

  const renderIMUCharts = () => {
  console.log('🔍 DEBUG - renderIMUCharts called');
  
  if (!multiSensorData || !multiSensorData.imus || Object.keys(multiSensorData.imus).length === 0) {
    console.log('❌ No multiSensorData or no IMUs');
    return (
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/30 shadow-xl flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Sensor Data Available</h3>
          <p className="text-gray-400">Sensor data could not be loaded or parsed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.keys(multiSensorData.imus).map((imuKey) => {
        const imu = multiSensorData.imus[imuKey];
        if (!imu) return null;
        
        // Use ALL data without limits
        const accelX = imu.acceleration?.x || [];
        const accelY = imu.acceleration?.y || [];
        const accelZ = imu.acceleration?.z || [];
        const gyroX = imu.gyroscope?.x || [];
        const gyroY = imu.gyroscope?.y || [];
        const gyroZ = imu.gyroscope?.z || [];
        const timestamps = multiSensorData.timestamps || [];
        
        const hasAccelData = accelX.length > 0 || accelY.length > 0 || accelZ.length > 0;
        const hasGyroData = gyroX.length > 0 || gyroY.length > 0 || gyroZ.length > 0;
        
        if (!hasAccelData && !hasGyroData) {
          return null;
        }
        
        const totalPoints = timestamps.length;
        
        return (
          <div key={imuKey} className="space-y-6">
            {/* IMU Header */}
            <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-2xl">📡</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{imuKey}</h3>
                    <p className="text-sm text-gray-400">
                      {totalPoints.toLocaleString()} data points (Full Dataset)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{totalPoints.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">all points displayed</div>
                </div>
              </div>
            </div>
            
            {/* Vertical Stack of Charts */}
            <div className="space-y-8">
              {/* Acceleration Chart - using uPlot */}
              {hasAccelData && timestamps.length > 0 && (
                <IMUAccelerationChart
                  timestamps={timestamps}
                  xData={accelX}
                  yData={accelY}
                  zData={accelZ}
                  title={`${imuKey} - Acceleration`}
                  height={500}
                />
              )}
              
              {/* Gyroscope Chart - using uPlot */}
              {hasGyroData && timestamps.length > 0 && (
                <IMUGyroscopeChart
                  timestamps={timestamps}
                  xData={gyroX}
                  yData={gyroY}
                  zData={gyroZ}
                  title={`${imuKey} - Gyroscope`}
                  height={500}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100 flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 01118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Gait Analysis Pro
            </h1>
            <p className="text-xs text-gray-400">Advanced Biomechanical Analysis System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {selectedPatient && (
            <div className="hidden md:flex items-center space-x-3">
              <div className="bg-gray-700/30 px-4 py-2 rounded-lg border border-gray-600/50">
                <div className="text-xs text-gray-400">Current Patient</div>
                <div className="font-medium text-white">{selectedPatient}</div>
              </div>
              {availableSensors.length > 0 && (
                <div className="bg-gray-700/30 px-4 py-2 rounded-lg border border-gray-600/50">
                  <div className="text-xs text-gray-400">Active Sensors</div>
                  <div className="font-medium text-white">
                    {selectedSensors.length}/{availableSensors.length}
                  </div>
                </div>
              )}
              {patientSensorFiles.length > 0 && (
                <div className="bg-gray-700/30 px-4 py-2 rounded-lg border border-gray-600/50">
                  <div className="text-xs text-gray-400">Files</div>
                  <div className="font-medium text-white">
                    {patientSensorFiles.length}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="text-sm text-gray-400 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-5.197v-1a6 6 0 00-9-5.197M9 21v-1a6 6 0 0112 0v1" />
            </svg>
            <span>{patients.length} patients • {records.length} records</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Patient List */}
        <div className="w-80 bg-gray-800/20 backdrop-blur-lg border-r border-gray-700/30 flex flex-col">
          <div className="p-5 border-b border-gray-700/30">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-5.197v-1a6 6 0 00-9-5.197M9 21v-1a6 6 0 0112 0v1" />
              </svg>
              Patient Records
            </h2>
            <p className="text-sm text-gray-500 mt-1">Select a patient to analyze gait patterns</p>
          </div>
          
          {loadingExcel ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-sm text-gray-400">Loading patient database...</p>
                <p className="text-xs text-gray-500 mt-2">From Patient-Records.xlsx</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <PatientList
                  patients={patients}
                  records={records}
                  onSelectPatient={handlePatientSelect}
                  selectedPatient={selectedPatient}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Visualizations */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-900/50 to-black/50">
          {selectedPatient ? (
            <div className="p-6">
              {/* Patient Header Card */}
              <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-gray-700/30 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mr-4 border border-blue-500/30">
                        <span className="text-2xl">
                          {patientRecords[0]?.gender === 'M' ? '👨‍⚕️' : 
                           patientRecords[0]?.gender === 'F' ? '👩‍⚕️' : '👤'}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-1">{selectedPatient}</h2>
                        <div className="flex items-center">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                            patientRecords[0]?.participantHealth === 'healthy' 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : patientRecords[0]?.participantHealth === 'healthy*'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {patientRecords[0]?.participantHealth}
                          </span>
                          <span className="ml-3 text-gray-400">
                            {patientRecords[0]?.gender} • {patientRecords.length} record{patientRecords.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Current File Info */}
                    {getCurrentFileInfo() && (
                      <div className="mt-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-blue-300">Currently Viewing</div>
                            <div className="font-medium text-white">{getCurrentFileInfo()?.fileName}</div>
                            <div className="text-xs text-gray-400">
                              Session: {getCurrentFileInfo()?.session} • 
                              Files: {patientSensorFiles.length}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Status</div>
                            <div className="font-medium text-green-400">
                              {filterStatus}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                        <div className="text-sm text-gray-400">Files Loaded</div>
                        <div className="text-2xl font-bold text-white">{patientSensorFiles.length}</div>
                      </div>
                      <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                        <div className="text-sm text-gray-400">Active Sensors</div>
                        <div className="text-2xl font-bold text-white">
                          {selectedSensors.length}/{availableSensors.length}
                        </div>
                      </div>
                      <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                        <div className="text-sm text-gray-400">Data Points</div>
                        <div className="text-2xl font-bold text-white">
                          {completeSensorData?.timestamps?.length?.toLocaleString() || 
                           multiSensorData?.timestamps?.length?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/30">
                        <div className="text-sm text-gray-400">IMUs Detected</div>
                        <div className="text-2xl font-bold text-white">
                          {completeSensorData ? Object.keys(completeSensorData.imus || {}).length : 
                           multiSensorData ? Object.keys(multiSensorData.imus || {}).length : '0'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                <Tab.List className="flex flex-wrap space-x-2 mb-8 bg-gray-800/30 backdrop-blur-lg rounded-2xl p-1 border border-gray-700/30">
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        `flex-1 min-w-[140px] px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 flex items-center justify-center ${
                          selected
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-lg border border-gray-700/50`
                            : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                        }`
                      }
                    >
                      <span className="mr-2 text-lg">{tab.icon}</span>
                      {tab.name}
                    </Tab>
                  ))}
                </Tab.List>

                <Tab.Panels>
                  {/* Tab 1: Complete Data */}
                  <Tab.Panel>
                    <div className="space-y-8">
                      {/* Multi-File Navigator */}
                      {patientSensorFiles.length > 1 && (
                        <MultiFileNavigator
                          files={patientSensorFiles.map(f => ({
                            fileName: f.fileName,
                            session: f.session,
                          }))}
                          currentIndex={currentFileIndex}
                          onSelectFile={handleSelectFile}
                        />
                      )}
                      
                      {/* Complete Data Analysis */}
                      {completeSensorData && (
                        <CompleteDataViewer 
                          data={completeSensorData} 
                          title={`Complete Analysis - ${getCurrentFileInfo()?.fileName}`}
                        />
                      )}
                      
                      {!completeSensorData && (
                        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/30 shadow-xl flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">No Complete Data Available</h3>
                            <p className="text-gray-400">Could not parse complete data from this file format</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab.Panel>

                  {/* Tab 2: Sensor Data */}
                  <Tab.Panel>
                    <div className="space-y-8">
                      {/* Multi-File Navigator */}
                      {patientSensorFiles.length > 1 && (
                        <MultiFileNavigator
                          files={patientSensorFiles.map(f => ({
                            fileName: f.fileName,
                            session: f.session,
                          }))}
                          currentIndex={currentFileIndex}
                          onSelectFile={handleSelectFile}
                        />
                      )}
                      
                      {/* Current File Banner */}
                      {getCurrentFileInfo() && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="bg-blue-500/20 w-10 h-10 rounded-xl flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">{getCurrentFileInfo()?.fileName}</h3>
                                <p className="text-sm text-gray-400">
                                  Session: {getCurrentFileInfo()?.session} • 
                                  File {currentFileIndex + 1} of {patientSensorFiles.length}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">IMUs Detected</div>
                              <div className="text-2xl font-bold text-white">
                                {multiSensorData ? Object.keys(multiSensorData.imus || {}).length : '0'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Individual IMU Plots */}
                      {multiSensorData ? (
                        renderIMUCharts()
                      ) : (
                        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/30 shadow-xl flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-16 h-16 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">No Sensor Data Loaded</h3>
                            <p className="text-gray-400">Select a sensor file to visualize data</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab.Panel>

                  {/* Tab 3: Gait Analysis */}
                  <Tab.Panel>
                    {currentAnalysis ? (
                      <GaitPhasePlot analysis={currentAnalysis} />
                    ) : (
                      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/30 shadow-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
                          <h3 className="text-xl font-semibold text-white mb-2">Analyzing Gait Patterns</h3>
                          <p className="text-gray-400">Load sensor data to extract gait parameters...</p>
                        </div>
                      </div>
                    )}
                  </Tab.Panel>

                  {/* Tab 4: Range of Motion */}
                  <Tab.Panel>
                    {currentAnalysis ? (
                      <RangeOfMotion analysis={currentAnalysis} />
                    ) : (
                      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/30 shadow-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6"></div>
                          <h3 className="text-xl font-semibold text-white mb-2">Calculating Range of Motion</h3>
                          <p className="text-gray-400">Load sensor data to analyze joint angles...</p>
                        </div>
                      </div>
                    )}
                  </Tab.Panel>

                  {/* Tab 5: Step Analysis */}
                  <Tab.Panel>
                    {currentAnalysis && currentRecording ? (
                      <StepAnalysis analysis={currentAnalysis} sensorData={currentRecording.data} />
                    ) : (
                      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-12 border border-gray-700/30 shadow-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-6"></div>
                          <h3 className="text-xl font-semibold text-white mb-2">Analyzing Step Patterns</h3>
                          <p className="text-gray-400">Load sensor data to detect steps and calculate gait metrics...</p>
                        </div>
                      </div>
                    )}
                  </Tab.Panel>

                  {/* Tab 6: File View */}
                  <Tab.Panel>
                    <div className="space-y-8">
                      {/* Multi-File Navigator */}
                      {patientSensorFiles.length > 1 && (
                        <MultiFileNavigator
                          files={patientSensorFiles.map(f => ({
                            fileName: f.fileName,
                            session: f.session,
                          }))}
                          currentIndex={currentFileIndex}
                          onSelectFile={handleSelectFile}
                        />
                      )}
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl h-full">
                            <h3 className="text-xl font-semibold text-white mb-4">File Explorer</h3>
                            <FileTree
                              onFileSelect={handleFileSelect}
                              patientId={selectedPatient}
                            />
                          </div>
                        </div>
                        
                        <div className="lg:col-span-2">
                          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl h-full">
                            <EnhancedDataFileViewer
                              filePath={selectedFilePath}
                              fileContent={getCurrentFileInfo()?.content}
                              patientId={selectedPatient}
                              sessionId={getCurrentFileInfo()?.session}
                              fileName={selectedFileName}
                              fileAnalysis={getCurrentFileInfo()?.analysis}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                  {/* Tab 7: Results View */}
<Tab.Panel>
  <div className="space-y-8">
    <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30 shadow-xl">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-r from-indigo-500/20 to-violet-500/20 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
          <span className="text-2xl">📈</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Gait Analysis Results</h3>
          <p className="text-gray-400">
            Yaw, Roll, and Pitch analysis from processed gait data
          </p>
        </div>
      </div>
      
      <ResultsView
        patientName={selectedPatient}
        records={records}
      />
    </div>
  </div>
</Tab.Panel>
                </Tab.Panels>
              </Tab.Group>

              {/* Abnormalities Alert */}
              {abnormalities.length > 0 && (
                <div className="mt-8 bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-lg border border-red-500/30 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-500/20 w-10 h-10 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-300">Potential Abnormalities Detected</h4>
                      <p className="text-sm text-red-400/70">Review these findings for clinical consideration</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {abnormalities.map((abnormality, index) => (
                      <div key={index} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          <span className="text-red-200">{abnormality}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Welcome/Empty State
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-2xl">
                <div className="mb-10">
                  <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-24 h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 01118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Gait Analysis Pro
                  </h3>
                  <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                    Advanced biomechanical analysis platform for clinical gait assessment and rehabilitation monitoring.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/30 shadow-xl">
                    <div className="text-4xl font-bold text-blue-400 mb-3">{patients.length}</div>
                    <div className="text-lg font-semibold text-white mb-2">Patients</div>
                    <div className="text-sm text-gray-400">In database</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/30 shadow-xl">
                    <div className="text-4xl font-bold text-green-400 mb-3">{records.length}</div>
                    <div className="text-lg font-semibold text-white mb-2">Records</div>
                    <div className="text-sm text-gray-400">Available</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg p-6 rounded-2xl border border-gray-700/30 shadow-xl">
                    <div className="text-4xl font-bold text-purple-400 mb-3">
                      {records.filter(r => r.participantHealth === 'healthy' || r.participantHealth === 'healthy*').length}
                    </div>
                    <div className="text-lg font-semibold text-white mb-2">Healthy</div>
                    <div className="text-sm text-gray-400">Subjects</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/30">
                  <p className="text-gray-300 mb-4">👈 Select a patient from the sidebar to begin analysis</p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span>Healthy</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span>Healthy*</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span>Patient</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Sensor Filter */}
        <div className="w-80 bg-gray-800/20 backdrop-blur-lg border-l border-gray-700/30">
          <SensorFilter
            selectedSensors={selectedSensors}
            onSensorFilterChange={handleSensorFilterChange}
            abnormalities={abnormalities}
            availableSensors={availableSensors}
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        patientCount={patients.length}
        sessionCount={records.length}
        loading={medicalLoading || sensorLoading || analysisLoading || loadingExcel}
        errors={[medicalError, sensorError, analysisError].filter(Boolean) as string[]}
      />
    </div>
  );
}

// Helper function to generate sample data if Excel file not found
function getSampleExcelData(): ExcelData {
  return [
    ['sensor records', 'video records', 'session', 'record date', 'participant name', 'participant health', 'n° medical record', 'birth date', 'age', 'gender', 'test type', 'test place', 'Footwear', 'Lower body clothing', 'Assistive device', 'preliminary detected double', 'comments'],
    ['patient_1_1', '(lost)', 'session-1', '2025-08-02 00:00:00', 'Wissal Raissi', 'patient', 'APC25', '', '', 'F', '6m', 'praxis', '', '', '', '', 'video lost, sensors 1 and 2 have failed'],
    ['patient_1_2', 'patient_1_2.mp4', 'session-1', '2025-08-02 00:00:00', 'Wissal Raissi', 'patient', 'APC25', '', '', 'F', '6m', 'praxis', '', '', '', '', ''],
    ['patient_2_1', 'patient_2_1.mp4', 'session-2', '2025-08-12 00:00:00', 'Mohamed ali Rezgui', 'patient', 'APC25', '', '', 'M', '6m', 'praxis', '', '', '', '', ''],
    ['gait.250918115028', 'gait.250918115028.mp4', 'session-3 (pilot kassab)', '2025-09-18 00:00:00', 'Yamina Ben Marzouk', 'patient', '00207193', '11/04/1955', '', 'F', '10m', 'hospital', '', '', '', '', ''],
    ['gait.250918115755', 'gait.250918115755.mp4', 'session-3 (pilot kassab)', '2025-09-18 00:00:00', 'Najiba Thayari', 'patient', '31440/08', '', '', 'M', '10m', 'hospital', '', '', '', '', ''],
  ];
}

export default App;