import { SensorDataPoint } from '../types/sensor.types';
import { GaitAnalysis } from '../types/gait.types';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string | string[];
    tension?: number;
  }[];
}

export class VisualizationService {
  static createSensorChart(data: SensorDataPoint[], sensorType: 'acceleration' | 'gyroscope', axis: 'x' | 'y' | 'z'): ChartData {
    const values = data.map((d, index) => ({
      x: index,
      y: sensorType === 'acceleration' ? d.acceleration[axis] : d.gyroscope[axis],
    }));

    return {
      labels: values.map((_, i) => i.toString()),
      datasets: [{
        label: `${sensorType.toUpperCase()} ${axis.toUpperCase()}`,
        data: values.map(v => v.y),
        borderColor: this.getColor(axis),
        backgroundColor: `${this.getColor(axis)}20`,
        tension: 0.4,
      }],
    };
  }

  static createGaitPhaseChart(analysis: GaitAnalysis): ChartData {
    return {
      labels: ['Stance', 'Swing', 'Double Support'],
      datasets: [{
        label: 'Gait Phases (%)',
        data: [
          analysis.gaitPhases.stancePhase,
          analysis.gaitPhases.swingPhase,
          analysis.gaitPhases.doubleSupport,
        ],
        borderColor: '#4F46E5',
        backgroundColor: ['#4F46E560', '#10B98160', '#F59E0B60'],
      }],
    };
  }

  static createStepMetricsChart(analysis: GaitAnalysis): ChartData {
    return {
      labels: ['Step Length', 'Step Time', 'Step Width', 'Cadence', 'Velocity'],
      datasets: [{
        label: 'Step Metrics',
        data: [
          analysis.stepMetrics.stepLength,
          analysis.stepMetrics.stepTime,
          analysis.stepMetrics.stepWidth,
          analysis.stepMetrics.cadence / 100, // Scale for visualization
          analysis.stepMetrics.velocity,
        ],
        borderColor: '#10B981',
        backgroundColor: '#10B98160',
      }],
    };
  }

  static createRangeOfMotionChart(analysis: GaitAnalysis): ChartData {
    return {
      labels: [
        'Hip Flexion',
        'Hip Extension',
        'Knee Flexion',
        'Knee Extension',
        'Ankle Dorsiflexion',
        'Ankle Plantarflexion',
      ],
      datasets: [{
        label: 'Range of Motion (degrees)',
        data: [
          analysis.rangeOfMotion.hipFlexion,
          analysis.rangeOfMotion.hipExtension,
          analysis.rangeOfMotion.kneeFlexion,
          analysis.rangeOfMotion.kneeExtension,
          analysis.rangeOfMotion.ankleDorsiflexion,
          analysis.rangeOfMotion.anklePlantarflexion,
        ],
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B60',
      }],
    };
  }

  static createComparisonChart(analyses: GaitAnalysis[], metric: keyof GaitAnalysis): ChartData {
    const labels = analyses.map(a => `${a.patientId} - ${a.sessionId}`);
    
    let data: number[];
    if (metric === 'symmetryIndex') {
      data = analyses.map(a => a.symmetryIndex);
    } else if (metric === 'gaitDeviationIndex') {
      data = analyses.map(a => a.gaitDeviationIndex);
    } else {
      data = [];
    }

    return {
      labels,
      datasets: [{
        label: metric.replace(/([A-Z])/g, ' $1').trim(),
        data,
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF660',
      }],
    };
  }

  private static getColor(axis: string): string {
    const colors = {
      x: '#EF4444', // Red
      y: '#10B981', // Green
      z: '#3B82F6', // Blue
    };
    return colors[axis as keyof typeof colors] || '#6B7280';
  }

  static generateSummaryStats(analyses: GaitAnalysis[]) {
    const stats = {
      totalPatients: new Set(analyses.map(a => a.patientId)).size,
      totalSessions: analyses.length,
      avgSymmetry: this.calculateAverage(analyses.map(a => a.symmetryIndex)),
      avgGaitDeviation: this.calculateAverage(analyses.map(a => a.gaitDeviationIndex)),
      abnormalGaitCount: analyses.filter(a => a.symmetryIndex < 85 || a.gaitDeviationIndex > 15).length,
    };

    return stats;
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }
}