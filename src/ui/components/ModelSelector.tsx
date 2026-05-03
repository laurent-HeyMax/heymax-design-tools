import type { ProviderId } from '@shared/messages';
import { useEffect } from 'react';
import { PROVIDERS, PROVIDER_LIST } from '../providers/registry';
import { useStore } from '../state/store';
import { Label } from './ui/Input';
import { Section } from './ui/Section';
import { Select } from './ui/Select';

export function ModelSelector() {
  const providerId = useStore((s) => s.providerId);
  const modelId = useStore((s) => s.modelId);
  const referenceImage = useStore((s) => s.referenceImage);
  const setProvider = useStore((s) => s.setProvider);
  const setModel = useStore((s) => s.setModel);
  const apiKeys = useStore((s) => s.settings.apiKeys);

  const provider = PROVIDERS[providerId];
  const requiresReference = !!referenceImage;

  useEffect(() => {
    if (!provider.models.find((m) => m.id === modelId)) {
      setModel(provider.models[0].id);
    }
  }, [providerId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Section title="Model">
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <div>
          <Label>Provider</Label>
          <Select
            value={providerId}
            onChange={(e) => setProvider(e.target.value as ProviderId)}
            options={PROVIDER_LIST.map((p) => ({
              value: p.id,
              label: apiKeys[p.id] ? p.label : `${p.label} (no key)`,
            }))}
          />
        </div>
        <div>
          <Label>Model</Label>
          <Select
            value={modelId}
            onChange={(e) => setModel(e.target.value)}
            options={provider.models.map((m) => ({
              value: m.id,
              label: m.label + (requiresReference && !m.supportsReference ? ' — no reference support' : ''),
              disabled: requiresReference && !m.supportsReference,
            }))}
          />
        </div>
      </div>
      {!apiKeys[providerId] && (
        <p className="mt-2 text-2xs text-text-warning">
          No API key set for {provider.label}. Add one in Settings before generating.
        </p>
      )}
    </Section>
  );
}
