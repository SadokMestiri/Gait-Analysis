import { useState, useEffect } from 'react';
import { MedicalRecord } from '../types/medical.types';
import { CSVParser } from '../services/csvParser';

export const useMedicalRecords = (data?: any[][]) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      loadData(data);
    }
  }, [data]);

  const loadData = (csvData: any[][]) => {
    setLoading(true);
    setError(null);

    try {
      const parsedRecords = CSVParser.parseExcelData(csvData);
      setRecords(parsedRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse medical records');
    } finally {
      setLoading(false);
    }
  };

  const getPatientRecords = (patientName: string) => {
    return records.filter(record => record.participantName === patientName);
  };

  const getSessionRecords = (session: string) => {
    return records.filter(record => record.session === session);
  };

  const getHealthStatusRecords = (status: string) => {
    return CSVParser.filterByHealthStatus(records, status);
  };

  const getUniquePatients = () => {
    return Array.from(new Set(records.map(record => record.participantName)));
  };

  const getUniqueSessions = () => {
    return CSVParser.getUniqueSessions(records);
  };

  return {
    records,
    loading,
    error,
    getPatientRecords,
    getSessionRecords,
    getHealthStatusRecords,
    getUniquePatients,
    getUniqueSessions,
  };
};