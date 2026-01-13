// services/advancedHeaderParser.ts - FIXED VERSION
export class AdvancedHeaderParser {
  static parseFileContent(content: string): any {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length < 3) {
    throw new Error('Invalid file format: insufficient lines');
  }

  // Find where data ends (#16 marker)
  let dataEndLine = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('#16')) {
      dataEndLine = i;
      console.log(`Stopping data parsing at line ${i} (#16 marker found)`);
      break;
    }
  }

  const firstHeader = lines[0];
  const secondHeader = lines[1];
  
  // Parse column definitions
  const columnInfo = this.parseColumnHeader(secondHeader);
  
  // Initialize result structure
  const result = {
    imus: {} as Record<string, any>,
    gaitParameters: {} as Record<string, number[]>,
    timestamps: [] as number[],
    metadata: {
      columnCount: columnInfo.totalColumns,
      totalRows: 0,
      sampleRate: 100,
      sensorIds: columnInfo.sensorIds,
      hasGaitParameters: columnInfo.hasGaitParameters,
      originalHeader: secondHeader,
      dataEndLine: dataEndLine, // Track where we stopped
    }
  };

  // Initialize IMUs for all detected sensors
  columnInfo.sensorIds.forEach(sensorId => {
    const imuKey = `IMU${sensorId}`;
    result.imus[imuKey] = {
      acceleration: { x: [], y: [], z: [] },
      gyroscope: { x: [], y: [], z: [] },
    };
  });

  // Find data start line (skip headers, stop before #16)
  const dataStartLine = this.findDataStartLine(lines);
  
  if (dataStartLine === -1 || dataStartLine >= dataEndLine) {
    console.log('No valid data found before #16 marker');
    return result;
  }

  // Parse only lines between dataStartLine and dataEndLine
  console.log(`Parsing data from line ${dataStartLine} to ${dataEndLine - 1}`);
  
  for (let i = dataStartLine; i < dataEndLine; i++) {
    const line = lines[i];
    if (line.startsWith('#') || line.trim() === '') continue;

    const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
    
    // Skip lines that don't have enough values or have invalid timestamps
    if (values.length < 2 || isNaN(values[0])) continue;
    
    result.timestamps.push(values[0]);
    
    // Process sensors based on column layout
    // This part needs to match your specific column ordering
    // You might need to adjust this based on your actual file format
    let valueIndex = 1;
    
    for (const sensorDef of columnInfo.sensorDefinitions) {
      if (valueIndex >= values.length) break;
      
      const imuKey = `IMU${sensorDef.sensorId}`;
      
      if (!result.imus[imuKey]) {
        result.imus[imuKey] = {
          acceleration: { x: [], y: [], z: [] },
          gyroscope: { x: [], y: [], z: [] },
        };
      }
      
      const value = values[valueIndex];
      
      if (sensorDef.type === 'acceleration') {
        result.imus[imuKey].acceleration[sensorDef.axis].push(value);
      } else if (sensorDef.type === 'gyroscope') {
        result.imus[imuKey].gyroscope[sensorDef.axis].push(value);
      }
      
      valueIndex++;
    }
  }

  result.metadata.totalRows = result.timestamps.length;
  
  // Validate that all IMUs have the same number of data points
  const imuKeys = Object.keys(result.imus);
  if (imuKeys.length > 0) {
    const firstImuKey = imuKeys[0];
    const expectedLength = result.imus[firstImuKey].acceleration.x.length;
    
    console.log('Data validation:', {
      timestamps: result.timestamps.length,
      expectedPointsPerIMU: expectedLength,
      IMUCounts: imuKeys.map(key => ({
        key,
        accX: result.imus[key].acceleration.x.length,
        accY: result.imus[key].acceleration.y.length,
        accZ: result.imus[key].acceleration.z.length,
        gyroX: result.imus[key].gyroscope.x.length,
        gyroY: result.imus[key].gyroscope.y.length,
        gyroZ: result.imus[key].gyroscope.z.length,
      }))
    });
  }

  return result;
}

  private static parseColumnHeader(headerLine: string): {
    totalColumns: number;
    sensorDefinitions: Array<{
      type: 'acceleration' | 'gyroscope';
      sensorId: string;
      axis: 'x' | 'y' | 'z';
    }>;
    sensorIds: string[];
    hasGaitParameters: boolean;
    hasADCValues: boolean;
    adcValueCount: number;
  } {
    console.log('📋 Parsing header line:', headerLine);
    
    // Extract total columns (the number after #)
    // Format: "# 103 1xClk[s]_3xAccelerationId1[g]_3xGyroscopeId1[°/s]_3xAccelerationId0[g]_3xGyroscopeId0[°/s] 13 14033"
    const match = headerLine.match(/#\s+(\d+)\s+(.+)/);
    if (!match) {
      console.error('❌ Cannot parse header line format');
      return {
        totalColumns: 0,
        sensorDefinitions: [],
        sensorIds: [],
        hasGaitParameters: false,
        hasADCValues: false,
        adcValueCount: 0
      };
    }
    
    const totalColumns = parseInt(match[1]);
    const columnDescriptions = match[2];
    
    console.log(`🔢 Total columns: ${totalColumns}`);
    console.log(`📜 Column descriptions: ${columnDescriptions}`);
    
    // Split by underscore to get individual column descriptors
    const descriptors = columnDescriptions.split('_');
    console.log('✂️ Descriptors:', descriptors);
    
    const sensorDefinitions: Array<{
      type: 'acceleration' | 'gyroscope';
      sensorId: string;
      axis: 'x' | 'y' | 'z';
    }> = [];
    
    const sensorIds = new Set<string>();
    let hasGaitParameters = false;
    let hasADCValues = false;
    let adcValueCount = 0;
    
    // Process each descriptor
    for (const desc of descriptors) {
      if (!desc || desc === '') continue;
      
      console.log(`🔍 Processing descriptor "${desc}"`);
      
      // Check for timestamp column
      if (desc.includes('Clk[s]')) {
        console.log('⏰ Found timestamp column');
        continue;
      }
      
      // Check for ADC values
      if (desc.includes('ADCValueId')) {
        hasADCValues = true;
        console.log('🔋 Found ADC values');
        const match = desc.match(/(\d+)xADCValueId/);
        if (match) {
          adcValueCount += parseInt(match[1]);
        }
        continue;
      }
      
      // Parse sensor patterns like "3xAccelerationId1[g]" or "3xGyroscopeId0[°/s]"
      const sensorMatch = desc.match(/(\d+)x(Acceleration|Gyroscope)Id(\d+)/);
      if (sensorMatch) {
        const count = parseInt(sensorMatch[1]);
        const type = sensorMatch[2].toLowerCase() as 'acceleration' | 'gyroscope';
        const sensorId = sensorMatch[3];
        
        console.log(`🎯 Found sensor: ${count}x ${type} Id${sensorId}`);
        
        sensorIds.add(sensorId);
        
        // Create entries for each axis (x, y, z)
        const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
        for (let j = 0; j < count && j < 3; j++) {
          sensorDefinitions.push({
            type,
            sensorId,
            axis: axes[j]
          });
          console.log(`   Added ${type} ${sensorId} ${axes[j]}`);
        }
        continue;
      }
      
      // Check for gait parameters (these come after sensors)
      const gaitPatterns = [
        'StepTime', 'DeltaYaw', 'DeltaPitch', 'DeltaRoll',
        'PrevStanceTime', 'PrevSwingTime', 'TimeSymmetry',
        'YawSymmetry', 'PitchSymmetry', 'RollSymmetry',
        'StanceSymmetry', 'SwingSymmetry'
      ];
      
      for (const pattern of gaitPatterns) {
        if (desc.includes(pattern)) {
          hasGaitParameters = true;
          console.log(`📈 Found gait parameter: ${pattern}`);
          break;
        }
      }
    }
    
    console.log('📊 Final column analysis:', {
      totalColumns,
      sensorDefinitions: sensorDefinitions.length,
      sensorIds: Array.from(sensorIds),
      hasGaitParameters,
      hasADCValues,
      adcValueCount
    });
    
    return {
      totalColumns,
      sensorDefinitions,
      sensorIds: Array.from(sensorIds),
      hasGaitParameters,
      hasADCValues,
      adcValueCount
    };
  }

  private static findDataStartLine(lines: string[]): number {
  console.log('🔍 Finding data start line...');
  
  // We need to skip:
  // 1. #5 - Header line with metadata
  // 2. #103 - Column definitions line
  // 3. #16 and everything after it - Labels/metadata
  
  let dataStart = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Stop at #16 - everything after this is labels/metadata, not data
    if (line.trim().startsWith('#16')) {
      console.log(`⏹️ Found #16 at line ${i} - stopping data parsing here`);
      break; // Stop processing any further lines
    }
    
    // Look for the first non-# line that has numeric data (skip header lines)
    if (!line.startsWith('#') && line.trim() !== '' && dataStart === -1) {
      const values = line.split(/\s+/).filter(v => v !== '');
      
      // Check if this looks like data (first value should be a timestamp/number)
      if (values.length > 0 && !isNaN(parseFloat(values[0]))) {
        console.log(`📄 Found data at line ${i}: ${line.substring(0, 100)}...`);
        dataStart = i;
        // Don't break here - we need to check all lines up to #16
      }
    }
  }
  
  if (dataStart === -1) {
    console.log('❌ No data found before #16');
  }
  
  return dataStart;
}
}