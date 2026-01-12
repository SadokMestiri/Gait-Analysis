import { GaitAnalysis } from '../types/gait.types';
import { MedicalRecord } from '../types/medical.types';
import * as XLSX from 'xlsx';

export class ExportService {
  static exportToCSV(data: any[], filename: string) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  static exportToExcel(data: any[], filename: string, sheetName: string = 'Data') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
  }

  static generateReport(analysis: GaitAnalysis, medicalRecord: MedicalRecord) {
    const report = {
      'Patient Name': medicalRecord.participantName,
      'Session': medicalRecord.session,
      'Date': medicalRecord.recordDate.toLocaleDateString(),
      'Health Status': medicalRecord.participantHealth,
      'Symmetry Index': `${analysis.symmetryIndex}%`,
      'Gait Deviation': analysis.gaitDeviationIndex,
      'Step Length': `${analysis.stepMetrics.stepLength.toFixed(2)} m`,
      'Cadence': `${analysis.stepMetrics.cadence.toFixed(0)} steps/min`,
      'Velocity': `${analysis.stepMetrics.velocity.toFixed(2)} m/s`,
      'Notes': medicalRecord.comments || 'No notes',
      'Analysis Date': new Date().toLocaleDateString(),
    };

    return report;
  }

  private static convertToCSV(data: any[]): string {
    const headers = Object.keys(data[0] || {});
    const rows = data.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}