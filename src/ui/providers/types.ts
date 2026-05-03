import type { ProviderId } from '@shared/messages';

export type ModelFamily =
  | 'flux'
  | 'sdxl'
  | 'gpt-image'
  | 'dalle'
  | 'imagen'
  | 'nano-banana'
  | 'other';

export interface ModelInfo {
  id: string;
  label: string;
  supportsReference: boolean;
  family: ModelFamily;
  notes?: string;
}

export type ReferenceImage =
  | { kind: 'url'; url: string }
  | { kind: 'data'; dataUrl: string; mimeType: string };

export interface GenerateOptions {
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  referenceImage?: ReferenceImage;
  apiKey: string;
  signal?: AbortSignal;
}

export interface GeneratedImage {
  bytes: Uint8Array;
  mimeType: string;
  meta: {
    providerId: ProviderId;
    modelId: string;
    prompt: string;
    width: number;
    height: number;
  };
}

export interface ImageProvider {
  id: ProviderId;
  label: string;
  models: ModelInfo[];
  generate(opts: GenerateOptions): Promise<GeneratedImage>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ProviderError';
  }
}
