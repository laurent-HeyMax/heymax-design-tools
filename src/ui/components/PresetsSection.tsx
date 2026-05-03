import { CITIES, STYLES } from '@shared/presets';
import { useStore } from '../state/store';
import { Chip } from './ui/Chip';
import { Section } from './ui/Section';
import { Select } from './ui/Select';

export function PresetsSection() {
  const cityId = useStore((s) => s.cityId);
  const styleId = useStore((s) => s.styleId);
  const setCity = useStore((s) => s.setCity);
  const setStyle = useStore((s) => s.setStyle);

  return (
    <Section title="Presets" defaultOpen={false} collapsible>
      <div className="space-y-3.5">
        <div>
          <div className="text-[11px] font-medium text-text-muted mb-1.5">City</div>
          <Select
            value={cityId ?? ''}
            onChange={(e) => setCity(e.target.value || undefined)}
            options={[{ value: '', label: 'None' }, ...CITIES.map((c) => ({ value: c.id, label: c.label }))]}
          />
          {cityId && (
            <p className="mt-1.5 text-[10.5px] text-text-faint line-clamp-2 leading-snug">
              {CITIES.find((c) => c.id === cityId)?.promptAddition}
            </p>
          )}
        </div>

        <div>
          <div className="text-[11px] font-medium text-text-muted mb-1.5">Style</div>
          <div className="flex flex-wrap gap-1.5">
            <Chip selected={!styleId} onClick={() => useStore.setState({ styleId: undefined })}>
              None
            </Chip>
            {STYLES.map((s) => (
              <Chip
                key={s.id}
                selected={styleId === s.id}
                onClick={() => setStyle(s.id)}
                title={s.promptAddition}
              >
                {s.label}
              </Chip>
            ))}
          </div>
          {styleId && (
            <p className="mt-1.5 text-[10.5px] text-text-faint line-clamp-2 leading-snug">
              {STYLES.find((s) => s.id === styleId)?.promptAddition}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
