export interface SongResult {
  artist: string;
  title: string;
  genre: string;
  funFact: string;
  confidence: number;
  searchLinks?: string[];
}

export interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}