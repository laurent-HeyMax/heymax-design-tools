import { useStore } from '../state/store';
import { Section } from './ui/Section';
import { Textarea } from './ui/Input';

export function PromptPanel() {
  const prompt = useStore((s) => s.prompt);
  const setPrompt = useStore((s) => s.setPrompt);
  return (
    <Section title="Prompt">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image you want to generate..."
        rows={4}
      />
      <p className="mt-2 text-[11px] text-text-faint">
        Tip: be specific. Mention subject, setting, lighting, style, and mood. The default prompt
        template (Settings) will wrap this.
      </p>
    </Section>
  );
}
