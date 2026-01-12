export interface SensorHeader {
  softwareVersion: string;
  firmwareVersion: string;
  deviceId: string;
  sensorTypes: string[];
  sampleRate: number;
}

export interface SensorDataPoint {
  timestamp: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
}

export interface SensorRecording {
  header: SensorHeader;
  data: SensorDataPoint[];
  patientId: string;
  sessionId: string;
  recordingDate: Date;
  metadata?: {
    originalHeader?: any;
    columnDefinitions?: any[];
    [key: string]: any;
  };
}
export interface IMUData {
  acceleration: {
    x: number[];
    y: number[];
    z: number[];
  };
  gyroscope: {
    x: number[];
    y: number[];
    z: number[];
  };
}
export interface MultiSensorData {
  timestamps: number[];
  imus: Record<string, IMUData>; // Key: "IMU0", "IMU1", "IMU2", etc.
}