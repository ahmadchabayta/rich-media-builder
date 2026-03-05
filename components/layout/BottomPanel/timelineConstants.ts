import type { Frame } from "@src/lib/types";

export interface FrameTiming {
  enterDur: number;
  holdDur: number;
  exitDur: number;
  total: number;
}

export const TRACK_H = 34;
export const LABEL_W = 88;
export const MIN_FRAME_PX = 60;
export const PX_PER_MS = 0.09;
export const DEFAULT_HOLD = 1500;

export const ENTER_COLOR = "rgba(59,130,246,0.55)";
export const HOLD_COLOR = "rgba(255,255,255,0.08)";
export const EXIT_COLOR = "rgba(239,68,68,0.45)";
export const ACTIVE_BORDER = "var(--mantine-color-blue-4)";
export const INACTIVE_BORDER = "var(--mantine-color-dark-4)";

export function getTimings(frames: Frame[], holdMs: number): FrameTiming[] {
  return frames.map((f) => {
    const maxCustomEnter = f.objects.reduce(
      (m, o) => Math.max(m, o.customAnimIn?.dur ?? 0),
      0,
    );
    const maxCustomExit = f.objects.reduce(
      (m, o) => Math.max(m, o.customAnimOut?.dur ?? 0),
      0,
    );
    const enterStagger = f.enterStagger ?? 0;
    const exitStagger = f.exitStagger ?? 0;
    // Number of distinct animOrder waves (max wave index = waveCount - 1)
    const waveCount = new Set(f.objects.map((o) => o.animOrder ?? 0)).size;
    const staggerEnterOffset = Math.max(0, waveCount - 1) * enterStagger;
    const staggerExitOffset = Math.max(0, waveCount - 1) * exitStagger;
    const enterDur =
      Math.max(f.animEnter?.dur ?? 400, maxCustomEnter) + staggerEnterOffset;
    const exitDur =
      Math.max(f.animExit?.dur ?? 300, maxCustomExit) + staggerExitOffset;
    return {
      enterDur,
      holdDur: holdMs,
      exitDur,
      total: enterDur + holdMs + exitDur,
    };
  });
}

export function msToLabel(ms: number) {
  return ms >= 1000 ? (ms / 1000).toFixed(1) + "s" : ms + "ms";
}
