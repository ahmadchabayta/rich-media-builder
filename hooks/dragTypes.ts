/* ─── Drag state type definitions for useDrag ─ */

export type DragMode = "object" | "obj-resize" | "resize";

export interface ObjectDragState {
  mode: "object";
  objId: string;
  frameIndex: number;
  startMouseX: number;
  startMouseY: number;
  origX: number;
  origY: number;
  liveX?: number;
  liveY?: number;
}

export interface ObjectResizeState {
  mode: "obj-resize";
  objId: string;
  frameIndex: number;
  startMouseX: number;
  startMouseY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  origSize: number;
  corner: string;
  liveW?: number;
  liveH?: number;
  liveX?: number;
  liveY?: number;
  liveSize?: number;
}

export interface FrameResizeState {
  mode: "resize";
  frameIndex: number;
  startMouseX: number;
  startMouseY: number;
  origW: number;
  origH: number;
  liveW?: number;
  liveH?: number;
}

export type DragState = ObjectDragState | ObjectResizeState | FrameResizeState;
