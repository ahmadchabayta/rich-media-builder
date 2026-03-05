import { useEffect } from "react";
import { useQuizStore, type ProjectSnapshot } from "@src/store/quizStore";
import { notifications } from "@mantine/notifications";

/**
 * Global keyboard shortcuts for the BLS Producer.
 * Handles undo/redo, duplicate, copy/paste, arrow nudge, shift-resize hint,
 * delete, save, export, new project, sidebar toggle.
 */
export function useKeyboardShortcuts(
  boardContainerRef: React.RefObject<HTMLDivElement | null>,
  actions?: { exportQuiz?: () => void },
) {
  useEffect(() => {
    const isEditable = () => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // ── Save to file (Ctrl+S) ──
      if (mod && e.key === "s") {
        e.preventDefault();
        const {
          quizData,
          defaultW: dw,
          defaultH: dh,
          currentPreviewIndex: idx,
          markSaved,
        } = useQuizStore.getState();
        const snapshot: ProjectSnapshot = {
          version: 1,
          quizData,
          defaultW: dw,
          defaultH: dh,
          currentPreviewIndex: idx,
        };
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bls-project.json";
        a.click();
        URL.revokeObjectURL(url);
        markSaved();
        notifications.show({
          title: "Saved",
          message: "Project saved to file.",
          color: "teal",
          autoClose: 2000,
        });
        return;
      }

      // ── Export (Ctrl+E) ──
      if (mod && e.key === "e") {
        e.preventDefault();
        actions?.exportQuiz?.();
        return;
      }

      // ── New project (Ctrl+N) ──
      if (mod && e.key === "n") {
        e.preventDefault();
        if (
          !window.confirm(
            "Start a new project? All unsaved changes will be lost.",
          )
        )
          return;
        const { defaultW, defaultH, loadProject, setCloudProjectId } =
          useQuizStore.getState();
        const blank: ProjectSnapshot = {
          version: 1,
          quizData: { bg: null, frames: [] },
          defaultW,
          defaultH,
          currentPreviewIndex: 0,
        };
        loadProject(blank);
        setCloudProjectId(null);
        notifications.show({
          title: "New project",
          message: "Started a blank project.",
          color: "teal",
          autoClose: 2500,
        });
        return;
      }

      // ── Toggle timeline (Ctrl+Shift+T) ──
      if (mod && e.shiftKey && e.key === "T") {
        e.preventDefault();
        const state = useQuizStore.getState();
        state.setTimelineOpen(!state.timelineOpen);
        return;
      }

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
