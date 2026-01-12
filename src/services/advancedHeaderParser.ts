// services/advancedHeaderParser.ts - FIXED VERSION
export class AdvancedHeaderParser {
  static parseFileContent(content: string): {
    imus: Record<string, {
      acceleration: { x: number[]; y: number[]; z: number[] };
      gyroscope: { x: number[]; y: number[]; z: number[] };
    }>;
    gaitParameters: Record<string, number[]>;
    timestamps: number[];
    metadata: {
      columnCount: number;
      totalRows: number;
      sampleRate: number;
      sensorIds: string[];
      hasGaitParameters: boolean;
      originalHeader: string;
    };
  } {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 3) {
      throw new Error('Invalid file format: insufficient lines');
    }

    const firstHeader = lines[0];
    const secondHeader = lines[1];
    
    console.log('🔍 First header:', firstHeader);
    console.log('🔍 Second header:', secondHeader);

    // Extract column definitions from second header
    const columnInfo = this.parseColumnHeader(secondHeader);
    console.log('✅ Column info parsed:', columnInfo);

    // Initialize data structures
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
      }
    };

    // Initialize IMU structures for all detected sensors
    columnInfo.sensorIds.forEach(sensorId => {
      const imuKey = `IMU${sensorId}`;
      result.imus[imuKey] = {
        acceleration: { x: [], y: [], z: [] },
        gyroscope: { x: [], y: [], z: [] },
      };
      console.log(`📱 Initialized ${imuKey}`);
    });

    // Parse data lines
    const dataStartLine = this.findDataStartLine(lines);
    console.log(`📊 Data starts at line ${dataStartLine}, total lines: ${lines.length}`);

    // Debug: Show first few data lines
    for (let i = dataStartLine; i < Math.min(dataStartLine + 3, lines.length); i++) {
      const line = lines[i];
      if (!line.startsWith('#') && line.trim() !== '') {
        const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
        console.log(`📝 Sample data line ${i}: ${values.length} values, first 5: ${values.slice(0, 5).join(', ')}`);
      }
    }

    let rowCount = 0;
for (let i = dataStartLine; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('#') || line.trim() === '') continue;

  const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
  
  // Check if we have enough values for at least timestamp + 1 value
  if (values.length >= 2) {
    // 1. Timestamp (always first column)
    result.timestamps.push(values[0]);
    
    // 2. Process sensors based on column layout
    let valueIndex = 1; // Start after timestamp
    
    // Process each sensor definition
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
    
    rowCount++;
    
    // Debug: Show first few rows
    if (rowCount <= 3) {
      console.log(`📝 Row ${rowCount}: timestamp=${values[0]}, processed ${valueIndex - 1} sensor values`);
    }
  }
}

result.metadata.totalRows = rowCount;
console.log(`✅ Processed ${rowCount} rows with data`);
    
    // Calculate actual sample rate from timestamps
    if (result.timestamps.length > 1) {
      const totalTime = result.timestamps[result.timestamps.length - 1] - result.timestamps[0];
      result.metadata.sampleRate = totalTime > 0 ? 
        (result.timestamps.length - 1) / totalTime : 100;
    }

    // Log summary
    console.log('✅ Parsing complete:', {
      totalRows: result.metadata.totalRows,
      timestamps: result.timestamps.length,
      imus: Object.keys(result.imus),
      imuDetails: Object.entries(result.imus).map(([key, imu]) => ({
        key,
        accX: imu.acceleration.x.length,
        accY: imu.acceleration.y.length,
        accZ: imu.acceleration.z.length,
        gyroX: imu.gyroscope.x.length,
        gyroY: imu.gyroscope.y.length,
        gyroZ: imu.gyroscope.z.length,
        firstAccX: imu.acceleration.x[0],
        firstAccY: imu.acceleration.y[0],
        firstAccZ: imu.acceleration.z[0],
      }))
    });

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
    // Skip header lines (starting with #)
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#') && lines[i].trim() !== '') {
        console.log(`📄 Found data at line ${i}: ${lines[i].substring(0, 100)}...`);
        return i;
      }
    }
    return 0;
  }
}