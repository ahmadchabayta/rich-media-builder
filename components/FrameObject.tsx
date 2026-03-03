import type { CSSProperties } from "react";
import type {
  FrameObject as FrameObjectType,
  AnswerGroupObject,
  ShapeObject,
  DividerObject,
} from "@src/lib/types";
import { useDragContext } from "@src/context/DragContext";
import { useQuizStore } from "@src/store/quizStore";
import { ensureFont } from "@src/lib/fonts";

function hexOpacityToRgba(hex: string, opacityPct: number): string {
  const h = hex || "#ffffff";
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacityPct / 100})`;
}

interface Props {
  obj: FrameObjectType;
  frameIndex: number;
}

export function FrameObjectEl({ obj, frameIndex }: Props) {
  const { startObjectDrag, startObjectResize } = useDragContext();
  const selectedObjectId = useQuizStore((s) => s.selectedObjectId);
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const setSelectedObject = useQuizStore((s) => s.setSelectedObject);
  const setActiveFrame = useQuizStore((s) => s.setActiveFrame);

  const isSelected =
    obj.id === selectedObjectId && frameIndex === currentPreviewIndex;
  const selectedObjectIds = useQuizStore((s) => s.selectedObjectIds);
  const toggleObjectSelection = useQuizStore((s) => s.toggleObjectSelection);
  const isMultiSelected =
    selectedObjectIds.includes(obj.id) && frameIndex === currentPreviewIndex;

  // Ensure Google Font is loaded when rendering
  if (obj.type === "text" && obj.fontFamily) ensureFont(obj.fontFamily);

  const opacityVal = obj.opacity != null ? obj.opacity / 100 : 1;
  const rotate =
    obj.rotation != null && obj.rotation !== 0
      ? `rotate(${obj.rotation}deg)`
      : undefined;

  const baseStyle: CSSProperties = {
    position: "absolute",
    left: (obj.x ?? 0) + "px",
    top: (obj.y ?? 0) + "px",
    cursor: "grab",
    userSelect: "none",
    touchAction: "none",
    outline: isSelected || isMultiSelected ? "2px solid #3b82f6" : undefined,
    outlineOffset: isSelected || isMultiSelected ? "2px" : undefined,
    opacity: opacityVal,
    transform: rotate,
    zIndex: obj.zIndex ?? "auto",
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (frameIndex !== currentPreviewIndex) setActiveFrame(frameIndex);
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click → toggle into multi-select without starting drag
      toggleObjectSelection(obj.id);
      return;
    }
    setSelectedObject(obj.id);
    if (e.shiftKey) {
      startObjectResize(e, obj.id, frameIndex);
    } else {
      startObjectDrag(e, obj.id, frameIndex);
    }
  };

  if (obj.type === "image") {
    return (
      <img
        src={obj.src}
        data-obj-id={obj.id}
        data-fi={frameIndex}
        style={{
          ...baseStyle,
          width: obj.w ? obj.w + "px" : undefined,
          height: obj.h ? obj.h + "px" : undefined,
          objectFit: "contain",
        }}
        draggable={false}
        onMouseDown={handleMouseDown}
        alt=""
      />
    );
  }

  if (obj.type === "answerGroup") {
    const ag = obj as AnswerGroupObject;
    const rgba = hexOpacityToRgba(
      ag.btnBgColor ?? "#ffffff",
      ag.btnBgOpacity ?? 18,
    );
    return (
      <div
        data-obj-id={obj.id}
        data-fi={frameIndex}
        style={{ ...baseStyle, width: (ag.w ?? 280) + "px" }}
        onMouseDown={handleMouseDown}
      >
        {ag.answers.map((ans, i) => (
          <div
            key={ans.id}
            style={{
              width: "100%",
              height: (ag.btnHeight ?? 44) + "px",
              background: rgba,
              borderRadius: (ag.btnRadius ?? 24) + "px",
              color: ag.textColor ?? "#fff",
              fontSize: (ag.fontSize ?? 16) + "px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              pointerEvents: "none",
              marginBottom:
                i < ag.answers.length - 1
                  ? (ag.btnGap ?? 10) + "px"
                  : undefined,
            }}
          >
            {ans.src ? (
              <img
                src={ans.src}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                alt=""
              />
            ) : (
              ans.text || `Answer ${i + 1}`
            )}
          </div>
        ))}
      </div>
    );
  }

  if (obj.type === "shape") {
    const s = obj as ShapeObject;
    const isCircle = s.shape === "circle";
    return (
      <div
        data-obj-id={obj.id}
        data-fi={frameIndex}
        style={{
          ...baseStyle,
          width: (s.w ?? 80) + "px",
          height: (s.h ?? 80) + "px",
          background: s.fill ?? "#3b82f6",
          border: s.stroke
            ? `${s.strokeWidth ?? 2}px solid ${s.stroke}`
            : undefined,
          borderRadius: isCircle ? "50%" : (s.radius ?? 0) + "px",
        }}
        onMouseDown={handleMouseDown}
      />
    );
  }

  if (obj.type === "divider") {
    const d = obj as DividerObject;
    return (
      <div
        data-obj-id={obj.id}
        data-fi={frameIndex}
        style={{
          ...baseStyle,
          width: (d.w ?? 200) + "px",
          height: (d.thickness ?? 2) + "px",
          background: d.color ?? "#ffffff",
          borderTop:
            d.lineStyle && d.lineStyle !== "solid"
              ? `${d.thickness ?? 2}px ${d.lineStyle} ${d.color ?? "#ffffff"}`
              : undefined,
        }}
        onMouseDown={handleMouseDown}
      />
    );
  }

  // text object
  const bgStyle: CSSProperties =
    obj.bgEnabled && obj.bgColor
      ? {
          backgroundColor: obj.bgColor,
          borderRadius: (obj.radius ?? 8) + "px",
          padding: "6px 14px",
        }
      : { textShadow: "0 1px 2px rgba(0,0,0,.6)" };

  return (
    <div
      data-obj-id={obj.id}
      data-fi={frameIndex}
      style={{
        ...baseStyle,
        color: obj.color ?? "#fff",
        fontSize: (obj.size ?? 22) + "px",
        fontWeight: obj.fontWeight ?? 700,
        fontStyle: obj.italic ? "italic" : "normal",
        textDecoration: obj.underline ? "underline" : "none",
        textAlign: obj.textAlign ?? "left",
        letterSpacing:
          obj.letterSpacing != null ? obj.letterSpacing + "px" : undefined,
        lineHeight: obj.lineHeight ?? 1.2,
        fontFamily: obj.fontFamily ?? undefined,
        whiteSpace: "pre-wrap",
        ...bgStyle,
      }}
      onMouseDown={handleMouseDown}
    >
      {obj.text || ""}
    </div>
  );
}
