/**
 * animCompiler.ts
 * ───────────────
 * Single source of truth for compiling CustomAnim → CSS.
 *
 * Two main outputs:
 *  1. @keyframes CSS rule  (injected into <style> or cssRules[])
 *  2. animation shorthand   (applied as inline style or data-attr)
 *
 * This replaces the dual-maintenance of globals.css + exportEngine.ts
 * for any animation that uses the CustomAnim data model.
 */

import type { AnimConfig, CustomAnim, LoopAnimConfig } from "./types";

// ── Compile a CustomAnim's stops into a @keyframes CSS rule ─────────────────

/**
 * Generates a complete `@keyframes <name> { ... }` CSS string.
 */
export function compileKeyframesCSS(anim: CustomAnim): string {
  const sorted = [...anim.stops].sort((a, b) => a.offset - b.offset);
  const blocks = sorted.map((stop) => {
    const pct = `${Math.round(stop.offset * 100)}%`;
    const declarations = Object.entries(stop.props)
      .map(([prop, val]) => `${prop}:${val}`)
      .join(";");
    return `${pct}{${declarations}}`;
  });
  return `@keyframes ${anim.name}{${blocks.join("")}}`;
}

// ── Compile a CustomAnim into an animation shorthand value ──────────────────

/**
 * Generates the CSS `animation:` shorthand value.
 * e.g. "blsc_abc_in 400ms ease-out 100ms 1 normal both"
 */
export function compileShorthand(anim: CustomAnim): string {
  const name = anim.name;
  const dur = `${anim.dur}ms`;
  const easing = anim.easing ?? "ease";
  const delay = `${anim.delay ?? 0}ms`;
  const iterations = anim.iterationCount ?? 1;
  const iterStr = iterations === "infinite" ? "infinite" : String(iterations);
  const direction = anim.direction ?? "normal";
  const fill = anim.fillMode ?? "both";
  return `${name} ${dur} ${easing} ${delay} ${iterStr} ${direction} ${fill}`;
}

// ── Build an animation shorthand from a preset AnimConfig ───────────────────

/**
 * Generates an animation shorthand for a preset-based AnimConfig.
 * This mirrors the existing inline string construction in FrameObject.tsx
 * but with configurable easing.
 */
export function presetShorthand(
  cfg: AnimConfig,
  defaultEasing: string = "ease-out",
): string {
  if (!cfg.type || cfg.type === "none") return "none";
  const dur = `${cfg.dur}ms`;
  const delay = `${cfg.delay ?? 0}ms`;
  const iterations = cfg.iterationCount ?? 1;
  const iterStr = iterations === "infinite" ? "infinite" : String(iterations);
  const direction = cfg.direction ?? "normal";
  const fill = cfg.fillMode ?? "both";
  return `${cfg.type} ${dur} ${defaultEasing} ${delay} ${iterStr} ${direction} ${fill}`;
}

/**
 * Generates a loop animation shorthand from a LoopAnimConfig.
 */
export function loopPresetShorthand(
  cfg: LoopAnimConfig,
  defaultEasing: string = "ease-in-out",
): string {
  if (!cfg.type || cfg.type === "none") return "none";
  const dur = `${cfg.dur}ms`;
  const delay = `${cfg.delay ?? 0}ms`;
  return `${cfg.type} ${dur} ${defaultEasing} ${delay} infinite alternate both`;
}

// ── Resolve: pick custom or preset, return CSS pair ─────────────────────────

interface ResolvedAnim {
  /** @keyframes CSS rule (empty string if using a built-in preset) */
  keyframesCSS: string;
  /** animation shorthand value */
  shorthand: string;
}

/**
 * Resolves an animation for a given phase, choosing custom over preset.
 * Returns null if no animation is configured.
 */
export function resolveEnterAnim(
  preset?: AnimConfig,
  custom?: CustomAnim,
): ResolvedAnim | null {
  if (custom && custom.stops.length > 0) {
    return {
      keyframesCSS: compileKeyframesCSS(custom),
      shorthand: compileShorthand(custom),
    };
  }
  if (preset && preset.type && preset.type !== "none") {
    return {
      keyframesCSS: "", // built-in preset — already in globals.css / cssRules
      shorthand: presetShorthand(preset, "ease-out"),
    };
  }
  return null;
}

export function resolveExitAnim(
  preset?: AnimConfig,
  custom?: CustomAnim,
): ResolvedAnim | null {
  if (custom && custom.stops.length > 0) {
    return {
      keyframesCSS: compileKeyframesCSS(custom),
      shorthand: compileShorthand(custom),
    };
  }
  if (preset && preset.type && preset.type !== "none") {
    return {
      keyframesCSS: "",
      shorthand: presetShorthand(preset, "ease-in"),
    };
  }
  return null;
}

export function resolveLoopAnim(
  preset?: LoopAnimConfig,
  custom?: CustomAnim,
): ResolvedAnim | null {
  if (custom && custom.stops.length > 0) {
    return {
      keyframesCSS: compileKeyframesCSS(custom),
      shorthand: compileShorthand(custom),
    };
  }
  if (preset && preset.type && preset.type !== "none") {
    return {
      keyframesCSS: "",
      shorthand: loopPresetShorthand(preset, "ease-in-out"),
    };
  }
  return null;
}

// ── Apply extra delay offset to an existing animation shorthand ─────────────
/**
 * Adds extraDelayMs to the delay token inside an animation shorthand string.
 * Both duration and delay are emitted as `Xms` — the second `Xms` token is
 * always the delay (first is the duration).
 */
export function applyStaggerDelay(
  shorthand: string,
  extraDelayMs: number,
): string {
  if (extraDelayMs === 0) return shorthand;
  let count = 0;
  return shorthand.replace(/\b(\d+)ms\b/g, (_, n) => {
    count++;
    if (count === 2) return `${parseInt(n) + extraDelayMs}ms`;
    return `${n}ms`;
  });
}

// ── Collect all custom @keyframes for an object ─────────────────────────────

/**
 * Gathers all unique custom @keyframes CSS strings needed for one object.
 * Used by FrameObject to inject <style> at render time,
 * and by exportEngine to include in the CSS output.
 */
export function collectCustomKeyframes(obj: {
  customAnimIn?: CustomAnim;
  customAnimOut?: CustomAnim;
  customAnimLoop?: CustomAnim;
}): string {
  const parts: string[] = [];
  if (obj.customAnimIn?.stops.length)
    parts.push(compileKeyframesCSS(obj.customAnimIn));
  if (obj.customAnimOut?.stops.length)
    parts.push(compileKeyframesCSS(obj.customAnimOut));
  if (obj.customAnimLoop?.stops.length)
    parts.push(compileKeyframesCSS(obj.customAnimLoop));
  return parts.join("\n");
}
