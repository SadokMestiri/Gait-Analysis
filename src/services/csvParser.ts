import { MedicalRecord } from '../types/medical.types';

export class CSVParser {
  static parseExcelData(data: any[][]): MedicalRecord[] {
    // Skip header row (index 0)
    const rows = data.slice(1);
    const records: MedicalRecord[] = [];

    for (const row of rows) {
      if (row.length < 15) continue;

      const record: MedicalRecord = {
        sensorRecords: row[0] || '',
        videoRecords: row[1] || '',
        session: row[2] || '',
        recordDate: this.parseDate(row[3]),
        participantName: row[4] || '',
        participantHealth: this.parseHealthStatus(row[5]),
        medicalRecordNumber: row[6] || '',
        birthDate: this.parseDate(row[7]),
        age: this.parseAge(row[8]),
        gender: row[9] as 'M' | 'F',
        testType: row[10] || '',
        testPlace: row[11] || '',
        footwear: row[12] || undefined,
        lowerBodyClothing: row[13] || undefined,
        assistiveDevice: row[14] || undefined,
        preliminaryDetectedDouble: this.parseNumber(row[15]),
        comments: row[16] || undefined,
      };

      records.push(record);
    }

    return records;
  }

  private static parseDate(dateString: string): Date {
    if (!dateString) return new Date();
    
    // Try multiple date formats
    const formats = [
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'DD/MM/YY',
    ];
    
    for (const format of formats) {
      const parsed = this.tryParseDate(dateString, format);
      if (parsed) return parsed;
    }
    
    return new Date(dateString);
  }

  private static tryParseDate(dateString: string, format: string): Date | null {
    // Simple date parsing implementation
    if (format === 'YYYY-MM-DD HH:mm:ss') {
      return new Date(dateString);
    } else if (format === 'DD/MM/YYYY') {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    return null;
  }

  private static parseHealthStatus(status: string): 'patient' | 'healthy' | 'healthy*' {
    if (status.includes('healthy*')) return 'healthy*';
    if (status.includes('healthy')) return 'healthy';
    return 'patient';
  }

  private static parseAge(age: string): number | undefined {
    if (!age) return undefined;
    const match = age.match(/\d+/);
    return match ? parseInt(match[0]) : undefined;
  }

  private static parseNumber(num: string): number | undefined {
    if (!num) return undefined;
    const parsed = parseFloat(num);
    return isNaN(parsed) ? undefined : parsed;
  }

  static groupByPatient(records: MedicalRecord[]): Record<string, MedicalRecord[]> {
    return records.reduce((groups, record) => {
      const key = record.participantName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
      return groups;
    }, {} as Record<string, MedicalRecord[]>);
  }

  static filterByHealthStatus(records: MedicalRecord[], status: string): MedicalRecord[] {
    return records.filter(record => record.participantHealth === status);
  }

  static getUniqueSessions(records: MedicalRecord[]): string[] {
    const uniqueSessions = new Set(records.map(record => record.session));
    return Array.from(uniqueSessions);
  }
}