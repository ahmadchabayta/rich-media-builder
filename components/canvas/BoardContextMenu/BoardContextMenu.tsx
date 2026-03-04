"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Portal } from "@mantine/core";
import {
  IconMagnet,
  IconRuler,
  IconGrid4x4,
  IconSquarePlus,
  IconClipboard,
  IconPointerOff,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";

interface CtxState {
  x: number;
  y: number;
}

export function BoardContextMenu() {
  const [ctx, setCtx] = useState<CtxState | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const snapEnabled = useQuizStore((s) => s.snapEnabled);
  const showRuler = useQuizStore((s) => s.showRuler);
  const showGrid = useQuizStore((s) => s.showGrid);
  const clipboard = useQuizStore((s) => s.clipboard);
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);

  const setSnapEnabled = useQuizStore((s) => s.setSnapEnabled);
  const setShowRuler = useQuizStore((s) => s.setShowRuler);
  const setShowGrid = useQuizStore((s) => s.setShowGrid);
  const pasteObject = useQuizStore((s) => s.pasteObject);
  const setSelectedObject = useQuizStore((s) => s.setSelectedObject);
  const addFrame = useQuizStore((s) => s.addFrame);
  const createDefaultFrame = useQuizStore((s) => s.createDefaultFrame);

  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only handle right-clicks NOT on an object
      if (target.closest("[data-obj-id]")) return;
      // Only handle clicks inside the board container
      if (!target.closest("#boardContainer")) return;
      e.preventDefault();
      setCtx({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("contextmenu", onContext);
    return () => window.removeEventListener("contextmenu", onContext);
  }, []);

  useEffect(() => {
    if (!ctx) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setCtx(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtx(null);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [ctx]);

  if (!ctx) return null;

  const close = () => setCtx(null);

  const menuW = 200;
  const menuH = 280;
  const left = Math.min(ctx.x, window.innerWidth - menuW - 8);
  const top = Math.min(ctx.y, window.innerHeight - menuH - 8);

  const check = (active: boolean) => (
    <span
      style={{
        display: "inline-block",
        width: 14,
        textAlign: "center",
        marginRight: 4,
        color: active ? "var(--mantine-color-blue-4)" : "transparent",
        fontWeight: 700,
      }}
    >
      ✓
    </span>
  );

  return (
    <Portal>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        onMouseDown={() => setCtx(null)}
      />
      <div ref={wrapRef} style={{ position: "fixed", left, top, zIndex: 9999 }}>
        <Menu
          opened
          onClose={close}
          width={menuW}
          shadow="md"
          withinPortal={false}
        >
          <Menu.Dropdown>
            <Menu.Label>Canvas</Menu.Label>

            <Menu.Item
              leftSection={<IconMagnet size={14} />}
              onClick={() => {
                setSnapEnabled(!snapEnabled);
                close();
              }}
            >
              {check(snapEnabled)}Snap to objects
            </Menu.Item>

            <Menu.Item
              leftSection={<IconRuler size={14} />}
              onClick={() => {
                setShowRuler(!showRuler);
                close();
              }}
            >
              {check(showRuler)}Show ruler
            </Menu.Item>

            <Menu.Item
              leftSection={<IconGrid4x4 size={14} />}
              onClick={() => {
                setShowGrid(!showGrid);
                close();
              }}
            >
              {check(showGrid)}Show grid
            </Menu.Item>

            <Menu.Divider />
            <Menu.Label>Frame</Menu.Label>

            <Menu.Item
              leftSection={<IconSquarePlus size={14} />}
              onClick={() => {
                addFrame(createDefaultFrame());
                close();
              }}
            >
              Add blank frame
            </Menu.Item>

            <Menu.Item
              leftSection={<IconClipboard size={14} />}
              disabled={!clipboard}
              onClick={() => {
                pasteObject(currentPreviewIndex);
                close();
              }}
            >
              Paste object
            </Menu.Item>

            <Menu.Divider />

            <Menu.Item
              leftSection={<IconPointerOff size={14} />}
              onClick={() => {
                setSelectedObject(null);
                close();
              }}
            >
              Deselect all
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </Portal>
  );
}
