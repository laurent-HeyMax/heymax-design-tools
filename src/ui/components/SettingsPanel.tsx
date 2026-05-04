import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { ProviderId } from '@shared/messages';
import { DEFAULT_NEGATIVE_PROMPT, DEFAULT_PROMPT_TEMPLATE, FORM_FACTORS } from '@shared/presets';
import { PROVIDER_LIST, PROVIDERS } from '../providers/registry';
import { useStore } from '../state/store';
import { Input, Label, Textarea } from './ui/Input';
import { Section } from './ui/Section';
import { Select } from './ui/Select';

export function SettingsPanel() {
  const settings = useStore((s) => s.settings);
  const setApiKey = useStore((s) => s.setApiKey);
  const setDefault = useStore((s) => s.setDefault);
  const setReplicateProxyUrl = useStore((s) => s.setReplicateProxyUrl);
  const [reveal, setReveal] = useState<Record<ProviderId, boolean>>({
    fal: false,
    replicate: false,
    openai: false,
    gemini: false,
  });

  const defaultProvider = PROVIDERS[settings.defaults.providerId];
  const defaultModelOptions = defaultProvider.models.map((m) => ({ value: m.id, label: m.label }));
  if (!defaultModelOptions.find((o) => o.value === settings.defaults.modelId)) {
    defaultModelOptions.unshift({
      value: settings.defaults.modelId,
      label: `${settings.defaults.modelId} (not in current provider)`,
    });
  }

  return (
    <div className="space-y-3">
      <Section title="API keys">
        <div className="space-y-3">
          {PROVIDER_LIST.map((p) => (
            <div key={p.id}>
              <Label>{p.label}</Label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Input
                    type={reveal[p.id] ? 'text' : 'password'}
                    value={settings.apiKeys[p.id] ?? ''}
                    onChange={(e) => setApiKey(p.id, e.target.value)}
                    placeholder={`${p.label} API key`}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => ({ ...r, [p.id]: !r[p.id] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
                    title={reveal[p.id] ? 'Hide' : 'Reveal'}
                  >
                    {reveal[p.id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-text-faint">
          Keys are stored locally via <code>figma.clientStorage</code> and never leave your machine
          except to call the chosen provider's API.
        </p>
      </Section>

      <Section title="Defaults">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Default provider</Label>
            <Select
              value={settings.defaults.providerId}
              onChange={(e) => {
                const id = e.target.value as ProviderId;
                setDefault('providerId', id);
                setDefault('modelId', PROVIDERS[id].models[0].id);
              }}
              options={PROVIDER_LIST.map((p) => ({ value: p.id, label: p.label }))}
            />
          </div>
          <div>
            <Label>Default model</Label>
            <Select
              value={settings.defaults.modelId}
              onChange={(e) => setDefault('modelId', e.target.value)}
              options={defaultModelOptions}
            />
          </div>
          <div className="col-span-2">
            <Label>Default form factor</Label>
            <Select
              value={settings.defaults.formFactor}
              onChange={(e) =>
                setDefault('formFactor', e.target.value as typeof settings.defaults.formFactor)
              }
              options={FORM_FACTORS.map((f) => ({
                value: f.id,
                label: `${f.label} — ${f.width}×${f.height}`,
              }))}
            />
          </div>
        </div>
      </Section>

      <Section title="Default prompt template">
        <Textarea
          rows={3}
          value={settings.defaults.promptTemplate}
          onChange={(e) => setDefault('promptTemplate', e.target.value)}
          placeholder={DEFAULT_PROMPT_TEMPLATE}
        />
        <p className="mt-2 text-[11px] text-text-faint">
          Use <code>{'{prompt}'}</code> as the placeholder for your prompt. The template wraps every
          generation, e.g.{' '}
          <code>{'{prompt}, professional photography, 8k'}</code>.
        </p>
      </Section>

      <Section title="Replicate CORS proxy">
        <Label>Worker URL</Label>
        <Input
          type="url"
          value={settings.replicateProxyUrl ?? ''}
          onChange={(e) => setReplicateProxyUrl(e.target.value)}
          placeholder={import.meta.env.REPLICATE_PROXY || 'https://your-worker.workers.dev'}
          spellCheck={false}
          autoComplete="off"
        />
        <p className="mt-2 text-2xs text-text-faint leading-snug">
          Replicate's API blocks browser requests (no CORS). Deploy the worker in{' '}
          <code>scripts/replicate-proxy.js</code> to a free Cloudflare Worker, then paste the URL
          here.{' '}
          {import.meta.env.REPLICATE_PROXY ? (
            <>
              A build-time default from <code>.env.production</code> is in effect — leave this
              field empty to use it, or paste a different URL to override.
            </>
          ) : (
            <>Leave empty to use other providers.</>
          )}
        </p>
      </Section>

      <Section title="Default negative prompt">
        <Textarea
          rows={3}
          value={settings.defaults.negativePrompt}
          onChange={(e) => setDefault('negativePrompt', e.target.value)}
          placeholder={DEFAULT_NEGATIVE_PROMPT}
        />
        <p className="mt-2 text-[11px] text-text-faint">
          What to <em>avoid</em> in the image. Sent natively to fal.ai, Replicate, and Imagen as
          <code> negative_prompt</code>; appended as <code>"Avoid: …"</code> for nano-banana and
          OpenAI (which don't have a dedicated field). Leave empty to disable.
        </p>
      </Section>

      <p className="text-[11px] text-text-faint text-center">
        Changes save automatically when you return to Generate.
      </p>
    </div>
  );
}
