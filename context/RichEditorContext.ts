import { createContext, useContext } from "react";
import type { Editor } from "@tiptap/react";
import type { TextObject } from "@src/lib/types";

export interface RichSelectionRange {
  from: number;
  to: number;
}

export interface RichEditorContextValue {
  activeEditor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
  selectionRange: RichSelectionRange | null;
  setSelectionRange: (range: RichSelectionRange | null) => void;
  lastExpandedSelectionRange: RichSelectionRange | null;
  setLastExpandedSelectionRange: (range: RichSelectionRange | null) => void;
  isSessionActive: boolean;
  applyTextPatch: (patch: Partial<TextObject>) => void;
  undoInEditor: () => boolean;
  redoInEditor: () => boolean;
}

export const RichEditorContext = createContext<RichEditorContextValue>({
  activeEditor: null,
  setActiveEditor: () => {},
  selectionRange: null,
  setSelectionRange: () => {},
  lastExpandedSelectionRange: null,
  setLastExpandedSelectionRange: () => {},
  isSessionActive: false,
  applyTextPatch: () => {},
  undoInEditor: () => false,
  redoInEditor: () => false,
});

export function useRichEditorContext(): RichEditorContextValue {
  return useContext(RichEditorContext);
}
