export interface MedicalRecord {
  sensorRecords: string;
  videoRecords: string;
  session: string;
  recordDate: Date;
  participantName: string;
  participantHealth: 'patient' | 'healthy' | 'healthy*';
  medicalRecordNumber: string;
  birthDate?: Date;
  age?: number;
  gender: 'M' | 'F';
  testType: string;
  testPlace: string;
  footwear?: string;
  lowerBodyClothing?: string;
  assistiveDevice?: string;
  preliminaryDetectedDouble?: number;
  comments?: string;
}

export interface PatientMetadata {
  patientId: string;
  sessionId: string;
  phase: 'Pre-op' | 'Post-op' | string;
  date: Date;
  pathology?: string;
  side?: 'Left' | 'Right';
  surgeryType?: string;
  surgeryDate?: Date;
  notes?: string;
}

export interface ParticipantHealthGender {
  participants: string[];
}