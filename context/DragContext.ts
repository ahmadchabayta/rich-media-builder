import { createContext, useContext } from "react";

export interface DragContextValue {
  startObjectDrag: (
    e: React.MouseEvent,
    objId: string,
    frameIndex: number,
  ) => void;
  startObjectResize: (
    e: React.MouseEvent,
    objId: string,
    frameIndex: number,
  ) => void;
  startFrameResize: (e: React.MouseEvent, frameIndex: number) => void;
}

export const DragContext = createContext<DragContextValue | null>(null);

export function useDragContext(): DragContextValue {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error("useDragContext must be used inside DragProvider");
  return ctx;
}
