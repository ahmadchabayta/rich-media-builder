/**
 * presetLibrary.ts
 * ────────────────
 * Maps every built-in preset name to its structured KeyframeStop[] data.
 * This is the single source-of-truth for what each animation does.
 *
 * When a user clicks "Customize" on a preset, `presetToCustomAnim()` clones
 * the stops into a new CustomAnim the keyframe editor can mutate.
 */

import type { KeyframeStop, CustomAnim } from "./types";

// ── Helper: shorthand for creating stop arrays ──────────────────────────────

function s(
  offset: number,
  props: Record<string, string>,
  easing?: string,
): KeyframeStop {
  return easing ? { offset, props, easing } : { offset, props };
}

// ── Enter presets ───────────────────────────────────────────────────────────

const blsFadeIn: KeyframeStop[] = [
  s(0, { opacity: "0" }),
  s(1, { opacity: "1" }),
];

const blsSlideUp: KeyframeStop[] = [
  s(0, { transform: "translateY(40px)", opacity: "0" }),
  s(1, { transform: "translateY(0)", opacity: "1" }),
];

const blsSlideDown: KeyframeStop[] = [
  s(0, { transform: "translateY(-40px)", opacity: "0" }),
  s(1, { transform: "translateY(0)", opacity: "1" }),
];

const blsSlideLeft: KeyframeStop[] = [
  s(0, { transform: "translateX(40px)", opacity: "0" }),
  s(1, { transform: "translateX(0)", opacity: "1" }),
];

const blsSlideRight: KeyframeStop[] = [
  s(0, { transform: "translateX(-40px)", opacity: "0" }),
  s(1, { transform: "translateX(0)", opacity: "1" }),
];

const blsZoomIn: KeyframeStop[] = [
  s(0, { transform: "scale(.65)", opacity: "0" }),
  s(1, { transform: "scale(1)", opacity: "1" }),
];

const blsPopIn: KeyframeStop[] = [
  s(0, { transform: "scale(.5)", opacity: "0" }),
  s(0.7, { transform: "scale(1.08)", opacity: "1" }),
  s(1, { transform: "scale(1)", opacity: "1" }),
];

const blsGravityFall: KeyframeStop[] = [
  s(0, { transform: "translateY(-140px) scaleY(1.1)", opacity: "0" }),
  s(0.55, { transform: "translateY(12px) scaleY(0.94)", opacity: "1" }),
  s(0.75, { transform: "translateY(-7px) scaleY(1.03)" }),
  s(0.9, { transform: "translateY(3px) scaleY(0.99)" }),
  s(1, { transform: "translateY(0) scaleY(1)", opacity: "1" }),
];

const blsElasticPop: KeyframeStop[] = [
  s(0, { transform: "scale(0)", opacity: "0" }),
  s(0.5, { transform: "scale(1.3)", opacity: "1" }),
  s(0.65, { transform: "scale(0.85)" }),
  s(0.8, { transform: "scale(1.12)" }),
  s(0.9, { transform: "scale(0.96)" }),
  s(1, { transform: "scale(1)", opacity: "1" }),
];

const blsFlickerIn: KeyframeStop[] = [
  s(0, { opacity: "0" }),
  s(0.09, { opacity: "0" }),
  s(0.1, { opacity: "0.7" }),
  s(0.11, { opacity: "0" }),
  s(0.13, { opacity: "0.7" }),
  s(0.14, { opacity: "0" }),
  s(0.16, { opacity: "0.7" }),
  s(0.19, { opacity: "0" }),
  s(0.22, { opacity: "0.7" }),
  s(0.28, { opacity: "0" }),
  s(0.31, { opacity: "0.7" }),
  s(0.4, { opacity: "1" }),
  s(0.47, { opacity: "0.2" }),
  s(0.55, { opacity: "1" }),
  s(0.62, { opacity: "0.2" }),
  s(0.7, { opacity: "1" }),
  s(0.77, { opacity: "0.2" }),
  s(0.85, { opacity: "1" }),
  s(1, { opacity: "1" }),
];

const blsGlitchIn: KeyframeStop[] = [
  s(0, {
    "clip-path": "inset(35% 0 55% 0)",
    transform: "translateX(-10px)",
    opacity: "0",
  }),
  s(0.18, {
    "clip-path": "inset(65% 0 5% 0)",
    transform: "translateX(10px)",
    opacity: "0.4",
  }),
  s(0.36, {
    "clip-path": "inset(5% 0 60% 0)",
    transform: "translateX(-6px)",
    opacity: "0.6",
  }),
  s(0.54, {
    "clip-path": "inset(25% 0 35% 0)",
    transform: "translateX(6px)",
    opacity: "0.8",
  }),
  s(0.72, {
    "clip-path": "inset(0% 0 0% 0)",
    transform: "translateX(-2px)",
    opacity: "0.95",
  }),
  s(1, {
    "clip-path": "inset(0% 0 0% 0)",
    transform: "translateX(0)",
    opacity: "1",
  }),
];

const blsBlurIn: KeyframeStop[] = [
  s(0, { filter: "blur(28px)", opacity: "0", transform: "scale(1.06)" }),
  s(1, { filter: "blur(0)", opacity: "1", transform: "scale(1)" }),
];

const blsSwingIn: KeyframeStop[] = [
  s(0, {
    "transform-origin": "top center",
    transform: "rotateZ(-65deg)",
    opacity: "0",
  }),
  s(0.4, {
    "transform-origin": "top center",
    transform: "rotateZ(22deg)",
    opacity: "1",
  }),
  s(0.65, { "transform-origin": "top center", transform: "rotateZ(-12deg)" }),
  s(0.82, { "transform-origin": "top center", transform: "rotateZ(6deg)" }),
  s(0.92, { "transform-origin": "top center", transform: "rotateZ(-3deg)" }),
  s(1, {
    "transform-origin": "top center",
    transform: "rotateZ(0deg)",
    opacity: "1",
  }),
];

const blsLightSpeedIn: KeyframeStop[] = [
  s(0, { transform: "translateX(-110%) skewX(-28deg)", opacity: "0" }),
  s(0.6, { transform: "translateX(6%) skewX(8deg)", opacity: "1" }),
  s(0.8, { transform: "translateX(-2%) skewX(-4deg)" }),
  s(1, { transform: "translateX(0) skewX(0deg)", opacity: "1" }),
];

const blsFlipIn: KeyframeStop[] = [
  s(0, { transform: "perspective(700px) rotateX(-90deg)", opacity: "0" }),
  s(0.55, { transform: "perspective(700px) rotateX(18deg)", opacity: "1" }),
  s(0.78, { transform: "perspective(700px) rotateX(-9deg)" }),
  s(0.92, { transform: "perspective(700px) rotateX(4deg)" }),
  s(1, { transform: "perspective(700px) rotateX(0deg)", opacity: "1" }),
];

const blsSpinScaleIn: KeyframeStop[] = [
  s(0, { transform: "rotate(-200deg) scale(0)", opacity: "0" }),
  s(0.6, { transform: "rotate(15deg) scale(1.08)", opacity: "1" }),
  s(1, { transform: "rotate(0deg) scale(1)", opacity: "1" }),
];

const blsRollIn: KeyframeStop[] = [
  s(0, { transform: "translateX(-120%) rotate(-130deg)", opacity: "0" }),
  s(1, { transform: "translateX(0) rotate(0deg)", opacity: "1" }),
];

const blsPerspectiveIn: KeyframeStop[] = [
  s(0, { transform: "perspective(800px) rotateY(-90deg)", opacity: "0" }),
  s(0.6, { transform: "perspective(800px) rotateY(12deg)", opacity: "1" }),
  s(0.8, { transform: "perspective(800px) rotateY(-6deg)" }),
  s(1, { transform: "perspective(800px) rotateY(0deg)", opacity: "1" }),
];

// ── Exit presets ────────────────────────────────────────────────────────────

const blsFadeOut: KeyframeStop[] = [
  s(0, { opacity: "1" }),
  s(1, { opacity: "0" }),
];

const blsSlideUpOut: KeyframeStop[] = [
  s(0, { transform: "translateY(0)", opacity: "1" }),
  s(1, { transform: "translateY(-40px)", opacity: "0" }),
];

const blsSlideDownOut: KeyframeStop[] = [
  s(0, { transform: "translateY(0)", opacity: "1" }),
  s(1, { transform: "translateY(40px)", opacity: "0" }),
];

const blsSlideLeftOut: KeyframeStop[] = [
  s(0, { transform: "translateX(0)", opacity: "1" }),
  s(1, { transform: "translateX(-40px)", opacity: "0" }),
];

const blsSlideRightOut: KeyframeStop[] = [
  s(0, { transform: "translateX(0)", opacity: "1" }),
  s(1, { transform: "translateX(40px)", opacity: "0" }),
];

const blsZoomOut: KeyframeStop[] = [
  s(0, { transform: "scale(1)", opacity: "1" }),
  s(1, { transform: "scale(.65)", opacity: "0" }),
];

const blsGravityFallOut: KeyframeStop[] = [
  s(0, { transform: "translateY(0) scaleY(1)", opacity: "1" }),
  s(0.2, { transform: "translateY(-18px) scaleY(1.06)" }),
  s(1, { transform: "translateY(180px) scaleY(0.75)", opacity: "0" }),
];

const blsFlickerOut: KeyframeStop[] = [
  s(0, { opacity: "1" }),
  s(0.08, { opacity: "0.15" }),
  s(0.15, { opacity: "1" }),
  s(0.22, { opacity: "0.15" }),
  s(0.3, { opacity: "1" }),
  s(0.45, { opacity: "0" }),
  s(0.55, { opacity: "0.35" }),
  s(0.65, { opacity: "0" }),
  s(0.75, { opacity: "0.35" }),
  s(0.85, { opacity: "0" }),
  s(1, { opacity: "0" }),
];

const blsGlitchOut: KeyframeStop[] = [
  s(0, { "clip-path": "inset(0)", transform: "translateX(0)", opacity: "1" }),
  s(0.2, {
    "clip-path": "inset(15% 0 32% 0)",
    transform: "translateX(8px)",
    opacity: "0.85",
  }),
  s(0.4, {
    "clip-path": "inset(55% 0 0% 0)",
    transform: "translateX(-10px)",
    opacity: "0.55",
  }),
  s(0.6, {
    "clip-path": "inset(20% 0 70% 0)",
    transform: "translateX(12px)",
    opacity: "0.3",
  }),
  s(0.8, {
    "clip-path": "inset(0)",
    transform: "translateX(-5px)",
    opacity: "0.1",
  }),
  s(1, { "clip-path": "inset(0)", transform: "translateX(0)", opacity: "0" }),
];

const blsBlurOut: KeyframeStop[] = [
  s(0, { filter: "blur(0)", opacity: "1", transform: "scale(1)" }),
  s(1, { filter: "blur(28px)", opacity: "0", transform: "scale(1.06)" }),
];

const blsLightSpeedOut: KeyframeStop[] = [
  s(0, { transform: "translateX(0) skewX(0deg)", opacity: "1" }),
  s(1, { transform: "translateX(130%) skewX(28deg)", opacity: "0" }),
];

const blsFlipOut: KeyframeStop[] = [
  s(0, { transform: "perspective(700px) rotateX(0deg)", opacity: "1" }),
  s(1, { transform: "perspective(700px) rotateX(90deg)", opacity: "0" }),
];

const blsSpinScaleOut: KeyframeStop[] = [
  s(0, { transform: "rotate(0deg) scale(1)", opacity: "1" }),
  s(1, { transform: "rotate(200deg) scale(0)", opacity: "0" }),
];

const blsRollOut: KeyframeStop[] = [
  s(0, { transform: "translateX(0) rotate(0deg)", opacity: "1" }),
  s(1, { transform: "translateX(130%) rotate(130deg)", opacity: "0" }),
];

// ── Loop / Decoration presets ───────────────────────────────────────────────

const blsFloat: KeyframeStop[] = [
  s(0, { transform: "translateY(0)" }),
  s(0.5, { transform: "translateY(-8px)" }),
  s(1, { transform: "translateY(0)" }),
];

const blsPulseLoop: KeyframeStop[] = [
  s(0, { transform: "scale(1)" }),
  s(0.5, { transform: "scale(1.06)" }),
  s(1, { transform: "scale(1)" }),
];

const blsBounceLoop: KeyframeStop[] = [
  s(0, { transform: "translateY(0)" }),
  s(0.4, { transform: "translateY(-12px)" }),
  s(0.6, { transform: "translateY(-4px)" }),
  s(1, { transform: "translateY(0)" }),
];

const blsShake: KeyframeStop[] = [
  s(0, { transform: "translateX(0)" }),
  s(0.12, { transform: "translateX(-6px)" }),
  s(0.25, { transform: "translateX(6px)" }),
  s(0.37, { transform: "translateX(-4px)" }),
  s(0.5, { transform: "translateX(4px)" }),
  s(0.62, { transform: "translateX(-2px)" }),
  s(0.75, { transform: "translateX(2px)" }),
  s(1, { transform: "translateX(0)" }),
];

const blsSpin: KeyframeStop[] = [
  s(0, { transform: "rotate(0deg)" }),
  s(1, { transform: "rotate(360deg)" }),
];

const blsSwing: KeyframeStop[] = [
  s(0, { transform: "rotate(0deg)" }),
  s(0.25, { transform: "rotate(12deg)" }),
  s(0.75, { transform: "rotate(-12deg)" }),
  s(1, { transform: "rotate(0deg)" }),
];

const blsRubberBand: KeyframeStop[] = [
  s(0, { transform: "scaleX(1) scaleY(1)" }),
  s(0.3, { transform: "scaleX(1.2) scaleY(0.8)" }),
  s(0.4, { transform: "scaleX(0.85) scaleY(1.15)" }),
  s(0.5, { transform: "scaleX(1.1) scaleY(0.9)" }),
  s(0.65, { transform: "scaleX(0.96) scaleY(1.04)" }),
  s(0.75, { transform: "scaleX(1.03) scaleY(0.97)" }),
  s(1, { transform: "scaleX(1) scaleY(1)" }),
];

const blsWobble: KeyframeStop[] = [
  s(0, { transform: "translateX(0) rotate(0)" }),
  s(0.15, { transform: "translateX(-10px) rotate(-4deg)" }),
  s(0.3, { transform: "translateX(8px) rotate(3deg)" }),
  s(0.45, { transform: "translateX(-6px) rotate(-2deg)" }),
  s(0.6, { transform: "translateX(4px) rotate(1deg)" }),
  s(0.75, { transform: "translateX(-2px) rotate(-0.5deg)" }),
  s(1, { transform: "translateX(0) rotate(0)" }),
];

const blsHeartbeat: KeyframeStop[] = [
  s(0, { transform: "scale(1)" }),
  s(0.14, { transform: "scale(1.15)" }),
  s(0.28, { transform: "scale(1)" }),
  s(0.42, { transform: "scale(1.12)" }),
  s(0.56, { transform: "scale(1)" }),
  s(1, { transform: "scale(1)" }),
];

const blsJello: KeyframeStop[] = [
  s(0, { transform: "skewX(0) skewY(0)" }),
  s(0.22, { transform: "skewX(-10deg) skewY(-3deg)" }),
  s(0.33, { transform: "skewX(7deg) skewY(2deg)" }),
  s(0.44, { transform: "skewX(-4deg) skewY(-1.5deg)" }),
  s(0.55, { transform: "skewX(2deg) skewY(0.8deg)" }),
  s(0.66, { transform: "skewX(-1deg) skewY(-0.4deg)" }),
  s(1, { transform: "skewX(0) skewY(0)" }),
];

const blsBreathing: KeyframeStop[] = [
  s(0, { transform: "scale(1)", opacity: "1" }),
  s(0.5, { transform: "scale(1.04)", opacity: "0.85" }),
  s(1, { transform: "scale(1)", opacity: "1" }),
];

const blsPerspectiveTilt: KeyframeStop[] = [
  s(0, { transform: "perspective(600px) rotateX(3deg) rotateY(2deg)" }),
  s(0.5, { transform: "perspective(600px) rotateX(-3deg) rotateY(-2deg)" }),
  s(1, { transform: "perspective(600px) rotateX(3deg) rotateY(2deg)" }),
];

// ── Click presets ───────────────────────────────────────────────────────────

const clickPulse: KeyframeStop[] = [
  s(0, { transform: "scale(1)" }),
  s(0.5, { transform: "scale(1.08)" }),
  s(1, { transform: "scale(1)" }),
];

const clickBounce: KeyframeStop[] = [
  s(0, { transform: "translateY(0)" }),
  s(0.3, { transform: "translateY(-8px)" }),
  s(0.5, { transform: "translateY(0)" }),
  s(0.7, { transform: "translateY(-4px)" }),
  s(1, { transform: "translateY(0)" }),
];

const clickShake: KeyframeStop[] = [
  s(0, { transform: "translateX(0)" }),
  s(0.2, { transform: "translateX(-5px)" }),
  s(0.4, { transform: "translateX(5px)" }),
  s(0.6, { transform: "translateX(-3px)" }),
  s(0.8, { transform: "translateX(3px)" }),
  s(1, { transform: "translateX(0)" }),
];

const clickPop: KeyframeStop[] = [
  s(0, { transform: "scale(1)" }),
  s(0.4, { transform: "scale(0.9)" }),
  s(0.7, { transform: "scale(1.1)" }),
  s(1, { transform: "scale(1)" }),
];

const clickRipple: KeyframeStop[] = [
  s(0, { "box-shadow": "0 0 0 0 rgba(255,255,255,0.4)" }),
  s(1, { "box-shadow": "0 0 0 18px rgba(255,255,255,0)" }),
];

const clickJelly: KeyframeStop[] = [
  s(0, { transform: "scale(1,1)" }),
  s(0.3, { transform: "scale(1.15,0.85)" }),
  s(0.4, { transform: "scale(0.9,1.1)" }),
  s(0.5, { transform: "scale(1.05,0.95)" }),
  s(0.65, { transform: "scale(0.98,1.02)" }),
  s(0.8, { transform: "scale(1.01,0.99)" }),
  s(1, { transform: "scale(1,1)" }),
];

// ── Master lookup ───────────────────────────────────────────────────────────

export const PRESET_KEYFRAMES: Record<string, KeyframeStop[]> = {
  // Enter
  blsFadeIn,
  blsSlideUp,
  blsSlideDown,
  blsSlideLeft,
  blsSlideRight,
  blsZoomIn,
  blsPopIn,
  blsGravityFall,
  blsElasticPop,
  blsFlickerIn,
  blsGlitchIn,
  blsBlurIn,
  blsSwingIn,
  blsLightSpeedIn,
  blsFlipIn,
  blsSpinScaleIn,
  blsRollIn,
  blsPerspectiveIn,
  // Exit
  blsFadeOut,
  blsSlideUpOut,
  blsSlideDownOut,
  blsSlideLeftOut,
  blsSlideRightOut,
  blsZoomOut,
  blsGravityFallOut,
  blsFlickerOut,
  blsGlitchOut,
  blsBlurOut,
  blsLightSpeedOut,
  blsFlipOut,
  blsSpinScaleOut,
  blsRollOut,
  // Loop
  blsFloat,
  blsPulseLoop,
  blsBounceLoop,
  blsShake,
  blsSpin,
  blsSwing,
  blsRubberBand,
  blsWobble,
  blsHeartbeat,
  blsJello,
  blsBreathing,
  blsPerspectiveTilt,
  // Click
  clickPulse,
  clickBounce,
  clickShake,
  clickPop,
  clickRipple,
  clickJelly,
};

// ── Default easings per phase ───────────────────────────────────────────────

const PHASE_EASING: Record<string, string> = {
  in: "ease-out",
  out: "ease-in",
  loop: "ease-in-out",
  click: "ease",
};

// ── Public API ──────────────────────────────────────────────────────────────

let _counter = 0;

/**
 * Convert a built-in preset into an editable CustomAnim.
 * Returns null if the preset name is unknown or "none".
 */
export function presetToCustomAnim(
  presetName: string,
  dur: number,
  phase: "in" | "out" | "loop" | "click" = "in",
  delay?: number,
): CustomAnim | null {
  if (!presetName || presetName === "none") return null;
  const stops = PRESET_KEYFRAMES[presetName];
  if (!stops) return null;

  _counter += 1;
  const isLoop = phase === "loop";

  return {
    name: `blsc_${presetName}_${_counter}`,
    stops: structuredClone(stops),
    dur,
    delay,
    iterationCount: isLoop ? "infinite" : 1,
    direction: isLoop ? "alternate" : "normal",
    fillMode: isLoop ? "both" : "both",
    easing: PHASE_EASING[phase] ?? "ease",
  };
}

/**
 * Generate a unique @keyframes name for a custom animation.
 */
export function generateCustomAnimName(
  objectId: string,
  phase: "in" | "out" | "loop",
): string {
  const safe = objectId.replace(/[^a-zA-Z0-9]/g, "");
  return `blsc_${safe}_${phase}`;
}
