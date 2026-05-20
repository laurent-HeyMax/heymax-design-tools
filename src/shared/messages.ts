export type ProviderId = 'fal' | 'replicate' | 'openai' | 'gemini';

export type FormFactorId = 'desktop' | 'phone' | 'tablet' | 'square';

export type SceneId = 'none' | 'sunrise' | 'afternoon' | 'sunset' | 'night';

export interface PluginSettings {
  apiKeys: Partial<Record<ProviderId, string>>;
  defaults: {
    providerId: ProviderId;
    modelId: string;
    formFactor: FormFactorId;
    promptTemplate: string;
    negativePrompt: string;
  };
  /**
   * Optional CORS proxy URL for Replicate (and any other provider that
   * doesn't return CORS headers). Pattern: https://your-worker.workers.dev
   * — the plugin will rewrite Replicate calls to ${proxyUrl}/api.replicate.com/…
   */
  replicateProxyUrl?: string;
  /** Last-used plugin window size; restored on next open. */
  windowSize?: { width: number; height: number };
}

export interface AddImagePayload {
  bytes: Uint8Array;
  width: number;
  height: number;
  label: string;
  index?: number;
  total?: number;
}

export interface AddSvgItem {
  svg: string;
  label: string;
  width: number;
  height: number;
}

export type UiToMain =
  | { type: 'ready' }
  | { type: 'save-settings'; settings: PluginSettings }
  | { type: 'add-image'; payload: AddImagePayload }
  | { type: 'add-images'; payloads: AddImagePayload[] }
  | { type: 'add-svgs'; items: AddSvgItem[] }
  | { type: 'notify'; message: string; level?: 'info' | 'error' }
  | { type: 'resize'; width: number; height: number }
  | { type: 'close' };

export type MainToUi =
  | { type: 'init'; settings: PluginSettings }
  | { type: 'settings-saved' }
  | { type: 'image-added'; ok: true }
  | { type: 'error'; message: string };
