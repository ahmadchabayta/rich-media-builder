import type { Frame, FrameObject } from "./types";

export function getObjDimensions(
  obj: FrameObject,
  boardContainer: HTMLElement | null,
): { w: number; h: number } {
  if (obj.type === "image") return { w: obj.w ?? 0, h: obj.h ?? 0 };
  if (obj.type === "shape") return { w: obj.w ?? 80, h: obj.h ?? 80 };
  if (obj.type === "divider") return { w: obj.w ?? 200, h: obj.thickness ?? 2 };
  if (obj.type === "answerGroup") {
    const h =
      obj.answers.length * (obj.btnHeight ?? 44) +
      Math.max(0, obj.answers.length - 1) * (obj.btnGap ?? 10);
    return { w: obj.w ?? 280, h };
  }
  const el = boardContainer?.querySelector<HTMLElement>(
    `[data-obj-id="${obj.id}"]`,
  );
  return el ? { w: el.offsetWidth, h: el.offsetHeight } : { w: 0, h: 0 };
}

export function calcCenterH(
  frame: Frame,
  obj: FrameObject,
  boardContainer: HTMLElement | null,
): number {
  const { w } = getObjDimensions(obj, boardContainer);
  return Math.round((frame.w - w) / 2);
}

export function calcCenterV(
  frame: Frame,
  obj: FrameObject,
  boardContainer: HTMLElement | null,
): number {
  const { h } = getObjDimensions(obj, boardContainer);
  return Math.round((frame.h - h) / 2);
}

/**
 * Distribute objects horizontally with even gaps between them.
 * When `ids` is provided (≥2), only those objects are moved; others stay.
 * Falls back to all objects when ids is empty/undefined.
 */
export function spreadObjsH(
  objects: FrameObject[],
  boardContainer: HTMLElement | null = null,
  ids?: string[],
): FrameObject[] {
  const targets =
    ids && ids.length >= 2
      ? objects.filter((o) => ids.includes(o.id))
      : objects;
  if (targets.length < 2) return objects;

  const sorted = [...targets].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
  const totalW = sorted.reduce(
    (sum, o) => sum + getObjDimensions(o, boardContainer).w,
    0,
  );
  const leftEdge = sorted[0].x ?? 0;
  const last = sorted[sorted.length - 1];
  const rightEdge = (last.x ?? 0) + getObjDimensions(last, boardContainer).w;
  const totalSpan = rightEdge - leftEdge;
  const gap = (totalSpan - totalW) / (sorted.length - 1);

  let cursor = leftEdge;
  const newX = new Map<string, number>();
  for (const o of sorted) {
    newX.set(o.id, Math.round(cursor));
    cursor += getObjDimensions(o, boardContainer).w + gap;
  }
  return objects.map((o) =>
    newX.has(o.id) ? { ...o, x: newX.get(o.id)! } : o,
  );
}

/**
 * Distribute objects vertically with even gaps between them.
 * When `ids` is provided (≥2), only those objects are moved; others stay.
 */
export function spreadObjsV(
  objects: FrameObject[],
  boardContainer: HTMLElement | null = null,
  ids?: string[],
): FrameObject[] {
  const targets =
    ids && ids.length >= 2
      ? objects.filter((o) => ids.includes(o.id))
      : objects;
  if (targets.length < 2) return objects;

  const sorted = [...targets].sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
  const totalH = sorted.reduce(
    (sum, o) => sum + getObjDimensions(o, boardContainer).h,
    0,
  );
  const topEdge = sorted[0].y ?? 0;
  const last = sorted[sorted.length - 1];
  const bottomEdge = (last.y ?? 0) + getObjDimensions(last, boardContainer).h;
  const totalSpan = bottomEdge - topEdge;
  const gap = (totalSpan - totalH) / (sorted.length - 1);

  let cursor = topEdge;
  const newY = new Map<string, number>();
  for (const o of sorted) {
    newY.set(o.id, Math.round(cursor));
    cursor += getObjDimensions(o, boardContainer).h + gap;
  }
  return objects.map((o) =>
    newY.has(o.id) ? { ...o, y: newY.get(o.id)! } : o,
  );
}

// ── Multi-select alignment (Photoshop-style) ─────────────────────────────

/** Align selected objects' left edges to the leftmost object. */
export function alignLeft(
  objects: FrameObject[],
  ids: string[],
): FrameObject[] {
  const targets = objects.filter((o) => ids.includes(o.id));
  if (targets.length < 2) return objects;
  const minX = Math.min(...targets.map((o) => o.x ?? 0));
  return objects.map((o) => (ids.includes(o.id) ? { ...o, x: minX } : o));
}

/** Align selected objects' right edges to the rightmost object. */
export function alignRight(
  objects: FrameObject[],
  ids: string[],
  boardContainer: HTMLElement | null = null,
): FrameObject[] {
  const targets = objects.filter((o) => ids.includes(o.id));
  if (targets.length < 2) return objects;
  const rightEdges = targets.map(
    (o) => (o.x ?? 0) + getObjDimensions(o, boardContainer).w,
  );
  const maxRight = Math.max(...rightEdges);
  return objects.map((o) => {
    if (!ids.includes(o.id)) return o;
    const w = getObjDimensions(o, boardContainer).w;
    return { ...o, x: Math.round(maxRight - w) };
  });
}

/** Align selected objects' top edges to the topmost object. */
export function alignTop(objects: FrameObject[], ids: string[]): FrameObject[] {
  const targets = objects.filter((o) => ids.includes(o.id));
  if (targets.length < 2) return objects;
  const minY = Math.min(...targets.map((o) => o.y ?? 0));
  return objects.map((o) => (ids.includes(o.id) ? { ...o, y: minY } : o));
}

/** Align selected objects' bottom edges to the bottommost object. */
export function alignBottom(
  objects: FrameObject[],
  ids: string[],
  boardContainer: HTMLElement | null = null,
): FrameObject[] {
  const targets = objects.filter((o) => ids.includes(o.id));
  if (targets.length < 2) return objects;
  const bottomEdges = targets.map(
    (o) => (o.y ?? 0) + getObjDimensions(o, boardContainer).h,
  );
  const maxBottom = Math.max(...bottomEdges);
  return objects.map((o) => {
    if (!ids.includes(o.id)) return o;
    const h = getObjDimensions(o, boardContainer).h;
    return { ...o, y: Math.round(maxBottom - h) };
  });
}

/** Align selected objects' horizontal centres to the average centre. */
export function alignCenterH(
  objects: FrameObject[],
  ids: string[],
  boardContainer: HTMLElement | null = null,
): FrameObject[] {
  const targets = objects.filter((o) => ids.includes(o.id));
  if (targets.length < 2) return objects;
  const centres = targets.map(
    (o) => (o.x ?? 0) + getObjDimensions(o, boardContainer).w / 2,
  );
  const avgCentre = centres.reduce((a, b) => a + b, 0) / centres.length;
  return objects.map((o) => {
    if (!ids.includes(o.id)) return o;
    const w = getObjDimensions(o, boardContainer).w;
    return { ...o, x: Math.round(avgCentre - w / 2) };
  });
}

/** Align selected objects' vertical centres to the average centre. */
export function alignCenterV(
  objects: FrameObject[],
  ids: string[],
  boardContainer: HTMLElement | null = null,
): FrameObject[] {
  const targets = objects.filter((o) => ids.includes(o.id));
  if (targets.length < 2) return objects;
  const centres = targets.map(
    (o) => (o.y ?? 0) + getObjDimensions(o, boardContainer).h / 2,
  );
  const avgCentre = centres.reduce((a, b) => a + b, 0) / centres.length;
  return objects.map((o) => {
    if (!ids.includes(o.id)) return o;
    const h = getObjDimensions(o, boardContainer).h;
    return { ...o, y: Math.round(avgCentre - h / 2) };
  });
}
