import qrcode from 'qrcode-generator';
import pjsVariableUrl from '../assets/fonts/PlusJakartaSans-Variable.woff2?inline';
import {
  HEYMAX_MONOGRAM_HEIGHT,
  HEYMAX_MONOGRAM_PATH,
  HEYMAX_MONOGRAM_WIDTH,
  HEYMAX_NATIVE_HEIGHT,
  HEYMAX_NATIVE_WIDTH,
  heymaxLogo,
} from './heymaxLogo';
import {
  LOGO_LINE_NATIVE_HEIGHT,
  LOGO_LINE_NATIVE_WIDTH,
  logoLine,
} from './logoLine';

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
  /** Manual two-line title: when enabled, `role` is line 1 and `role2` is line 2 (no auto-wrap). */
  roleSplit: boolean;
  role2: string;
  phone: string;
  email: string;
  /** URL encoded as a QR on the info side. Defaults to the HeyMax membership page; can be swapped for e.g. a LinkedIn profile. */
  qrUrl: string;
  /** Office address shown at the bottom of the info side. */
  address: string;
  /** Website line shown under the address. */
  website: string;
  /** Show the address + website block on the info side. */
  showAddress: boolean;
  /** Flat background color of the statement ("I am …") side. The "Max" letters derive from it at 80% value. */
  frontBg: string;
}

export const NAME_CARD_PLACEHOLDERS = {
  name: 'Your Name Here',
  role: 'This is your job title',
  phone: '+65 1234 5678',
  email: 'name@heymax.ai',
  qrUrl: 'https://heymax.ai/membership',
  address: '75 Ayer Rajah Crescent, #03–16, Singapore 139952',
  website: 'Heymax.ai',
} as const;

export const DEFAULT_NAME_CARD: NameCardData = {
  name: '',
  role: '',
  roleSplit: false,
  role2: '',
  phone: '',
  email: '',
  qrUrl: '',
  address: '75 Ayer Rajah Crescent, #03–16, Singapore 139952',
  website: 'Heymax.ai',
  showAddress: true,
  frontBg: '#2F1F5E',
};

/** Multiply each RGB channel by `f` — e.g. f=0.8 gives the color at 80% of its value. */
function scaleHex(hex: string, f: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  const rgb = (ch((n >> 16) & 255) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255);
  return `#${rgb.toString(16).padStart(6, '0').toUpperCase()}`;
}

const INK = '#2F1F5E';
const PURPLE = '#7D62A3';

function qrRects(text: string, x: number, y: number, size: number, fill = '#000000'): string {
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
        rects.push(`<rect x="${rx}" y="${ry}" width="${w}" height="${w}" fill="${fill}" />`);
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

/** M-in-pill monogram mark (outline finish), centered on (cx, cy). `r` is the half-height. */
function heymaxMark(cx: number, cy: number, r: number, color: string): string {
  const h = r * 2;
  const s = h / HEYMAX_MONOGRAM_HEIGHT;
  const w = HEYMAX_MONOGRAM_WIDTH * s;
  return `<g transform="translate(${(cx - w / 2).toFixed(2)}, ${(cy - h / 2).toFixed(2)}) scale(${s.toFixed(5)})"><path d="${HEYMAX_MONOGRAM_PATH}" fill="${color}" /></g>`;
}

/** Statement side — flat brand background, giant rotated wordmark and "I am {first name}". */
export function frontCardSvg(d: NameCardData, _opts: SvgOptions = {}): string {
  const firstName = clip((d.name || NAME_CARD_PLACEHOLDERS.name).trim().split(/\s+/)[0], 12);

  const logoWidth = 255;
  const logoBand = (logoWidth * HEYMAX_NATIVE_HEIGHT) / HEYMAX_NATIVE_WIDTH;
  const bottomY = CARD_HEIGHT - 26;
  const logoX = 36;
  const logo = heymaxLogo({
    transform: `translate(${logoX}, ${bottomY}) rotate(-90)`,
    width: logoWidth,
    heyFill: '#C4B2D0',
    maxFill: scaleHex(d.frontBg, 0.8),
    gradientId: 'hmFrontGrad',
  });

  const iAmX = logoX + logoBand + 32;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs><style>${FONT_FACE_BLOCK}</style></defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${d.frontBg}" />
  <g transform="rotate(-90 28 28)">${heymaxMark(28, 28, 10, '#FFFFFF')}</g>
  ${logo}
  <text transform="translate(${iAmX}, ${bottomY}) rotate(-90)" font-family="${FONT_STACK}" font-weight="300" font-size="30" fill="#FFFFFF">I am ${escapeXml(firstName)}</text>
</svg>`.trim();
}

/** Info side — white card with the logo lockup, then name, role, QR, and contact details. */
export function backCardSvg(d: NameCardData): string {
  const PAD = 18;

  const logoWidth = 97.5;
  const logoY = 36;
  const logo = logoLine({
    transform: `translate(${(CARD_WIDTH - logoWidth) / 2}, ${logoY})`,
    width: logoWidth,
    fill: INK,
  });

  const showAddress = d.showAddress !== false;

  const nameLines = wrap(d.name || NAME_CARD_PLACEHOLDERS.name, 18, 2);
  const roleLines = d.roleSplit
    ? [d.role || NAME_CARD_PLACEHOLDERS.role, d.role2].filter(Boolean).map((l) => clip(l, 30))
    : wrap(d.role || NAME_CARD_PLACEHOLDERS.role, 28, 2);
  const nameLineHeight = 20;
  const roleLineHeight = 12;
  const nameShift = Math.max(0, nameLines.length - 1) * nameLineHeight;
  const roleShift = Math.max(0, roleLines.length - 1) * roleLineHeight;

  const qrSize = 50;
  const addressLines = wrap(d.address || NAME_CARD_PLACEHOLDERS.address, 34, 3);
  const addressLineHeight = 10;

  // Offsets relative to the first name baseline, so the whole block can be centered.
  const roleRel = nameShift + 17;
  const qrRel = roleRel + roleShift + 10;
  const phoneRel = qrRel + qrSize + 19;
  const emailRel = phoneRel + 15;
  const addressRel = emailRel + 21;
  const websiteRel = addressRel + Math.max(0, addressLines.length - 1) * addressLineHeight + addressLineHeight;

  const blockTopRel = -13;
  const blockBottomRel = (showAddress ? websiteRel : emailRel) + 3;

  const regionTop = logoY + (logoWidth * LOGO_LINE_NATIVE_HEIGHT) / LOGO_LINE_NATIVE_WIDTH + 8;
  const regionBottom = CARD_HEIGHT - 42;
  const nameBaseY = Math.max(
    regionTop - blockTopRel,
    regionTop + (regionBottom - regionTop - (blockBottomRel - blockTopRel)) / 2 - blockTopRel,
  );

  const roleBaseY = nameBaseY + roleRel;
  const qrY = nameBaseY + qrRel;
  const phoneY = nameBaseY + phoneRel;
  const emailY = nameBaseY + emailRel;
  const addressBaseY = nameBaseY + addressRel;
  const websiteY = nameBaseY + websiteRel;

  const qrPlaced = qrRects(d.qrUrl?.trim() || NAME_CARD_PLACEHOLDERS.qrUrl, PAD, qrY, qrSize, INK);

  const tspans = (lines: string[], x: number, lineHeight: number) =>
    lines
      .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
      .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs><style>${FONT_FACE_BLOCK}</style></defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#FFFFFF" />
  ${logo}

  <text x="${PAD}" y="${nameBaseY}" font-family="${FONT_STACK}" font-weight="600" font-size="17" fill="${INK}">${tspans(nameLines, PAD, nameLineHeight)}</text>
  <text x="${PAD}" y="${roleBaseY}" font-family="${FONT_STACK}" font-weight="500" font-size="10" fill="${PURPLE}">${tspans(roleLines, PAD, roleLineHeight)}</text>

  ${qrPlaced}

  <text x="${PAD}" y="${phoneY}" font-family="${FONT_STACK}" font-weight="400" font-size="10" fill="#2F1F5E">t: ${escapeXml(clip(d.phone || NAME_CARD_PLACEHOLDERS.phone, 26))}</text>
  <text x="${PAD}" y="${emailY}" font-family="${FONT_STACK}" font-weight="400" font-size="10" fill="#2F1F5E">e: ${escapeXml(clip(d.email || NAME_CARD_PLACEHOLDERS.email, 26))}</text>

  ${
    showAddress
      ? `<text x="${PAD}" y="${addressBaseY}" font-family="${FONT_STACK}" font-weight="400" font-size="7.5" fill="${INK}">${tspans(addressLines, PAD, addressLineHeight)}</text>
  <text x="${PAD}" y="${websiteY}" font-family="${FONT_STACK}" font-weight="400" font-size="7.5" fill="${INK}">${escapeXml(clip(d.website || '', 30))}</text>`
      : ''
  }

  ${heymaxMark(CARD_WIDTH - 26, CARD_HEIGHT - 26, 9, INK)}
</svg>`.trim();
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
