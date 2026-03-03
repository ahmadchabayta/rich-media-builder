import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Frame, FrameObject, QuizData } from "@src/lib/types";
import { idbStorage } from "@src/lib/idbStorage";

export interface CloudMeta {
  title: string;
  status?: string;
  format?: string;
  client?: string;
  notes?: string;
  publishDate?: string;
  endDate?: string;
  platforms?: string[];
  tags?: string[];
  audience?: {
    ageRanges?: string[];
    gender?: string;
    devices?: string[];
    interests?: string[];
    regions?: string[];
  };
}

/** Serialisable snapshot written to disk or localStorage. */
export interface ProjectSnapshot {
  version: number;
  quizData: QuizData;
  defaultW: number;
  defaultH: number;
  currentPreviewIndex: number;
}

export function makeId() {
  return String(Date.now() + Math.random());
}

function makeDefaultFrame(defaultW: number, defaultH: number): Frame {
  return {
    id: makeId(),
    src: null,
    objects: [],
    w: defaultW,
    h: defaultH,
    isDefault: true,
    isEndFrame: false,
    animEnter: { type: "blsFadeIn", dur: 400 },
    animExit: { type: "blsFadeOut", dur: 300 },
    answerStagger: 80,
  };
}

export interface QuizState {
  quizData: QuizData;
  currentPreviewIndex: number;
  selectedObjectId: string | null;
  selectedObjectIds: string[]; // multi-select set
  animMode: boolean;
  defaultW: number;
  defaultH: number;
  snapEnabled: boolean;

  // Undo/redo (in-memory only, not persisted)
  pastSnapshots: QuizData[];
  futureSnapshots: QuizData[];

  // Selectors
  getActiveFrame: () => Frame | null;
  getSelectedObject: () => FrameObject | null;
  createDefaultFrame: () => Frame;

  // Mutations
  setBg: (bg: string | null) => void;
  addFrame: (frame: Frame) => void;
  removeFrame: (index: number) => void;
  reorderFrame: (from: number, to: number) => void;
  updateFrameField: (index: number, updates: Partial<Frame>) => void;
  addObject: (frameIndex: number, obj: FrameObject) => void;
  removeObject: (frameIndex: number, objId: string) => void;
  updateObject: (
    frameIndex: number,
    objId: string,
    updater: (obj: FrameObject) => FrameObject,
  ) => void;
  setActiveFrame: (index: number) => void;
  setSelectedObject: (id: string | null) => void;
  toggleObjectSelection: (id: string) => void; // Ctrl+click multi-select
  toggleAnimMode: () => void;
  setDefaultSize: (w: number, h: number) => void;
  setSnapEnabled: (v: boolean) => void;
  commitObjectPosition: (
    frameIndex: number,
    objId: string,
    x: number,
    y: number,
  ) => void;
  commitObjectResize: (
    frameIndex: number,
    objId: string,
    updates: Partial<FrameObject>,
  ) => void;
  commitFrameSize: (frameIndex: number, w: number, h: number) => void;
  ensureAtLeastOneFrame: () => void;
  /** Replace all project data from a saved snapshot. */
  loadProject: (data: ProjectSnapshot) => void;

  // Cloud sync
  cloudProjectId: string | null;
  setCloudProjectId: (id: string | null) => void;
  cloudMeta: CloudMeta | null;
  setCloudMeta: (meta: CloudMeta) => void;

  // History
  snapshot: () => void; // push current quizData onto undo stack
  undo: () => void;
  redo: () => void;

  // Object utilities
  duplicateObject: (frameIndex: number, objId: string) => void;
  reorderObjectZ: (
    frameIndex: number,
    objId: string,
    dir: "front" | "back" | "forward" | "backward",
  ) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizData: { bg: null, frames: [] },
      currentPreviewIndex: 0,
      selectedObjectId: null,
      selectedObjectIds: [],
      animMode: false,
      defaultW: 320,
      defaultH: 480,
      snapEnabled: true,
      pastSnapshots: [],
      futureSnapshots: [],
      cloudProjectId: null,
      cloudMeta: null,

      getActiveFrame: () => {
        const { quizData, currentPreviewIndex } = get();
        return quizData.frames[currentPreviewIndex] ?? null;
      },

      getSelectedObject: () => {
        const state = get();
        const frame = state.getActiveFrame();
        if (!frame || !state.selectedObjectId) return null;
        return (
          frame.objects.find((o) => o.id === state.selectedObjectId) ?? null
        );
      },

      createDefaultFrame: () => {
        const { defaultW, defaultH } = get();
        return makeDefaultFrame(defaultW, defaultH);
      },

      setBg: (bg) => set((s) => ({ quizData: { ...s.quizData, bg } })),

      addFrame: (frame) => {
        get().snapshot();
        set((s) => ({
          quizData: { ...s.quizData, frames: [...s.quizData.frames, frame] },
          currentPreviewIndex: s.quizData.frames.length,
          selectedObjectId: null,
        }));
      },

      removeFrame: (index) => {
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

      reorderFrame: (from, to) =>
        set((s) => {
          const frames = [...s.quizData.frames];
          const [moved] = frames.splice(from, 1);
          frames.splice(to, 0, moved);
          let idx = s.currentPreviewIndex;
          if (idx === from) idx = to;
          else if (idx > from && idx <= to) idx--;
          else if (idx < from && idx >= to) idx++;
          return {
            quizData: { ...s.quizData, frames },
            currentPreviewIndex: idx,
          };
        }),

      updateFrameField: (index, updates) => {
        get().snapshot();
        set((s) => {
          const frames = s.quizData.frames.map((f, i) =>
            i === index ? { ...f, ...updates } : f,
          );
          return { quizData: { ...s.quizData, frames } };
        });
      },

      addObject: (frameIndex, obj) => {
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

      removeObject: (frameIndex, objId) => {
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

      updateObject: (frameIndex, objId, updater) =>
        set((s) => {
          const frames = s.quizData.frames.map((f, i) => {
            if (i !== frameIndex) return f;
            const objects = f.objects.map((o) =>
              o.id === objId ? updater(o) : o,
            );
            return { ...f, objects };
          });
          return { quizData: { ...s.quizData, frames } };
        }),

      setActiveFrame: (index) =>
        set((s) => ({
          currentPreviewIndex: Math.max(
            0,
            Math.min(index, s.quizData.frames.length - 1),
          ),
          selectedObjectId: null,
          selectedObjectIds: [],
        })),

      setSelectedObject: (id) =>
        set({ selectedObjectId: id, selectedObjectIds: id ? [id] : [] }),

      toggleObjectSelection: (id) =>
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

      setDefaultSize: (w, h) => set({ defaultW: w, defaultH: h }),

      setSnapEnabled: (v) => set({ snapEnabled: v }),

      commitObjectPosition: (frameIndex, objId, x, y) => {
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

      commitObjectResize: (frameIndex, objId, updates) => {
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

      commitFrameSize: (frameIndex, w, h) => {
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

      loadProject: (data) =>
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
        }),

      setCloudProjectId: (id) => set({ cloudProjectId: id }),
      setCloudMeta: (meta) => set({ cloudMeta: meta }),

      // ─── History ──────────────────────────────────────────────────
      snapshot: () => {
        const { quizData, pastSnapshots } = get();
        const snap = JSON.parse(JSON.stringify(quizData)) as QuizData;
        set({
          pastSnapshots: [...pastSnapshots, snap].slice(-50),
          futureSnapshots: [],
        });
      },

      undo: () => {
        const { pastSnapshots, futureSnapshots, quizData } = get();
        if (pastSnapshots.length === 0) return;
        const past = [...pastSnapshots];
        const prev = past.pop()!;
        const future = [
          JSON.parse(JSON.stringify(quizData)) as QuizData,
          ...futureSnapshots,
        ];
        set({
          quizData: prev,
          pastSnapshots: past,
          futureSnapshots: future,
          selectedObjectId: null,
          selectedObjectIds: [],
        });
      },

      redo: () => {
        const { futureSnapshots, pastSnapshots, quizData } = get();
        if (futureSnapshots.length === 0) return;
        const future = [...futureSnapshots];
        const next = future.shift()!;
        const past = [
          ...pastSnapshots,
          JSON.parse(JSON.stringify(quizData)) as QuizData,
        ];
        set({
          quizData: next,
          pastSnapshots: past,
          futureSnapshots: future,
          selectedObjectId: null,
          selectedObjectIds: [],
        });
      },

      // ─── Object utilities ─────────────────────────────────────────
      duplicateObject: (frameIndex, objId) => {
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

      reorderObjectZ: (frameIndex, objId, dir) => {
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
            else if (dir === "forward")
              target = Math.min(idx + 1, objs.length - 1);
            else if (dir === "backward") target = Math.max(idx - 1, 0);
            const [item] = objs.splice(idx, 1);
            objs.splice(target, 0, item);
            return { ...f, objects: objs };
          });
          return { quizData: { ...s.quizData, frames } };
        });
      },
    }),
    {
      name: "bls-producer-project",
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({
        quizData: s.quizData,
        defaultW: s.defaultW,
        defaultH: s.defaultH,
        currentPreviewIndex: s.currentPreviewIndex,
        snapEnabled: s.snapEnabled,
        cloudProjectId: s.cloudProjectId,
        cloudMeta: s.cloudMeta,
      }),
    },
  ),
);
