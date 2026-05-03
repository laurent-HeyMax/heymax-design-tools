import { useCallback } from 'react';
import { CITIES, FORM_FACTORS, SCENES, STYLES } from '@shared/presets';
import { sendToMain } from './messaging';
import { pLimit } from './concurrency';
import { loadImageFromBytes } from './imageBytes';
import { getModel, getProvider } from '../providers/registry';
import type { ResultJob } from '../state/store';
import { useStore } from '../state/store';

const CONCURRENCY = 4;

function applyTemplate(template: string, prompt: string): string {
  if (template.includes('{prompt}')) return template.replace(/\{prompt\}/g, prompt);
  return template ? `${template}\n\n${prompt}` : prompt;
}

function shortPrompt(p: string): string {
  return p.length > 60 ? `${p.slice(0, 60)}…` : p;
}

function jobId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useGenerate() {
  const state = useStore;

  return useCallback(async () => {
    const s = state.getState();
    const trimmed = s.prompt.trim();
    const city = s.cityId ? CITIES.find((c) => c.id === s.cityId) : undefined;
    if (!trimmed && !city) {
      sendToMain({
        type: 'notify',
        message: 'Enter a prompt or pick a city preset first',
        level: 'error',
      });
      return;
    }
    const provider = getProvider(s.providerId);
    const model = getModel(s.providerId, s.modelId);
    if (!model) {
      sendToMain({ type: 'notify', message: 'Pick a model', level: 'error' });
      return;
    }
    const apiKey = s.settings.apiKeys[s.providerId] ?? '';
    if (!apiKey) {
      sendToMain({
        type: 'notify',
        message: `Add an API key for ${provider.label} in Settings`,
        level: 'error',
      });
      return;
    }
    if (s.referenceImage && !model.supportsReference) {
      sendToMain({
        type: 'notify',
        message: `${model.label} doesn't accept reference images. Pick another model or remove the reference.`,
        level: 'error',
      });
      return;
    }

    const sceneList = SCENES.filter((sc) => s.scenes.includes(sc.id));
    const formFactorList = s.customDimensions.enabled
      ? [{
          id: 'custom' as const,
          label: 'Custom',
          width: s.customDimensions.width,
          height: s.customDimensions.height,
        }]
      : FORM_FACTORS.filter((f) => s.formFactors.includes(f.id));

    if (sceneList.length === 0 || formFactorList.length === 0) {
      sendToMain({ type: 'notify', message: 'Pick at least one scene and one form factor', level: 'error' });
      return;
    }

    const style = s.styleId ? STYLES.find((st) => st.id === s.styleId) : undefined;
    const styleAddition = style ? `. ${style.promptAddition}` : '';
    // If no user prompt but a city is selected, fold the city description into the
    // template as the prompt so the photography modifiers still wrap it cleanly.
    const effectivePrompt = trimmed || city!.promptAddition;
    const cityAddition = trimmed && city ? `. ${city.promptAddition}` : '';

    const newJobs: ResultJob[] = [];
    for (const ff of formFactorList) {
      for (const sc of sceneList) {
        const base = applyTemplate(s.settings.defaults.promptTemplate, effectivePrompt);
        const promptCombined = base + sc.modifier + cityAddition + styleAddition;
        newJobs.push({
          id: jobId(),
          providerId: s.providerId,
          modelId: s.modelId,
          modelLabel: model.label,
          prompt: promptCombined,
          promptShort: shortPrompt(promptCombined),
          sceneLabel: sc.label,
          formFactorLabel: ff.label,
          width: ff.width,
          height: ff.height,
          status: 'pending',
          createdAt: Date.now(),
        });
      }
    }
    newJobs.forEach((j) => state.getState().addJob(j));

    // Make the Replicate proxy URL visible to the provider via globalThis.
    // Order: explicit user override > build-time default from .env.production.
    (globalThis as { __replicateProxyUrl?: string }).__replicateProxyUrl =
      s.settings.replicateProxyUrl?.trim() ||
      import.meta.env.REPLICATE_PROXY?.trim() ||
      undefined;

    const limit = pLimit(CONCURRENCY);
    await Promise.all(
      newJobs.map((job) =>
        limit(async () => {
          state.getState().patchJob(job.id, { status: 'running' });
          try {
            const result = await provider.generate({
              modelId: job.modelId,
              prompt: job.prompt,
              negativePrompt: state.getState().settings.defaults.negativePrompt?.trim() || undefined,
              width: job.width,
              height: job.height,
              referenceImage: state.getState().referenceImage,
              apiKey,
            });
            // Decode the actual returned image to get true pixel dimensions
            // (some models, e.g. Gemini nano-banana, return ~1024px regardless of request)
            let actualWidth = result.meta.width;
            let actualHeight = result.meta.height;
            try {
              const img = await loadImageFromBytes(result.bytes, result.mimeType);
              actualWidth = img.naturalWidth;
              actualHeight = img.naturalHeight;
            } catch {
              // fall back to meta dims if decode fails
            }
            state.getState().patchJob(job.id, {
              status: 'done',
              bytes: result.bytes,
              mimeType: result.mimeType,
              width: actualWidth,
              height: actualHeight,
              requestedWidth: job.width,
              requestedHeight: job.height,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            state.getState().patchJob(job.id, { status: 'error', error: message });
          }
        }),
      ),
    );
  }, [state]);
}
