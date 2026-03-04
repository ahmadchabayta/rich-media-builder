export const ANIM_IN = [
  { v: "none", l: "None" },
  // ── Basic ────────────────────────────────────────────────
  { v: "blsFadeIn", l: "Fade In" },
  { v: "blsSlideUp", l: "Slide Up" },
  { v: "blsSlideDown", l: "Slide Down" },
  { v: "blsSlideLeft", l: "Slide Left" },
  { v: "blsSlideRight", l: "Slide Right" },
  { v: "blsZoomIn", l: "Zoom In" },
  { v: "blsPopIn", l: "Pop" },
  // ── Premium ──────────────────────────────────────────────
  { v: "blsGravityFall", l: "✦ Gravity Fall" },
  { v: "blsElasticPop", l: "✦ Elastic Pop" },
  { v: "blsFlickerIn", l: "✦ Neon Flicker" },
  { v: "blsGlitchIn", l: "✦ Glitch In" },
  { v: "blsBlurIn", l: "✦ Blur Focus" },
  { v: "blsSwingIn", l: "✦ Pendulum Swing" },
  { v: "blsLightSpeedIn", l: "✦ Light Speed In" },
  { v: "blsFlipIn", l: "✦ 3D Flip In" },
  { v: "blsSpinScaleIn", l: "✦ Spin Scale" },
  { v: "blsRollIn", l: "✦ Roll In" },
  { v: "blsPerspectiveIn", l: "✦ 3D Perspective" },
] as const;

export const ANIM_OUT = [
  { v: "none", l: "None" },
  // ── Basic ────────────────────────────────────────────────
  { v: "blsFadeOut", l: "Fade Out" },
  { v: "blsSlideUpOut", l: "Slide Up" },
  { v: "blsSlideDownOut", l: "Slide Down" },
  { v: "blsSlideLeftOut", l: "Slide Left" },
  { v: "blsSlideRightOut", l: "Slide Right" },
  { v: "blsZoomOut", l: "Zoom Out" },
  // ── Premium ──────────────────────────────────────────────
  { v: "blsGravityFallOut", l: "✦ Gravity Fall" },
  { v: "blsFlickerOut", l: "✦ Neon Flicker" },
  { v: "blsGlitchOut", l: "✦ Glitch Out" },
  { v: "blsBlurOut", l: "✦ Blur Defocus" },
  { v: "blsLightSpeedOut", l: "✦ Light Speed Out" },
  { v: "blsFlipOut", l: "✦ 3D Flip Out" },
  { v: "blsSpinScaleOut", l: "✦ Spin Scale" },
  { v: "blsRollOut", l: "✦ Roll Out" },
] as const;

export type AnimInValue = (typeof ANIM_IN)[number]["v"];
export type AnimOutValue = (typeof ANIM_OUT)[number]["v"];

// ── Decoration / Loop ──────────────────────────────────────
export const ANIM_LOOP = [
  { v: "none", l: "None" },
  { v: "blsFloat", l: "Float" },
  { v: "blsPulseLoop", l: "Pulse" },
  { v: "blsBounceLoop", l: "Bounce" },
  { v: "blsShake", l: "Shake" },
  { v: "blsSpin", l: "Spin" },
  { v: "blsSwing", l: "Swing" },
  { v: "blsRubberBand", l: "Rubber Band" },
  { v: "blsWobble", l: "Wobble" },
  { v: "blsHeartbeat", l: "Heartbeat" },
  { v: "blsJello", l: "Jello" },
  { v: "blsBreathing", l: "Breathing" },
  { v: "blsPerspectiveTilt", l: "3D Tilt" },
] as const;

// ── Hover Effects ──────────────────────────────────────────
export const HOVER_PRESETS = [
  { v: "none", l: "None" },
  { v: "lift", l: "Lift" },
  { v: "grow", l: "Grow" },
  { v: "shrink", l: "Shrink" },
  { v: "glow", l: "Glow" },
  { v: "dim", l: "Dim" },
  { v: "brighten", l: "Brighten" },
  { v: "tilt", l: "Tilt" },
  { v: "underline", l: "Underline Slide" },
] as const;

// ── Click / Active Effects ─────────────────────────────────
export const CLICK_PRESETS = [
  { v: "none", l: "None" },
  { v: "clickPulse", l: "Pulse" },
  { v: "clickBounce", l: "Bounce" },
  { v: "clickShake", l: "Shake" },
  { v: "clickPop", l: "Pop" },
  { v: "clickRipple", l: "Ripple" },
  { v: "clickJelly", l: "Jelly" },
] as const;
