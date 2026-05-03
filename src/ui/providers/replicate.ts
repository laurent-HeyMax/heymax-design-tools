import { fetchBytes } from '../lib/imageBytes';
import type { GenerateOptions, GeneratedImage, ImageProvider, ModelInfo } from './types';
import { ProviderError } from './types';

const DIRECT_API = 'https://api.replicate.com/v1';

const MODELS: ModelInfo[] = [
  { id: 'black-forest-labs/flux-schnell', label: 'Flux Schnell', supportsReference: false, family: 'flux' },
  { id: 'black-forest-labs/flux-dev', label: 'Flux Dev', supportsReference: false, family: 'flux' },
  { id: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro', supportsReference: false, family: 'flux' },
  { id: 'black-forest-labs/flux-redux-dev', label: 'Flux Redux Dev (image variation)', supportsReference: true, family: 'flux' },
  { id: 'stability-ai/stable-diffusion-3.5-large', label: 'Stable Diffusion 3.5 Large', supportsReference: false, family: 'sdxl' },
];

interface PredictionResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: string | string[] | null;
  error: string | null;
  urls: { get: string };
}

function aspectRatioFor(width: number, height: number): string {
  const r = width / height;
  if (Math.abs(r - 1) < 0.05) return '1:1';
  if (Math.abs(r - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(r - 9 / 16) < 0.05) return '9:16';
  if (Math.abs(r - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(r - 3 / 4) < 0.05) return '3:4';
  if (Math.abs(r - 21 / 9) < 0.05) return '21:9';
  return r > 1 ? '16:9' : '9:16';
}

/**
 * Replicate's API doesn't return CORS headers, so calls from a browser plugin fail.
 * To use Replicate, set a proxy URL in plugin Settings (deploy the Cloudflare
 * Worker in scripts/replicate-proxy.js, free tier).
 *
 * Proxy URL is read from window.__replicateProxyUrl, set by useGenerate before
 * calling provider.generate(). Empty/undefined → calls go direct (will fail in browser).
 */
function apiBase(): string {
  const proxy = (globalThis as { __replicateProxyUrl?: string }).__replicateProxyUrl;
  return proxy ? `${proxy.replace(/\/$/, '')}/v1` : DIRECT_API;
}

function rewriteFollowupUrl(url: string): string {
  // Polling URL comes back from Replicate as https://api.replicate.com/v1/predictions/...
  // If we're using a proxy, rewrite it to go through the proxy too.
  const proxy = (globalThis as { __replicateProxyUrl?: string }).__replicateProxyUrl;
  if (!proxy) return url;
  return url.replace('https://api.replicate.com', proxy.replace(/\/$/, ''));
}

function rewriteDeliveryUrl(url: string): string {
  // Result image URL comes back as https://replicate.delivery/... — that CDN
  // also doesn't support CORS, so route the download through the worker too.
  const proxy = (globalThis as { __replicateProxyUrl?: string }).__replicateProxyUrl;
  if (!proxy) return url;
  return url.replace('https://replicate.delivery', `${proxy.replace(/\/$/, '')}/delivery`);
}

export const replicateProvider: ImageProvider = {
  id: 'replicate',
  label: 'Replicate',
  models: MODELS,

  async generate(opts: GenerateOptions): Promise<GeneratedImage> {
    if (!opts.apiKey) throw new ProviderError('Missing Replicate API key');
    const input: Record<string, unknown> = {
      prompt: opts.prompt,
      aspect_ratio: aspectRatioFor(opts.width, opts.height),
      output_format: 'png',
      num_outputs: 1,
    };
    if (opts.negativePrompt) input.negative_prompt = opts.negativePrompt;
    if (opts.referenceImage) {
      input.image =
        opts.referenceImage.kind === 'url' ? opts.referenceImage.url : opts.referenceImage.dataUrl;
    }
    const submit = await fetch(`${apiBase()}/models/${opts.modelId}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({ input }),
      signal: opts.signal,
    }).catch((err) => {
      throw new ProviderError(
        `Replicate request blocked. ${err.message}\n\n` +
          `Replicate's API doesn't allow browser requests (no CORS). ` +
          `Deploy the proxy in scripts/replicate-proxy.js to a Cloudflare Worker (free), ` +
          `then paste the worker URL in Settings → Replicate proxy URL.`,
      );
    });
    if (!submit.ok) {
      const txt = await submit.text().catch(() => '');
      throw new ProviderError(`Replicate submit failed (${submit.status}): ${txt}`, submit.status);
    }
    let prediction = (await submit.json()) as PredictionResponse;
    const start = Date.now();
    while (prediction.status === 'starting' || prediction.status === 'processing') {
      if (opts.signal?.aborted) throw new ProviderError('Aborted');
      if (Date.now() - start > 180_000) throw new ProviderError('Replicate request timed out');
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(rewriteFollowupUrl(prediction.urls.get), {
        headers: { Authorization: `Bearer ${opts.apiKey}` },
        signal: opts.signal,
      });
      if (!poll.ok) {
        const txt = await poll.text().catch(() => '');
        throw new ProviderError(`Replicate poll failed (${poll.status}): ${txt}`, poll.status);
      }
      prediction = (await poll.json()) as PredictionResponse;
    }
    if (prediction.status !== 'succeeded') {
      throw new ProviderError(prediction.error ?? `Replicate prediction ${prediction.status}`);
    }
    const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!url) throw new ProviderError('Replicate returned no image');
    const { bytes, mimeType } = await fetchBytes(rewriteDeliveryUrl(url), opts.signal);
    return {
      bytes,
      mimeType,
      meta: {
        providerId: 'replicate',
        modelId: opts.modelId,
        prompt: opts.prompt,
        width: opts.width,
        height: opts.height,
      },
    };
  },
};
