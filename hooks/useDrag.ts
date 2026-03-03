import { useRef, useEffect, useCallback } from "react";
import { useQuizStore } from "@src/store/quizStore";
import {
  computeSnapAndGuides,
  emitGuides,
  clearGuides,
  type ObjRect,
} from "@src/lib/snapGuides";

type DragMode = "object" | "obj-resize" | "resize";

interface ObjectDragState {
  mode: "object";
  objId: string;
  frameIndex: number;
  startMouseX: number;
  startMouseY: number;
  origX: number;
  origY: number;
}

interface ObjectResizeState {
  mode: "obj-resize";
  objId: string;
  frameIndex: number;
  startMouseX: number;
  startMouseY: number;
  origW: number;
  origH: number;
  origSize: number;
}

interface FrameResizeState {
  mode: "resize";
  frameIndex: number;
  startMouseX: number;
  startMouseY: number;
  origW: number;
  origH: number;
}

type DragState = ObjectDragState | ObjectResizeState | FrameResizeState;

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
    (e: React.MouseEvent, objId: string, frameIndex: number) => {
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
      };
      document.body.style.cursor = "se-resize";
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
    const onMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      if (ds.mode === "object") {
        const objStore = useQuizStore.getState();
        const frame = objStore.quizData.frames[ds.frameIndex];
        const obj = frame?.objects.find((o) => o.id === ds.objId);
        if (!obj) return;
        const rawX = Math.round(ds.origX + (e.clientX - ds.startMouseX));
        const rawY = Math.round(ds.origY + (e.clientY - ds.startMouseY));

        // Get dimensions of the dragged element from DOM
        const el = boardContainerRef.current?.querySelector<HTMLElement>(
          `[data-obj-id="${ds.objId}"][data-fi="${ds.frameIndex}"]`,
        );
        const draggedW = el?.offsetWidth ?? 80;
        const draggedH = el?.offsetHeight ?? 40;

        // Build rects for all other objects (use DOM dimensions for accuracy)
        const others: ObjRect[] = frame.objects
          .filter((o) => o.id !== ds.objId)
          .map((o) => {
            const oEl = boardContainerRef.current?.querySelector<HTMLElement>(
              `[data-obj-id="${o.id}"][data-fi="${ds.frameIndex}"]`,
            );
            return {
              id: o.id,
              x: o.x ?? 0,
              y: o.y ?? 0,
              w:
                oEl?.offsetWidth ??
                ("w" in o ? ((o as { w?: number }).w ?? 80) : 80),
              h:
                oEl?.offsetHeight ??
                ("h" in o ? ((o as { h?: number }).h ?? 40) : 40),
            };
          });

        // Compute snap & guides
        const snapEnabled = useQuizStore.getState().snapEnabled;
        const { x, y, guides } = computeSnapAndGuides(
          { id: ds.objId, x: rawX, y: rawY, w: draggedW, h: draggedH },
          others,
          frame.w,
          frame.h,
          snapEnabled,
        );

        // Emit guide lines to overlay in FrameCard
        emitGuides({ frameIndex: ds.frameIndex, ...guides });

        // Direct DOM update for performance
        if (el) {
          el.style.left = x + "px";
          el.style.top = y + "px";
        }
        // Update live coordinate readouts in sidebar if present
        const xInput = document.getElementById(
          "obj-x-input",
        ) as HTMLInputElement | null;
        const yInput = document.getElementById(
          "obj-y-input",
        ) as HTMLInputElement | null;
        if (xInput) xInput.value = String(x);
        if (yInput) yInput.value = String(y);
        // Store the live values in a temporary way (commit on mouseup)
        (ds as ObjectDragState & { liveX?: number; liveY?: number }).liveX = x;
        (ds as ObjectDragState & { liveX?: number; liveY?: number }).liveY = y;
      } else if (ds.mode === "obj-resize") {
        const objStore = useQuizStore.getState();
        const frame = objStore.quizData.frames[ds.frameIndex];
        const obj = frame?.objects.find((o) => o.id === ds.objId);
        if (!obj) return;
        const dx = e.clientX - ds.startMouseX;
        const dy = e.clientY - ds.startMouseY;
        const el = boardContainerRef.current?.querySelector<HTMLElement>(
          `[data-obj-id="${ds.objId}"][data-fi="${ds.frameIndex}"]`,
        );
        if (obj.type === "image") {
          const w = Math.max(20, Math.round(ds.origW + dx));
          const h = Math.max(20, Math.round(ds.origH + dy));
          if (el) {
            el.style.width = w + "px";
            el.style.height = h + "px";
          }
          (ds as ObjectResizeState & { liveW?: number; liveH?: number }).liveW =
            w;
          (ds as ObjectResizeState & { liveW?: number; liveH?: number }).liveH =
            h;
        } else if (obj.type === "answerGroup") {
          const w = Math.max(60, Math.round(ds.origW + dx));
          const btnH = Math.max(20, Math.round(ds.origH + dy));
          if (el) {
            el.style.width = w + "px";
            // Rebuild buttons inline
            const rgba = hexOpacityToRgba(
              obj.btnBgColor ?? "#ffffff",
              obj.btnBgOpacity ?? 18,
            );
            Array.from(el.children).forEach((btn, i) => {
              (btn as HTMLElement).style.height = btnH + "px";
              if (i < obj.answers.length - 1)
                (btn as HTMLElement).style.marginBottom =
                  (obj.btnGap ?? 10) + "px";
            });
            el.style.width = w + "px";
          }
          (ds as ObjectResizeState & { liveW?: number; liveH?: number }).liveW =
            w;
          (ds as ObjectResizeState & { liveW?: number; liveH?: number }).liveH =
            btnH;
        } else {
          // text: horizontal → font size
          const size = Math.max(8, Math.round(ds.origSize + dx * 0.3));
          if (el) el.style.fontSize = size + "px";
          (ds as ObjectResizeState & { liveSize?: number }).liveSize = size;
        }
      } else if (ds.mode === "resize") {
        const w = Math.max(
          80,
          Math.round(ds.origW + (e.clientX - ds.startMouseX)),
        );
        const h = Math.max(
          80,
          Math.round(ds.origH + (e.clientY - ds.startMouseY)),
        );
        const card = boardContainerRef.current?.querySelector<HTMLElement>(
          `[data-card-index="${ds.frameIndex}"]`,
        );
        if (card) {
          const cv = card.querySelector<HTMLElement>(".frame-canvas");
          if (cv) {
            cv.style.width = w + "px";
            cv.style.height = h + "px";
          }
          const badge = card.querySelector<HTMLElement>(".frame-badge");
          if (badge) badge.textContent = w + "×" + h;
        }
        (ds as FrameResizeState & { liveW?: number; liveH?: number }).liveW = w;
        (ds as FrameResizeState & { liveW?: number; liveH?: number }).liveH = h;
      }
    };

    const onMouseUp = () => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const s = useQuizStore.getState();

      if (ds.mode === "object") {
        const live = ds as ObjectDragState & { liveX?: number; liveY?: number };
        if (live.liveX !== undefined && live.liveY !== undefined) {
          s.commitObjectPosition(
            ds.frameIndex,
            ds.objId,
            live.liveX,
            live.liveY,
          );
        }
      } else if (ds.mode === "obj-resize") {
        const live = ds as ObjectResizeState & {
          liveW?: number;
          liveH?: number;
          liveSize?: number;
        };
        const frame = s.quizData.frames[ds.frameIndex];
        const obj = frame?.objects.find((o) => o.id === ds.objId);
        if (obj) {
          if (obj.type === "image" && live.liveW !== undefined) {
            s.commitObjectResize(ds.frameIndex, ds.objId, {
              w: live.liveW,
              h: live.liveH,
            });
          } else if (obj.type === "answerGroup" && live.liveW !== undefined) {
            s.commitObjectResize(ds.frameIndex, ds.objId, {
              w: live.liveW,
              btnHeight: live.liveH,
            });
          } else if (obj.type === "text" && live.liveSize !== undefined) {
            s.commitObjectResize(ds.frameIndex, ds.objId, {
              size: live.liveSize,
            });
          }
        }
      } else if (ds.mode === "resize") {
        const live = ds as FrameResizeState & {
          liveW?: number;
          liveH?: number;
        };
        if (live.liveW !== undefined && live.liveH !== undefined) {
          s.commitFrameSize(ds.frameIndex, live.liveW, live.liveH);
        }
      }

      dragStateRef.current = null;
      document.body.style.cursor = "";
      // Clear guide lines
      if (ds.mode === "object") clearGuides(ds.frameIndex);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [boardContainerRef]);

  return { startObjectDrag, startObjectResize, startFrameResize };
}

function hexOpacityToRgba(hex: string, opacityPct: number): string {
  hex = hex || "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacityPct / 100})`;
}
