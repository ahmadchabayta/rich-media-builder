import type { CSSProperties } from "react";
import type { CSSFilterConfig } from "@src/lib/types";

/** Resolve CSS overrides for hover effects (used during playback) */
export function resolveHoverOverrides(
  type: string,
  baseOpacity: number,
  baseTransform: string | undefined,
  baseFilter: string | undefined,
): CSSProperties {
  const tf = (extra: string) =>
    [baseTransform, extra].filter(Boolean).join(" ");
  switch (type) {
    case "lift":
      return { transform: tf("translateY(-6px)") };
    case "grow":
      return { transform: tf("scale(1.07)") };
    case "shrink":
      return { transform: tf("scale(0.93)") };
    case "tilt":
      return { transform: tf("rotate(5deg)") };
    case "glow":
      return { boxShadow: "0 0 20px 6px rgba(255,255,255,0.5)" };
    case "dim":
      return { opacity: baseOpacity * 0.45 };
    case "brighten":
      return {
        filter: [baseFilter, "brightness(1.4)"].filter(Boolean).join(" "),
      };
    default:
      return {};
  }
}

/** Build a CSS filter string from the CSSFilterConfig */
export function buildCSSFilter(
  f: CSSFilterConfig | undefined,
): string | undefined {
  if (!f) return undefined;
  const p: string[] = [];
  if (f.opacity != null && f.opacity !== 100) p.push(`opacity(${f.opacity}%)`);
  if (f.brightness != null && f.brightness !== 100)
    p.push(`brightness(${f.brightness}%)`);
  if (f.contrast != null && f.contrast !== 100)
    p.push(`contrast(${f.contrast}%)`);
  if (f.saturate != null && f.saturate !== 100)
    p.push(`saturate(${f.saturate}%)`);
  if (f.hueRotate != null && f.hueRotate !== 0)
    p.push(`hue-rotate(${f.hueRotate}deg)`);
  if (f.blur != null && f.blur !== 0) p.push(`blur(${f.blur}px)`);
  if (f.grayscale != null && f.grayscale !== 0)
    p.push(`grayscale(${f.grayscale}%)`);
  if (f.sepia != null && f.sepia !== 0) p.push(`sepia(${f.sepia}%)`);
  if (f.invert != null && f.invert !== 0) p.push(`invert(${f.invert}%)`);
  return p.length > 0 ? p.join(" ") : undefined;
}

/** Convert hex + opacity percentage to rgba() string */
export function hexOpacityToRgba(hex: string, opacityPct: number): string {
  const h = hex || "#ffffff";
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacityPct / 100})`;
}

/** 8 resize handles: 4 corners + 4 edges */
export const HANDLES = [
  {
    id: "nw",
    top: -5,
    bottom: "auto" as const,
    left: -5,
    right: "auto" as const,
    tf: undefined,
  },
  {
    id: "n",
    top: -5,
    bottom: "auto" as const,
    left: "50%",
    right: "auto" as const,
    tf: "translateX(-50%)",
  },
  {
    id: "ne",
    top: -5,
    bottom: "auto" as const,
    left: "auto" as const,
    right: -5,
    tf: undefined,
  },
  {
    id: "e",
    top: "50%",
    bottom: "auto" as const,
    left: "auto" as const,
    right: -5,
    tf: "translateY(-50%)",
  },
  {
    id: "se",
    top: "auto" as const,
    bottom: -5,
    left: "auto" as const,
    right: -5,
    tf: undefined,
  },
  {
    id: "s",
    top: "auto" as const,
    bottom: -5,
    left: "50%",
    right: "auto" as const,
    tf: "translateX(-50%)",
  },
  {
    id: "sw",
    top: "auto" as const,
    bottom: -5,
    left: -5,
    right: "auto" as const,
    tf: undefined,
  },
  {
    id: "w",
    top: "50%",
    bottom: "auto" as const,
    left: -5,
    right: "auto" as const,
    tf: "translateY(-50%)",
  },
];
