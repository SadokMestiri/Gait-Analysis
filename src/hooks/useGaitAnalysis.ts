import { useState, useCallback } from 'react';
import { SensorDataPoint } from '../types/sensor.types';
import { GaitAnalysis } from '../types/gait.types';
import { AnalysisService } from '../services/analysisService';

export const useGaitAnalysis = () => {
  const [analyses, setAnalyses] = useState<GaitAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<GaitAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSensorData = useCallback((
    sensorData: SensorDataPoint[],
    patientId: string,
    sessionId: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const analysis = AnalysisService.analyzeGait(sensorData, patientId, sessionId);
      
      // Add to analyses history
      setAnalyses(prev => {
        const filtered = prev.filter(a => 
          !(a.patientId === patientId && a.sessionId === sessionId)
        );
        return [...filtered, analysis];
      });
      
      setCurrentAnalysis(analysis);
      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze gait';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatientAnalyses = useCallback((patientId: string) => {
    return analyses.filter(analysis => analysis.patientId === patientId);
  }, [analyses]);

  const compareAnalyses = useCallback((analysisIds: string[]) => {
    // Compare multiple analyses
    const selectedAnalyses = analyses.filter(a => analysisIds.includes(`${a.patientId}-${a.sessionId}`));
    
    return {
      avgSymmetry: selectedAnalyses.reduce((sum, a) => sum + a.symmetryIndex, 0) / selectedAnalyses.length,
      avgDeviation: selectedAnalyses.reduce((sum, a) => sum + a.gaitDeviationIndex, 0) / selectedAnalyses.length,
      stepLengthRange: {
        min: Math.min(...selectedAnalyses.map(a => a.stepMetrics.stepLength)),
        max: Math.max(...selectedAnalyses.map(a => a.stepMetrics.stepLength)),
      },
      cadenceRange: {
        min: Math.min(...selectedAnalyses.map(a => a.stepMetrics.cadence)),
        max: Math.max(...selectedAnalyses.map(a => a.stepMetrics.cadence)),
      },
      analyses: selectedAnalyses,
    };
  }, [analyses]);

  const detectAbnormalities = useCallback((sensorData: SensorDataPoint[]) => {
    return AnalysisService.detectAbnormalities(sensorData);
  }, []);

  const clearAnalyses = () => {
    setAnalyses([]);
    setCurrentAnalysis(null);
  };

  return {
    analyses,
    currentAnalysis,
    loading,
    error,
    analyzeSensorData,
    getPatientAnalyses,
    compareAnalyses,
    detectAbnormalities,
    clearAnalyses,
  };
};