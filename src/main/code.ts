import type { AddImagePayload, MainToUi, PluginSettings, UiToMain } from '@shared/messages';
import { DEFAULT_SETTINGS } from '@shared/presets';

const STORAGE_KEY = 'heymax-design-tools:v1';
const DEFAULT_WIDTH = 460;
const DEFAULT_HEIGHT = 720;
const MIN_WIDTH = 360;
const MIN_HEIGHT = 480;
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1400;

function clampSize(w: number, h: number) {
  return {
    width: Math.round(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w))),
    height: Math.round(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, h))),
  };
}

async function loadSettings(): Promise<PluginSettings> {
  const raw = await figma.clientStorage.getAsync(STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...(raw.apiKeys ?? {}) },
    defaults: { ...DEFAULT_SETTINGS.defaults, ...(raw.defaults ?? {}) },
  };
}

async function saveSettings(settings: PluginSettings) {
  await figma.clientStorage.setAsync(STORAGE_KEY, settings);
}

let cachedSettings: PluginSettings = DEFAULT_SETTINGS;

async function fetchRemoteUI(): Promise<string | null> {
  if (!__UI_CDN_URL__) return null;
  const fetchPromise = (async () => {
    try {
      const res = await fetch(__UI_CDN_URL__, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  })();
  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
  return Promise.race([fetchPromise, timeoutPromise]);
}

(async () => {
  cachedSettings = await loadSettings();
  const initial = clampSize(
    cachedSettings.windowSize?.width ?? DEFAULT_WIDTH,
    cachedSettings.windowSize?.height ?? DEFAULT_HEIGHT,
  );
  const remote = await fetchRemoteUI();
  figma.showUI(remote ?? __html__, { ...initial, themeColors: true });
})();

function send(message: MainToUi) {
  figma.ui.postMessage(message);
}

async function placeImage(payload: AddImagePayload, layoutIndex: number, layoutTotal: number) {
  const image = figma.createImage(payload.bytes);
  const node = figma.createRectangle();
  node.name = payload.label;
  node.resize(payload.width, payload.height);
  node.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];

  const center = figma.viewport.center;
  const cols = Math.max(1, Math.ceil(Math.sqrt(layoutTotal)));
  const col = layoutIndex % cols;
  const row = Math.floor(layoutIndex / cols);
  const gap = 48;
  const cellW = payload.width + gap;
  const cellH = payload.height + gap;
  const totalRows = Math.ceil(layoutTotal / cols);
  const originX = center.x - (cols * cellW) / 2;
  const originY = center.y - (totalRows * cellH) / 2;
  node.x = originX + col * cellW;
  node.y = originY + row * cellH;

  figma.currentPage.appendChild(node);
  return node;
}

let pendingResizeSave: number | undefined;

figma.ui.onmessage = async (msg: UiToMain) => {
  try {
    switch (msg.type) {
      case 'ready': {
        send({ type: 'init', settings: cachedSettings });
        break;
      }
      case 'save-settings': {
        cachedSettings = msg.settings;
        await saveSettings(msg.settings);
        send({ type: 'settings-saved' });
        break;
      }
      case 'add-image': {
        const node = await placeImage(msg.payload, 0, 1);
        figma.viewport.scrollAndZoomIntoView([node]);
        send({ type: 'image-added', ok: true });
        break;
      }
      case 'add-images': {
        const nodes = [];
        for (let i = 0; i < msg.payloads.length; i++) {
          nodes.push(await placeImage(msg.payloads[i], i, msg.payloads.length));
        }
        if (nodes.length) figma.viewport.scrollAndZoomIntoView(nodes);
        send({ type: 'image-added', ok: true });
        break;
      }
      case 'notify': {
        figma.notify(msg.message, { error: msg.level === 'error' });
        break;
      }
      case 'resize': {
        const { width, height } = clampSize(msg.width, msg.height);
        figma.ui.resize(width, height);
        // Debounced persist — only save once the user stops dragging.
        if (pendingResizeSave !== undefined) clearTimeout(pendingResizeSave);
        pendingResizeSave = setTimeout(() => {
          cachedSettings = { ...cachedSettings, windowSize: { width, height } };
          saveSettings(cachedSettings).catch(() => {});
          pendingResizeSave = undefined;
        }, 250) as unknown as number;
        break;
      }
      case 'close': {
        figma.closePlugin();
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message });
    figma.notify(message, { error: true });
  }
};
