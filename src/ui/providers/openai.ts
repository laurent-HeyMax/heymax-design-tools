import { base64ToBytes, fetchBytes } from '../lib/imageBytes';
import type { GenerateOptions, GeneratedImage, ImageProvider, ModelInfo } from './types';
import { ProviderError } from './types';

const API = 'https://api.openai.com/v1';

const MODELS: ModelInfo[] = [
  { id: 'gpt-image-1', label: 'GPT Image 1 (supports references)', supportsReference: true, family: 'gpt-image' },
  { id: 'dall-e-3', label: 'DALL·E 3', supportsReference: false, family: 'dalle' },
];

function gptImageSize(width: number, height: number): string {
  const r = width / height;
  if (Math.abs(r - 1) < 0.1) return '1024x1024';
  return r > 1 ? '1536x1024' : '1024x1536';
}

function dalleSize(width: number, height: number): string {
  const r = width / height;
  if (Math.abs(r - 1) < 0.1) return '1024x1024';
  return r > 1 ? '1792x1024' : '1024x1792';
}

interface ImageResponse {
  data: { b64_json?: string; url?: string }[];
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export const openaiProvider: ImageProvider = {
  id: 'openai',
  label: 'OpenAI',
  models: MODELS,

  async generate(opts: GenerateOptions): Promise<GeneratedImage> {
    if (!opts.apiKey) throw new ProviderError('Missing OpenAI API key');
    const headers: Record<string, string> = { Authorization: `Bearer ${opts.apiKey}` };

    const finalPrompt = opts.negativePrompt
      ? `${opts.prompt}\n\nAvoid: ${opts.negativePrompt}`
      : opts.prompt;

    let json: ImageResponse;
    if (opts.modelId === 'gpt-image-1' && opts.referenceImage) {
      let blob: Blob;
      if (opts.referenceImage.kind === 'data') {
        blob = await dataUrlToBlob(opts.referenceImage.dataUrl);
      } else {
        const refRes = await fetch(opts.referenceImage.url, { signal: opts.signal });
        if (!refRes.ok) throw new ProviderError(`Failed to fetch reference image (${refRes.status})`);
        blob = await refRes.blob();
      }
      const form = new FormData();
      form.append('model', 'gpt-image-1');
      form.append('prompt', finalPrompt);
      form.append('size', gptImageSize(opts.width, opts.height));
      form.append('image', new File([blob], 'reference.png', { type: blob.type || 'image/png' }));
      const res = await fetch(`${API}/images/edits`, {
        method: 'POST',
        headers,
        body: form,
        signal: opts.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new ProviderError(`OpenAI edits failed (${res.status}): ${txt}`, res.status);
      }
      json = (await res.json()) as ImageResponse;
    } else {
      const body: Record<string, unknown> = {
        model: opts.modelId,
        prompt: finalPrompt,
        size: opts.modelId === 'gpt-image-1'
          ? gptImageSize(opts.width, opts.height)
          : dalleSize(opts.width, opts.height),
        n: 1,
      };
      if (opts.modelId === 'dall-e-3') {
        body.response_format = 'b64_json';
      }
      const res = await fetch(`${API}/images/generations`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: opts.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new ProviderError(`OpenAI generation failed (${res.status}): ${txt}`, res.status);
      }
      json = (await res.json()) as ImageResponse;
    }

    const first = json.data?.[0];
    if (!first) throw new ProviderError('OpenAI returned no image');

    let bytes: Uint8Array;
    let mimeType = 'image/png';
    if (first.b64_json) {
      bytes = base64ToBytes(first.b64_json);
    } else if (first.url) {
      const fetched = await fetchBytes(first.url, opts.signal);
      bytes = fetched.bytes;
      mimeType = fetched.mimeType;
    } else {
      throw new ProviderError('OpenAI returned no image data');
    }

    return {
      bytes,
      mimeType,
      meta: {
        providerId: 'openai',
        modelId: opts.modelId,
        prompt: opts.prompt,
        width: opts.width,
        height: opts.height,
      },
    };
  },
};
