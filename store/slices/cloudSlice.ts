import type { SliceSet, SliceGet, ProjectSnapshot } from "../types";

export const cloudSlice = (set: SliceSet, _get: SliceGet) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  cloudProjectId: null as string | null,
  cloudProjectTitle: null as string | null,
  lastSavedAt: null as number | null,

  // ── Actions ──────────────────────────────────────────────────────────────────

  setCloudProjectId: (id: string | null) => set({ cloudProjectId: id }),

  setCloudProjectTitle: (title: string | null) =>
    set({ cloudProjectTitle: title }),

  markSaved: () => set({ isDirty: false, lastSavedAt: Date.now() }),

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
    }),
});
