export interface GaitPhase {
  stancePhase: number;
  swingPhase: number;
  doubleSupport: number;
}

export interface StepMetrics {
  stepLength: number;
  stepTime: number;
  stepWidth: number;
  cadence: number;
  velocity: number;
}

export interface RangeOfMotion {
  hipFlexion: number;
  hipExtension: number;
  kneeFlexion: number;
  kneeExtension: number;
  ankleDorsiflexion: number;
  anklePlantarflexion: number;
}

export interface GaitAnalysis {
  patientId: string;
  sessionId: string;
  gaitPhases: GaitPhase;
  stepMetrics: StepMetrics;
  rangeOfMotion: RangeOfMotion;
  symmetryIndex: number;
  gaitDeviationIndex: number;
}