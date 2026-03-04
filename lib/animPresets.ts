export const ANIM_IN = [
  { v: "none",            l: "None" },
  // ── Basic ────────────────────────────────────────────────
  { v: "blsFadeIn",       l: "Fade In" },
  { v: "blsSlideUp",      l: "Slide Up" },
  { v: "blsSlideDown",    l: "Slide Down" },
  { v: "blsSlideLeft",    l: "Slide Left" },
  { v: "blsSlideRight",   l: "Slide Right" },
  { v: "blsZoomIn",       l: "Zoom In" },
  { v: "blsPopIn",        l: "Pop" },
  // ── Premium ──────────────────────────────────────────────
  { v: "blsGravityFall",  l: "✦ Gravity Fall" },
  { v: "blsElasticPop",   l: "✦ Elastic Pop" },
  { v: "blsFlickerIn",    l: "✦ Neon Flicker" },
  { v: "blsGlitchIn",     l: "✦ Glitch In" },
  { v: "blsBlurIn",       l: "✦ Blur Focus" },
  { v: "blsSwingIn",      l: "✦ Pendulum Swing" },
  { v: "blsLightSpeedIn", l: "✦ Light Speed In" },
  { v: "blsFlipIn",       l: "✦ 3D Flip In" },
  { v: "blsSpinScaleIn",  l: "✦ Spin Scale" },
  { v: "blsRollIn",       l: "✦ Roll In" },
] as const;

export const ANIM_OUT = [
  { v: "none",              l: "None" },
  // ── Basic ────────────────────────────────────────────────
  { v: "blsFadeOut",        l: "Fade Out" },
  { v: "blsSlideUpOut",     l: "Slide Up" },
  { v: "blsSlideDownOut",   l: "Slide Down" },
  { v: "blsSlideLeftOut",   l: "Slide Left" },
  { v: "blsSlideRightOut",  l: "Slide Right" },
  { v: "blsZoomOut",        l: "Zoom Out" },
  // ── Premium ──────────────────────────────────────────────
  { v: "blsGravityFallOut", l: "✦ Gravity Fall" },
  { v: "blsFlickerOut",     l: "✦ Neon Flicker" },
  { v: "blsGlitchOut",      l: "✦ Glitch Out" },
  { v: "blsBlurOut",        l: "✦ Blur Defocus" },
  { v: "blsLightSpeedOut",  l: "✦ Light Speed Out" },
  { v: "blsFlipOut",        l: "✦ 3D Flip Out" },
  { v: "blsSpinScaleOut",   l: "✦ Spin Scale" },
  { v: "blsRollOut",        l: "✦ Roll Out" },
] as const;

export type AnimInValue = (typeof ANIM_IN)[number]["v"];
export type AnimOutValue = (typeof ANIM_OUT)[number]["v"];
