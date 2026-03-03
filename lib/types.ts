export interface AnimConfig {
  type: string;
  dur: number;
  delay?: number;
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
  zIndex?: number;
  opacity?: number; // 0–100
  rotation?: number; // degrees
}

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  size: number;
  color: string;
  bgColor?: string;
  bgEnabled?: boolean;
  radius?: number;
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
}

export interface QuizData {
  bg: string | null;
  frames: Frame[];
}
