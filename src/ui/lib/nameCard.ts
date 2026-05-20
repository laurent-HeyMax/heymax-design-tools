import qrcode from 'qrcode-generator';
import pjsVariableUrl from '../assets/fonts/PlusJakartaSans-Variable.woff2';

export const CARD_WIDTH = 204;
export const CARD_HEIGHT = 340;

const FONT_FACE_BLOCK = `
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 200 800;
      src: url(${pjsVariableUrl}) format('woff2-variations');
    }`;

export interface NameCardData {
  name: string;
  role: string;
  phone: string;
  email: string;
  /** URL that gets encoded as a QR on the front of the card (e.g. a LinkedIn profile). */
  qrUrl: string;
  backTagline: string;
  /** Top of the linear background gradient. */
  gradientStart: string;
  /** Bottom of the linear background gradient. */
  gradientEnd: string;
  /** Bright radial glow anchored at bottom-center, layered on top of the linear gradient. */
  gradientGlow: string;
  /** 0–100. 50 = even top-to-bottom. >50 pushes the end color toward the bottom; <50 pushes it toward the top. */
  gradientBalance: number;
  /** 0–100. Controls how far up the radial glow reaches and how visible it is. */
  gradientCurve: number;
  /** 0–100. Controls how wide the radial glow spreads horizontally. */
  gradientWidth: number;
  /** 0–100. Intensity of the paper-grain noise overlay across the card. */
  gradientGrain: number;
}

export const NAME_CARD_PLACEHOLDERS = {
  name: 'Your Name Here',
  role: 'This is your job title',
  phone: '+65 1234 5678',
  email: 'name@heymax.ai',
  qrUrl: 'https://linkedin.com/in/your-handle',
} as const;

export const DEFAULT_NAME_CARD: NameCardData = {
  name: '',
  role: '',
  phone: '',
  email: '',
  qrUrl: '',
  backTagline: 'Where frequent travellers engage with your brands daily',
  gradientStart: '#130739',
  gradientEnd: '#35149F',
  gradientGlow: '#C12BDF',
  gradientBalance: 58,
  gradientCurve: 100,
  gradientWidth: 72,
  gradientGrain: 25,
};

function qrRects(text: string, x: number, y: number, size: number): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const cell = size / count;
  const rects: string[] = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        const rx = (x + c * cell).toFixed(3);
        const ry = (y + r * cell).toFixed(3);
        const w = cell.toFixed(3);
        rects.push(`<rect x="${rx}" y="${ry}" width="${w}" height="${w}" fill="#000000" />`);
      }
    }
  }
  return rects.join('');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const FONT_STACK =
  "'Plus Jakarta Sans','Inter','Inter Variable','-apple-system','SF Pro Text','Segoe UI','Roboto',sans-serif";

const HEYMAX_NATIVE_WIDTH = 540;
const HEYMAX_NATIVE_HEIGHT = 88;

function heymaxLogo(opts: {
  transform: string;
  width: number;
  heyFill: string;
  gradientId: string;
}): string {
  const { transform, width, heyFill, gradientId } = opts;
  const scale = width / HEYMAX_NATIVE_WIDTH;
  return `<g transform="${transform} scale(${scale.toFixed(5)})">
    <defs>
      <linearGradient id="${gradientId}" x1="251.467" y1="43.6364" x2="489.741" y2="156.781" gradientUnits="userSpaceOnUse">
        <stop stop-color="#802EFF" />
        <stop offset="1" stop-color="#D400FF" />
      </linearGradient>
    </defs>
    <path d="M482.741 0.363632L498.679 27.9347H499.361L515.469 0.363632H539.077L512.741 44L539.929 87.6364H515.724L499.361 59.767H498.679L482.315 87.6364H458.281L485.341 44L458.963 0.363632H482.741Z" fill="url(#${gradientId})" />
    <path fill-rule="evenodd" clip-rule="evenodd" d="M365.021 87.6364H387.692L391.956 74.0271L391.875 74.0012L393.372 69.3125L396.604 59.192L398.489 53.2898H398.453L408.146 22.3523H408.828L418.542 53.2898H410.155L405.038 69.3125H423.572L429.325 87.6364H451.996L422.55 0.363632H394.468L365.021 87.6364Z" fill="url(#${gradientId})" />
    <path d="M258.072 0.363632H284.194L306.354 54.3977H307.376L329.535 0.363632H355.658V87.6364H335.118V34.0284H334.393L313.427 87.0824H300.302L279.336 33.7301H278.612V87.6364H258.072V0.363632Z" fill="url(#${gradientId})" />
    <path d="M159.555 0.363632H183.12L201.572 36.8835H202.339L220.79 0.363632H244.356L212.438 58.4886V87.6364H191.472V58.4886L159.555 0.363632Z" fill="${heyFill}" />
    <path d="M90.0723 87.6364V0.363632H150.925V17.4943H111.166V35.392H147.814V52.5653H111.166V70.5057H150.925V87.6364H90.0723Z" fill="${heyFill}" />
    <path d="M0.0722656 87.6364V0.363632H21.166V35.392H55.5552V0.363632H76.6064V87.6364H55.5552V52.5653H21.166V87.6364H0.0722656Z" fill="${heyFill}" />
  </g>`;
}

interface SvgOptions {
  trim?: boolean;
}

function clip(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, Math.max(0, maxLen - 1)) + '…';
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const truncated = lines.slice(0, maxLines);
  const lastIdx = truncated.length - 1;
  truncated[lastIdx] =
    truncated[lastIdx].length + 1 <= maxChars
      ? truncated[lastIdx] + '…'
      : truncated[lastIdx].slice(0, maxChars - 1) + '…';
  return truncated;
}

export function frontCardSvg(d: NameCardData, _opts: SvgOptions = {}): string {
  const PAD = 16;
  const logoWidth = 65;

  const logo = heymaxLogo({
    transform: `translate(${PAD}, ${PAD})`,
    width: logoWidth,
    heyFill: '#130739',
    gradientId: 'hmFrontGrad',
  });

  const dashed = (y: number) =>
    `<line x1="0" y1="${y}" x2="${CARD_WIDTH}" y2="${y}" stroke="#D9D9D9" stroke-width="1" stroke-dasharray="5,3" />`;

  const qrSize = 64;
  const qrTrimmed = d.qrUrl?.trim() || NAME_CARD_PLACEHOLDERS.qrUrl;

  const nameLines = wrap(d.name || NAME_CARD_PLACEHOLDERS.name, 22, 2);
  const roleLines = wrap(d.role || NAME_CARD_PLACEHOLDERS.role, 34, 2);
  const nameBaseY = 72;
  const nameLineHeight = 16;
  const roleLineHeight = 11;
  const extraNameShift = Math.max(0, nameLines.length - 1) * nameLineHeight;
  const extraRoleShift = Math.max(0, roleLines.length - 1) * roleLineHeight;
  const totalShift = extraNameShift + extraRoleShift;
  const roleBaseY = nameBaseY + extraNameShift + 16;

  const mobileY = 124 + totalShift;
  const phoneY = mobileY + 18;
  const emailLabelY = phoneY + 32;
  const emailValueY = emailLabelY + 18;
  const dashedBottomY = Math.max(220, emailValueY + 12);
  const linkedinLabelY = dashedBottomY + 24;
  const qrYDyn = Math.min(CARD_HEIGHT - PAD - qrSize, linkedinLabelY + 12);

  const nameTspans = nameLines
    .map((line, i) => `<tspan x="${PAD}" dy="${i === 0 ? 0 : nameLineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  const roleTspans = roleLines
    .map((line, i) => `<tspan x="${PAD}" dy="${i === 0 ? 0 : roleLineHeight}">${escapeXml(line)}</tspan>`)
    .join('');

  const qrPlaced = qrRects(qrTrimmed, PAD, qrYDyn, qrSize);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs><style>${FONT_FACE_BLOCK}</style></defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#FFFFFF" />
  ${logo}
  ${dashed(40)}

  <text x="${PAD}" y="${nameBaseY}" font-family="${FONT_STACK}" font-weight="700" font-size="14" fill="#313131">${nameTspans}</text>
  <text x="${PAD}" y="${roleBaseY}" font-family="${FONT_STACK}" font-weight="400" font-size="9" fill="#808080">${roleTspans}</text>

  <text x="${PAD}" y="${mobileY}" font-family="${FONT_STACK}" font-weight="500" font-size="8" fill="#A3A3A3" letter-spacing="1">MOBILE</text>
  <text x="${PAD}" y="${phoneY}" font-family="${FONT_STACK}" font-weight="600" font-size="11" fill="#313131">${escapeXml(clip(d.phone || NAME_CARD_PLACEHOLDERS.phone, 26))}</text>

  <text x="${PAD}" y="${emailLabelY}" font-family="${FONT_STACK}" font-weight="500" font-size="8" fill="#A3A3A3" letter-spacing="1">EMAIL</text>
  <text x="${PAD}" y="${emailValueY}" font-family="${FONT_STACK}" font-weight="600" font-size="11" fill="#313131">${escapeXml(clip(d.email || NAME_CARD_PLACEHOLDERS.email, 26))}</text>

  ${dashed(dashedBottomY)}

  <text x="${PAD}" y="${linkedinLabelY}" font-family="${FONT_STACK}" font-weight="500" font-size="8" fill="#A3A3A3" letter-spacing="1">LINKEDIN</text>
  ${qrPlaced}
</svg>`.trim();
}

export function backCardSvg(d: NameCardData): string {
  const gradId = 'ncGrad';
  const PAD = 20;

  const tagline = escapeXml(d.backTagline || '');

  // Rotated 90° clockwise so the logo reads top-to-bottom on the back of the card.
  const backLogoWidth = 180;
  const backLogoHeight = (backLogoWidth * HEYMAX_NATIVE_HEIGHT) / HEYMAX_NATIVE_WIDTH;
  const logo = heymaxLogo({
    transform: `translate(${(PAD + backLogoHeight).toFixed(2)}, ${PAD}) rotate(90)`,
    width: backLogoWidth,
    heyFill: '#FFFFFF',
    gradientId: 'hmBackGrad',
  });

  const taglineFontSize = 12;
  const taglineLineHeight = 17;
  const lines = layoutTagline(tagline);
  const taglineBottomPad = 28;
  const firstBaselineY = CARD_HEIGHT - taglineBottomPad - (lines.length - 1) * taglineLineHeight;

  const balance = Math.max(0, Math.min(100, d.gradientBalance ?? 50));
  const stopStart = Math.max(0, (balance - 50) * 2);
  const stopEnd = Math.min(100, balance * 2);
  const curve = Math.max(0, Math.min(100, d.gradientCurve ?? 0));
  const curveStrength = curve / 100;

  // Radial spotlight: wide and short ellipse anchored at the bottom-center.
  // We use a unit-radius circle and stretch it via gradientTransform — browsers
  // don't reliably honor rx/ry on <radialGradient> but they all support transforms.
  const widthStrength = Math.max(0, Math.min(100, d.gradientWidth ?? 70)) / 100;
  const grainStrength = Math.max(0, Math.min(100, d.gradientGrain ?? 50)) / 100;
  const radialCx = CARD_WIDTH / 2;
  const radialCy = CARD_HEIGHT;
  const radialRxPx = 35 + widthStrength * 170;
  const radialRyPx = (14 + curveStrength * 24) * (CARD_HEIGHT / 100);
  const radialOpacity = Math.min(1, 0.2 + curveStrength * 0.7);
  const radialId = `${gradId}-radial`;
  const grainId = `${gradId}-grain`;
  const grainAlpha = (grainStrength * 0.32).toFixed(3);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>
    <style>${FONT_FACE_BLOCK}</style>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="${stopStart}%" stop-color="${d.gradientStart}" />
      <stop offset="${stopEnd}%" stop-color="${d.gradientEnd}" />
    </linearGradient>
    <radialGradient
      id="${radialId}"
      cx="${radialCx}"
      cy="${radialCy}"
      r="1"
      fx="${radialCx}"
      fy="${radialCy}"
      gradientUnits="userSpaceOnUse"
      gradientTransform="translate(${radialCx} ${radialCy}) scale(${radialRxPx.toFixed(2)} ${radialRyPx.toFixed(2)}) translate(${-radialCx} ${-radialCy})"
    >
      <stop offset="0%" stop-color="${d.gradientGlow}" stop-opacity="1" />
      <stop offset="65%" stop-color="${d.gradientGlow}" stop-opacity="0.5" />
      <stop offset="100%" stop-color="${d.gradientGlow}" stop-opacity="0" />
    </radialGradient>
    <filter id="${grainId}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4" stitchTiles="stitch" />
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${grainAlpha} 0" />
    </filter>
  </defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${gradId})" />
  ${radialOpacity > 0 ? `<rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${radialId})" opacity="${radialOpacity.toFixed(2)}" />` : ''}
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" filter="url(#${grainId})" />
  ${logo}
  <text x="${CARD_WIDTH - PAD}" y="${firstBaselineY}" font-family="${FONT_STACK}" font-weight="600" font-size="${taglineFontSize}" fill="#FFFFFF" text-anchor="end">
    ${lines.map((line, i) => `<tspan x="${CARD_WIDTH - PAD}" dy="${i === 0 ? 0 : taglineLineHeight}">${line}</tspan>`).join('')}
  </text>
</svg>`.trim();
}

function layoutTagline(text: string): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  const maxChars = 22;
  for (const w of words) {
    const next = current ? current + ' ' + w : w;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

let crcTable: Uint32Array | undefined;
function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Minimal STORE-mode ZIP builder — no compression, just concatenated bytes with index records. */
export function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const dt = new Date();
  const dosTime =
    ((dt.getHours() & 0x1f) << 11) | ((dt.getMinutes() & 0x3f) << 5) | ((dt.getSeconds() / 2) & 0x1f);
  const dosDate =
    (((dt.getFullYear() - 1980) & 0x7f) << 9) | (((dt.getMonth() + 1) & 0xf) << 5) | (dt.getDate() & 0x1f);

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    chunks.push(local, f.data);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cd.set(nameBytes, 46);
    central.push(cd);

    offset += local.length + size;
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const centralOffset = offset;

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);
  ev.setUint16(20, 0, true);

  const total = offset + centralSize + eocd.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  for (const c of central) {
    out.set(c, p);
    p += c.length;
  }
  out.set(eocd, p);
  return out;
}

export async function svgToPngBytes(
  svg: string,
  width: number,
  height: number,
  scale = 3,
): Promise<Uint8Array> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to render SVG to image'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D context');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!out) throw new Error('Canvas toBlob returned null');
    const buf = await out.arrayBuffer();
    return new Uint8Array(buf);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
