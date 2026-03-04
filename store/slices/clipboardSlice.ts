import type { FrameObject } from "@src/lib/types";
import type { SliceSet, SliceGet } from "../types";
import { makeId } from "../types";

export const clipboardSlice = (set: SliceSet, get: SliceGet) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  clipboard: null as FrameObject | null,

  // ── Actions ──────────────────────────────────────────────────────────────────

  copyObject: (frameIndex: number, objId: string) => {
    const frame = get().quizData.frames[frameIndex];
    const obj = frame?.objects.find((o) => o.id === objId);
    if (obj) set({ clipboard: JSON.parse(JSON.stringify(obj)) });
  },

  pasteObject: (frameIndex: number) => {
    const { clipboard } = get();
    if (!clipboard) return;
    get().snapshot();
    const clone: FrameObject = {
      ...JSON.parse(JSON.stringify(clipboard)),
      id: makeId(),
      x: (clipboard.x ?? 0) + 16,
      y: (clipboard.y ?? 0) + 16,
      label: (clipboard.label || "Object") + " copy",
    };
    set((s) => {
      const frames = s.quizData.frames.map((f, i) =>
        i === frameIndex ? { ...f, objects: [...f.objects, clone] } : f,
      );
      return {
        quizData: { ...s.quizData, frames },
        selectedObjectId: clone.id,
      };
    });
  },
});
