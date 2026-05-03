export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

export async function fetchBytes(url: string, signal?: AbortSignal): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to download image (${res.status}) from ${url}`);
  const buf = await res.arrayBuffer();
  const mimeType = res.headers.get('content-type') ?? 'image/png';
  return { bytes: new Uint8Array(buf), mimeType };
}

export async function fileToDataUrl(file: File | Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function loadImageFromBytes(bytes: Uint8Array, mimeType: string): Promise<HTMLImageElement> {
  const blob = new Blob([bytes as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
