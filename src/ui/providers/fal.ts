import { fetchBytes } from '../lib/imageBytes';
import type { GenerateOptions, GeneratedImage, ImageProvider, ModelInfo } from './types';
import { ProviderError } from './types';

const QUEUE_BASE = 'https://queue.fal.run';

const MODELS: ModelInfo[] = [
  { id: 'fal-ai/flux/schnell', label: 'Flux Schnell (fast, free-tier friendly)', supportsReference: false, family: 'flux' },
  { id: 'fal-ai/flux/dev', label: 'Flux Dev', supportsReference: false, family: 'flux' },
  { id: 'fal-ai/flux-pro/v1.1', label: 'Flux Pro 1.1', supportsReference: false, family: 'flux' },
  { id: 'fal-ai/flux/dev/image-to-image', label: 'Flux Dev (image-to-image)', supportsReference: true, family: 'flux' },
  { id: 'fal-ai/stable-diffusion-v35-large', label: 'Stable Diffusion 3.5 Large', supportsReference: false, family: 'sdxl' },
];

interface FalQueueSubmit {
  request_id: string;
  status_url?: string;
  response_url?: string;
}

interface FalImageOut {
  images: { url: string; content_type?: string; width?: number; height?: number }[];
}

async function pollUntilDone(model: string, requestId: string, apiKey: string, signal?: AbortSignal): Promise<FalImageOut> {
  const statusUrl = `${QUEUE_BASE}/${model}/requests/${requestId}/status`;
  const responseUrl = `${QUEUE_BASE}/${model}/requests/${requestId}`;
  const start = Date.now();
  const timeoutMs = 120_000;
  while (true) {
    if (signal?.aborted) throw new ProviderError('Aborted');
    if (Date.now() - start > timeoutMs) throw new ProviderError('fal.ai request timed out');
    const res = await fetch(statusUrl, { headers: { Authorization: `Key ${apiKey}` }, signal });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new ProviderError(`fal.ai status check failed (${res.status}): ${txt}`, res.status);
    }
    const json = await res.json();
    if (json.status === 'COMPLETED') {
      const final = await fetch(responseUrl, { headers: { Authorization: `Key ${apiKey}` }, signal });
      if (!final.ok) {
        const txt = await final.text().catch(() => '');
        throw new ProviderError(`fal.ai result fetch failed (${final.status}): ${txt}`, final.status);
      }
      return (await final.json()) as FalImageOut;
    }
    if (json.status === 'FAILED' || json.status === 'CANCELLED') {
      throw new ProviderError(`fal.ai job ${String(json.status).toLowerCase()}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

export const falProvider: ImageProvider = {
  id: 'fal',
  label: 'fal.ai',
  models: MODELS,

  async generate(opts: GenerateOptions): Promise<GeneratedImage> {
    if (!opts.apiKey) throw new ProviderError('Missing fal.ai API key');
    const body: Record<string, unknown> = {
      prompt: opts.prompt,
      image_size: { width: opts.width, height: opts.height },
      num_images: 1,
    };
    if (opts.negativePrompt) body.negative_prompt = opts.negativePrompt;
    if (opts.referenceImage) {
      const url =
        opts.referenceImage.kind === 'url'
          ? opts.referenceImage.url
          : opts.referenceImage.dataUrl;
      body.image_url = url;
    }
    const submit = await fetch(`${QUEUE_BASE}/${opts.modelId}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!submit.ok) {
      const txt = await submit.text().catch(() => '');
      throw new ProviderError(`fal.ai submit failed (${submit.status}): ${txt}`, submit.status);
    }
    const queued = (await submit.json()) as FalQueueSubmit;
    const result = await pollUntilDone(opts.modelId, queued.request_id, opts.apiKey, opts.signal);
    const first = result.images?.[0];
    if (!first?.url) throw new ProviderError('fal.ai returned no image');
    const { bytes, mimeType } = await fetchBytes(first.url, opts.signal);
    return {
      bytes,
      mimeType,
      meta: {
        providerId: 'fal',
        modelId: opts.modelId,
        prompt: opts.prompt,
        width: first.width ?? opts.width,
        height: first.height ?? opts.height,
      },
    };
  },
};
