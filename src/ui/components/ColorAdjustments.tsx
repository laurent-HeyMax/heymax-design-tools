import { RotateCcw } from 'lucide-react';
import { useStore } from '../state/store';
import { Button } from './ui/Button';
import { Section } from './ui/Section';
import { Select } from './ui/Select';
import { Slider } from './ui/Slider';
import { Switch } from './ui/Switch';

const BLEND_MODES: GlobalCompositeOperation[] = [
  'multiply',
  'screen',
  'overlay',
  'soft-light',
  'color',
  'hue',
  'darken',
  'lighten',
];

export function ColorAdjustmentsPanel() {
  const adj = useStore((s) => s.adjustments);
  const setAdj = useStore((s) => s.setAdjustments);
  const setOverlay = useStore((s) => s.setOverlay);
  const reset = useStore((s) => s.resetAdjustments);

  return (
    <Section
      title="Color adjustments"
      defaultOpen={false}
      collapsible
      trailing={
        <Button size="sm" variant="ghost" onClick={reset} iconLeft={<RotateCcw className="size-3" />}>
          Reset
        </Button>
      }
    >
      <div className="space-y-2.5">
        <Slider
          label="Saturation"
          suffix="%"
          min={0}
          max={200}
          value={adj.saturation}
          onChange={(v) => setAdj({ saturation: v })}
        />
        <Slider
          label="Contrast"
          suffix="%"
          min={0}
          max={200}
          value={adj.contrast}
          onChange={(v) => setAdj({ contrast: v })}
        />
        <Slider
          label="Brightness"
          suffix="%"
          min={0}
          max={200}
          value={adj.brightness}
          onChange={(v) => setAdj({ brightness: v })}
        />
        <Slider
          label="Hue shift"
          suffix="°"
          min={-180}
          max={180}
          value={adj.hue}
          onChange={(v) => setAdj({ hue: v })}
        />
      </div>

      <div className="mt-4 pt-3 border-t border-border-subtle">
        <Switch
          checked={adj.overlay.enabled}
          onChange={(v) => setOverlay({ enabled: v })}
          label="Color overlay"
          description="Tint the image with a blended color."
        />
        {adj.overlay.enabled && (
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={adj.overlay.color}
                onChange={(e) => setOverlay({ color: e.target.value })}
                className="h-8 w-10 rounded-md cursor-pointer border border-border bg-transparent"
              />
              <Select
                className="flex-1"
                value={adj.overlay.blendMode}
                onChange={(e) => setOverlay({ blendMode: e.target.value as GlobalCompositeOperation })}
                options={BLEND_MODES.map((b) => ({ value: b, label: b }))}
              />
            </div>
            <Slider
              label="Opacity"
              suffix="%"
              min={0}
              max={100}
              value={Math.round(adj.overlay.opacity * 100)}
              onChange={(v) => setOverlay({ opacity: v / 100 })}
            />
          </div>
        )}
      </div>
    </Section>
  );
}
