import { SensorDataPoint } from '../types/sensor.types';

export const calculateStepDetection = (data: SensorDataPoint[], threshold = 0.3) => {
  const verticalAcceleration = data.map(d => d.acceleration.y);
  const steps: number[] = [];
  
  // Simple peak detection for step identification
  for (let i = 1; i < verticalAcceleration.length - 1; i++) {
    const current = verticalAcceleration[i];
    const previous = verticalAcceleration[i - 1];
    const next = verticalAcceleration[i + 1];
    
    if (current > previous && current > next && current > threshold) {
      steps.push(i);
    }
  }
  
  return steps;
};

export const calculateRangeOfMotion = (
  data: SensorDataPoint[],
  joint: 'hip' | 'knee' | 'ankle'
) => {
  let axisData: number[];
  
  switch (joint) {
    case 'hip':
      axisData = data.map(d => d.gyroscope.x);
      break;
    case 'knee':
      axisData = data.map(d => d.gyroscope.y);
      break;
    case 'ankle':
      axisData = data.map(d => d.gyroscope.z);
      break;
    default:
      axisData = [];
  }
  
  if (axisData.length === 0) return { min: 0, max: 0, range: 0 };
  
  const min = Math.min(...axisData);
  const max = Math.max(...axisData);
  const range = max - min;
  
  return { min, max, range };
};

export const calculateCadence = (steps: number[], data: SensorDataPoint[]) => {
  if (steps.length < 2) return 0;
  
  const firstStepTime = data[steps[0]].timestamp;
  const lastStepTime = data[steps[steps.length - 1]].timestamp;
  const totalTime = lastStepTime - firstStepTime;
  
  if (totalTime <= 0) return 0;
  
  const stepCount = steps.length - 1;
  const cadence = (stepCount / totalTime) * 60; // Steps per minute
  
  return cadence;
};

export const calculateVelocity = (stepLength: number, cadence: number) => {
  // velocity = step length * cadence / 60 (to get m/s)
  return (stepLength * cadence) / 60;
};

export const calculateSymmetry = (
  leftSteps: number[],
  rightSteps: number[],
  data: SensorDataPoint[]
) => {
  if (leftSteps.length === 0 || rightSteps.length === 0) return 100;
  
  const calculateStepMetrics = (steps: number[]) => {
    if (steps.length < 2) return { avgTime: 0, variability: 0 };
    
    const times: number[] = [];
    for (let i = 1; i < steps.length; i++) {
      const time = data[steps[i]].timestamp - data[steps[i - 1]].timestamp;
      times.push(time);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const variability = Math.sqrt(
      times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length
    );
    
    return { avgTime, variability };
  };
  
  const leftMetrics = calculateStepMetrics(leftSteps);
  const rightMetrics = calculateStepMetrics(rightSteps);
  
  // Symmetry index (0-100%, higher is better)
  const timeSymmetry = Math.min(leftMetrics.avgTime, rightMetrics.avgTime) / 
                       Math.max(leftMetrics.avgTime, rightMetrics.avgTime) * 100;
  
  return Math.round(timeSymmetry);
};