import { FORM_FACTORS } from '@shared/presets';
import { useStore } from '../state/store';
import { Chip } from './ui/Chip';

export function FormFactorChips() {
  const formFactors = useStore((s) => s.formFactors);
  const toggle = useStore((s) => s.toggleFormFactor);
  const cdEnabled = useStore((s) => s.customDimensions.enabled);

  return (
    <div>
      <div className="text-[11px] font-medium text-text-muted mb-1.5">Form factor</div>
      <div className="flex flex-wrap gap-1.5">
        {FORM_FACTORS.map((f) => (
          <Chip
            key={f.id}
            selected={formFactors.includes(f.id)}
            onClick={() => toggle(f.id)}
            disabled={cdEnabled}
            title={`${f.width}×${f.height}`}
          >
            {f.label}
          </Chip>
        ))}
      </div>
      {cdEnabled && (
        <p className="mt-1.5 text-[11px] text-text-faint">Disabled while custom dimensions are on.</p>
      )}
    </div>
  );
}
