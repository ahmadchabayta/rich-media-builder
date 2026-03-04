export interface CSSFilterConfig {
  brightness?: number; // 0–200, default 100
  contrast?: number; // 0–200, default 100
  saturate?: number; // 0–200, default 100
  hueRotate?: number; // -180–180 deg, default 0
  blur?: number; // 0–40 px, default 0
  grayscale?: number; // 0–100, default 0
  sepia?: number; // 0–100, default 0
  invert?: number; // 0–100, default 0
}

export interface AnimConfig {
  type: string;
  dur: number;
  delay?: number;
  iterationCount?: number | "infinite"; // 1 = default, "infinite" = loop forever
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
}

// ── Custom keyframe animation authoring ────────────────────
export interface KeyframeStop {
  offset: number; // 0–1 (0 = 0%, 1 = 100%)
  props: Record<string, string>; // CSS property → value
  easing?: string; // per-stop easing (applied TO this stop)
}

export interface CustomAnim {
  name: string; // unique @keyframes rule name
  stops: KeyframeStop[];
  dur: number; // ms
  delay?: number;
  iterationCount?: number | "infinite";
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fillMode?: "none" | "forwards" | "backwards" | "both";
  easing?: string; // overall easing, e.g. "cubic-bezier(0.2,0.8,0.2,1)"
}

export interface LoopAnimConfig {
  type: string; // e.g. "blsFloat", "blsPulse", "blsBounce", …
  dur: number;
  delay?: number;
}

export interface HoverEffect {
  type: string; // e.g. "lift", "grow", "glow", "dim", "tilt", "brighten"
}

export interface ClickEffect {
  type: string; // e.g. "pulse", "bounce", "shake", "ripple", "pop"
}

export interface Answer {
  id: string;
  text: string;
  src?: string;
}

interface BaseObject {
  id: string;
  label: string;
  x: number;
  y: number;
  role?: string;
  animIn?: AnimConfig;
  animOut?: AnimConfig;
  animLoop?: LoopAnimConfig;
  hoverEffect?: HoverEffect;
  clickEffect?: ClickEffect;
  customAnimIn?: CustomAnim;
  customAnimOut?: CustomAnim;
  customAnimLoop?: CustomAnim;
  zIndex?: number;
  opacity?: number; // 0–100
  rotation?: number; // degrees
  hidden?: boolean; // visibility toggle (layers panel)
  locked?: boolean; // lock position/selection (layers panel)
  blendMode?: string; // CSS mix-blend-mode e.g. "multiply", "soft-light"
  cssFilter?: CSSFilterConfig;
}

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  size: number;
  color: string;
  w?: number; // explicit container width (px); undefined = shrink-to-content
  bgColor?: string;
  bgEnabled?: boolean;
  radius?: number;
  paddingX?: number; // horizontal padding (px)
  paddingY?: number; // vertical padding (px)
  fontFamily?: string;
  fontWeight?: string; // '400' | '700' | '900' …
  letterSpacing?: number; // px
  lineHeight?: number; // multiplier, e.g. 1.2
  textAlign?: "left" | "center" | "right";
  italic?: boolean;
  underline?: boolean;
}

export interface ImageObject extends BaseObject {
  type: "image";
  src: string;
  w: number;
  h: number;
}

export interface AnswerGroupObject extends BaseObject {
  type: "answerGroup";
  w: number;
  answers: Answer[];
  btnHeight: number;
  btnGap: number;
  btnBgColor: string;
  btnBgOpacity: number;
  btnRadius: number;
  textColor: string;
  fontSize: number;
}

export interface ShapeObject extends BaseObject {
  type: "shape";
  shape: "rect" | "circle";
  w: number;
  h: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number; // border-radius for rect
}

export interface DividerObject extends BaseObject {
  type: "divider";
  w: number;
  thickness: number;
  color: string;
  lineStyle?: "solid" | "dashed" | "dotted";
}

export type FrameObject =
  | TextObject
  | ImageObject
  | AnswerGroupObject
  | ShapeObject
  | DividerObject;

export type BgImageAnimType =
  | "none"
  | "blsBgZoomIn"
  | "blsBgZoomOut"
  | "blsBgKenBurns"
  | "blsBgPulse"
  | "blsBgFadeIn";

export interface BgImageAnim {
  type: BgImageAnimType;
  dur: number; // ms, e.g. 8000
}

export interface Frame {
  id: string;
  src: string | null;
  objects: FrameObject[];
  w: number;
  h: number;
  isDefault?: boolean;
  isEndFrame: boolean;
  animEnter: AnimConfig;
  animExit: AnimConfig;
  answerStagger: number;
  bgColor?: string;
  bgGradient?: { angle: number; stops: [string, string] } | null;
  bgImage?: string | null; // per-frame background image (object-fit: cover)
  bgImageAnim?: BgImageAnim | null; // animation applied to the bg image
}

export interface QuizData {
  bg: string | null;
  frames: Frame[];
}
