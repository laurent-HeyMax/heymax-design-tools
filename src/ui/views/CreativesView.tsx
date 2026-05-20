import { ArrowLeft, Check, Download, ImagePlus, Plus, RotateCcw, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Input, Label } from '../components/ui/Input';
import { ResizeHandle } from '../components/ui/ResizeHandle';
import { Section } from '../components/ui/Section';
import { Slider } from '../components/ui/Slider';
import {
  RECT_HEIGHT,
  RECT_WIDTH,
  SQUARE_SIZE,
  rectangleCreativeSvg,
  readImageFile,
  resolveBackground,
  squareCreativeSvg,
} from '../lib/creatives';
import { sendToMain } from '../lib/messaging';
import { buildZip, svgToPngBytes } from '../lib/nameCard';
import { useStore } from '../state/store';

export function CreativesView() {
  const setView = useStore((s) => s.setView);
  const inFigma = useStore((s) => s.inFigma);
  const creatives = useStore((s) => s.creatives);
  const setCreatives = useStore((s) => s.setCreatives);
  const resetCreatives = useStore((s) => s.resetCreatives);

  const [busy, setBusy] = useState<'idle' | 'adding' | 'downloading'>('idle');
  const [flash, setFlash] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [adjustVariant, setAdjustVariant] = useState<'rect' | 'square'>('rect');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rectSvg = useMemo(() => rectangleCreativeSvg(creatives), [creatives]);
  const squareSvg = useMemo(() => squareCreativeSvg(creatives), [creatives]);

  const rectPreview = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(rectSvg)}`,
    [rectSvg],
  );
  const squarePreview = useMemo(
    () => `data:image/svg+xml;utf8,${encodeURIComponent(squareSvg)}`,
    [squareSvg],
  );

  const showFlash = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(undefined), 1500);
  };

  const onUpload = async (file: File | undefined) => {
    setUploadError(undefined);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file.');
      return;
    }
    try {
      const logo = await readImageFile(file);
      setCreatives({ partnerLogo: logo });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not read image');
    }
  };

  const clearLogo = () => setCreatives({ partnerLogo: undefined });

  const addToFigma = async () => {
    setBusy('adding');
    try {
      const [rectBytes, squareBytes] = await Promise.all([
        svgToPngBytes(rectSvg, RECT_WIDTH, RECT_HEIGHT, 1),
        svgToPngBytes(squareSvg, SQUARE_SIZE, SQUARE_SIZE, 1),
      ]);
      sendToMain({
        type: 'add-images',
        payloads: [
          {
            bytes: rectBytes,
            width: RECT_WIDTH,
            height: RECT_HEIGHT,
            label: 'Partnership Banner — Rectangle 1034×500',
          },
          {
            bytes: squareBytes,
            width: SQUARE_SIZE,
            height: SQUARE_SIZE,
            label: 'Partnership Banner — Square 1080×1080',
          },
        ],
      });
      showFlash('Added to canvas');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendToMain({ type: 'notify', message, level: 'error' });
    } finally {
      setBusy('idle');
    }
  };

  const downloadAll = async () => {
    setBusy('downloading');
    try {
      const [rectBytes, squareBytes] = await Promise.all([
        svgToPngBytes(rectSvg, RECT_WIDTH, RECT_HEIGHT, 1),
        svgToPngBytes(squareSvg, SQUARE_SIZE, SQUARE_SIZE, 1),
      ]);
      const partnerSlug = creatives.partnerLogo?.name
        ?.replace(/\.[^.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const slug = partnerSlug ? `partnership-banner-${partnerSlug}` : 'partnership-banner';
      const zip = buildZip([
        { name: `${slug}-rectangle-1034x500.png`, data: rectBytes },
        { name: `${slug}-square-1080x1080.png`, data: squareBytes },
      ]);
      const blob = new Blob([zip as BlobPart], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.zip`;
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

  const resolvedBg = resolveBackground(creatives);
  const previewBgClass =
    resolvedBg === 'solid'
      ? 'bg-[repeating-conic-gradient(#f5f5f5_0_25%,#ffffff_0_50%)] bg-[length:16px_16px]'
      : 'bg-bg-subtle';
  const autoHint =
    creatives.background === 'auto'
      ? creatives.partnerLogo
        ? `Auto → ${resolvedBg === 'gradient' ? 'Gradient' : 'Solid'} (logo luminance ${(creatives.partnerLogo.luminance * 100).toFixed(0)}%)`
        : 'Auto → Gradient (upload a logo to switch automatically)'
      : undefined;

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
        <h2 className="text-xs font-semibold text-text flex-1">Partnership Banner Generator</h2>
        <button
          type="button"
          onClick={resetCreatives}
          title="Reset"
          className="inline-flex items-center justify-center size-6 rounded text-text-muted hover:text-text hover:bg-bg-subtle transition-colors"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-3 space-y-3">
        <Section title="Preview">
          <div className={`flex flex-col items-center gap-3 py-3 rounded-md border border-border ${previewBgClass}`}>
            <div className="flex flex-col items-center gap-1.5">
              <img
                src={rectPreview}
                alt="Rectangle banner preview"
                className="shadow-soft rounded-sm max-w-[92%] h-auto"
                style={{ width: 380, aspectRatio: `${RECT_WIDTH} / ${RECT_HEIGHT}` }}
              />
              <span className="text-2xs text-text-faint">Rectangle · 1034 × 500</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <img
                src={squarePreview}
                alt="Square banner preview"
                className="shadow-soft rounded-sm max-w-[92%] h-auto"
                style={{ width: 280, aspectRatio: '1 / 1' }}
              />
              <span className="text-2xs text-text-faint">Square · 1080 × 1080</span>
            </div>
          </div>
        </Section>

        <Section title="Partner logo">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onUpload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {creatives.partnerLogo ? (
            <div className="flex items-center gap-2.5">
              <div className="size-12 shrink-0 rounded border border-border bg-bg-subtle flex items-center justify-center overflow-hidden">
                <img
                  src={creatives.partnerLogo.dataUrl}
                  alt="Partner logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-text truncate">
                  {creatives.partnerLogo.name || 'partner-logo'}
                </div>
                <div className="text-2xs text-text-faint">
                  {creatives.partnerLogo.width} × {creatives.partnerLogo.height}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                title="Replace logo"
              >
                <Upload className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearLogo}
                title="Remove logo"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-md border border-dashed border-border text-text-muted hover:text-text hover:border-border-strong hover:bg-bg-subtle transition-colors"
            >
              <ImagePlus className="size-4" />
              <span className="text-xs font-medium">Upload partner logo</span>
            </button>
          )}
          {uploadError && (
            <p className="mt-2 text-2xs text-text-danger">{uploadError}</p>
          )}
          {creatives.partnerLogo && (() => {
            const adj = creatives.partnerAdjust[adjustVariant];
            const setAdj = (patch: Partial<typeof adj>) =>
              setCreatives({
                partnerAdjust: {
                  ...creatives.partnerAdjust,
                  [adjustVariant]: { ...adj, ...patch },
                },
              });
            return (
              <div className="mt-3 pt-3 border-t border-border space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Chip
                    selected={adjustVariant === 'rect'}
                    onClick={() => setAdjustVariant('rect')}
                  >
                    Rectangle
                  </Chip>
                  <Chip
                    selected={adjustVariant === 'square'}
                    onClick={() => setAdjustVariant('square')}
                  >
                    Square
                  </Chip>
                </div>
                <Slider
                  label="Offset X"
                  value={adj.offsetX}
                  min={-100}
                  max={100}
                  onChange={(offsetX) => setAdj({ offsetX })}
                  suffix="%"
                />
                <Slider
                  label="Offset Y"
                  value={adj.offsetY}
                  min={-100}
                  max={100}
                  onChange={(offsetY) => setAdj({ offsetY })}
                  suffix="%"
                />
                <Slider
                  label="Scale"
                  value={adj.scale}
                  min={50}
                  max={200}
                  onChange={(scale) => setAdj({ scale })}
                  suffix="%"
                />
              </div>
            );
          })()}
        </Section>

        <Section title="Background">
          <div className="flex items-center gap-1.5">
            <Chip
              selected={creatives.background === 'auto'}
              onClick={() => setCreatives({ background: 'auto' })}
            >
              Auto
            </Chip>
            <Chip
              selected={creatives.background === 'solid'}
              onClick={() => setCreatives({ background: 'solid' })}
            >
              Solid
            </Chip>
            <Chip
              selected={creatives.background === 'gradient'}
              onClick={() => setCreatives({ background: 'gradient' })}
            >
              Gradient
            </Chip>
          </div>
          {autoHint && (
            <p className="mt-2 text-2xs text-text-faint">{autoHint}</p>
          )}
          {resolvedBg === 'gradient' && (
            <div className="mt-3 pt-3 border-t border-border space-y-2.5">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Start</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={creatives.gradientStart}
                      onChange={(e) => setCreatives({ gradientStart: e.target.value })}
                      className="h-8 w-8 rounded border border-border cursor-pointer shrink-0 p-0 bg-transparent"
                    />
                    <Input
                      value={creatives.gradientStart}
                      onChange={(e) => setCreatives({ gradientStart: e.target.value })}
                      className="font-mono"
                      placeholder="#321B78"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label>End</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={creatives.gradientEnd}
                      onChange={(e) => setCreatives({ gradientEnd: e.target.value })}
                      className="h-8 w-8 rounded border border-border cursor-pointer shrink-0 p-0 bg-transparent"
                    />
                    <Input
                      value={creatives.gradientEnd}
                      onChange={(e) => setCreatives({ gradientEnd: e.target.value })}
                      className="font-mono"
                      placeholder="#130739"
                    />
                  </div>
                </div>
              </div>
              <Slider
                label="Center X"
                value={creatives.gradientCx}
                min={0}
                max={100}
                onChange={(gradientCx) => setCreatives({ gradientCx })}
                suffix="%"
              />
              <Slider
                label="Center Y"
                value={creatives.gradientCy}
                min={0}
                max={100}
                onChange={(gradientCy) => setCreatives({ gradientCy })}
                suffix="%"
              />
              <Slider
                label="Radius"
                value={creatives.gradientR}
                min={20}
                max={200}
                onChange={(gradientR) => setCreatives({ gradientR })}
                suffix="%"
              />
            </div>
          )}
        </Section>
      </main>

      <footer className="border-t border-border bg-bg p-3 flex items-center gap-2">
        {inFigma && (
          <Button
            variant="primary"
            size="lg"
            onClick={addToFigma}
            disabled={busy !== 'idle'}
            iconLeft={
              flash === 'Added to canvas' ? <Check className="size-4" /> : <Plus className="size-4" />
            }
            className="flex-1"
          >
            {flash === 'Added to canvas'
              ? 'Added!'
              : busy === 'adding'
                ? 'Adding…'
                : 'Add to Figma'}
          </Button>
        )}
        <Button
          variant={inFigma ? 'secondary' : 'primary'}
          size="lg"
          fullWidth={!inFigma}
          onClick={downloadAll}
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
