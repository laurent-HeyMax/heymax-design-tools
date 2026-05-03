import { DimensionsPicker } from './DimensionsPicker';
import { FormFactorChips } from './FormFactorChips';
import { SceneVariantChips } from './SceneVariantChips';
import { Section } from './ui/Section';

export function CustomizationsSection() {
  return (
    <Section title="Customizations" defaultOpen={false} collapsible>
      <div className="space-y-4">
        <FormFactorChips />
        <SceneVariantChips />
        <div className="pt-1 border-t border-border-subtle">
          <DimensionsPicker />
        </div>
      </div>
    </Section>
  );
}
