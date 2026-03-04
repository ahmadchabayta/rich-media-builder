import type { SliceSet, SliceGet } from "../types";

export const selectionSlice = (set: SliceSet, get: SliceGet) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  selectedObjectId: null as string | null,
  selectedObjectIds: [] as string[],
  animMode: false,
  snapEnabled: true,
  showRuler: true,
  showGrid: false,
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
  setPlayback: (
    pb: { frameIdx: number; phase: "enter" | "hold" | "exit" } | null,
  ) => set({ playback: pb }),
});
