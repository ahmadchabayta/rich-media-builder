/* eslint-disable @next/next/no-img-element */
import { useState, type CSSProperties, type ReactNode } from "react";
import type {
  FrameObject as FrameObjectType,
  ImageObject,
  AnswerGroupObject,
  ShapeObject,
  DividerObject,
  PathObject,
} from "@src/lib/types";
import { hexOpacityToRgba } from "./frameObjectUtils";

export interface SharedRenderProps {
  obj: FrameObjectType;
  frameIndex: number;
  baseStyle: CSSProperties;
  handleMouseDown: (e: React.MouseEvent) => void;
  hoverProps: Record<string, () => void>;
  resizeHandles: ReactNode;
  editing?: boolean;
  onExitEditing?: () => void;
  onAnswerChange?: (index: number, text: string) => void;
}

/** Image object renderer (with broken-image fallback) */
export function ImageRender({
  obj,
  frameIndex,
  baseStyle,
  handleMouseDown,
  hoverProps,
  resizeHandles,
}: SharedRenderProps) {
  const imgObj = obj as ImageObject;
  const [imgBroken, setImgBroken] = useState(false);

  if (imgBroken) {
    return (
      <div
        data-obj-id={obj.id}
        data-fi={frameIndex}
        style={{
          ...baseStyle,
          width: imgObj.w ? imgObj.w + "px" : 120,
          height: imgObj.h ? imgObj.h + "px" : 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--mantine-color-dark-5)",
          border: "1px dashed var(--mantine-color-dark-3)",
          borderRadius: 4,
        }}
        onMouseDown={handleMouseDown}
        {...hoverProps}
      >
        <span
          style={{
            fontSize: 10,
            color: "var(--mantine-color-dimmed)",
            textAlign: "center",
          }}
        >
          Image not found
        </span>
        {resizeHandles}
      </div>
    );
  }

  return (
    <div
      data-obj-id={obj.id}
      data-fi={frameIndex}
      style={{ ...baseStyle, display: "inline-block" }}
      onMouseDown={handleMouseDown}
      {...hoverProps}
    >
      <img
        src={imgObj.src}
        style={{
          width: imgObj.w ? imgObj.w + "px" : undefined,
          height: imgObj.h ? imgObj.h + "px" : undefined,
          objectFit: "contain",
          display: "block",
        }}
        draggable={false}
        alt=""
        onError={() => setImgBroken(true)}
      />
      {resizeHandles}
    </div>
  );
}

/** Answer group object renderer */
export function AnswerGroupRender({
  obj,
  frameIndex,
  baseStyle,
  handleMouseDown,
  hoverProps,
  resizeHandles,
  editing,
  onExitEditing,
  onAnswerChange,
}: SharedRenderProps) {
  const ag = obj as AnswerGroupObject;
  const rgba = hexOpacityToRgba(
    ag.btnBgColor ?? "#ffffff",
    ag.btnBgOpacity ?? 18,
  );
  const btnPaddingTop = ag.btnPaddingTop ?? 0;
  const btnPaddingRight = ag.btnPaddingRight ?? 14;
  const btnPaddingBottom = ag.btnPaddingBottom ?? 0;
  const btnPaddingLeft = ag.btnPaddingLeft ?? 14;
  return (
    <div
      data-obj-id={obj.id}
      data-fi={frameIndex}
      style={{
        ...baseStyle,
        width: (ag.w ?? 280) + "px",
        position: "relative" as const,
      }}
      onMouseDown={handleMouseDown}
      onBlur={(e) => {
        if (editing && !e.currentTarget.contains(e.relatedTarget as Node)) {
          onExitEditing?.();
        }
      }}
      {...hoverProps}
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
            fontFamily: ag.fontFamily
              ? `'${ag.fontFamily}', sans-serif`
              : undefined,
            fontWeight: ag.fontWeight ?? 700,
            fontStyle: ag.italic ? "italic" : undefined,
            textDecoration: ag.underline ? "underline" : undefined,
            letterSpacing: ag.letterSpacing
              ? ag.letterSpacing + "px"
              : undefined,
            lineHeight: ag.lineHeight ?? undefined,
            textTransform: (ag.textTransform && ag.textTransform !== "none"
              ? ag.textTransform
              : undefined) as React.CSSProperties["textTransform"],
            display: "flex",
            alignItems: "center",
            padding: `${btnPaddingTop}px ${btnPaddingRight}px ${btnPaddingBottom}px ${btnPaddingLeft}px`,
            justifyContent:
              ag.textAlign === "left"
                ? "flex-start"
                : ag.textAlign === "right"
                  ? "flex-end"
                  : "center",
            textAlign: ag.textAlign ?? "center",
            direction: ag.direction ?? "ltr",
            overflow: "hidden",
            pointerEvents: editing ? "auto" : "none",
            position: "relative",
            marginBottom:
              i < ag.answers.length - 1 ? (ag.btnGap ?? 10) + "px" : undefined,
          }}
        >
          {editing ? (
            <input
              autoFocus={i === 0}
              defaultValue={ans.text || ""}
              onChange={(e) => onAnswerChange?.(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Enter") {
                  e.preventDefault();
                  onExitEditing?.();
                }
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                background: "transparent",
                border: "none",
                outline: "2px solid rgba(59,130,246,0.7)",
                outlineOffset: "-2px",
                borderRadius: "inherit",
                color: "inherit",
                fontSize: "inherit",
                fontFamily: "inherit",
                fontWeight: "inherit",
                textAlign: "inherit",
                width: "100%",
                padding: "0 4px",
                cursor: "text",
              }}
            />
          ) : ans.src ? (
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
      {resizeHandles}
    </div>
  );
}

/** Shape object renderer (rect or circle) */
export function ShapeRender({
  obj,
  frameIndex,
  baseStyle,
  handleMouseDown,
  hoverProps,
  resizeHandles,
}: SharedRenderProps) {
  const s = obj as ShapeObject;
  const isCircle = s.shape === "circle";
  const hasIndividualRadius =
    s.radiusTopLeft != null ||
    s.radiusTopRight != null ||
    s.radiusBottomRight != null ||
    s.radiusBottomLeft != null;
  const borderRadius = isCircle
    ? "50%"
    : hasIndividualRadius
      ? `${s.radiusTopLeft ?? s.radius ?? 0}px ${s.radiusTopRight ?? s.radius ?? 0}px ${s.radiusBottomRight ?? s.radius ?? 0}px ${s.radiusBottomLeft ?? s.radius ?? 0}px`
      : (s.radius ?? 0) + "px";
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
        borderRadius,
      }}
      onMouseDown={handleMouseDown}
      {...hoverProps}
    >
      {resizeHandles}
    </div>
  );
}

/** Divider / line object renderer */
export function DividerRender({
  obj,
  frameIndex,
  baseStyle,
  handleMouseDown,
  hoverProps,
  resizeHandles,
}: SharedRenderProps) {
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
        position: "relative" as const,
      }}
      onMouseDown={handleMouseDown}
      {...hoverProps}
    >
      {resizeHandles}
    </div>
  );
}

/** SVG path/pen tool renderer */
export function PathRender({
  obj,
  frameIndex,
  baseStyle,
  handleMouseDown,
  hoverProps,
  resizeHandles,
}: SharedRenderProps) {
  const p = obj as PathObject;
  return (
    <svg
      data-obj-id={obj.id}
      data-fi={frameIndex}
      style={{
        ...baseStyle,
        position: "absolute",
        left: (p.x ?? 0) + "px",
        top: (p.y ?? 0) + "px",
        width: (p.w ?? 100) + "px",
        height: (p.h ?? 100) + "px",
        overflow: "visible",
      }}
      onMouseDown={handleMouseDown}
      {...hoverProps}
    >
      <path
        d={p.d}
        stroke={p.stroke ?? "#ffffff"}
        strokeWidth={p.strokeWidth ?? 2}
        fill={p.fill ?? "none"}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {resizeHandles}
    </svg>
  );
}
