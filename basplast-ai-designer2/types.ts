export enum ThermosLength {
  Short = 'Short (0.5L)',
  Medium = 'Medium (1.0L)',
  Long = 'Long (1.5L+)'
}

export enum ThermosShape {
  Classic = 'Classic Cylinder',
  Slim = 'Slim/Modern',
  Wide = 'Wide Mouth',
  Patterned = 'Geometric/Patterned',
  Ergonomic = 'Ergonomic Grip'
}

export interface DesignRequest {
  id: string;
  timestamp: number;
  prompt: string;
  attributes: {
    length: ThermosLength | '';
    shape: ThermosShape | '';
    color: string;
  };
  referenceImage?: string; // Base64
  generatedImages: string[]; // Base64 or URLs
}

export interface AppState {
  history: DesignRequest[];
  currentRequest: DesignRequest | null;
}