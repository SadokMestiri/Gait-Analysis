import { SensorDataPoint } from '../types/sensor.types';
import { GaitAnalysis, GaitPhase, StepMetrics, RangeOfMotion } from '../types/gait.types';

export class AnalysisService {
  static analyzeGait(
    sensorData: SensorDataPoint[],
    patientId: string,
    sessionId: string
  ): GaitAnalysis {
    const gaitPhases = this.calculateGaitPhases(sensorData);
    const stepMetrics = this.calculateStepMetrics(sensorData);
    const rangeOfMotion = this.calculateRangeOfMotion(sensorData);
    const symmetryIndex = this.calculateSymmetryIndex(sensorData);
    const gaitDeviationIndex = this.calculateGaitDeviationIndex(sensorData);

    return {
      patientId,
      sessionId,
      gaitPhases,
      stepMetrics,
      rangeOfMotion,
      symmetryIndex,
      gaitDeviationIndex,
    };
  }

  private static calculateGaitPhases(data: SensorDataPoint[]): GaitPhase {
    // Simplified gait phase calculation based on acceleration patterns
    const accelY = data.map(d => d.acceleration.y);
    const peaks = this.findLocalMaxima(accelY);
    
    if (peaks.length < 2) {
      return {
        stancePhase: 60,
        swingPhase: 40,
        doubleSupport: 10,
      };
    }

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push((data[peaks[i]].timestamp - data[peaks[i - 1]].timestamp) * 1000); // Convert to ms
    }

    
    // Estimate phases based on typical gait patterns
    const stancePhase = 60; // Typical stance phase percentage
    const swingPhase = 40;  // Typical swing phase percentage
    const doubleSupport = 10; // Typical double support percentage

    return { stancePhase, swingPhase, doubleSupport };
  }

  private static calculateStepMetrics(data: SensorDataPoint[]): StepMetrics {
    const accelY = data.map(d => d.acceleration.y);
    const peaks = this.findLocalMaxima(accelY);
    
    if (peaks.length < 2) {
      return {
        stepLength: 0.7, // meters
        stepTime: 0.6,   // seconds
        stepWidth: 0.1,  // meters
        cadence: 100,    // steps per minute
        velocity: 1.2,   // meters per second
      };
    }

    const timeDiff = data[peaks[peaks.length - 1]].timestamp - data[peaks[0]].timestamp;
    const avgStepTime = timeDiff / (peaks.length - 1);
    
    // Estimated metrics (would need calibration for real measurements)
    const stepLength = 0.7; // Estimated average step length
    const cadence = 60 / avgStepTime;
    const velocity = stepLength * cadence / 60;

    return {
      stepLength,
      stepTime: avgStepTime,
      stepWidth: 0.1,
      cadence,
      velocity,
    };
  }

  private static calculateRangeOfMotion(data: SensorDataPoint[]): RangeOfMotion {
    // Estimate ROM from sensor data (simplified)
    const gyroX = data.map(d => d.gyroscope.x);
    const gyroY = data.map(d => d.gyroscope.y);
    const gyroZ = data.map(d => d.gyroscope.z);

    return {
      hipFlexion: Math.max(...gyroX) * 0.1, // Convert to degrees
      hipExtension: Math.min(...gyroX) * 0.1,
      kneeFlexion: Math.max(...gyroY) * 0.1,
      kneeExtension: Math.min(...gyroY) * 0.1,
      ankleDorsiflexion: Math.max(...gyroZ) * 0.1,
      anklePlantarflexion: Math.min(...gyroZ) * 0.1,
    };
  }

  private static calculateSymmetryIndex(data: SensorDataPoint[]): number {
    // Calculate symmetry between left and right steps (simplified)
    const accelY = data.map(d => d.acceleration.y);
    const peaks = this.findLocalMaxima(accelY);
    
    if (peaks.length < 3) return 100;

    const leftSteps: number[] = [];
    const rightSteps: number[] = [];
    
    // Alternate peaks as left/right steps (simplified assumption)
    for (let i = 0; i < peaks.length; i++) {
      if (i % 2 === 0) {
        leftSteps.push(accelY[peaks[i]]);
      } else {
        rightSteps.push(accelY[peaks[i]]);
      }
    }

    const leftAvg = leftSteps.reduce((a, b) => a + b, 0) / leftSteps.length;
    const rightAvg = rightSteps.reduce((a, b) => a + b, 0) / rightSteps.length;
    
    const symmetry = Math.min(leftAvg, rightAvg) / Math.max(leftAvg, rightAvg) * 100;
    return Math.round(symmetry * 100) / 100;
  }

  private static calculateGaitDeviationIndex(data: SensorDataPoint[]): number {
    // Simplified gait deviation calculation
    const accelY = data.map(d => d.acceleration.y);
    const mean = accelY.reduce((a, b) => a + b, 0) / accelY.length;
    const variance = accelY.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / accelY.length;
    
    // Lower variance = more consistent gait = lower deviation index
    const deviationIndex = Math.sqrt(variance) * 10;
    return Math.round(deviationIndex * 100) / 100;
  }

  private static findLocalMaxima(values: number[]): number[] {
    const maxima: number[] = [];
    
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        maxima.push(i);
      }
    }
    
    return maxima;
  }

  static detectAbnormalities(sensorData: SensorDataPoint[]): string[] {
    const abnormalities: string[] = [];
    
    // Check for irregular patterns
    const accelY = sensorData.map(d => d.acceleration.y);
    const variance = this.calculateVariance(accelY);
    
    if (variance > 0.5) {
      abnormalities.push('High variability in gait pattern');
    }
    
    const peaks = this.findLocalMaxima(accelY);
    if (peaks.length < 5) {
      abnormalities.push('Low number of steps detected');
    }
    
    // Check for asymmetry
    const symmetryIndex = this.calculateSymmetryIndex(sensorData);
    if (symmetryIndex < 85) {
      abnormalities.push(`Significant asymmetry detected (${symmetryIndex}%)`);
    }
    
    return abnormalities;
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  }
}