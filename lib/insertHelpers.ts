import { makeId } from "@src/store/quizStore";
import type {
  TextObject,
  ShapeObject,
  DividerObject,
  AnswerGroupObject,
  ImageObject,
  DefaultTypography,
} from "@src/lib/types";

/** Create a default text object positioned by count. */
export function createDefaultText(
  objectCount: number,
  defaults?: DefaultTypography,
): TextObject {
  return {
    id: makeId(),
    type: "text",
    label: "Text " + (objectCount + 1),
    text: "Edit me",
    x: 20,
    y: 20 + objectCount * 40,
    size: defaults?.size ?? 22,
    color: defaults?.color ?? "#ffffff",
    fontFamily: defaults?.fontFamily,
    fontWeight: defaults?.fontWeight,
    letterSpacing: defaults?.letterSpacing,
    lineHeight: defaults?.lineHeight,
    textTransform: defaults?.textTransform,
    italic: defaults?.italic,
    underline: defaults?.underline,
    textAlign: defaults?.textAlign,
  };
}

/** Create a default rectangle centred in the frame. */
export function createDefaultRect(frame: {
  w: number;
  h: number;
}): ShapeObject {
  return {
    id: makeId(),
    type: "shape",
    shape: "rect",
    label: "Rectangle",
    x: Math.round(frame.w * 0.2),
    y: Math.round(frame.h * 0.2),
    w: Math.round(frame.w * 0.5),
    h: 60,
    fill: "rgba(59,130,246,0.7)",
    radius: 8,
  };
}

/** Create a default circle centred in the frame. */
export function createDefaultCircle(frame: {
  w: number;
  h: number;
}): ShapeObject {
  const size = Math.round(Math.min(frame.w, frame.h) * 0.25);
  return {
    id: makeId(),
    type: "shape",
    shape: "circle",
    label: "Circle",
    x: Math.round((frame.w - size) / 2),
    y: Math.round((frame.h - size) / 2),
    w: size,
    h: size,
    fill: "rgba(236,72,153,0.7)",
  };
}

/** Create a default horizontal divider line. */
export function createDefaultLine(frame: {
  w: number;
  h: number;
}): DividerObject {
  return {
    id: makeId(),
    type: "divider",
    label: "Line",
    x: Math.round(frame.w * 0.1),
    y: Math.round(frame.h * 0.5),
    w: Math.round(frame.w * 0.8),
    thickness: 2,
    color: "rgba(255,255,255,0.4)",
    lineStyle: "solid",
  };
}

/** Create a default answer‑group object. */
export function createDefaultAnswers(frame: {
  w: number;
  h: number;
}): AnswerGroupObject {
  return {
    id: makeId(),
    type: "answerGroup",
    label: "Answers",
    x: Math.round(frame.w * 0.07),
    y: Math.round(frame.h * 0.55),
    w: Math.round(frame.w * 0.86),
    answers: [
      { id: makeId(), text: "Answer 1" },
      { id: makeId(), text: "Answer 2" },
      { id: makeId(), text: "Answer 3" },
    ],
    btnHeight: 44,
    btnGap: 10,
    btnPaddingTop: 0,
    btnPaddingRight: 14,
    btnPaddingBottom: 0,
    btnPaddingLeft: 14,
    btnBgColor: "#ffffff",
    btnBgOpacity: 18,
    btnRadius: 24,
    textColor: "#ffffff",
    fontSize: 16,
    role: "answer",
    animIn: { type: "blsSlideUp", dur: 400, delay: 0 },
    animOut: { type: "blsFadeOut", dur: 300, delay: 0 },
  };
}

/**
 * Given a File (image), read it as data‑URL and create an ImageObject
 * scaled to fit inside the frame, then call `onCreated`.
 */
export function createImageFromFile(
  file: File,
  frame: { w: number; h: number },
  onCreated: (obj: ImageObject) => void,
) {
  const reader = new FileReader();
  reader.onload = (f) => {
    const tmp = new Image();
    tmp.onload = () => {
      const scale = Math.min(1, (frame.w * 0.7) / tmp.naturalWidth);
      const w = Math.round(tmp.naturalWidth * scale);
      const h = Math.round(tmp.naturalHeight * scale);
      const obj: ImageObject = {
        id: makeId(),
        type: "image",
        label: file.name.replace(/\.[^.]+$/, "").slice(0, 24) || "Image",
        src: f.target!.result as string,
        x: Math.round((frame.w - w) / 2),
        y: Math.round((frame.h - h) / 2),
        w,
        h,
      };
      onCreated(obj);
    };
    tmp.src = f.target!.result as string;
  };
  reader.readAsDataURL(file);
}
