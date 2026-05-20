import { HEYMAX_NATIVE_HEIGHT, HEYMAX_NATIVE_WIDTH, heymaxLogo } from './heymaxLogo';

export const RECT_WIDTH = 1034;
export const RECT_HEIGHT = 500;
export const SQUARE_SIZE = 1080;

export type CreativeBackground = 'auto' | 'solid' | 'gradient';
export type ResolvedBackground = 'solid' | 'gradient';

export interface CreativeLogo {
  dataUrl: string;
  width: number;
  height: number;
  name?: string;
  /** Average perceptual luminance of non-transparent pixels (0..1). */
  luminance: number;
}

export interface PartnerAdjust {
  /** -100..100 — horizontal offset as % of bounding-box half-width. 0 = centered. */
  offsetX: number;
  /** -100..100 — vertical offset as % of bounding-box half-height. 0 = centered. */
  offsetY: number;
  /** 50..200 — scale multiplier applied to the fitted size. */
  scale: number;
}

export type CreativeVariant = 'rect' | 'square';

export interface CreativesData {
  background: CreativeBackground;
  gradientStart: string;
  gradientEnd: string;
  gradientCx: number;
  gradientCy: number;
  gradientR: number;
  partnerLogo?: CreativeLogo;
  partnerAdjust: Record<CreativeVariant, PartnerAdjust>;
}

const DEFAULT_PARTNER_ADJUST: PartnerAdjust = { offsetX: 0, offsetY: 0, scale: 100 };

export const DEFAULT_CREATIVES: CreativesData = {
  background: 'auto',
  gradientStart: '#321B78',
  gradientEnd: '#130739',
  gradientCx: 25,
  gradientCy: 25,
  gradientR: 100,
  partnerLogo: undefined,
  partnerAdjust: {
    rect: { ...DEFAULT_PARTNER_ADJUST },
    square: { ...DEFAULT_PARTNER_ADJUST },
  },
};

/** Logos with average luminance above this are treated as "white-ish" and routed onto gradient. */
const LIGHT_LOGO_THRESHOLD = 0.75;

export function resolveBackground(d: CreativesData): ResolvedBackground {
  if (d.background !== 'auto') return d.background;
  if (!d.partnerLogo) return 'gradient';
  return d.partnerLogo.luminance > LIGHT_LOGO_THRESHOLD ? 'gradient' : 'solid';
}

function backgroundDefs(d: CreativesData, idPrefix: string): string {
  if (resolveBackground(d) === 'solid') return '';
  const id = `${idPrefix}-bg`;
  return `<radialGradient id="${id}" cx="${d.gradientCx}%" cy="${d.gradientCy}%" r="${d.gradientR}%">
    <stop offset="0%" stop-color="${d.gradientStart}" stop-opacity="1" />
    <stop offset="100%" stop-color="${d.gradientEnd}" stop-opacity="1" />
  </radialGradient>`;
}

function backgroundFill(bg: ResolvedBackground, idPrefix: string): string {
  if (bg === 'solid') return '#FFFFFF';
  return `url(#${idPrefix}-bg)`;
}

function heyFill(bg: ResolvedBackground): string {
  return bg === 'solid' ? '#130739' : '#FFFFFF';
}

function dividerColor(bg: ResolvedBackground): string {
  return bg === 'solid' ? '#130739' : '#FFFFFF';
}

interface PlacedLogo {
  width: number;
  height: number;
  x: number;
  y: number;
}

/** Fit a logo (preserving aspect ratio) inside a centered bounding box, then apply scale and offset. */
function fitLogo(
  logo: CreativeLogo,
  boxCx: number,
  boxCy: number,
  boxW: number,
  boxH: number,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
): PlacedLogo {
  const aspect = logo.width / logo.height;
  let w = boxW;
  let h = w / aspect;
  if (h > boxH) {
    h = boxH;
    w = h * aspect;
  }
  w *= scale;
  h *= scale;
  return {
    width: w,
    height: h,
    x: boxCx + offsetX - w / 2,
    y: boxCy + offsetY - h / 2,
  };
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function partnerLogoSvg(logo: CreativeLogo | undefined, box: PlacedLogo): string {
  if (!logo) return '';
  return `<image href="${escapeAttr(logo.dataUrl)}" x="${box.x.toFixed(2)}" y="${box.y.toFixed(2)}" width="${box.width.toFixed(2)}" height="${box.height.toFixed(2)}" preserveAspectRatio="xMidYMid meet" />`;
}

export function rectangleCreativeSvg(d: CreativesData): string {
  const W = RECT_WIDTH;
  const H = RECT_HEIGHT;
  const halfW = W / 2;
  const idPrefix = 'crRect';
  const padding = 80;
  const bg = resolveBackground(d);

  const heymaxW = 329;
  const heymaxH = (heymaxW * HEYMAX_NATIVE_HEIGHT) / HEYMAX_NATIVE_WIDTH;
  const heymaxX = halfW - padding - heymaxW;
  const heymaxY = H / 2 - heymaxH / 2;

  const logo = heymaxLogo({
    transform: `translate(${heymaxX.toFixed(2)}, ${heymaxY.toFixed(2)})`,
    width: heymaxW,
    heyFill: heyFill(bg),
    gradientId: `${idPrefix}-hmGrad`,
  });

  const dividerHeight = 192;
  const dividerY1 = (H - dividerHeight) / 2;
  const dividerY2 = dividerY1 + dividerHeight;
  const divider = `<line x1="${halfW}" y1="${dividerY1}" x2="${halfW}" y2="${dividerY2}" stroke="${dividerColor(bg)}" stroke-width="3" />`;

  const partnerBoxX = halfW + padding;
  const partnerBoxW = W - heymaxX - partnerBoxX;
  const partnerBoxH = 220;
  const adj = d.partnerAdjust.rect;
  const partnerBox = fitLogo(
    d.partnerLogo ?? { dataUrl: '', width: 1, height: 1, luminance: 1 },
    partnerBoxX + partnerBoxW / 2,
    H / 2,
    partnerBoxW,
    partnerBoxH,
    adj.scale / 100,
    (adj.offsetX / 100) * (partnerBoxW / 2),
    (adj.offsetY / 100) * (partnerBoxH / 2),
  );
  const partner = partnerLogoSvg(d.partnerLogo, partnerBox);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${backgroundDefs(d, idPrefix)}</defs>
  <rect width="${W}" height="${H}" fill="${backgroundFill(bg, idPrefix)}" />
  ${logo}
  ${divider}
  ${partner}
</svg>`.trim();
}

export function squareCreativeSvg(d: CreativesData): string {
  const W = SQUARE_SIZE;
  const H = SQUARE_SIZE;
  const halfH = H / 2;
  const idPrefix = 'crSquare';
  const padding = 160;
  const bg = resolveBackground(d);

  const heymaxW = 525;
  const heymaxH = (heymaxW * HEYMAX_NATIVE_HEIGHT) / HEYMAX_NATIVE_WIDTH;
  const heymaxX = W / 2 - heymaxW / 2;
  const heymaxY = halfH - padding - heymaxH;

  const logo = heymaxLogo({
    transform: `translate(${heymaxX.toFixed(2)}, ${heymaxY.toFixed(2)})`,
    width: heymaxW,
    heyFill: heyFill(bg),
    gradientId: `${idPrefix}-hmGrad`,
  });

  const dividerWidth = 674;
  const dividerX1 = (W - dividerWidth) / 2;
  const dividerX2 = dividerX1 + dividerWidth;
  const divider = `<line x1="${dividerX1}" y1="${halfH}" x2="${dividerX2}" y2="${halfH}" stroke="${dividerColor(bg)}" stroke-width="1.5" />`;

  const partnerBoxY = halfH + padding;
  const partnerBoxH = 280;
  const partnerBoxW = 600;
  const adj = d.partnerAdjust.square;
  const partnerBox = fitLogo(
    d.partnerLogo ?? { dataUrl: '', width: 1, height: 1, luminance: 1 },
    W / 2,
    partnerBoxY + partnerBoxH / 2,
    partnerBoxW,
    partnerBoxH,
    adj.scale / 100,
    (adj.offsetX / 100) * (partnerBoxW / 2),
    (adj.offsetY / 100) * (partnerBoxH / 2),
  );
  const partner = partnerLogoSvg(d.partnerLogo, partnerBox);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${backgroundDefs(d, idPrefix)}</defs>
  <rect width="${W}" height="${H}" fill="${backgroundFill(bg, idPrefix)}" />
  ${logo}
  ${divider}
  ${partner}
</svg>`.trim();
}

export async function readImageFile(file: File): Promise<CreativeLogo> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not decode image'));
    el.src = dataUrl;
  });
  const width = img.naturalWidth || 1;
  const height = img.naturalHeight || 1;
  const luminance = sampleLuminance(img, width, height);
  return { dataUrl, width, height, name: file.name, luminance };
}

function sampleLuminance(img: HTMLImageElement, naturalW: number, naturalH: number): number {
  const sampleW = 48;
  const sampleH = Math.max(1, Math.round(sampleW * (naturalH / naturalW)));
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 1;
  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 40) continue;
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    count++;
  }
  return count ? total / count : 1;
}
