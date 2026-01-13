export class ResultsParser {
  static parseResultsFile(content: string, type: 'Yaw' | 'Roll' | 'Pitch'): {
    timestamps: number[];
    values: number[][]; // 2D array: [phaseIndex][measurementIndex]
    columnCount: number; // e.g., 17 for "17xPitch"
    phaseIncrement: number;
    type: string;
  } {
    console.log(`Parsing ${type} results file`);
    
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const result = {
      timestamps: [] as number[],
      values: [] as number[][],
      columnCount: 0,
      phaseIncrement: 0.01, // Default, we'll try to detect actual increment
      type,
    };

    let dataStarted = false;
    let measurementCount = 0; // e.g., 17 for "17xPitch"
    let totalColumns = 0; // e.g., 19
    let totalPoints = 0; // e.g., 101

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (line.trim() === '') continue;
      
      // Look for the header line that contains the format info
      // e.g., "# 103 1xPhase_1xMean_17xPitch 19 101"
      if (line.includes(`x${type}`) && line.includes('1xPhase_1xMean')) {
        console.log(`Found ${type} header at line ${i}: ${line}`);
        
        // Parse the header format: "1xPhase_1xMean_17xPitch 19 101"
        const parts = line.split(' ');
        
        // The format part is after the column count (e.g., "103")
        const formatPart = parts[2] || '';
        
        // Extract measurement count (e.g., 17 from "17xPitch")
        const measurementMatch = formatPart.match(/(\d+)x(Yaw|Roll|Pitch)/i);
        if (measurementMatch) {
          measurementCount = parseInt(measurementMatch[1]);
          result.columnCount = measurementCount;
          console.log(`Detected ${measurementCount} ${type} measurements`);
        }
        
        // Extract total columns and points (e.g., 19 and 101)
        totalColumns = parseInt(parts[3] || '0');
        totalPoints = parseInt(parts[4] || '0');
        
        console.log(`Total columns: ${totalColumns}, Total points: ${totalPoints}`);
        
        dataStarted = true;
        continue;
      }
      
      // Skip other header lines
      if (line.startsWith('#')) {
        continue;
      }
      
      // Parse data lines
      if (dataStarted) {
        const values = line.split(/\s+/).filter(v => v !== '').map(v => parseFloat(v));
        
        // Expected format: [phase, mean, measurement1, measurement2, ..., measurementN]
        if (values.length >= 2 + measurementCount) {
          // First value is phase (0, 0.01, 0.02, etc.)
          const phase = values[0];
          
          // Second value is the MEAN of all measurements at this phase
          const meanValue = values[1];
          
          // The next measurementCount values are individual measurements
          const individualMeasurements = values.slice(2, 2 + measurementCount);
          
          // Store phase as timestamp
          result.timestamps.push(phase);
          
          // Store ALL values: mean + all individual measurements
          result.values.push([meanValue, ...individualMeasurements]);
          
          // Detect phase increment from first two points
          if (result.timestamps.length === 2 && result.phaseIncrement === 0.01) {
            const increment = result.timestamps[1] - result.timestamps[0];
            if (increment > 0 && increment < 1) {
              result.phaseIncrement = increment;
              console.log(`Detected phase increment: ${increment}`);
            }
          }
          
          // Log first data point for debugging
          if (result.timestamps.length === 1) {
            console.log(`First ${type} data point:`);
            console.log(`  Phase: ${phase}`);
            console.log(`  Mean: ${meanValue.toFixed(4)}`);
            console.log(`  Individual measurements (first 3): ${individualMeasurements.slice(0, 3).map(v => v.toFixed(2)).join(', ')}`);
            console.log(`  Total measurements at this phase: ${individualMeasurements.length}`);
          }
        } else if (values.length > 0) {
          console.warn(`Line ${i} has insufficient data: expected ${2 + measurementCount} values, got ${values.length}`);
        }
      }
    }

    console.log(`Parsed ${result.values.length} phases with ${measurementCount} ${type} measurements each`);
    console.log(`Phase range: ${result.timestamps[0]?.toFixed(3) || 0} to ${result.timestamps[result.timestamps.length - 1]?.toFixed(3) || 0}`);
    console.log(`Total data points: ${result.values.length * (measurementCount + 1)} (phases × measurements)`);
    
    return result;
  }

  static async loadResultsFile(sensorRecord: string, type: 'Yaw' | 'Roll' | 'Pitch'): Promise<string> {
    // Clean the sensor record name
    const cleanRecord = sensorRecord.trim();
    
    // Try multiple filename patterns
    const filePatterns = [
      `${cleanRecord}GaitAnalysisId0${type}.MicroHub.txt`,
      `${cleanRecord}${type}.MicroHub.txt`,
      `${cleanRecord}GaitAnalysisId0${type}.txt`,
      `${cleanRecord}${type}.txt`,
      `${cleanRecord.toLowerCase()}${type.toLowerCase()}.microhub.txt`,
    ];
    
    for (const fileName of filePatterns) {
      const filePath = `/records-one-folder/result/${fileName}`;
      console.log(`Trying to load: ${filePath}`);
      
      try {
        const response = await fetch(filePath);
        if (response.ok) {
          const content = await response.text();
          console.log(`✓ Found file: ${fileName} (${content.length} bytes)`);
          
          // Check if this looks like a results file
          if (content.includes('1xPhase_1xMean') && content.includes(type)) {
            return content;
          } else {
            console.warn(`File ${fileName} doesn't match expected results format`);
          }
        }
      } catch (error) {
        console.log(`✗ Not found: ${fileName}`);
        continue;
      }
    }
    
    throw new Error(`No ${type} results file found for sensor record: ${cleanRecord}`);
  }

  static getAvailableResultsForSensorRecord(sensorRecord: string, records: any[]): Array<{
    type: 'Yaw' | 'Roll' | 'Pitch';
    fileName: string;
    baseFileName: string;
    session: string;
  }> {
    const cleanRecord = sensorRecord.trim();
    const availableResults: Array<{
      type: 'Yaw' | 'Roll' | 'Pitch';
      fileName: string;
      baseFileName: string;
      session: string;
    }> = [];

    // Get all sessions for this sensor record
    const sessions = records
      .filter(r => r.sensorRecords === cleanRecord)
      .map(r => r.session);

    // For each result type
    const resultTypes: ('Yaw' | 'Roll' | 'Pitch')[] = ['Yaw', 'Roll', 'Pitch'];
    
    for (const type of resultTypes) {
      const fileName = `${cleanRecord}GaitAnalysisId0${type}.MicroHub.txt`;
      availableResults.push({
        type,
        fileName,
        baseFileName: cleanRecord,
        session: sessions[0] || 'unknown',
      });
    }

    console.log(`Available results for sensor record "${cleanRecord}":`, availableResults);
    return availableResults;
  }

  static async loadAllResultsForSensorRecord(sensorRecord: string): Promise<{
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
    errors: string[];
  }> {
    console.log(`Loading all results for sensor record: ${sensorRecord}`);
    
    const result = {
      pitch: { 
        timestamps: [] as number[], 
        values: [] as number[][],
        columnCount: 0,
        phaseIncrement: 0.01,
      },
      roll: { 
        timestamps: [] as number[], 
        values: [] as number[][],
        columnCount: 0,
        phaseIncrement: 0.01,
      },
      yaw: { 
        timestamps: [] as number[], 
        values: [] as number[][],
        columnCount: 0,
        phaseIncrement: 0.01,
      },
      loadedFiles: [] as string[],
      errors: [] as string[],
    };

    const resultTypes: ('Yaw' | 'Roll' | 'Pitch')[] = ['Yaw', 'Roll', 'Pitch'];
    
    // Load each result type
    for (const type of resultTypes) {
      try {
        const content = await this.loadResultsFile(sensorRecord, type);
        const parsed = this.parseResultsFile(content, type);
        
        if (type === 'Pitch') {
          result.pitch = {
            timestamps: parsed.timestamps,
            values: parsed.values,
            columnCount: parsed.columnCount,
            phaseIncrement: parsed.phaseIncrement,
          };
        } else if (type === 'Roll') {
          result.roll = {
            timestamps: parsed.timestamps,
            values: parsed.values,
            columnCount: parsed.columnCount,
            phaseIncrement: parsed.phaseIncrement,
          };
        } else if (type === 'Yaw') {
          result.yaw = {
            timestamps: parsed.timestamps,
            values: parsed.values,
            columnCount: parsed.columnCount,
            phaseIncrement: parsed.phaseIncrement,
          };
        }
        
        result.loadedFiles.push(`${sensorRecord}GaitAnalysisId0${type}.MicroHub.txt`);
        console.log(`✓ Loaded ${type}: ${parsed.values.length} phases × ${parsed.columnCount} measurements`);
        
        // Show detailed statistics
        if (parsed.values.length > 0 && parsed.columnCount > 0) {
          // Calculate mean of means
          const meanValues = parsed.values.map(row => row[0]); // Column 0 is the mean
          const avgMean = meanValues.reduce((a, b) => a + b, 0) / meanValues.length;
          
          // Calculate overall statistics
          const allValues = parsed.values.flat();
          const min = Math.min(...allValues);
          const max = Math.max(...allValues);
          const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
          
          console.log(`  ${type} Statistics:`);
          console.log(`    Average of means: ${avgMean.toFixed(4)}`);
          console.log(`    Overall min/max: ${min.toFixed(4)} / ${max.toFixed(4)}`);
          console.log(`    Overall mean: ${overallMean.toFixed(4)}`);
          console.log(`    Phase increment: ${parsed.phaseIncrement}`);
        }
      } catch (error: any) {
        const errorMsg = `Failed to load ${type}: ${error.message}`;
        console.warn(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    return result;
  }
}