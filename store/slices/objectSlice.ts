import type { FrameObject } from "@src/lib/types";
import type { SliceSet, SliceGet } from "../types";
import { makeId } from "../types";

export const objectSlice = (set: SliceSet, get: SliceGet) => ({
  // ── Actions ──────────────────────────────────────────────────────────────────

  addObject: (frameIndex: number, obj: FrameObject) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) =>
        i === frameIndex ? { ...f, objects: [...f.objects, obj] } : f,
      );
      return {
        quizData: { ...s.quizData, frames },
        selectedObjectId: obj.id,
      };
    });
  },

  removeObject: (frameIndex: number, objId: string) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        return { ...f, objects: f.objects.filter((o) => o.id !== objId) };
      });
      const newSelected = frames[frameIndex]?.objects[0]?.id ?? null;
      return {
        quizData: { ...s.quizData, frames },
        selectedObjectId: newSelected,
      };
    });
  },

  updateObject: (
    frameIndex: number,
    objId: string,
    updater: (obj: FrameObject) => FrameObject,
  ) =>
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const objects = f.objects.map((o) => (o.id === objId ? updater(o) : o));
        return { ...f, objects };
      });
      return { quizData: { ...s.quizData, frames } };
    }),

  duplicateObject: (frameIndex: number, objId: string) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const src = f.objects.find((o) => o.id === objId);
        if (!src) return f;
        const clone: FrameObject = {
          ...JSON.parse(JSON.stringify(src)),
          id: makeId(),
          x: (src.x ?? 0) + 16,
          y: (src.y ?? 0) + 16,
          label: (src.label || "Object") + " copy",
        };
        return { ...f, objects: [...f.objects, clone] };
      });
      const cloneId = frames[frameIndex]?.objects.at(-1)?.id ?? null;
      return {
        quizData: { ...s.quizData, frames },
        selectedObjectId: cloneId,
      };
    });
  },

  copyObjectToAllFrames: (frameIndex: number, objId: string) => {
    get().snapshot();
    set((s) => {
      const srcFrame = s.quizData.frames[frameIndex];
      if (!srcFrame) return {};
      const src = srcFrame.objects.find((o) => o.id === objId);
      if (!src) return {};
      const frames = s.quizData.frames.map((f, i) => {
        if (i === frameIndex) return f; // already has it
        // Remove any existing copy with the same label to avoid duplicates on repeated clicks
        const filtered = f.objects.filter(
          (o) => !(o.label === src.label && o.type === src.type),
        );
        const clone: FrameObject = {
          ...JSON.parse(JSON.stringify(src)),
          id: makeId(),
        };
        return { ...f, objects: [...filtered, clone] };
      });
      return { quizData: { ...s.quizData, frames } };
    });
  },

  commitObjectPosition: (
    frameIndex: number,
    objId: string,
    x: number,
    y: number,
  ) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const objects = f.objects.map((o) =>
          o.id === objId ? { ...o, x, y } : o,
        );
        return { ...f, objects };
      });
      return { quizData: { ...s.quizData, frames } };
    });
  },

  commitObjectResize: (
    frameIndex: number,
    objId: string,
    updates: Partial<FrameObject>,
  ) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const objects = f.objects.map((o) =>
          o.id === objId ? ({ ...o, ...updates } as FrameObject) : o,
        );
        return { ...f, objects };
      });
      return { quizData: { ...s.quizData, frames } };
    });
  },

  reorderObjectZ: (
    frameIndex: number,
    objId: string,
    dir: "front" | "back" | "forward" | "backward",
  ) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const objs = [...f.objects];
        const idx = objs.findIndex((o) => o.id === objId);
        if (idx === -1) return f;
        let target = idx;
        if (dir === "front") target = objs.length - 1;
        else if (dir === "back") target = 0;
        else if (dir === "forward") target = Math.min(idx + 1, objs.length - 1);
        else if (dir === "backward") target = Math.max(idx - 1, 0);
        const [item] = objs.splice(idx, 1);
        objs.splice(target, 0, item);
        return { ...f, objects: objs };
      });
      return { quizData: { ...s.quizData, frames } };
    });
  },

  moveObjectToIndex: (
    frameIndex: number,
    fromIndex: number,
    toIndex: number,
  ) => {
    if (fromIndex === toIndex) return;
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const objs = [...f.objects];
        const [item] = objs.splice(fromIndex, 1);
        objs.splice(toIndex, 0, item);
        return { ...f, objects: objs };
      });
      return { quizData: { ...s.quizData, frames } };
    });
  },

  nudgeObject: (frameIndex: number, objId: string, dx: number, dy: number) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const objects = f.objects.map((o) =>
          o.id === objId
            ? {
                ...o,
                x: Math.round((o.x ?? 0) + dx),
                y: Math.round((o.y ?? 0) + dy),
              }
            : o,
        );
        return { ...f, objects };
      });
      return { quizData: { ...s.quizData, frames } };
    });
  },

  toggleObjectVisibility: (frameIndex: number, objId: string) =>
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const objects = f.objects.map((o) =>
          o.id === objId ? { ...o, hidden: !o.hidden } : o,
        );
        return { ...f, objects };
      });
      return { quizData: { ...s.quizData, frames } };
    }),

  toggleObjectLock: (frameIndex: number, objId: string) =>
    set((s) => {
      const frames = s.quizData.frames.map((f, i) => {
        if (i !== frameIndex) return f;
        const objects = f.objects.map((o) =>
          o.id === objId ? { ...o, locked: !o.locked } : o,
        );
        return { ...f, objects };
      });
      return { quizData: { ...s.quizData, frames } };
    }),
});
