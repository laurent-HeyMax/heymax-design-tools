import { create } from 'zustand';
import type { FormFactorId, PluginSettings, ProviderId, SceneId } from '@shared/messages';
import { DEFAULT_SETTINGS, FORM_FACTORS } from '@shared/presets';
import type { ColorAdjustments } from '../lib/colorAdjust';
import { NEUTRAL_ADJUSTMENTS } from '../lib/colorAdjust';
import { DEFAULT_CREATIVES, type CreativesData } from '../lib/creatives';
import { DEFAULT_NAME_CARD, type NameCardData } from '../lib/nameCard';
import type { ReferenceImage } from '../providers/types';

export type JobStatus = 'pending' | 'running' | 'done' | 'error';

export interface ResultJob {
  id: string;
  providerId: ProviderId;
  modelId: string;
  modelLabel: string;
  prompt: string;
  promptShort: string;
  sceneLabel: string;
  formFactorLabel: string;
  width: number;
  height: number;
  requestedWidth?: number;
  requestedHeight?: number;
  status: JobStatus;
  error?: string;
  bytes?: Uint8Array;
  mimeType?: string;
  createdAt: number;
}

export type ToolId = 'image-gen' | 'name-card' | 'creatives';
export type ToolView = 'home' | ToolId;

const TOOL_IDS: readonly ToolId[] = ['image-gen', 'name-card', 'creatives'];

/** Deep link for the standalone web build: ?tool=name-card opens that tool directly. */
function initialView(): ToolView {
  try {
    const tool = new URLSearchParams(window.location.search).get('tool');
    if (tool && (TOOL_IDS as readonly string[]).includes(tool)) return tool as ToolId;
  } catch {
    /* not in a browser context */
  }
  return 'home';
}

export interface UiState {
  initialized: boolean;
  inFigma: boolean;
  view: ToolView;
  tab: 'generate' | 'settings';
  settings: PluginSettings;

  prompt: string;
  providerId: ProviderId;
  modelId: string;
  cityId?: string;
  styleId?: string;
  formFactors: FormFactorId[];
  scenes: SceneId[];
  customDimensions: { enabled: boolean; width: number; height: number };
  referenceImage?: ReferenceImage;
  adjustments: ColorAdjustments;

  jobs: ResultJob[];

  nameCard: NameCardData;
  creatives: CreativesData;

  setView: (view: ToolView) => void;
  setTab: (tab: 'generate' | 'settings') => void;
  setInFigma: (v: boolean) => void;
  setSettings: (s: PluginSettings) => void;
  patchSettings: (patch: Partial<PluginSettings>) => void;
  setApiKey: (provider: ProviderId, key: string) => void;
  setDefault: <K extends keyof PluginSettings['defaults']>(k: K, v: PluginSettings['defaults'][K]) => void;
  setReplicateProxyUrl: (url: string) => void;

  setPrompt: (p: string) => void;
  setProvider: (p: ProviderId) => void;
  setModel: (m: string) => void;
  setCity: (id: string | undefined) => void;
  setStyle: (id: string | undefined) => void;
  toggleFormFactor: (id: FormFactorId) => void;
  toggleScene: (id: SceneId) => void;
  setCustomDimensions: (enabled: boolean, w?: number, h?: number) => void;
  setReferenceImage: (ref?: ReferenceImage) => void;
  setAdjustments: (a: Partial<ColorAdjustments>) => void;
  setOverlay: (a: Partial<ColorAdjustments['overlay']>) => void;
  resetAdjustments: () => void;

  addJob: (job: ResultJob) => void;
  patchJob: (id: string, patch: Partial<ResultJob>) => void;
  clearJobs: () => void;
  removeJob: (id: string) => void;

  setNameCard: (patch: Partial<NameCardData>) => void;
  resetNameCard: () => void;

  setCreatives: (patch: Partial<CreativesData>) => void;
  resetCreatives: () => void;

  applyDefaults: () => void;
}

export const useStore = create<UiState>((set, get) => ({
  initialized: false,
  inFigma: false,
  view: initialView(),
  tab: 'generate',
  settings: DEFAULT_SETTINGS,

  prompt: '',
  providerId: DEFAULT_SETTINGS.defaults.providerId,
  modelId: DEFAULT_SETTINGS.defaults.modelId,
  cityId: undefined,
  styleId: undefined,
  formFactors: ['desktop'],
  scenes: ['none'],
  customDimensions: {
    enabled: false,
    width: FORM_FACTORS[0].width,
    height: FORM_FACTORS[0].height,
  },
  referenceImage: undefined,
  adjustments: NEUTRAL_ADJUSTMENTS,
  jobs: [],

  nameCard: DEFAULT_NAME_CARD,
  creatives: DEFAULT_CREATIVES,

  setView: (view) => set({ view, tab: view === 'image-gen' ? 'generate' : get().tab }),
  setTab: (tab) => set({ tab }),
  setInFigma: (inFigma) => set({ inFigma }),
  setSettings: (settings) => set({ settings, initialized: true }),
  patchSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
  setApiKey: (provider, key) => {
    const s = get().settings;
    const apiKeys = { ...s.apiKeys, [provider]: key };
    set({ settings: { ...s, apiKeys } });
  },
  setDefault: (k, v) => {
    const s = get().settings;
    set({ settings: { ...s, defaults: { ...s.defaults, [k]: v } } });
  },
  setReplicateProxyUrl: (url) => {
    const s = get().settings;
    set({ settings: { ...s, replicateProxyUrl: url || undefined } });
  },

  setPrompt: (prompt) => set({ prompt }),
  setProvider: (providerId) => set({ providerId }),
  setModel: (modelId) => set({ modelId }),
  setCity: (cityId) => set({ cityId: cityId || undefined }),
  setStyle: (styleId) => set({ styleId: styleId === get().styleId ? undefined : styleId || undefined }),
  toggleFormFactor: (id) => {
    const cur = get().formFactors;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ formFactors: next.length ? next : [id] });
  },
  toggleScene: (id) => {
    const cur = get().scenes;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ scenes: next.length ? next : [id] });
  },
  setCustomDimensions: (enabled, w, h) => {
    const cur = get().customDimensions;
    set({
      customDimensions: {
        enabled,
        width: w ?? cur.width,
        height: h ?? cur.height,
      },
    });
  },
  setReferenceImage: (ref) => set({ referenceImage: ref }),
  setAdjustments: (a) => set({ adjustments: { ...get().adjustments, ...a } }),
  setOverlay: (a) =>
    set({ adjustments: { ...get().adjustments, overlay: { ...get().adjustments.overlay, ...a } } }),
  resetAdjustments: () => set({ adjustments: NEUTRAL_ADJUSTMENTS }),

  addJob: (job) => set({ jobs: [...get().jobs, job] }),
  patchJob: (id, patch) =>
    set({ jobs: get().jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }),
  clearJobs: () => set({ jobs: [] }),
  removeJob: (id) => set({ jobs: get().jobs.filter((j) => j.id !== id) }),

  setNameCard: (patch) => set({ nameCard: { ...get().nameCard, ...patch } }),
  resetNameCard: () => set({ nameCard: DEFAULT_NAME_CARD }),

  setCreatives: (patch) => set({ creatives: { ...get().creatives, ...patch } }),
  resetCreatives: () => set({ creatives: DEFAULT_CREATIVES }),

  applyDefaults: () => {
    const s = get().settings;
    set({
      providerId: s.defaults.providerId,
      modelId: s.defaults.modelId,
    });
  },
}));
