import { ArrowLeft, Check, Download, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { ResizeHandle } from '../components/ui/ResizeHandle';
import { Section } from '../components/ui/Section';
import { Slider } from '../components/ui/Slider';
import { sendToMain } from '../lib/messaging';
import {
  backCardSvg,
  buildZip,
  CARD_HEIGHT,
  CARD_WIDTH,
  frontCardSvg,
  NAME_CARD_PLACEHOLDERS,
  svgToPngBytes,
} from '../lib/nameCard';
import { useStore } from '../state/store';

function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded border border-border cursor-pointer shrink-0 p-0 bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function NameCardView() {
  const setView = useStore((s) => s.setView);
  const inFigma = useStore((s) => s.inFigma);
  const card = useStore((s) => s.nameCard);
  const setNameCard = useStore((s) => s.setNameCard);
  const resetNameCard = useStore((s) => s.resetNameCard);

  const [busy, setBusy] = useState<'idle' | 'adding' | 'downloading'>('idle');
  const [flash, setFlash] = useState<string | undefined>(undefined);

  const frontSvg = useMemo(() => frontCardSvg(card), [card]);
  const backSvg = useMemo(() => backCardSvg(card), [card]);

  const frontPreview = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(frontSvg)}`,
    [frontSvg],
  );
  const backPreview = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(backSvg)}`,
    [backSvg],
  );

  const showFlash = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(undefined), 1500);
  };

  const addToFigma = () => {
    setBusy('adding');
    sendToMain({
      type: 'add-svgs',
      items: [
        { svg: frontSvg, label: 'Name Card — Front', width: CARD_WIDTH, height: CARD_HEIGHT },
        { svg: backSvg, label: 'Name Card — Back', width: CARD_WIDTH, height: CARD_HEIGHT },
      ],
    });
    window.setTimeout(() => {
      setBusy('idle');
      showFlash('Added to canvas');
    }, 200);
  };

  const downloadCards = async () => {
    setBusy('downloading');
    try {
      const safeName =
        (card.name || 'name-card').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
        'name-card';

      const [frontBytes, backBytes] = await Promise.all([
        svgToPngBytes(frontSvg, CARD_WIDTH, CARD_HEIGHT, 3),
        svgToPngBytes(backSvg, CARD_WIDTH, CARD_HEIGHT, 3),
      ]);
      const zip = buildZip([
        { name: `${safeName}-front.png`, data: frontBytes },
        { name: `${safeName}-back.png`, data: backBytes },
      ]);
      const blob = new Blob([zip as BlobPart], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}-namecard.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
      showFlash('Downloaded');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendToMain({ type: 'notify', message, level: 'error' });
    } finally {
      setBusy('idle');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-bg text-text font-sans">
      <header className="flex items-center gap-1.5 px-3 h-9 border-b border-border bg-bg">
        <button
          type="button"
          onClick={() => setView('home')}
          title="Back to tools"
          className="inline-flex items-center justify-center size-6 rounded text-text-muted hover:text-text hover:bg-bg-subtle transition-colors"
        >
          <ArrowLeft className="size-3.5" />
        </button>
        <h2 className="text-xs font-semibold text-text flex-1">Name Card Generator</h2>
        <button
          type="button"
          onClick={resetNameCard}
          title="Reset to defaults"
          className="inline-flex items-center justify-center size-6 rounded text-text-muted hover:text-text hover:bg-bg-subtle transition-colors"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-3 space-y-3">
        <Section title="Preview">
          <div className="flex items-start justify-center gap-3 py-2 bg-bg-subtle rounded-md border border-border">
            <div className="flex flex-col items-center gap-1.5">
              <img
                src={frontPreview}
                alt="Front of name card"
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="shadow-soft rounded-sm bg-white"
              />
              <span className="text-2xs text-text-faint">Front</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <img
                src={backPreview}
                alt="Back of name card"
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="shadow-soft rounded-sm"
              />
              <span className="text-2xs text-text-faint">Back</span>
            </div>
          </div>
        </Section>

        <Section title="Details" collapsible defaultOpen>
          <div className="space-y-2">
            <div>
              <Label>Name</Label>
              <Input
                value={card.name}
                onChange={(e) => setNameCard({ name: e.target.value })}
                placeholder={NAME_CARD_PLACEHOLDERS.name}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Input
                value={card.role}
                onChange={(e) => setNameCard({ role: e.target.value })}
                placeholder={NAME_CARD_PLACEHOLDERS.role}
              />
            </div>
            <div>
              <Label>Phone number</Label>
              <Input
                value={card.phone}
                onChange={(e) => setNameCard({ phone: e.target.value })}
                placeholder={NAME_CARD_PLACEHOLDERS.phone}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={card.email}
                onChange={(e) => setNameCard({ email: e.target.value })}
                placeholder={NAME_CARD_PLACEHOLDERS.email}
              />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input
                value={card.qrUrl}
                onChange={(e) => setNameCard({ qrUrl: e.target.value })}
                placeholder={NAME_CARD_PLACEHOLDERS.qrUrl}
              />
            </div>
          </div>
        </Section>

        <Section title="Back gradient" defaultOpen={false} collapsible>
          <div className="space-y-2.5">
            <div className="flex items-end gap-2">
              <ColorPicker
                label="Top"
                value={card.gradientStart}
                onChange={(gradientStart) => setNameCard({ gradientStart })}
              />
              <ColorPicker
                label="Bottom"
                value={card.gradientEnd}
                onChange={(gradientEnd) => setNameCard({ gradientEnd })}
              />
            </div>
            <ColorPicker
              label="Glow"
              value={card.gradientGlow}
              onChange={(gradientGlow) => setNameCard({ gradientGlow })}
            />
            <Slider
              label="Balance (top ↔ bottom)"
              value={card.gradientBalance}
              min={0}
              max={100}
              onChange={(gradientBalance) => setNameCard({ gradientBalance })}
              suffix="%"
            />
            <Slider
              label="Glow height"
              value={card.gradientCurve}
              min={0}
              max={100}
              onChange={(gradientCurve) => setNameCard({ gradientCurve })}
              suffix="%"
            />
            <Slider
              label="Glow width"
              value={card.gradientWidth}
              min={0}
              max={100}
              onChange={(gradientWidth) => setNameCard({ gradientWidth })}
              suffix="%"
            />
            <Slider
              label="Grain"
              value={card.gradientGrain}
              min={0}
              max={100}
              onChange={(gradientGrain) => setNameCard({ gradientGrain })}
              suffix="%"
            />
            <div>
              <Label>Tagline</Label>
              <Input
                value={card.backTagline}
                onChange={(e) => setNameCard({ backTagline: e.target.value })}
                placeholder="Where frequent travellers engage with your brands daily"
              />
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t border-border bg-bg p-3 flex items-center gap-2">
        {inFigma && (
          <Button
            variant="primary"
            size="lg"
            onClick={addToFigma}
            disabled={busy !== 'idle'}
            iconLeft={flash === 'Added to canvas' ? <Check className="size-4" /> : <Plus className="size-4" />}
            className="flex-1"
          >
            {flash === 'Added to canvas' ? 'Added!' : 'Add to Figma'}
          </Button>
        )}
        <Button
          variant={inFigma ? 'secondary' : 'primary'}
          size="lg"
          fullWidth={!inFigma}
          onClick={downloadCards}
          disabled={busy !== 'idle'}
          iconLeft={flash === 'Downloaded' ? <Check className="size-4" /> : <Download className="size-4" />}
          className={inFigma ? undefined : 'flex-1'}
        >
          {flash === 'Downloaded'
            ? 'Downloaded!'
            : busy === 'downloading'
              ? 'Preparing…'
              : 'Download'}
        </Button>
      </footer>
      <ResizeHandle />
    </div>
  );
}
