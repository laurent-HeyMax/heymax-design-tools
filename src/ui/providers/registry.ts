import type { ProviderId } from '@shared/messages';
import { falProvider } from './fal';
import { geminiProvider } from './gemini';
import { openaiProvider } from './openai';
import { replicateProvider } from './replicate';
import type { ImageProvider } from './types';

export const PROVIDERS: Record<ProviderId, ImageProvider> = {
  fal: falProvider,
  replicate: replicateProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

export const PROVIDER_LIST: ImageProvider[] = [
  falProvider,
  replicateProvider,
  openaiProvider,
  geminiProvider,
];

export function getProvider(id: ProviderId): ImageProvider {
  return PROVIDERS[id];
}

export function getModel(providerId: ProviderId, modelId: string) {
  return PROVIDERS[providerId].models.find((m) => m.id === modelId);
}
