export const ANIM_IN = [
  { v: "none", l: "None" },
  { v: "blsFadeIn", l: "Fade In" },
  { v: "blsSlideUp", l: "Slide Up" },
  { v: "blsSlideDown", l: "Slide Down" },
  { v: "blsSlideLeft", l: "Slide Left" },
  { v: "blsSlideRight", l: "Slide Right" },
  { v: "blsZoomIn", l: "Zoom In" },
  { v: "blsPopIn", l: "Pop" },
] as const;

export const ANIM_OUT = [
  { v: "none", l: "None" },
  { v: "blsFadeOut", l: "Fade Out" },
  { v: "blsSlideUpOut", l: "Slide Up" },
  { v: "blsSlideDownOut", l: "Slide Down" },
  { v: "blsSlideLeftOut", l: "Slide Left" },
  { v: "blsSlideRightOut", l: "Slide Right" },
  { v: "blsZoomOut", l: "Zoom Out" },
] as const;

export type AnimInValue = (typeof ANIM_IN)[number]["v"];
export type AnimOutValue = (typeof ANIM_OUT)[number]["v"];
