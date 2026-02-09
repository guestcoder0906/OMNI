export interface FileObject {
  name: string;
  content: string;
  type: 'SYSTEM' | 'PLAYER' | 'LOCATION' | 'ITEM' | 'GUIDE';
  lastUpdated: number; // World time timestamp
  isHidden: boolean; // Controls visibility to the player
}

export interface LogEntry {
  id: string;
  type: 'NARRATIVE' | 'SYSTEM' | 'ERROR' | 'INPUT';
  text: string;
  timestamp: number;
}

export interface LiveUpdate {
  id: string;
  text: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface GameState {
  isInitialized: boolean;
  isLoading: boolean;
  debugMode: boolean; // Controls visibility of system files
  worldTime: number; // Seconds
  files: Record<string, FileObject>;
  history: LogEntry[];
  liveUpdates: LiveUpdate[];
}

export interface EngineResponse {
  narrative: string;
  liveUpdates: string[]; // Strings to be parsed into LiveUpdate objects
  fileUpdates: {
    fileName: string;
    content: string;
    type: 'SYSTEM' | 'PLAYER' | 'LOCATION' | 'ITEM' | 'GUIDE';
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    isHidden?: boolean;
  }[];
  timeDelta: number;
}

export const INITIAL_FILES: Record<string, FileObject> = {
  'Guide.txt': {
    name: 'Guide.txt',
    content: 'System Initializing... Waiting for world parameters.',
    type: 'GUIDE',
    lastUpdated: 0,
    isHidden: false,
  },
};

declare global {
  // Fix: Define AIStudio interface to match the type expected by the environment
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Fix: Use AIStudio type to avoid "Subsequent property declarations must have the same type" error
    aistudio?: AIStudio;
  }
}