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

export enum KieModel {
  GPT_4o_Image = 'gpt-image/1.5-image-to-image',
  Flux_Pro_Ultra = 'flux-pro-1.1-ultra',
  Midjourney_V6 = 'midjourney-6',
  Nano_Banana = 'google/nano-banana',
  Flex_Image = 'flux-2/flex-image-to-image',
  Ideogram_V3 = 'ideogram/v3-text-to-image'
}

export interface DesignRequest {
  id: string;
  timestamp: number;
  prompt: string;
  attributes: {
    length: ThermosLength | '';
    shape: ThermosShape | '';
    color: string;
    model: string;
    isAdMode?: string;
  };
  referenceImage?: string; // Base64
  generatedImages: string[]; // Base64 or URLs
}

export interface GeneratedItem {
  id: string;
  url: string;
  batchId: string;
  model: string;
  timestamp: number;
  prompt: string;
}

export interface AppState {
  history: DesignRequest[];
  currentRequest: DesignRequest | null;
}