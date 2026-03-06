"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import { ExtendedTextStyle } from "@src/lib/richTextExtensions";
import { useRichEditorContext } from "@src/context/RichEditorContext";
import type { TextObject } from "@src/lib/types";

interface Props {
  obj: TextObject;
  frameIndex: number;
  opacityVal: number;
  rotate: string | undefined;
  onCommit: (richText: string, plainText: string) => void;
  onCancel: () => void;
}

export function RichTextEditor({
  obj,
  frameIndex,
  opacityVal,
  rotate,
  onCommit,
  onCancel,
}: Props) {
  const { setActiveEditor } = useRichEditorContext();
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep a ref to the latest onCommit to avoid stale closures in cleanup
  const onCommitRef = useRef(onCommit);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCommitRef.current = onCommit;
    onCancelRef.current = onCancel;
  });

  // Track whether the editor content was actually modified
  const dirtyRef = useRef(false);
  // Track whether Escape was pressed (cancel = discard, don't commit)
  const cancelledRef = useRef(false);

  // Track the latest editor content so we can commit it on unmount
  const latestRef = useRef({
    html:
      obj.richText ||
      `<p>${(obj.text || "").replace(/\n/g, "</p><p>") || ""}</p>`,
    text: obj.text || "",
  });

  // Convert plain text newlines to paragraph breaks for Tiptap
  const initialContent =
    obj.richText ||
    `<p>${(obj.text || "").replace(/\n/g, "</p><p>") || ""}</p>`;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        heading: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      Color,
      FontFamily,
      TextAlign.configure({ types: ["paragraph"] }),
      ExtendedTextStyle,
    ],
    content: initialContent,
    immediatelyRender: false,
    // NO onBlur â€” we commit on unmount instead so toolbar clicks
    // don't accidentally close the editor before applying styles
    onUpdate: ({ editor: e }) => {
      dirtyRef.current = true;
      latestRef.current = {
        html: e.getHTML(),
        text: e.getText({ blockSeparator: "\n" }),
      };
    },
  });

  // Close editor when the user clicks outside the editor container and outside
  // the typography toolbar. Uses a document-level mousedown capture listener
  // so it fires before any stopPropagation and before React re-renders, making
  // it immune to the render-timing races that plagued the useEffect/isSelected approach.
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      // Stay open if click is inside the editor
      if (containerRef.current?.contains(target)) return;
      // Stay open if click is inside the typography toolbar
      if ((target as Element).closest?.("[data-rich-toolbar]")) return;
      // Clicked outside — commit if dirty, then close
      console.log("[RichTextEditor] Outside click detected for obj", obj.id);
      if (dirtyRef.current && !cancelledRef.current) {
        console.log(
          "[RichTextEditor] onCommit (outside click) for obj",
          obj.id,
        );
        onCommitRef.current(latestRef.current.html, latestRef.current.text);
        dirtyRef.current = false;
      }
      console.log("[RichTextEditor] onCancel (outside click) for obj", obj.id);
      onCancelRef.current();
    };
    document.addEventListener("mousedown", handleOutsideClick, true);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick, true);
  }, [obj.id]);
  useEffect(() => {
    console.log("[RichTextEditor] MOUNT for obj", obj.id);
    return () => {
      console.log("[RichTextEditor] UNMOUNT for obj", obj.id);
    };
  }, [obj.id]);

  //e
  useEffect(() => {
    if (editor) setActiveEditor(editor);
    return () => setActiveEditor(null);
  }, [editor, setActiveEditor]);

  // Explicitly focus + select-all once the editor is ready
  // (needed because immediatelyRender:false may defer mount)
  useEffect(() => {
    if (!editor) return;
    // Small delay to ensure the DOM is ready
    const id = requestAnimationFrame(() => {
      editor.chain().focus("all").run();
    });
    return () => cancelAnimationFrame(id);
  }, [editor]);

  const px = obj.paddingX ?? (obj.bgEnabled ? 14 : 0);
  const py = obj.paddingY ?? (obj.bgEnabled ? 6 : 0);

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
    direction: (obj.direction ?? "ltr") as CSSProperties["direction"],
    letterSpacing:
      obj.letterSpacing != null ? obj.letterSpacing + "px" : undefined,
    lineHeight: obj.lineHeight ?? 1.2,
    fontFamily: obj.fontFamily ?? undefined,
    textTransform: (obj.textTransform && obj.textTransform !== "none"
      ? obj.textTransform
      : undefined) as CSSProperties["textTransform"],
    whiteSpace: "pre-wrap",
    opacity: opacityVal,
    transform: rotate,
    zIndex: 9999,
    background: obj.bgEnabled && obj.bgColor ? obj.bgColor : "transparent",
    borderRadius:
      obj.bgEnabled && obj.bgColor ? (obj.radius ?? 8) + "px" : "3px",
    padding:
      obj.bgEnabled && obj.bgColor
        ? `${py}px ${px}px`
        : `${py ?? 2}px ${px ?? 4}px`,
    cursor: "text",
    userSelect: "text",
    outline: "2px solid #3b82f6",
    border: "none",
    ...(obj.w != null
      ? { width: obj.w + "px" }
      : {
          width: "auto",
          minWidth: Math.max(60, (obj.size ?? 22) * 4) + "px",
        }),
  };

  return (
    <div
      ref={containerRef}
      className="bls-rich-editor"
      data-obj-id={obj.id}
      data-fi={frameIndex}
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          cancelledRef.current = true;
          setActiveEditor(null);
          onCancel();
        }
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
