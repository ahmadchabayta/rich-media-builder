import { useState, useMemo, useEffect, type CSSProperties } from "react";
import type { FrameObject as FrameObjectType } from "@src/lib/types";
import { useDragContext } from "@src/context/DragContext";
import { useQuizStore } from "@src/store/quizStore";
import { ensureFont } from "@src/lib/fonts";
import {
  resolveEnterAnim,
  resolveExitAnim,
  resolveLoopAnim,
  collectCustomKeyframes,
} from "@src/lib/animCompiler";
import {
  resolveHoverOverrides,
  buildCSSFilter,
  HANDLES,
} from "./frameObjectUtils";
import {
  ImageRender,
  AnswerGroupRender,
  ShapeRender,
  DividerRender,
} from "./FrameObjectRenderers";
import { InlineTextEditor } from "./InlineTextEditor";

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
  const updateObject = useQuizStore((s) => s.updateObject);
  const snapshot = useQuizStore((s) => s.snapshot);
  const playback = useQuizStore((s) => s.playback);
  const selectedObjectIds = useQuizStore((s) => s.selectedObjectIds);
  const toggleObjectSelection = useQuizStore((s) => s.toggleObjectSelection);

  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (obj.type === "text" && obj.fontFamily) ensureFont(obj.fontFamily);

  const isSelected =
    obj.id === selectedObjectId && frameIndex === currentPreviewIndex;
  const isMultiSelected =
    selectedObjectIds.includes(obj.id) && frameIndex === currentPreviewIndex;

  const opacityVal = obj.opacity != null ? obj.opacity / 100 : 1;
  const rotate =
    obj.rotation != null && obj.rotation !== 0
      ? `rotate(${obj.rotation}deg)`
      : undefined;

  const baseStyle: CSSProperties = {
    position: "absolute",
    left: (obj.x ?? 0) + "px",
    top: (obj.y ?? 0) + "px",
    cursor: playback ? "default" : "grab",
    userSelect: "none",
    touchAction: "none",
    outline:
      !playback && (isSelected || isMultiSelected)
        ? "2px solid #3b82f6"
        : undefined,
    outlineOffset:
      !playback && (isSelected || isMultiSelected) ? "2px" : undefined,
    opacity: opacityVal,
    transform: rotate,
    zIndex: obj.zIndex ?? "auto",
    filter: buildCSSFilter(obj.cssFilter) ?? undefined,
    mixBlendMode: (obj.blendMode as CSSProperties["mixBlendMode"]) || undefined,
  };

  // ── Hover effect (playback only) ──────────────────────────────────────────
  const hoverType = obj.hoverEffect?.type;
  const hoverActive = !!playback && !!hoverType && hoverType !== "none";
  if (hoverActive) {
    baseStyle.transition =
      "transform 180ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease, filter 180ms ease, box-shadow 180ms ease";
    if (hovered)
      Object.assign(
        baseStyle,
        resolveHoverOverrides(
          hoverType!,
          opacityVal,
          rotate,
          buildCSSFilter(obj.cssFilter) ?? undefined,
        ),
      );
  }
  const hoverProps: Record<string, () => void> = hoverActive
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {};

  // ── Custom @keyframes CSS ─────────────────────────────────────────────────
  const customCSS = useMemo(() => collectCustomKeyframes(obj), [obj]);

  // ── Live animation during timeline playback ───────────────────────────────
  if (playback) {
    if (playback.frameIdx === frameIndex) {
      const { phase } = playback;
      if (phase === "enter") {
        const r = resolveEnterAnim(obj.animIn, obj.customAnimIn);
        if (r) baseStyle.animation = r.shorthand;
      } else if (phase === "hold") {
        const r = resolveLoopAnim(obj.animLoop, obj.customAnimLoop);
        if (r) baseStyle.animation = r.shorthand;
      } else if (phase === "exit") {
        const r = resolveExitAnim(obj.animOut, obj.customAnimOut);
        if (r) baseStyle.animation = r.shorthand;
      }
    } else {
      baseStyle.opacity = 0;
      baseStyle.pointerEvents = "none";
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (playback) return;
    e.stopPropagation();
    e.preventDefault();
    if (frameIndex !== currentPreviewIndex) setActiveFrame(frameIndex);
    if (e.ctrlKey || e.metaKey) {
      toggleObjectSelection(obj.id);
      return;
    }
    setSelectedObject(obj.id);
    if (obj.locked) return;
    startObjectDrag(e, obj.id, frameIndex);
  };

  const resizeHandles =
    isSelected && !obj.locked ? (
      <>
        {HANDLES.map(({ id, top, bottom, left, right, tf }) => (
          <div
            key={id}
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              background: "#3b82f6",
              border: "1px solid #fff",
              borderRadius: 2,
              top,
              bottom,
              left,
              right,
              transform: tf,
              cursor: `${id}-resize`,
              zIndex: 10,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              startObjectResize(e, obj.id, frameIndex, id);
            }}
          />
        ))}
      </>
    ) : null;

  // ── Inject custom @keyframes into <head> ──────────────────────────────────
  useEffect(() => {
    if (!customCSS) return;
    const style = document.createElement("style");
    style.setAttribute("data-bls-obj", obj.id);
    style.textContent = customCSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [customCSS, obj.id]);

  if (obj.hidden) return null;

  // ── Delegate non-text types ───────────────────────────────────────────────
  const shared = {
    obj,
    frameIndex,
    baseStyle,
    handleMouseDown,
    hoverProps,
    resizeHandles,
  };
  if (obj.type === "image") return <ImageRender {...shared} />;
  if (obj.type === "answerGroup") return <AnswerGroupRender {...shared} />;
  if (obj.type === "shape") return <ShapeRender {...shared} />;
  if (obj.type === "divider") return <DividerRender {...shared} />;

  // ── Text object ───────────────────────────────────────────────────────────
  const px = obj.paddingX ?? (obj.bgEnabled ? 14 : 0);
  const py = obj.paddingY ?? (obj.bgEnabled ? 6 : 0);

  const bgStyle: CSSProperties =
    obj.bgEnabled && obj.bgColor
      ? {
          backgroundColor: obj.bgColor,
          borderRadius: (obj.radius ?? 8) + "px",
          padding: `${py}px ${px}px`,
        }
      : {
          textShadow: "0 1px 2px rgba(0,0,0,.6)",
          ...(px || py ? { padding: `${py}px ${px}px` } : {}),
        };

  const textStyle: CSSProperties = {
    ...baseStyle,
    ...(obj.w != null ? { width: obj.w + "px" } : { width: "max-content" }),
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
    whiteSpace: obj.w != null ? "pre-wrap" : "pre",
    ...bgStyle,
  };

  if (editing && obj.type === "text") {
    return (
      <InlineTextEditor
        obj={obj}
        frameIndex={frameIndex}
        opacityVal={opacityVal}
        rotate={rotate}
        onCommit={(val) => {
          snapshot();
          updateObject(frameIndex, obj.id, (o) => ({ ...o, text: val }));
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      data-obj-id={obj.id}
      data-fi={frameIndex}
      style={textStyle}
      onMouseDown={handleMouseDown}
      {...hoverProps}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (obj.type === "text") setEditing(true);
      }}
    >
      {obj.text || ""}
      {resizeHandles}
    </div>
  );
}
