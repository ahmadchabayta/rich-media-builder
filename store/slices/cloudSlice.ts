import type {
  SliceSet,
  SliceGet,
  ProjectSnapshot,
  ExportMeta,
  AssetItem,
} from "../types";

const DEFAULT_EXPORT_META: ExportMeta = {
  clientName: "",
  adName: "",
  adKind: "bls",
  countries: [{ code: "ksa", languages: ["en"] }],
  tracker: {
    enabled: true,
    endpoint: "https://rm.memob.com",
  },
};

export const cloudSlice = (set: SliceSet, get: SliceGet) => {
  void get;
  return {
  // ── State ────────────────────────────────────────────────────────────────────
  cloudProjectId: null as string | null,
  cloudProjectTitle: null as string | null,
  cloudProjectClient: null as string | null,
  cloudProjectLocales: [] as string[],
  cloudProjectRegions: [] as string[],
  lastSavedAt: null as number | null,
  exportMeta: { ...DEFAULT_EXPORT_META } as ExportMeta,
  customCss: "" as string,
  assets: [] as AssetItem[],

  // ── Actions ──────────────────────────────────────────────────────────────────

  setCloudProjectId: (id: string | null) => set({ cloudProjectId: id }),

  setCloudProjectTitle: (title: string | null) =>
    set({ cloudProjectTitle: title }),

  setCloudProjectClient: (client: string | null) =>
    set({ cloudProjectClient: client }),

  setCloudProjectLocales: (locales: string[]) =>
    set({ cloudProjectLocales: locales }),

  setCloudProjectRegions: (regions: string[]) =>
    set({ cloudProjectRegions: regions }),

  markSaved: () => set({ isDirty: false, lastSavedAt: Date.now() }),

  setExportMeta: (meta: Partial<ExportMeta>) =>
    set((s) => ({ exportMeta: { ...s.exportMeta, ...meta } })),

  setCustomCss: (css: string) => set({ customCss: css }),

  addAsset: (item: AssetItem) => set((s) => ({ assets: [...s.assets, item] })),

  removeAsset: (id: string) =>
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

  loadProject: (data: ProjectSnapshot) =>
    set({
      quizData: data.quizData,
      defaultW: data.defaultW ?? 320,
      defaultH: data.defaultH ?? 480,
      currentPreviewIndex: Math.max(
        0,
        Math.min(
          data.currentPreviewIndex ?? 0,
          (data.quizData.frames.length || 1) - 1,
        ),
      ),
      selectedObjectId: null,
      selectedObjectIds: [],
      animMode: false,
      pastSnapshots: [],
      futureSnapshots: [],
      isDirty: false,
      lastSavedAt: null,
      cloudProjectTitle: null,
      cloudProjectClient: null,
      cloudProjectLocales: [],
      cloudProjectRegions: [],
    }),
  };
};
