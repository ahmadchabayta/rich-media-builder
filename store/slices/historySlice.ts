import type { QuizData } from "@src/lib/types";
import type { SliceSet, SliceGet } from "../types";

export const historySlice = (set: SliceSet, get: SliceGet) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  pastSnapshots: [] as QuizData[],
  futureSnapshots: [] as QuizData[],
  isDirty: false,

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Push current quizData onto the undo stack before any mutation. */
  snapshot: () => {
    const { quizData, pastSnapshots } = get();
    const snap = JSON.parse(JSON.stringify(quizData)) as QuizData;
    set({
      pastSnapshots: [...pastSnapshots, snap].slice(-50),
      futureSnapshots: [],
      isDirty: true,
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
});
