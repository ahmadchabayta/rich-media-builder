import type React from "react";
import { useQuizStore } from "@src/store/quizStore";
import {
  computeSnapAndGuides,
  emitGuides,
  clearGuides,
  type ObjRect,
} from "@src/lib/snapGuides";
import type {
  DragState,
  ObjectDragState,
  ObjectResizeState,
  FrameResizeState,
} from "./dragTypes";

/* ─── Mouse-move handler factory ──────────────────────────────── */

export function createMouseMoveHandler(
  dragStateRef: React.RefObject<DragState | null>,
  boardContainerRef: React.RefObject<HTMLDivElement | null>,
) {
  return (e: MouseEvent) => {
    const ds = dragStateRef.current;
    if (!ds) return;

    if (ds.mode === "object") {
      const objStore = useQuizStore.getState();
      const frame = objStore.quizData.frames[ds.frameIndex];
      const obj = frame?.objects.find((o) => o.id === ds.objId);
      if (!obj) return;
      const rawX = Math.round(ds.origX + (e.clientX - ds.startMouseX));
      const rawY = Math.round(ds.origY + (e.clientY - ds.startMouseY));

      const el = boardContainerRef.current?.querySelector<HTMLElement>(
        `[data-obj-id="${ds.objId}"][data-fi="${ds.frameIndex}"]`,
      );
      const draggedW = el?.offsetWidth ?? 80;
      const draggedH = el?.offsetHeight ?? 40;

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

      const snapEnabled = useQuizStore.getState().snapEnabled;
      const { x, y, guides } = computeSnapAndGuides(
        { id: ds.objId, x: rawX, y: rawY, w: draggedW, h: draggedH },
        others,
        frame.w,
        frame.h,
        snapEnabled,
      );

      emitGuides({ frameIndex: ds.frameIndex, ...guides });

      if (el) {
        el.style.left = x + "px";
        el.style.top = y + "px";
      }
      const xInput = document.getElementById(
        "obj-x-input",
      ) as HTMLInputElement | null;
      const yInput = document.getElementById(
        "obj-y-input",
      ) as HTMLInputElement | null;
      if (xInput) xInput.value = String(x);
      if (yInput) yInput.value = String(y);
      (ds as ObjectDragState).liveX = x;
      (ds as ObjectDragState).liveY = y;
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

      const corner = ds.corner;
      const affectsW = corner.includes("e") || corner.includes("w");
      const affectsH = corner.includes("n") || corner.includes("s");
      const fromLeft = corner.includes("w");
      const fromTop = corner.includes("n");

      let newW = affectsW
        ? Math.round(fromLeft ? ds.origW - dx : ds.origW + dx)
        : ds.origW;
      let newH = affectsH
        ? Math.round(fromTop ? ds.origH - dy : ds.origH + dy)
        : ds.origH;

      if (e.shiftKey && affectsW && affectsH && ds.origH > 0) {
        const ratio = ds.origW / ds.origH;
        if (Math.abs(newW - ds.origW) >= Math.abs(newH - ds.origH)) {
          newH = Math.round(newW / ratio);
        } else {
          newW = Math.round(newH * ratio);
        }
      }

      const live = ds as ObjectResizeState;
      if (obj.type === "image") {
        const w = Math.max(20, newW);
        const h = Math.max(20, newH);
        const nx = fromLeft ? ds.origX + (ds.origW - w) : ds.origX;
        const ny = fromTop ? ds.origY + (ds.origH - h) : ds.origY;
        if (el) {
          if (affectsW) el.style.width = w + "px";
          if (affectsH) el.style.height = h + "px";
          if (fromLeft) el.style.left = nx + "px";
          if (fromTop) el.style.top = ny + "px";
        }
        if (affectsW) live.liveW = w;
        if (affectsH) live.liveH = h;
        if (fromLeft) live.liveX = nx;
        if (fromTop) live.liveY = ny;
      } else if (obj.type === "answerGroup") {
        const w = Math.max(60, newW);
        const btnH = Math.max(20, Math.round(ds.origH + dy));
        const nx = fromLeft ? ds.origX + (ds.origW - w) : ds.origX;
        if (el) {
          el.style.width = w + "px";
          if (fromLeft) el.style.left = nx + "px";
          Array.from(el.children).forEach((btn, i) => {
            (btn as HTMLElement).style.height = btnH + "px";
            if (i < obj.answers.length - 1)
              (btn as HTMLElement).style.marginBottom =
                (obj.btnGap ?? 10) + "px";
          });
        }
        live.liveW = w;
        live.liveH = btnH;
        if (fromLeft) live.liveX = nx;
      } else if (obj.type === "shape") {
        const w = Math.max(4, newW);
        const h = Math.max(4, newH);
        const nx = fromLeft ? ds.origX + (ds.origW - w) : ds.origX;
        const ny = fromTop ? ds.origY + (ds.origH - h) : ds.origY;
        if (el) {
          if (affectsW) el.style.width = w + "px";
          if (affectsH) el.style.height = h + "px";
          if (fromLeft) el.style.left = nx + "px";
          if (fromTop) el.style.top = ny + "px";
        }
        if (affectsW) live.liveW = w;
        if (affectsH) live.liveH = h;
        if (fromLeft) live.liveX = nx;
        if (fromTop) live.liveY = ny;
      } else if (obj.type === "divider") {
        const w = Math.max(4, newW);
        const nx = fromLeft ? ds.origX + (ds.origW - w) : ds.origX;
        if (el) {
          el.style.width = w + "px";
          if (fromLeft) el.style.left = nx + "px";
        }
        live.liveW = w;
        if (fromLeft) live.liveX = nx;
      } else {
        // text: scale font proportionally
        const w = Math.max(40, newW);
        const nx = fromLeft ? ds.origX + (ds.origW - w) : ds.origX;
        const newSize =
          ds.origW > 0
            ? Math.max(6, Math.round(ds.origSize * (w / ds.origW)))
            : ds.origSize;
        if (el) {
          el.style.fontSize = newSize + "px";
          if (fromLeft) el.style.left = nx + "px";
        }
        live.liveSize = newSize;
        if (fromLeft) live.liveX = nx;
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
      (ds as FrameResizeState).liveW = w;
      (ds as FrameResizeState).liveH = h;
    }
  };
}

/* ─── Mouse-up handler factory ────────────────────────────────── */

export function createMouseUpHandler(
  dragStateRef: React.MutableRefObject<DragState | null>,
) {
  return () => {
    const ds = dragStateRef.current;
    if (!ds) return;
    const s = useQuizStore.getState();

    if (ds.mode === "object") {
      if (ds.liveX !== undefined && ds.liveY !== undefined) {
        s.commitObjectPosition(ds.frameIndex, ds.objId, ds.liveX, ds.liveY);
      }
    } else if (ds.mode === "obj-resize") {
      const frame = s.quizData.frames[ds.frameIndex];
      const obj = frame?.objects.find((o) => o.id === ds.objId);
      if (obj) {
        if (obj.type === "image" && ds.liveW !== undefined) {
          s.commitObjectResize(ds.frameIndex, ds.objId, {
            w: ds.liveW,
            h: ds.liveH,
          });
        } else if (obj.type === "answerGroup" && ds.liveW !== undefined) {
          s.commitObjectResize(ds.frameIndex, ds.objId, {
            w: ds.liveW,
            btnHeight: ds.liveH,
          });
        } else if (obj.type === "shape" && ds.liveW !== undefined) {
          s.commitObjectResize(ds.frameIndex, ds.objId, {
            w: ds.liveW,
            h: ds.liveH,
          });
        } else if (obj.type === "divider" && ds.liveW !== undefined) {
          s.commitObjectResize(ds.frameIndex, ds.objId, { w: ds.liveW });
        } else if (obj.type === "text" && ds.liveSize !== undefined) {
          s.commitObjectResize(ds.frameIndex, ds.objId, { size: ds.liveSize });
        }
        if (ds.liveX !== undefined || ds.liveY !== undefined) {
          s.commitObjectPosition(
            ds.frameIndex,
            ds.objId,
            ds.liveX ?? ds.origX,
            ds.liveY ?? ds.origY,
          );
        }
      }
    } else if (ds.mode === "resize") {
      if (ds.liveW !== undefined && ds.liveH !== undefined) {
        s.commitFrameSize(ds.frameIndex, ds.liveW, ds.liveH);
      }
    }

    dragStateRef.current = null;
    document.body.style.cursor = "";
    if (ds.mode === "object") clearGuides(ds.frameIndex);
  };
}
