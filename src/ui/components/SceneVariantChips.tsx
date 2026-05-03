import { SCENES } from '@shared/presets';
import { useStore } from '../state/store';
import { Chip } from './ui/Chip';

export function SceneVariantChips() {
  const scenes = useStore((s) => s.scenes);
  const toggle = useStore((s) => s.toggleScene);
  return (
    <div>
      <div className="text-[11px] font-medium text-text-muted mb-1.5">Scene variants</div>
      <div className="flex flex-wrap gap-1.5">
        {SCENES.map((s) => (
          <Chip key={s.id} selected={scenes.includes(s.id)} onClick={() => toggle(s.id)}>
            {s.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
