export interface SensorColumn {
  name: string;
  type: 'acceleration' | 'gyroscope' | 'timestamp' | 'gait_parameter';
  sensorId?: string;
  axis?: 'x' | 'y' | 'z';
  unit?: string;
  index: number;
}

export interface FileHeader {
  softwareVersion: string;
  firmwareVersion: string;
  deviceId: string;
  sensorTypes: string[];
  timestamp: Date;
  columnCount: number;
  columns: SensorColumn[];
  originalHeader: string;
}

export class HeaderParser {
  static parseHeader(headerLine: string): FileHeader {
    console.log('Parsing header:', headerLine);
    
    // Extract basic metadata from first header line
    const metadata = this.extractMetadata(headerLine);
    
    // Ensure all required properties are present with defaults
    const header: FileHeader = {
      softwareVersion: metadata.softwareVersion || 'Unknown',
      firmwareVersion: metadata.firmwareVersion || 'Unknown',
      deviceId: metadata.deviceId || 'Unknown',
      sensorTypes: metadata.sensorTypes || [],
      timestamp: metadata.timestamp || new Date(),
      columnCount: 0, // Will be updated when we parse data
      columns: [],
      originalHeader: headerLine,
    };
    
    return header;
  }

  static parseSecondHeader(secondLine: string, sampleData?: string[]): SensorColumn[] {
  console.log('Parsing second header:', secondLine);
  
  // Remove leading # and split into parts
  const cleanLine = secondLine.replace(/^#\s*/, '');
  
  // Split by underscore to get column descriptions
  const parts = cleanLine.split('_');
  
  if (parts.length < 2) {
    throw new Error('Invalid second header format');
  }
  
  // The first part is usually the column count and sample rate (e.g., "103")
  const firstPart = parts[0].split(' ');
  const columnCount = parseInt(firstPart[0]);
  
  // Parse column descriptions starting from the rest
  const columns: SensorColumn[] = [];
  let currentIndex = 0;
  
  // Start from part 1 (skip the count part)
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    // Skip empty parts
    if (!part.trim()) continue;
    
    // Parse column description
    const parsedColumns = this.parseColumnDescription(part, currentIndex);
    
    // Ensure we don't have duplicate indices
    parsedColumns.forEach(col => {
      col.index = currentIndex;
      currentIndex++;
    });
    
    columns.push(...parsedColumns);
  }
  
  console.log(`Parsed ${columns.length} columns from header:`, columns.map(c => ({
    name: c.name,
    type: c.type,
    sensorId: c.sensorId,
    axis: c.axis,
    index: c.index
  })));
  
  return columns;
}
  private static getDefaultColumns(): SensorColumn[] {
    // Return default column definitions for common sensor format
    return [
      { name: 'timestamp', type: 'timestamp', index: 0, unit: 's' },
      { name: 'acceleration_x', type: 'acceleration', sensorId: '0', axis: 'x', index: 1, unit: 'g' },
      { name: 'acceleration_y', type: 'acceleration', sensorId: '0', axis: 'y', index: 2, unit: 'g' },
      { name: 'acceleration_z', type: 'acceleration', sensorId: '0', axis: 'z', index: 3, unit: 'g' },
      { name: 'gyroscope_x', type: 'gyroscope', sensorId: '0', axis: 'x', index: 4, unit: '°/s' },
      { name: 'gyroscope_y', type: 'gyroscope', sensorId: '0', axis: 'y', index: 5, unit: '°/s' },
      { name: 'gyroscope_z', type: 'gyroscope', sensorId: '0', axis: 'z', index: 6, unit: '°/s' },
    ];
  }

  private static extractMetadata(headerLine: string): Partial<FileHeader> {
    try {
      const parts = headerLine.split('_');
      
      return {
        softwareVersion: parts[1] || 'Unknown',
        firmwareVersion: parts[3] || 'Unknown',
        deviceId: parts[4] || 'Unknown',
        sensorTypes: this.extractSensorTypes(headerLine),
        timestamp: this.extractTimestamp(headerLine),
      };
    } catch (error) {
      console.warn('Error extracting metadata:', error);
      return {
        softwareVersion: 'Unknown',
        firmwareVersion: 'Unknown',
        deviceId: 'Unknown',
        sensorTypes: [],
        timestamp: new Date(),
      };
    }
  }

  private static extractSensorTypes(headerLine: string): string[] {
    const sensorTypes: string[] = [];
    
    // Look for sensor type patterns like (1,3) or (1,2,3)
    const sensorPattern = /\(([\d,]+)\)/g;
    const matches = headerLine.match(sensorPattern);
    
    if (matches) {
      for (const match of matches) {
        const typeCodes = match.slice(1, -1).split(',').map(Number);
        
        for (const code of typeCodes) {
          const sensorName = this.getSensorName(code);
          if (sensorName && !sensorTypes.includes(sensorName)) {
            sensorTypes.push(sensorName);
          }
        }
      }
    }
    
    // Fallback: look for sensor mentions in the header
    if (sensorTypes.length === 0) {
      if (headerLine.includes('Acceleration') && headerLine.includes('Gyroscope')) {
        sensorTypes.push('Acceleration', 'Gyroscope');
      } else if (headerLine.includes('Acceleration')) {
        sensorTypes.push('Acceleration');
      } else if (headerLine.includes('Gyroscope')) {
        sensorTypes.push('Gyroscope');
      }
    }
    
    return sensorTypes;
  }

  private static getSensorName(code: number): string {
    const sensorMap: Record<number, string> = {
      0: 'Acceleration',
      1: 'Acceleration',
      2: 'Gyroscope',
      3: 'Magnetometer',
      4: 'Temperature',
      5: 'Pressure',
    };
    return sensorMap[code] || `Unknown${code}`;
  }

  private static extractTimestamp(headerLine: string): Date {
    try {
      // Look for UTC timestamp
      const utcMatch = headerLine.match(/UTC_([^_]+)$/);
      if (utcMatch) {
        return new Date(utcMatch[1]);
      }
      
      // Look for ISO timestamp pattern
      const isoMatch = headerLine.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
      if (isoMatch) {
        return new Date(isoMatch[0]);
      }
      
      return new Date();
    } catch (error) {
      console.warn('Error extracting timestamp:', error);
      return new Date();
    }
  }

  private static parseColumnDescription(description: string, startIndex: number): SensorColumn[] {
  console.log(`Parsing column description: "${description}"`);
  
  // Check for patterns like "3xAccelerationId1[g]"
  const countMatch = description.match(/^(\d+)x/);
  if (!countMatch) {
    // Single column
    return [this.parseSingleColumn(description, startIndex)];
  }
  
  const count = parseInt(countMatch[1]);
  const rest = description.slice(countMatch[0].length);
  
  console.log(`Found ${count}x pattern for: ${rest}`);
  
  const columns: SensorColumn[] = [];
  
  // Parse the sensor type and ID
  let type: SensorColumn['type'] = 'gait_parameter';
  let sensorId = '0';
  let axisType = '';
  
  // Check for different patterns
  if (rest.includes('AccelerationId')) {
    type = 'acceleration';
    // Extract sensor ID like "Id1" or "Id2" or "Id0"
    const idMatch = rest.match(/AccelerationId(\d+)/);
    sensorId = idMatch ? idMatch[1] : '0';
    axisType = 'acc';
  } else if (rest.includes('GyroscopeId')) {
    type = 'gyroscope';
    const idMatch = rest.match(/GyroscopeId(\d+)/);
    sensorId = idMatch ? idMatch[1] : '0';
    axisType = 'gyro';
  } else if (rest.includes('Clk')) {
    type = 'timestamp';
  } else if (rest.includes('ADCValueId')) {
    type = 'gait_parameter';
  } else if (rest.includes('StepTime') || rest.includes('DeltaYaw') || 
             rest.includes('DeltaPitch') || rest.includes('DeltaRoll') ||
             rest.includes('PrevStanceTime') || rest.includes('PrevSwingTime') ||
             rest.includes('Symmetry')) {
    type = 'gait_parameter';
  }
  
  // For sensor columns, create 3 columns (x, y, z)
  if (type === 'acceleration' || type === 'gyroscope') {
    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
    
    for (let i = 0; i < count; i++) {
      const axis = axes[i % 3];
      columns.push({
        name: `${type}_${sensorId}_${axis}`,
        type,
        sensorId,
        axis,
        unit: rest.includes('[') ? rest.match(/\[([^\]]+)\]/)?.[1] : undefined,
        index: startIndex + i,
      });
    }
  } else {
    // For non-sensor columns, create generic columns
    for (let i = 0; i < count; i++) {
      columns.push({
        name: `${rest}_${i}`,
        type,
        index: startIndex + i,
      });
    }
  }
  
  return columns;
}

  private static parseSingleColumn(description: string, index: number): SensorColumn {
  // Handle special cases
  if (description.includes('Clk')) {
    return {
      name: 'timestamp',
      type: 'timestamp',
      index,
      unit: 's',
    };
  }
  
  // Default to gait parameter
  return {
    name: description,
    type: 'gait_parameter',
    index,
  };
}

  static analyzeFileStructure(content: string): {
  header: FileHeader;
  columns: SensorColumn[];
  sampleData: number[];
  dataStartLine: number;
} {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length < 3) {
    throw new Error('Invalid file format: insufficient lines');
  }
  
  console.log('First header line:', lines[0]);
  console.log('Second header line:', lines[1]);
  
  // Parse first header line
  const header = this.parseHeader(lines[0]);
  
  // Parse second header line
  const columns = this.parseSecondHeader(lines[1]);
  
  console.log('Parsed columns:', columns.map(c => ({
    name: c.name,
    type: c.type,
    sensorId: c.sensorId,
    axis: c.axis,
    index: c.index,
  })));
  
  // Find first data line (skip all header lines starting with #)
  let dataStartLine = 2; // Usually line 2 is data
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i].startsWith('#')) {
      dataStartLine = i;
      break;
    }
  }
  
  // Get sample data from first data line
  const firstDataLine = lines[dataStartLine];
  const sampleData = firstDataLine.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
  
  // Update header with column count
  header.columnCount = columns.length;
  header.columns = columns;
  
  return {
    header,
    columns,
    sampleData,
    dataStartLine,
  };
}
}