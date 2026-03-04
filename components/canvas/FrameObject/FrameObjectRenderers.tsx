/* eslint-disable @next/next/no-img-element */
import { useState, type CSSProperties, type ReactNode } from "react";
import type {
  FrameObject as FrameObjectType,
  ImageObject,
  AnswerGroupObject,
  ShapeObject,
  DividerObject,
} from "@src/lib/types";
import { hexOpacityToRgba } from "./frameObjectUtils";

export interface SharedRenderProps {
  obj: FrameObjectType;
  frameIndex: number;
  baseStyle: CSSProperties;
  handleMouseDown: (e: React.MouseEvent) => void;
  hoverProps: Record<string, () => void>;
  resizeHandles: ReactNode;
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
}: SharedRenderProps) {
  const ag = obj as AnswerGroupObject;
  const rgba = hexOpacityToRgba(
    ag.btnBgColor ?? "#ffffff",
    ag.btnBgOpacity ?? 18,
  );
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
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            pointerEvents: "none",
            marginBottom:
              i < ag.answers.length - 1 ? (ag.btnGap ?? 10) + "px" : undefined,
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
