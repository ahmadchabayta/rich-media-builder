import { useState, useRef, useEffect, type CSSProperties } from "react";
import type { FrameObject as FrameObjectType } from "@src/lib/types";

interface InlineTextEditorProps {
  obj: FrameObjectType & { type: "text" };
  frameIndex: number;
  opacityVal: number;
  rotate: string | undefined;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

export function InlineTextEditor({
  obj,
  frameIndex,
  opacityVal,
  rotate,
  onCommit,
  onCancel,
}: InlineTextEditorProps) {
  const [editValue, setEditValue] = useState(obj.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus + select-all when mounted
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Auto-resize textarea to content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.width = "9999px";
    el.style.height = "auto";
    el.style.width = el.scrollWidth + "px";
    el.style.height = el.scrollHeight + "px";
  }, [editValue]);

  const style: CSSProperties = {
    position: "absolute",
    left: (obj.x ?? 0) + "px",
    top: (obj.y ?? 0) + "px",
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
    textTransform: (obj.textTransform && obj.textTransform !== "none"
      ? obj.textTransform
      : undefined) as React.CSSProperties["textTransform"],
    whiteSpace: "pre-wrap",
    opacity: opacityVal,
    transform: rotate,
    zIndex: 9999,
    background: obj.bgEnabled && obj.bgColor ? obj.bgColor : "transparent",
    borderRadius:
      obj.bgEnabled && obj.bgColor ? (obj.radius ?? 8) + "px" : "3px",
    padding:
      obj.bgEnabled && obj.bgColor
        ? `${obj.paddingY ?? 6}px ${obj.paddingX ?? 14}px`
        : `${obj.paddingY ?? 2}px ${obj.paddingX ?? 4}px`,
    cursor: "text",
    userSelect: "text",
    outline: "none",
    border: "2px solid #3b82f6",
    resize: "none",
    overflow: "hidden",
    boxShadow: "none",
    textShadow: "none",
    ...(obj.w != null
      ? { width: obj.w + "px" }
      : { width: "auto", minWidth: Math.max(60, (obj.size ?? 22) * 4) + "px" }),
  };

  return (
    <textarea
      ref={textareaRef}
      data-obj-id={obj.id}
      data-fi={frameIndex}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={() => onCommit(editValue)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") onCancel();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={style}
    />
  );
}
