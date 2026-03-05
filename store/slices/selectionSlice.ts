import type { SliceSet, SliceGet, CustomFontEntry } from "../types";

export const selectionSlice = (set: SliceSet, get: SliceGet) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  selectedObjectId: null as string | null,
  selectedObjectIds: [] as string[],
  animMode: false,
  snapEnabled: true,
  showRuler: true,
  showGrid: false,
  timelineOpen: true,
  zoom: 1,
  showCursorLines: true,
  penMode: false,
  customFonts: [] as CustomFontEntry[],
  defaultTypography: {
    size: 22,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0,
    lineHeight: 1.2,
    textTransform: "none" as const,
  },
  playback: null as {
    frameIdx: number;
    phase: "enter" | "hold" | "exit";
  } | null,

  // ── Computed ──────────────────────────────────────────────────────────────────

  getActiveFrame: () => {
    const { quizData, currentPreviewIndex } = get();
    return quizData.frames[currentPreviewIndex] ?? null;
  },

  getSelectedObject: () => {
    const state = get();
    const frame = state.getActiveFrame();
    if (!frame || !state.selectedObjectId) return null;
    return frame.objects.find((o) => o.id === state.selectedObjectId) ?? null;
  },

  // ── Actions ──────────────────────────────────────────────────────────────────

  setSelectedObject: (id: string | null) =>
    set({ selectedObjectId: id, selectedObjectIds: id ? [id] : [] }),

  toggleObjectSelection: (id: string) =>
    set((s) => {
      const cur = s.selectedObjectIds;
      const next = cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur, id];
      return {
        selectedObjectIds: next,
        selectedObjectId: next.length === 1 ? next[0] : null,
      };
    }),

  toggleAnimMode: () => set((s) => ({ animMode: !s.animMode })),

  setSnapEnabled: (v: boolean) => set({ snapEnabled: v }),
  setShowRuler: (v: boolean) => set({ showRuler: v }),
  setShowGrid: (v: boolean) => set({ showGrid: v }),
  setTimelineOpen: (v: boolean) => set({ timelineOpen: v }),
  setZoom: (v: number) => set({ zoom: Math.max(0.25, Math.min(3, v)) }),
  setShowCursorLines: (v: boolean) => set({ showCursorLines: v }),
  setPenMode: (v: boolean) => set({ penMode: v }),
  addCustomFont: (entry: CustomFontEntry) =>
    set((s) => ({ customFonts: [...s.customFonts, entry] })),
  removeCustomFont: (id: string) =>
    set((s) => ({ customFonts: s.customFonts.filter((f) => f.id !== id) })),
  setDefaultTypography: (
    patch: Partial<{
      size: number;
      fontWeight: string;
      color: string;
      fontFamily?: string;
      letterSpacing: number;
      lineHeight: number;
      textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
      italic?: boolean;
      underline?: boolean;
      textAlign?: "left" | "center" | "right";
    }>,
  ) =>
    set((s) => ({ defaultTypography: { ...s.defaultTypography, ...patch } })),
  setPlayback: (
    pb: { frameIdx: number; phase: "enter" | "hold" | "exit" } | null,
  ) => set({ playback: pb }),
});
