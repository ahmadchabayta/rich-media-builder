import { createContext, useContext } from "react";
import type { Editor } from "@tiptap/react";

export interface RichEditorContextValue {
  activeEditor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
}

export const RichEditorContext = createContext<RichEditorContextValue>({
  activeEditor: null,
  setActiveEditor: () => {},
});

export function useRichEditorContext(): RichEditorContextValue {
  return useContext(RichEditorContext);
}
