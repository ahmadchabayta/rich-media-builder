import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@src/lib/idbStorage";

//  Re-exports so all existing consumers keep working
export type { QuizState, ProjectSnapshot } from "./types";
export { makeId } from "./types";

//  Slices
import { frameSlice } from "./slices/frameSlice";
import { objectSlice } from "./slices/objectSlice";
import { selectionSlice } from "./slices/selectionSlice";
import { historySlice } from "./slices/historySlice";
import { clipboardSlice } from "./slices/clipboardSlice";
import { cloudSlice } from "./slices/cloudSlice";

import type { QuizState } from "./types";

//  Store

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      ...frameSlice(set, get),
      ...objectSlice(set, get),
      ...selectionSlice(set, get),
      ...historySlice(set, get),
      ...clipboardSlice(set, get),
      ...cloudSlice(set, get),
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
        showRuler: s.showRuler,
        showGrid: s.showGrid,
        timelineOpen: s.timelineOpen,
        zoom: s.zoom,
        showCursorLines: s.showCursorLines,
        defaultTypography: s.defaultTypography,
        cloudProjectId: s.cloudProjectId,
        cloudProjectTitle: s.cloudProjectTitle,
        cloudProjectClient: s.cloudProjectClient,
        cloudProjectLocales: s.cloudProjectLocales,
        cloudProjectRegions: s.cloudProjectRegions,
        exportMeta: s.exportMeta,
        customCss: s.customCss,
        assets: s.assets,
        customFonts: s.customFonts,
      }),
    },
  ),
);
