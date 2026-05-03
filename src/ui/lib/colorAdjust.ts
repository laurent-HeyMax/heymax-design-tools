import { loadImageFromBytes } from './imageBytes';

export interface ColorAdjustments {
  saturation: number; // 0..200 (%)
  contrast: number;   // 0..200 (%)
  brightness: number; // 0..200 (%)
  hue: number;        // -180..180 (deg)
  overlay: {
    enabled: boolean;
    color: string;     // hex e.g. "#ff8800"
    opacity: number;   // 0..1
    blendMode: GlobalCompositeOperation;
  };
}

export const NEUTRAL_ADJUSTMENTS: ColorAdjustments = {
  saturation: 100,
  contrast: 100,
  brightness: 100,
  hue: 0,
  overlay: { enabled: false, color: '#7c5cff', opacity: 0.25, blendMode: 'overlay' },
};

export function isNeutral(adj: ColorAdjustments): boolean {
  return (
    adj.saturation === 100 &&
    adj.contrast === 100 &&
    adj.brightness === 100 &&
    adj.hue === 0 &&
    !adj.overlay.enabled
  );
}

export function buildCssFilter(adj: ColorAdjustments): string {
  return `saturate(${adj.saturation}%) contrast(${adj.contrast}%) brightness(${adj.brightness}%) hue-rotate(${adj.hue}deg)`;
}

function drawWith(
  source: CanvasImageSource,
  width: number,
  height: number,
  adj: ColorAdjustments,
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) {
  ctx.save();
  ctx.filter = buildCssFilter(adj);
  ctx.drawImage(source, 0, 0, width, height);
  ctx.restore();

  if (adj.overlay.enabled && adj.overlay.opacity > 0) {
    ctx.save();
    ctx.globalCompositeOperation = adj.overlay.blendMode;
    ctx.globalAlpha = adj.overlay.opacity;
    ctx.fillStyle = adj.overlay.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

export async function applyToBytes(
  bytes: Uint8Array,
  mimeType: string,
  adj: ColorAdjustments,
): Promise<Uint8Array> {
  if (isNeutral(adj)) return bytes;
  const img = await loadImageFromBytes(bytes, mimeType);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable');
    drawWith(img, w, h, adj, ctx);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return new Uint8Array(await blob.arrayBuffer());
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d context unavailable');
  drawWith(img, w, h, adj, ctx);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Canvas toBlob failed');
  return new Uint8Array(await blob.arrayBuffer());
}

export function paintToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  adj: ColorAdjustments,
) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  drawWith(img, w, h, adj, ctx);
}
