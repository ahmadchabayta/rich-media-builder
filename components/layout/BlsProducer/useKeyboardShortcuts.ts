import { useEffect } from "react";
import { useQuizStore } from "@src/store/quizStore";

/**
 * Global keyboard shortcuts for the BLS Producer.
 * Handles undo/redo, duplicate, copy/paste, arrow nudge, shift-resize hint, and delete.
 */
export function useKeyboardShortcuts(
  boardContainerRef: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const isEditable = () => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Undo / Redo
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useQuizStore.getState().undo();
        return;
      }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        useQuizStore.getState().redo();
        return;
      }
      // Duplicate selected object
      if (mod && e.key === "d") {
        e.preventDefault();
        const state = useQuizStore.getState();
        if (state.selectedObjectId)
          state.duplicateObject(
            state.currentPreviewIndex,
            state.selectedObjectId,
          );
        return;
      }
      // Copy / Paste
      if (mod && e.key === "c" && !isEditable()) {
        const state = useQuizStore.getState();
        if (state.selectedObjectId)
          state.copyObject(state.currentPreviewIndex, state.selectedObjectId);
        return;
      }
      if (mod && e.key === "v" && !isEditable()) {
        e.preventDefault();
        useQuizStore
          .getState()
          .pasteObject(useQuizStore.getState().currentPreviewIndex);
        return;
      }
      // Arrow-key nudge: 1 px, or 10 px with Shift
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        !isEditable()
      ) {
        const state = useQuizStore.getState();
        if (!state.selectedObjectId) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx =
          e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dy =
          e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
        state.nudgeObject(
          state.currentPreviewIndex,
          state.selectedObjectId,
          dx,
          dy,
        );
        return;
      }
      if (e.key === "Shift") {
        boardContainerRef.current
          ?.querySelectorAll<HTMLElement>("[data-obj-id]")
          .forEach((el) => {
            el.style.cursor = "se-resize";
          });
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (isEditable()) return;
        const state = useQuizStore.getState();
        const frame = state.getActiveFrame();
        const sel = state.selectedObjectId;
        if (!frame || !sel) return;
        state.removeObject(state.currentPreviewIndex, sel);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        boardContainerRef.current
          ?.querySelectorAll<HTMLElement>("[data-obj-id]")
          .forEach((el) => {
            el.style.cursor = "grab";
          });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [boardContainerRef]);
}
