import { useState } from 'react';
import { SensorRecording, SensorDataPoint } from '../types/sensor.types';
import { GaitParser } from '../services/gaitParser';

export const useSensorData = () => {
  const [recordings, setRecordings] = useState<SensorRecording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<SensorRecording | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSensorFile = async (
    fileContent: string,
    patientId?: string,
    sessionId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      // First, check if this looks like a sensor file or HTML
      if (fileContent.includes('<!DOCTYPE html>') || fileContent.includes('<html')) {
        throw new Error('Invalid file: Received HTML instead of sensor data');
      }

      // First, analyze the file format
      const format = GaitParser.getDataFormatPreview(fileContent);
      console.log('Sensor file format preview:', format);
      
      // Check if it's a valid sensor file - be more lenient for different formats
      if (format.columns < 3) { // Reduced from 7 to be more flexible
        console.warn('File may have non-standard format, attempting to parse anyway');
      }
      
      // Parse the file
      const recording = GaitParser.parseSensorFile(
        fileContent, 
        patientId || 'unknown-patient', 
        sessionId || 'unknown-session'
      );
      
      // Log some stats for debugging
      console.log(`Loaded ${recording.data.length} data points`);
      
      setRecordings(prev => [...prev, recording]);
      setCurrentRecording(recording);
      
      return recording;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse sensor data';
      console.error('Error parsing sensor file:', err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRecording = (patientId: string, sessionId: string) => {
    return recordings.find(
      r => r.patientId === patientId && r.sessionId === sessionId
    );
  };

  const extractGaitParameters = (data: SensorDataPoint[]) => {
    return GaitParser.extractGaitParameters(data);
  };

  const clearRecordings = () => {
    setRecordings([]);
    setCurrentRecording(null);
  };

  return {
    recordings,
    currentRecording,
    loading,
    error,
    loadSensorFile,
    getRecording,
    extractGaitParameters,
    clearRecordings,
  };
};