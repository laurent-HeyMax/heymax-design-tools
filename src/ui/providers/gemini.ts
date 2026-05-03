import { base64ToBytes, bytesToBase64 } from '../lib/imageBytes';
import type { GenerateOptions, GeneratedImage, ImageProvider, ModelInfo, ReferenceImage } from './types';
import { ProviderError } from './types';

const API = 'https://generativelanguage.googleapis.com/v1beta';

const MODELS: ModelInfo[] = [
  {
    id: 'gemini-2.5-flash-image',
    label: 'Gemini 2.5 Flash Image (nano-banana, paid)',
    supportsReference: true,
    family: 'nano-banana',
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    label: 'Gemini 3.1 Flash Image (preview)',
    supportsReference: true,
    family: 'nano-banana',
  },
  {
    id: 'gemini-3-pro-image-preview',
    label: 'Gemini 3 Pro Image (preview)',
    supportsReference: true,
    family: 'nano-banana',
  },
  { id: 'imagen-3.0-generate-002', label: 'Imagen 3 (paid)', supportsReference: false, family: 'imagen' },
  { id: 'imagen-4.0-generate-preview-06-06', label: 'Imagen 4 preview (paid)', supportsReference: false, family: 'imagen' },
];

function imagenAspect(width: number, height: number): string {
  const r = width / height;
  if (Math.abs(r - 1) < 0.05) return '1:1';
  if (Math.abs(r - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(r - 9 / 16) < 0.05) return '9:16';
  if (Math.abs(r - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(r - 3 / 4) < 0.05) return '3:4';
  return r > 1 ? '16:9' : '9:16';
}

function stripDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return { mimeType: 'image/png', data: dataUrl };
  return { mimeType: m[1], data: m[2] };
}

async function refToInline(ref: ReferenceImage, signal?: AbortSignal): Promise<{ mimeType: string; data: string }> {
  if (ref.kind === 'data') return stripDataUrl(ref.dataUrl);
  const r = await fetch(ref.url, { signal });
  if (!r.ok) throw new ProviderError(`Failed to fetch reference (${r.status})`);
  const bytes = new Uint8Array(await r.arrayBuffer());
  return { mimeType: r.headers.get('content-type') ?? 'image/png', data: bytesToBase64(bytes) };
}

interface ImagenPredictResponse {
  predictions: { bytesBase64Encoded?: string; mimeType?: string }[];
}

interface GenerateContentResponse {
  candidates: {
    content: {
      parts: { inlineData?: { mimeType: string; data: string }; text?: string }[];
    };
  }[];
}

export const geminiProvider: ImageProvider = {
  id: 'gemini',
  label: 'Google Gemini',
  models: MODELS,

  async generate(opts: GenerateOptions): Promise<GeneratedImage> {
    if (!opts.apiKey) throw new ProviderError('Missing Google AI API key');
    const isImagen = opts.modelId.startsWith('imagen');

    if (isImagen) {
      const url = `${API}/models/${opts.modelId}:predict?key=${encodeURIComponent(opts.apiKey)}`;
      const body = {
        instances: [{ prompt: opts.prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: imagenAspect(opts.width, opts.height),
          ...(opts.negativePrompt ? { negativePrompt: opts.negativePrompt } : {}),
        },
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: opts.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new ProviderError(`Imagen request failed (${res.status}): ${txt}`, res.status);
      }
      const json = (await res.json()) as ImagenPredictResponse;
      const first = json.predictions?.[0];
      if (!first?.bytesBase64Encoded) throw new ProviderError('Imagen returned no image');
      return {
        bytes: base64ToBytes(first.bytesBase64Encoded),
        mimeType: first.mimeType ?? 'image/png',
        meta: {
          providerId: 'gemini',
          modelId: opts.modelId,
          prompt: opts.prompt,
          width: opts.width,
          height: opts.height,
        },
      };
    }

    const url = `${API}/models/${opts.modelId}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;
    const promptText = opts.negativePrompt
      ? `${opts.prompt}\n\nAvoid: ${opts.negativePrompt}`
      : opts.prompt;
    const parts: Record<string, unknown>[] = [{ text: promptText }];
    if (opts.referenceImage) {
      const inline = await refToInline(opts.referenceImage, opts.signal);
      parts.push({ inlineData: inline });
    }
    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: imagenAspect(opts.width, opts.height) },
      },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new ProviderError(`Gemini request failed (${res.status}): ${txt}`, res.status);
    }
    const json = (await res.json()) as GenerateContentResponse;
    const inline = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!inline) throw new ProviderError('Gemini returned no image');
    return {
      bytes: base64ToBytes(inline.data),
      mimeType: inline.mimeType ?? 'image/png',
      meta: {
        providerId: 'gemini',
        modelId: opts.modelId,
        prompt: opts.prompt,
        width: opts.width,
        height: opts.height,
      },
    };
  },
};
