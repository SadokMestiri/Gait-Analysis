import { SensorHeader, SensorDataPoint, SensorRecording } from '../types/sensor.types';

export class GaitParser {
  static parseSensorFile(content: string, patientId: string, sessionId: string): SensorRecording {
    // Check if content is valid
    if (!content || content.trim().length === 0) {
      throw new Error('Empty file content');
    }
    
    // Check if this is HTML/not a sensor file
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      throw new Error('File appears to be HTML, not sensor data');
    }
    
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 3) {
      // Try to parse anyway with what we have
      console.warn('File has fewer than 3 lines, attempting to parse anyway');
    }
    
    // Parse header from first line if available
    const header = lines.length > 0 ? this.parseHeader(lines[0]) : this.getDefaultHeader();
    
    // Extract recording date from header or use current date
    const recordingDate = lines.length > 0 ? this.extractRecordingDate(lines[0]) : new Date();
    
    // Parse data from remaining lines
    const dataStart = Math.min(2, lines.length - 1);
    const data = this.parseData(lines.slice(dataStart));
    
    return {
      header,
      data,
      patientId,
      sessionId,
      recordingDate,
    };
  }

  private static getDefaultHeader(): SensorHeader {
    return {
      softwareVersion: '1.0.0',
      firmwareVersion: 'V1.0',
      deviceId: 'UNKNOWN',
      sensorTypes: ['Acceleration', 'Gyroscope'],
      sampleRate: 100,
    };
  }

  private static parseHeader(headerLine: string): SensorHeader {
    console.log('Parsing header:', headerLine);
    
    const parts = headerLine.split('_');
    
    // Extract information from the complex header format
    let softwareVersion = '1.35.0';
    let firmwareVersion = 'V4.0.16';
    let deviceId = '0804101CAAC4F4A0586C4FDAF5001902';
    
    try {
      softwareVersion = parts[1] || '1.35.0';
      firmwareVersion = parts[3] || 'V4.0.16';
      deviceId = parts[4] || '0804101CAAC4F4A0586C4FDAF5001902';
    } catch (error) {
      console.warn('Error parsing header parts:', error);
    }
    
    // Parse sensor types from format like (1,3)
    const sensorTypesMatch = headerLine.match(/\(([^)]+)\)/);
    const sensorTypes = sensorTypesMatch 
      ? this.parseSensorTypes(sensorTypesMatch[1])
      : ['Acceleration', 'Gyroscope'];

    // Default sample rate
    const sampleRate = 100;

    return {
      softwareVersion,
      firmwareVersion,
      deviceId,
      sensorTypes,
      sampleRate,
    };
  }

  private static extractRecordingDate(headerLine: string): Date {
    try {
      // Extract timestamp from header
      const timestampMatch = headerLine.match(/UTC_([^_]+)$/);
      if (timestampMatch) {
        return new Date(timestampMatch[1]);
      }
      
      // Try to find timestamp in other formats
      const isoMatch = headerLine.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      if (isoMatch) {
        return new Date(isoMatch[0]);
      }
      
      // If no timestamp found, return current date
      return new Date();
    } catch (error) {
      console.warn('Error extracting recording date:', error);
      return new Date();
    }
  }

  private static parseSensorTypes(typeString: string): string[] {
    const types: string[] = [];
    const codes = typeString.split(',').map(Number);
    
    const sensorMap: Record<number, string> = {
      1: 'Acceleration',
      2: 'Gyroscope',
      3: 'Magnetometer',
      4: 'Temperature',
    };
    
    codes.forEach(code => {
      if (sensorMap[code]) {
        types.push(sensorMap[code]);
      }
    });
    
    return types;
  }

  private static parseData(lines: string[]): SensorDataPoint[] {
    const data: SensorDataPoint[] = [];

    for (const line of lines) {
      if (!line.trim() || line.startsWith('#')) continue;

      const values = line.split(' ').filter(v => v !== '').map(v => parseFloat(v));
      
      if (values.length >= 7) {
        // Based on the example, it appears the format has multiple sensor sets
        // Let's assume first 7 values are: timestamp, accX, accY, accZ, gyroX, gyroY, gyroZ
        // This might need adjustment based on actual sensor configuration
        
        const dataPoint: SensorDataPoint = {
          timestamp: values[0],
          acceleration: {
            x: values[1] || 0,
            y: values[2] || 0,
            z: values[3] || 0,
          },
          gyroscope: {
            x: values[4] || 0,
            y: values[5] || 0,
            z: values[6] || 0,
          },
        };
        
        data.push(dataPoint);
      }
    }

    console.log(`Parsed ${data.length} data points`);
    return data;
  }

  static extractGaitParameters(data: SensorDataPoint[]) {
    // Extract basic gait parameters from sensor data
    if (data.length === 0) {
      return {
        acceleration: { x: { mean: 0, stdDev: 0, max: 0, min: 0, variance: 0 }, y: { mean: 0, stdDev: 0, max: 0, min: 0, variance: 0 }, z: { mean: 0, stdDev: 0, max: 0, min: 0, variance: 0 } },
        gyroscope: { x: { mean: 0, stdDev: 0, max: 0, min: 0, variance: 0 }, y: { mean: 0, stdDev: 0, max: 0, min: 0, variance: 0 }, z: { mean: 0, stdDev: 0, max: 0, min: 0, variance: 0 } },
        peaks: [],
      };
    }

    const accelX = data.map(d => d.acceleration.x);
    const accelY = data.map(d => d.acceleration.y);
    const accelZ = data.map(d => d.acceleration.z);
    
    const gyroX = data.map(d => d.gyroscope.x);
    const gyroY = data.map(d => d.gyroscope.y);
    const gyroZ = data.map(d => d.gyroscope.z);

    return {
      acceleration: {
        x: this.calculateStats(accelX),
        y: this.calculateStats(accelY),
        z: this.calculateStats(accelZ),
      },
      gyroscope: {
        x: this.calculateStats(gyroX),
        y: this.calculateStats(gyroY),
        z: this.calculateStats(gyroZ),
      },
      peaks: this.detectPeaks(accelY),
    };
  }

  private static calculateStats(values: number[]) {
    if (values.length === 0) return { mean: 0, stdDev: 0, max: 0, min: 0, variance: 0 };
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { mean, stdDev, max, min, variance };
  }

  private static detectPeaks(values: number[], threshold = 0.3) {
    const peaks: number[] = [];
    
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1] && values[i] > threshold) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  // Helper method to get a preview of the data format
  static getDataFormatPreview(content: string): { columns: number; sample: number[]; header: string } {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 3) {
      return { columns: 0, sample: [], header: '' };
    }
    
    // Get first data line
    const firstDataLine = lines[2] || lines[1];
    const values = firstDataLine.split(' ').filter(v => v !== '').map(v => parseFloat(v));
    
    return {
      columns: values.length,
      sample: values.slice(0, 10), // First 10 values
      header: lines[0],
    };
  }
}