import { HeaderParser, SensorColumn, FileHeader } from './headerParser';
import { SensorHeader, SensorDataPoint, SensorRecording } from '../types/sensor.types';
import { MultiSensorData } from '../types/sensor.types';
import { AdvancedHeaderParser } from './advancedHeaderParser';

export class EnhancedGaitParser {
  static parseSensorFile(
    content: string, 
    patientId: string, 
    sessionId: string
  ): SensorRecording {
    console.log('Starting enhanced parsing...');
    
    // First, analyze the file structure
    const analysis = HeaderParser.analyzeFileStructure(content);
    
    console.log('File analysis:', {
      columnCount: analysis.columns.length,
      columns: analysis.columns,
      sampleDataLength: analysis.sampleData.length,
    });
    
    // Parse all data lines
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const dataPoints: SensorDataPoint[] = [];
    
    for (let i = analysis.dataStartLine; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#') || line.trim() === '') continue;
      
      const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
      
      if (values.length >= analysis.columns.length) {
        const dataPoint = this.createDataPoint(values, analysis.columns);
        dataPoints.push(dataPoint);
      }
    }
    
    console.log(`Parsed ${dataPoints.length} data points`);
    
    // Convert to SensorHeader format
    const sensorHeader = this.convertToSensorHeader(analysis.header, dataPoints.length);
    
    // Create the recording without metadata for now (or cast it)
    const recording: SensorRecording = {
      header: sensorHeader,
      data: dataPoints,
      patientId,
      sessionId,
      recordingDate: analysis.header.timestamp,
    };
    
    // Add metadata as a non-enumerable property if needed
    Object.defineProperty(recording, 'metadata', {
      value: {
        originalHeader: analysis.header,
        columnDefinitions: analysis.columns,
      },
      enumerable: false,
      writable: true,
      configurable: true,
    });
    
    return recording;
  }

  static parseCompleteFile(content: string) {
  try {
    console.log('🎯 Starting complete file parsing');
    
    const result = AdvancedHeaderParser.parseFileContent(content);
    
    console.log('✅ Complete parsing successful:', {
      imus: Object.keys(result.imus),
      timestamps: result.timestamps.length,
      gaitParameters: Object.keys(result.gaitParameters),
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Complete parsing failed:', error);
    
    // Fallback to simple parsing
    return this.extractMultiIMUData(content, []);
  }
}
  
 static extractFilteredSensorData(
  content: string,
  selectedSensorIds: string[]
): {
  acceleration: { x: number[]; y: number[]; z: number[] };
  gyroscope: { x: number[]; y: number[]; z: number[] };
  timestamps: number[];
  availableSensors: Array<{type: string, id: string, axis: string}>;
} {
  console.log('🎯 Starting extractFilteredSensorData');
  console.log('Selected sensor IDs:', selectedSensorIds);
  
  try {
    const analysis = HeaderParser.analyzeFileStructure(content);
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    console.log('File analysis:', {
      columnCount: analysis.columns.length,
      columns: analysis.columns.map(c => ({
        name: c.name,
        type: c.type,
        sensorId: c.sensorId,
        axis: c.axis,
        index: c.index
      }))
    });
    
    const result = {
      acceleration: { x: [] as number[], y: [] as number[], z: [] as number[] },
      gyroscope: { x: [] as number[], y: [] as number[], z: [] as number[] },
      timestamps: [] as number[],
      availableSensors: [] as Array<{type: string, id: string, axis: string}>,
    };
    
    // First, identify all available sensors from columns
    console.log('Analyzing columns for sensors...');
    analysis.columns.forEach((column, idx) => {
      if (column.type === 'acceleration' || column.type === 'gyroscope') {
        const sensorKey = `${column.type}_${column.sensorId || '0'}_${column.axis || 'x'}`;
        console.log(`Column ${idx}: ${column.name} -> ${sensorKey}`);
        
        // Add to available sensors
        result.availableSensors.push({
          type: column.type,
          id: column.sensorId || '0',
          axis: column.axis || 'x',
        });
      }
    });
    
    console.log('Available sensors found:', result.availableSensors.length);
    console.log('Available sensors:', result.availableSensors);
    
    // Parse selected sensors
    const selectedSensors = selectedSensorIds.map(id => {
      const parts = id.split('_');
      return {
        type: parts[0] as 'acceleration' | 'gyroscope',
        sensorId: parts[1],
        axis: parts[2] as 'x' | 'y' | 'z',
      };
    });
    
    console.log('Parsed selected sensors:', selectedSensors);
    
    // Parse data lines (limit to first 500 for performance)
    let lineCount = 0;
    
    for (let i = analysis.dataStartLine; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#') || line.trim() === '') continue;
      
      const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
      
      // Extract timestamp (first column should be timestamp)
      if (values.length > 0) {
        result.timestamps.push(values[0]);
      }
      
      // Map values to columns based on analysis
      for (let j = 0; j < Math.min(values.length, analysis.columns.length); j++) {
        const column = analysis.columns[j];
        const value = values[j];
        
        if (column.type === 'timestamp') {
          // Already handled as timestamp
        } else if (column.type === 'acceleration' || column.type === 'gyroscope') {
          // Check if this sensor is selected
          const isSelected = selectedSensors.some(s => 
            s.type === column.type && 
            s.sensorId === (column.sensorId || '0') && 
            s.axis === (column.axis || 'x')
          );
          
          // Also select if no sensors are selected (show all by default)
          if (isSelected || selectedSensorIds.length === 0) {
            if (column.type === 'acceleration') {
              if (column.axis === 'x') result.acceleration.x.push(value);
              if (column.axis === 'y') result.acceleration.y.push(value);
              if (column.axis === 'z') result.acceleration.z.push(value);
            } else if (column.type === 'gyroscope') {
              if (column.axis === 'x') result.gyroscope.x.push(value);
              if (column.axis === 'y') result.gyroscope.y.push(value);
              if (column.axis === 'z') result.gyroscope.z.push(value);
            }
          }
        }
      }
      
      lineCount++;
    }
    
    console.log('Data extraction complete:', {
      linesProcessed: lineCount,
      timestamps: result.timestamps.length,
      acceleration: {
        x: result.acceleration.x.length,
        y: result.acceleration.y.length,
        z: result.acceleration.z.length,
      },
      gyroscope: {
        x: result.gyroscope.x.length,
        y: result.gyroscope.y.length,
        z: result.gyroscope.z.length,
      },
    });
    
    return result;
    
  } catch (error) {
    console.error('Error in extractFilteredSensorData:', error);
    // Return empty result
    return {
      acceleration: { x: [], y: [], z: [] },
      gyroscope: { x: [], y: [], z: [] },
      timestamps: [],
      availableSensors: [],
    };
  }
}

static filterSensorData(
  data: SensorDataPoint[],
  selectedSensorIds: string[]
): {
  acceleration: { x: number[]; y: number[]; z: number[] };
  gyroscope: { x: number[]; y: number[]; z: number[] };
  timestamps: number[];
} {
  const result = {
    acceleration: { x: [] as number[], y: [] as number[], z: [] as number[] },
    gyroscope: { x: [] as number[], y: [] as number[], z: [] as number[] },
    timestamps: [] as number[],
  };

  // Limit to first 500 points for performance
  const limit = Math.min(500, data.length);
  
  for (let i = 0; i < limit; i++) {
    const point = data[i];
    result.timestamps.push(point.timestamp);
    
    // Check which sensors are selected
    const hasAccelX = selectedSensorIds.includes('acceleration_0_x');
    const hasAccelY = selectedSensorIds.includes('acceleration_0_y');
    const hasAccelZ = selectedSensorIds.includes('acceleration_0_z');
    const hasGyroX = selectedSensorIds.includes('gyroscope_0_x');
    const hasGyroY = selectedSensorIds.includes('gyroscope_0_y');
    const hasGyroZ = selectedSensorIds.includes('gyroscope_0_z');
    
    // Add data for selected sensors
    if (hasAccelX) result.acceleration.x.push(point.acceleration.x);
    if (hasAccelY) result.acceleration.y.push(point.acceleration.y);
    if (hasAccelZ) result.acceleration.z.push(point.acceleration.z);
    if (hasGyroX) result.gyroscope.x.push(point.gyroscope.x);
    if (hasGyroY) result.gyroscope.y.push(point.gyroscope.y);
    if (hasGyroZ) result.gyroscope.z.push(point.gyroscope.z);
  }
  
  console.log('Filtered data:', {
    points: result.timestamps.length,
    accelX: result.acceleration.x.length,
    accelY: result.acceleration.y.length,
    accelZ: result.acceleration.z.length,
    gyroX: result.gyroscope.x.length,
    gyroY: result.gyroscope.y.length,
    gyroZ: result.gyroscope.z.length,
  });
  
  return result;
}

static extractMultiIMUData(
  content: string,
  selectedSensorIds: string[]
): MultiSensorData {
  console.log('🎯 Starting extractMultiIMUData');
  
  try {
    const analysis = HeaderParser.analyzeFileStructure(content);
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Initialize data structure
    const result: MultiSensorData = {
      timestamps: [],
      imus: {}
    };
    
    // Group columns by IMU
    analysis.columns.forEach(column => {
      if (column.type === 'acceleration' || column.type === 'gyroscope') {
        const imuId = `IMU${column.sensorId || '0'}`;
        
        if (!result.imus[imuId]) {
          result.imus[imuId] = {
            acceleration: { x: [], y: [], z: [] },
            gyroscope: { x: [], y: [], z: [] }
          };
        }
      }
    });
    
    console.log('IMUs detected:', Object.keys(result.imus));
    
    // Parse data lines
    let lineCount = 0;
    
    for (let i = analysis.dataStartLine; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#') || line.trim() === '') continue;
      
      const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
      
      if (values.length > 0) {
        result.timestamps.push(values[0]);
      }
      
      // Reset IMU data for this timestamp
      Object.keys(result.imus).forEach(imuId => {
        result.imus[imuId].acceleration.x.push(0);
        result.imus[imuId].acceleration.y.push(0);
        result.imus[imuId].acceleration.z.push(0);
        result.imus[imuId].gyroscope.x.push(0);
        result.imus[imuId].gyroscope.y.push(0);
        result.imus[imuId].gyroscope.z.push(0);
      });
      
      // Map values to IMUs
      for (let j = 0; j < Math.min(values.length, analysis.columns.length); j++) {
        const column = analysis.columns[j];
        const value = values[j];
        
        if (column.type === 'acceleration' || column.type === 'gyroscope') {
          const imuId = `IMU${column.sensorId || '0'}`;
          const axis = column.axis || 'x';
          
          if (column.type === 'acceleration') {
            result.imus[imuId].acceleration[axis as 'x' | 'y' | 'z'][lineCount] = value;
          } else if (column.type === 'gyroscope') {
            result.imus[imuId].gyroscope[axis as 'x' | 'y' | 'z'][lineCount] = value;
          }
        }
      }
      
      lineCount++;
    }
    
    // Trim arrays to actual length
    result.timestamps = result.timestamps.slice(0, lineCount);
    
    console.log('Multi-IMU data extracted:', {
      timestamps: result.timestamps.length,
      imus: Object.keys(result.imus),
      sampleData: result.timestamps.slice(0, 3)
    });
    
    return result;
    
  } catch (error) {
    console.error('Error in extractMultiIMUData:', error);
    return {
      timestamps: [],
      imus: {}
    };
  }
}

private static extractDataSimple(
  content: string,
  selectedSensorIds: string[]
): {
  acceleration: { x: number[]; y: number[]; z: number[] };
  gyroscope: { x: number[]; y: number[]; z: number[] };
  timestamps: number[];
  availableSensors: Array<{type: string, id: string, axis: string}>;
} {
  console.log('Using simple data extraction');
  
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const result = {
    acceleration: { x: [] as number[], y: [] as number[], z: [] as number[] },
    gyroscope: { x: [] as number[], y: [] as number[], z: [] as number[] },
    timestamps: [] as number[],
    availableSensors: [] as Array<{type: string, id: string, axis: string}>,
  };
  
  // Based on your file format: timestamp + 12 sensor values (3 accel + 3 gyro) × 2 sensors
  // So columns: 0: timestamp, 1-3: accel1 xyz, 4-6: gyro1 xyz, 7-9: accel0 xyz, 10-12: gyro0 xyz
  
  // Add available sensors
  const sensors = [
    { type: 'acceleration', id: '1', axis: 'x' },
    { type: 'acceleration', id: '1', axis: 'y' },
    { type: 'acceleration', id: '1', axis: 'z' },
    { type: 'gyroscope', id: '1', axis: 'x' },
    { type: 'gyroscope', id: '1', axis: 'y' },
    { type: 'gyroscope', id: '1', axis: 'z' },
    { type: 'acceleration', id: '0', axis: 'x' },
    { type: 'acceleration', id: '0', axis: 'y' },
    { type: 'acceleration', id: '0', axis: 'z' },
    { type: 'gyroscope', id: '0', axis: 'x' },
    { type: 'gyroscope', id: '0', axis: 'y' },
    { type: 'gyroscope', id: '0', axis: 'z' },
  ];
  
  result.availableSensors = sensors;
  
  // Parse selected sensors
  const selectedSensors = selectedSensorIds.map(id => {
    const parts = id.split('_');
    return {
      type: parts[0] as 'acceleration' | 'gyroscope',
      sensorId: parts[1],
      axis: parts[2] as 'x' | 'y' | 'z',
    };
  });
  
  // Parse data
  let lineCount = 0;
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#') || line.trim() === '') continue;
    
    const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
    
    if (values.length >= 13) { // timestamp + 12 sensor values
      result.timestamps.push(values[0]);
      
      // Map values to sensors
      for (let j = 0; j < sensors.length; j++) {
        const sensor = sensors[j];
        const value = values[j + 1]; // +1 to skip timestamp
        
        // Check if this sensor is selected
        const isSelected = selectedSensors.some(s => 
          s.type === sensor.type && 
          s.sensorId === sensor.id && 
          s.axis === sensor.axis
        );
        
        if (isSelected || selectedSensorIds.length === 0) {
          if (sensor.type === 'acceleration') {
            result.acceleration[sensor.axis as 'x' | 'y' | 'z'].push(value);
          } else {
            result.gyroscope[sensor.axis as 'x' | 'y' | 'z'].push(value);
          }
        }
      }
    }
    
    lineCount++;
  }
  
  console.log('Simple extraction results:', {
    lines: lineCount,
    timestamps: result.timestamps.length,
    accelData: Object.keys(result.acceleration).map(k => ({ [k]: result.acceleration[k as 'x'|'y'|'z'].length })),
    gyroData: Object.keys(result.gyroscope).map(k => ({ [k]: result.gyroscope[k as 'x'|'y'|'z'].length })),
  });
  
  return result;
}

  private static createDataPoint(values: number[], columns: SensorColumn[]): SensorDataPoint {
    const dataPoint: SensorDataPoint = {
      timestamp: 0,
      acceleration: { x: 0, y: 0, z: 0 },
      gyroscope: { x: 0, y: 0, z: 0 },
    };
    
    // Map values to columns
    for (let i = 0; i < Math.min(values.length, columns.length); i++) {
      const column = columns[i];
      const value = values[i];
      
      if (column.type === 'timestamp') {
        dataPoint.timestamp = value;
      } else if (column.type === 'acceleration' && column.axis && column.sensorId === '0') {
        // For now, use sensor 0 as primary
        dataPoint.acceleration[column.axis] = value;
      } else if (column.type === 'gyroscope' && column.axis && column.sensorId === '0') {
        dataPoint.gyroscope[column.axis] = value;
      }
    }
    
    return dataPoint;
  }

  private static convertToSensorHeader(header: FileHeader, dataCount: number): SensorHeader {
    // Extract sample rate from data timestamps (if possible)
    let sampleRate = 100; // default
    
    return {
      softwareVersion: header.softwareVersion,
      firmwareVersion: header.firmwareVersion,
      deviceId: header.deviceId,
      sensorTypes: header.sensorTypes,
      sampleRate,
    };
  }

  static extractSensorDataByColumn(
    content: string,
    columnTypes: ('acceleration' | 'gyroscope')[] = ['acceleration', 'gyroscope']
  ): {
    acceleration: { x: number[]; y: number[]; z: number[] };
    gyroscope: { x: number[]; y: number[]; z: number[] };
    timestamps: number[];
  } {
    const analysis = HeaderParser.analyzeFileStructure(content);
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    const result = {
      acceleration: { x: [] as number[], y: [] as number[], z: [] as number[] },
      gyroscope: { x: [] as number[], y: [] as number[], z: [] as number[] },
      timestamps: [] as number[],
    };
    
    for (let i = analysis.dataStartLine; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#') || line.trim() === '') continue;
      
      const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
      
      for (let j = 0; j < Math.min(values.length, analysis.columns.length); j++) {
        const column = analysis.columns[j];
        const value = values[j];
        
        if (column.type === 'timestamp') {
          result.timestamps.push(value);
        } else if (column.type === 'acceleration' && column.axis) {
          if (column.sensorId === '0') {
            result.acceleration[column.axis].push(value);
          }
        } else if (column.type === 'gyroscope' && column.axis) {
          if (column.sensorId === '0') {
            result.gyroscope[column.axis].push(value);
          }
        }
      }
    }
    
    return result;
  }

  static getAvailableSensors(content: string): Array<{
    type: 'acceleration' | 'gyroscope';
    id: string;
    availableAxes: ('x' | 'y' | 'z')[];
  }> {
    const analysis = HeaderParser.analyzeFileStructure(content);
    const sensorMap = new Map<string, Set<string>>();
    
    for (const column of analysis.columns) {
      if (column.type === 'acceleration' || column.type === 'gyroscope') {
        const sensorKey = `${column.type}_${column.sensorId || '0'}`;
        if (!sensorMap.has(sensorKey)) {
          sensorMap.set(sensorKey, new Set());
        }
        if (column.axis) {
          sensorMap.get(sensorKey)!.add(column.axis);
        }
      }
    }
    
    const sensors: Array<{
      type: 'acceleration' | 'gyroscope';
      id: string;
      availableAxes: ('x' | 'y' | 'z')[];
    }> = [];
    
    sensorMap.forEach((axes, key) => {
      const [type, id] = key.split('_');
      sensors.push({
        type: type as 'acceleration' | 'gyroscope',
        id,
        availableAxes: Array.from(axes) as ('x' | 'y' | 'z')[],
      });
    });
    
    return sensors;
  }
}