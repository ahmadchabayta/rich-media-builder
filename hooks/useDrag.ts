import { useRef, useEffect, useCallback } from "react";
import { useQuizStore } from "@src/store/quizStore";
import type { DragState } from "./dragTypes";
import { createMouseMoveHandler, createMouseUpHandler } from "./dragHandlers";

export function useDrag(
  boardContainerRef: React.RefObject<HTMLDivElement | null>,
) {
  const dragStateRef = useRef<DragState | null>(null);
  const store = useQuizStore.getState;

  const startObjectDrag = useCallback(
    (e: React.MouseEvent, objId: string, frameIndex: number) => {
      const obj = store().quizData.frames[frameIndex]?.objects.find(
        (o) => o.id === objId,
      );
      if (!obj) return;
      dragStateRef.current = {
        mode: "object",
        objId,
        frameIndex,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        origX: obj.x ?? 0,
        origY: obj.y ?? 0,
      };
      document.body.style.cursor = "grabbing";
    },
    [store],
  );

  const startObjectResize = useCallback(
    (e: React.MouseEvent, objId: string, frameIndex: number, corner = "se") => {
      const obj = store().quizData.frames[frameIndex]?.objects.find(
        (o) => o.id === objId,
      );
      if (!obj) return;
      const el = boardContainerRef.current?.querySelector<HTMLElement>(
        `[data-obj-id="${objId}"][data-fi="${frameIndex}"]`,
      );
      dragStateRef.current = {
        mode: "obj-resize",
        objId,
        frameIndex,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        origX: obj.x ?? 0,
        origY: obj.y ?? 0,
        origW:
          obj.type === "image"
            ? (obj.w ?? el?.offsetWidth ?? 100)
            : obj.type === "answerGroup"
              ? (obj.w ?? el?.offsetWidth ?? 280)
              : (el?.offsetWidth ?? 280),
        origH:
          obj.type === "image"
            ? (obj.h ?? el?.offsetHeight ?? 100)
            : obj.type === "answerGroup"
              ? (obj.btnHeight ?? 44)
              : (el?.offsetHeight ?? 44),
        origSize: obj.type === "text" ? (obj.size ?? 22) : 22,
        corner,
      };
      document.body.style.cursor = corner + "-resize";
    },
    [store, boardContainerRef],
  );

  const startFrameResize = useCallback(
    (e: React.MouseEvent, frameIndex: number) => {
      const frame = store().quizData.frames[frameIndex];
      if (!frame) return;
      dragStateRef.current = {
        mode: "resize",
        frameIndex,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        origW: frame.w,
        origH: frame.h,
      };
      document.body.style.cursor = "se-resize";
    },
    [store],
  );

  useEffect(() => {
    const onMouseMove = createMouseMoveHandler(dragStateRef, boardContainerRef);
    const onMouseUp = createMouseUpHandler(dragStateRef);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [boardContainerRef]);

  return { startObjectDrag, startObjectResize, startFrameResize };
}
