import type { Frame } from "@src/lib/types";
import type { SliceSet, SliceGet } from "../types";
import { makeId, makeDefaultFrame } from "../types";

export const frameSlice = (set: SliceSet, get: SliceGet) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  quizData: { bg: null, frames: [] as Frame[] },
  currentPreviewIndex: 0,
  defaultW: 320,
  defaultH: 480,

  // ── Actions ──────────────────────────────────────────────────────────────────

  createDefaultFrame: (): Frame => {
    const { defaultW, defaultH } = get();
    return makeDefaultFrame(defaultW, defaultH);
  },

  setBg: (bg: string | null) =>
    set((s) => ({ quizData: { ...s.quizData, bg } })),

  addFrame: (frame: Frame) => {
    get().snapshot();
    set((s) => ({
      quizData: { ...s.quizData, frames: [...s.quizData.frames, frame] },
      currentPreviewIndex: s.quizData.frames.length,
      selectedObjectId: null,
    }));
  },

  removeFrame: (index: number) => {
    get().snapshot();
    set((s) => {
      let frames = s.quizData.frames.filter((_, i) => i !== index);
      if (frames.length === 0)
        frames = [makeDefaultFrame(s.defaultW, s.defaultH)];
      const newIndex = Math.max(
        0,
        Math.min(s.currentPreviewIndex, frames.length - 1),
      );
      return {
        quizData: { ...s.quizData, frames },
        currentPreviewIndex: newIndex,
        selectedObjectId: null,
      };
    });
  },

  reorderFrame: (from: number, to: number) =>
    set((s) => {
      const frames = [...s.quizData.frames];
      const [moved] = frames.splice(from, 1);
      frames.splice(to, 0, moved);
      let idx = s.currentPreviewIndex;
      if (idx === from) idx = to;
      else if (idx > from && idx <= to) idx--;
      else if (idx < from && idx >= to) idx++;
      return { quizData: { ...s.quizData, frames }, currentPreviewIndex: idx };
    }),

  updateFrameField: (index: number, updates: Partial<Frame>) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) =>
        i === index ? { ...f, ...updates } : f,
      );
      return { quizData: { ...s.quizData, frames } };
    });
  },

  setActiveFrame: (index: number) =>
    set((s) => ({
      currentPreviewIndex: Math.max(
        0,
        Math.min(index, s.quizData.frames.length - 1),
      ),
      selectedObjectId: null,
      selectedObjectIds: [],
    })),

  commitFrameSize: (frameIndex: number, w: number, h: number) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) =>
        i === frameIndex ? { ...f, w, h } : f,
      );
      return { quizData: { ...s.quizData, frames } };
    });
  },

  ensureAtLeastOneFrame: () => {
    const { quizData, defaultW, defaultH } = get();
    if (quizData.frames.length > 0) return;
    set((s) => ({
      quizData: {
        ...s.quizData,
        frames: [makeDefaultFrame(defaultW, defaultH)],
      },
      currentPreviewIndex: 0,
      selectedObjectId: null,
    }));
  },

  setDefaultSize: (w: number, h: number) => set({ defaultW: w, defaultH: h }),

  duplicateFrame: (frameIndex: number) => {
    get().snapshot();
    set((s) => {
      const src = s.quizData.frames[frameIndex];
      if (!src) return s;
      const clone: Frame = {
        ...JSON.parse(JSON.stringify(src)),
        id: makeId(),
        objects: src.objects.map((o) => ({
          ...JSON.parse(JSON.stringify(o)),
          id: makeId(),
        })),
      };
      const frames = [...s.quizData.frames];
      frames.splice(frameIndex + 1, 0, clone);
      return {
        quizData: { ...s.quizData, frames },
        currentPreviewIndex: frameIndex + 1,
        selectedObjectId: null,
      };
    });
  },
});
