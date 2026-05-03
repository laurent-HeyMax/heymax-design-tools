import { useStore } from '../state/store';
import { Input, Label } from './ui/Input';
import { Switch } from './ui/Switch';

export function DimensionsPicker() {
  const cd = useStore((s) => s.customDimensions);
  const setCD = useStore((s) => s.setCustomDimensions);
  return (
    <div>
      <Switch
        checked={cd.enabled}
        onChange={(v) => setCD(v)}
        label="Custom dimensions"
        description="Override form-factor presets with exact width × height."
      />
      {cd.enabled && (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div>
            <Label>Width</Label>
            <Input
              type="number"
              min={64}
              max={4096}
              value={cd.width}
              onChange={(e) => setCD(true, Number(e.target.value), cd.height)}
            />
          </div>
          <div>
            <Label>Height</Label>
            <Input
              type="number"
              min={64}
              max={4096}
              value={cd.height}
              onChange={(e) => setCD(true, cd.width, Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
