/**
 * Smart alignment guides & snapping.
 *
 * During an object drag we look at all other objects in the same frame and the
 * frame edges/centre, compute "candidate" snap positions, find the closest
 * ones within a pixel threshold, optionally snap the dragged position to them,
 * and return the guide lines to draw.
 */

export const SNAP_THRESHOLD = 6; // px — within this distance we snap / show a guide

export interface GuideLines {
  /** x-coordinates of vertical guide lines (drawn top→bottom across the canvas) */
  vLines: number[];
  /** y-coordinates of horizontal guide lines (drawn left→right across the canvas) */
  hLines: number[];
}

export interface ObjRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Compute snap position and guide lines for a dragged object.
 *
 * @param dragged  Current (raw, un-snapped) rect of the dragged object.
 * @param others   Rects of all OTHER objects on the same frame.
 * @param frameW   Frame width  (used for centre / edge guides).
 * @param frameH   Frame height.
 * @param snap     Whether to actually snap the position.
 * @returns        { x, y } (possibly snapped) and guide lines to render.
 */
export function computeSnapAndGuides(
  dragged: ObjRect,
  others: ObjRect[],
  frameW: number,
  frameH: number,
  snap: boolean,
): { x: number; y: number; guides: GuideLines } {
  const { x: rawX, y: rawY, w, h } = dragged;

  // ── Dragged object key x/y values ────────────────────────────────────────
  const dLeft = rawX;
  const dCenterX = rawX + w / 2;
  const dRight = rawX + w;

  const dTop = rawY;
  const dCenterY = rawY + h / 2;
  const dBottom = rawY + h;

  // ── Build candidate snap targets ─────────────────────────────────────────
  // Each target: { axis: 'x'|'y', dragEdge: number, snapTo: number }
  // dragEdge  = which value of the dragged obj is being compared
  // snapTo    = the reference value we'd snap to

  interface Candidate {
    axis: "x" | "y";
    dragEdge: number;
    snapTo: number;
  }

  const candidates: Candidate[] = [];

  // Frame edges + centre
  candidates.push(
    { axis: "x", dragEdge: dLeft, snapTo: 0 },
    { axis: "x", dragEdge: dCenterX, snapTo: frameW / 2 },
    { axis: "x", dragEdge: dRight, snapTo: frameW },
    { axis: "y", dragEdge: dTop, snapTo: 0 },
    { axis: "y", dragEdge: dCenterY, snapTo: frameH / 2 },
    { axis: "y", dragEdge: dBottom, snapTo: frameH },
  );

  // Other objects
  for (const o of others) {
    const oLeft = o.x;
    const oCenterX = o.x + o.w / 2;
    const oRight = o.x + o.w;
    const oTop = o.y;
    const oCenterY = o.y + o.h / 2;
    const oBottom = o.y + o.h;

    // Vertical guide candidates (comparing x values)
    for (const snapTo of [oLeft, oCenterX, oRight]) {
      candidates.push({ axis: "x", dragEdge: dLeft, snapTo });
      candidates.push({ axis: "x", dragEdge: dCenterX, snapTo });
      candidates.push({ axis: "x", dragEdge: dRight, snapTo });
    }
    // Horizontal guide candidates (comparing y values)
    for (const snapTo of [oTop, oCenterY, oBottom]) {
      candidates.push({ axis: "y", dragEdge: dTop, snapTo });
      candidates.push({ axis: "y", dragEdge: dCenterY, snapTo });
      candidates.push({ axis: "y", dragEdge: dBottom, snapTo });
    }
  }

  // ── Find closest snap within threshold ───────────────────────────────────
  let bestX: { dragEdge: number; snapTo: number; delta: number } | null = null;
  let bestY: { dragEdge: number; snapTo: number; delta: number } | null = null;

  for (const c of candidates) {
    const delta = Math.abs(c.dragEdge - c.snapTo);
    if (delta > SNAP_THRESHOLD) continue;
    if (c.axis === "x") {
      if (!bestX || delta < bestX.delta) bestX = { ...c, delta };
    } else {
      if (!bestY || delta < bestY.delta) bestY = { ...c, delta };
    }
  }

  // ── Compute (possibly snapped) position ──────────────────────────────────
  let finalX = rawX;
  let finalY = rawY;

  if (snap && bestX) {
    // Offset rawX so that dragEdge lands exactly on snapTo
    finalX = rawX + (bestX.snapTo - bestX.dragEdge);
  }
  if (snap && bestY) {
    finalY = rawY + (bestY.snapTo - bestY.dragEdge);
  }

  // ── Collect guide lines to draw ───────────────────────────────────────────
  // Re-check with final position so guides match snapped coords
  const finalLeft = finalX;
  const finalCenterX = finalX + w / 2;
  const finalRight = finalX + w;
  const finalTop = finalY;
  const finalCenterY = finalY + h / 2;
  const finalBottom = finalY + h;

  const vLineSet = new Set<number>();
  const hLineSet = new Set<number>();

  const addGuides = (axis: "x" | "y", edges: number[], targets: number[]) => {
    for (const edge of edges) {
      for (const t of targets) {
        if (Math.abs(edge - t) <= SNAP_THRESHOLD) {
          if (axis === "x") vLineSet.add(Math.round(t));
          else hLineSet.add(Math.round(t));
        }
      }
    }
  };

  const objXEdges = [finalLeft, finalCenterX, finalRight];
  const objYEdges = [finalTop, finalCenterY, finalBottom];

  // Frame references
  addGuides("x", objXEdges, [0, frameW / 2, frameW]);
  addGuides("y", objYEdges, [0, frameH / 2, frameH]);

  for (const o of others) {
    addGuides("x", objXEdges, [o.x, o.x + o.w / 2, o.x + o.w]);
    addGuides("y", objYEdges, [o.y, o.y + o.h / 2, o.y + o.h]);
  }

  return {
    x: Math.round(finalX),
    y: Math.round(finalY),
    guides: {
      vLines: Array.from(vLineSet),
      hLines: Array.from(hLineSet),
    },
  };
}

// ── Custom DOM event used to communicate guides to FrameCard ─────────────────

export interface GuideEvent {
  frameIndex: number;
  vLines: number[];
  hLines: number[];
}

export function emitGuides(detail: GuideEvent) {
  window.dispatchEvent(new CustomEvent<GuideEvent>("bls-guides", { detail }));
}

export function clearGuides(frameIndex: number) {
  emitGuides({ frameIndex, vLines: [], hLines: [] });
}
