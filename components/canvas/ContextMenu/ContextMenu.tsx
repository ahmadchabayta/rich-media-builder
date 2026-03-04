"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Portal, Text } from "@mantine/core";
import {
  IconCopy,
  IconClipboard,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconArrowBarToUp,
  IconArrowBarDown,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";

interface CtxState {
  x: number;
  y: number;
  objId: string;
  frameIndex: number;
}

export function ContextMenu() {
  const [ctx, setCtx] = useState<CtxState | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const removeObject = useQuizStore((s) => s.removeObject);
  const duplicateObject = useQuizStore((s) => s.duplicateObject);
  const reorderObjectZ = useQuizStore((s) => s.reorderObjectZ);
  const copyObject = useQuizStore((s) => s.copyObject);
  const pasteObject = useQuizStore((s) => s.pasteObject);
  const toggleObjectVisibility = useQuizStore((s) => s.toggleObjectVisibility);
  const toggleObjectLock = useQuizStore((s) => s.toggleObjectLock);
  const setSelectedObject = useQuizStore((s) => s.setSelectedObject);
  const setActiveFrame = useQuizStore((s) => s.setActiveFrame);
  const clipboard = useQuizStore((s) => s.clipboard);

  const frames = useQuizStore((s) => s.quizData.frames);
  const activeFrameObjects = ctx ? (frames[ctx.frameIndex]?.objects ?? []) : [];
  const obj = ctx ? activeFrameObjects.find((o) => o.id === ctx.objId) : null;

  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const objEl = target.closest<HTMLElement>("[data-obj-id]");
      if (!objEl) return;
      e.preventDefault();
      const objId = objEl.dataset.objId!;
      const fi = Number(objEl.dataset.fi ?? 0);
      setActiveFrame(fi);
      setSelectedObject(objId);
      setCtx({ x: e.clientX, y: e.clientY, objId, frameIndex: fi });
    };
    window.addEventListener("contextmenu", onContext);
    return () => window.removeEventListener("contextmenu", onContext);
  }, [setActiveFrame, setSelectedObject]);

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
  const { x, y, objId, frameIndex } = ctx;

  const menuW = 210;
  const menuH = 360;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  return (
    <Portal>
      {/* Full-screen backdrop closes menu on outside click */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        onMouseDown={() => setCtx(null)}
      />

      <div ref={wrapRef} style={{ position: "fixed", left, top, zIndex: 9999 }}>
        <Menu
          opened
          withinPortal={false}
          shadow="lg"
          width={menuW}
          styles={{
            dropdown: { border: "1px solid var(--mantine-color-dark-4)" },
          }}
        >
          <Menu.Dropdown>
            {/* Object name header */}
            <Menu.Label>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" truncate>
                {obj?.label ?? "Object"}
              </Text>
            </Menu.Label>

            {/* Layer order */}
            <Menu.Label>Layer order</Menu.Label>
            <Menu.Item
              leftSection={<IconArrowBarToUp size={14} />}
              onClick={() => {
                reorderObjectZ(frameIndex, objId, "front");
                close();
              }}
            >
              Bring to Front
            </Menu.Item>
            <Menu.Item
              leftSection={<IconArrowUp size={14} />}
              onClick={() => {
                reorderObjectZ(frameIndex, objId, "forward");
                close();
              }}
            >
              Bring Forward
            </Menu.Item>
            <Menu.Item
              leftSection={<IconArrowDown size={14} />}
              onClick={() => {
                reorderObjectZ(frameIndex, objId, "backward");
                close();
              }}
            >
              Send Backward
            </Menu.Item>
            <Menu.Item
              leftSection={<IconArrowBarDown size={14} />}
              onClick={() => {
                reorderObjectZ(frameIndex, objId, "back");
                close();
              }}
            >
              Send to Back
            </Menu.Item>

            <Menu.Divider />

            {/* Visibility & Lock */}
            <Menu.Item
              leftSection={
                obj?.hidden ? <IconEye size={14} /> : <IconEyeOff size={14} />
              }
              onClick={() => {
                toggleObjectVisibility(frameIndex, objId);
                close();
              }}
            >
              {obj?.hidden ? "Show" : "Hide"}
            </Menu.Item>
            <Menu.Item
              leftSection={
                obj?.locked ? (
                  <IconLockOpen size={14} />
                ) : (
                  <IconLock size={14} />
                )
              }
              onClick={() => {
                toggleObjectLock(frameIndex, objId);
                close();
              }}
            >
              {obj?.locked ? "Unlock" : "Lock"}
            </Menu.Item>

            <Menu.Divider />

            {/* Clipboard */}
            <Menu.Item
              leftSection={<IconCopy size={14} />}
              onClick={() => {
                copyObject(frameIndex, objId);
                close();
              }}
            >
              Copy
            </Menu.Item>
            <Menu.Item
              leftSection={<IconClipboard size={14} />}
              disabled={!clipboard}
              onClick={() => {
                pasteObject(frameIndex);
                close();
              }}
            >
              Paste
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCopy size={14} />}
              onClick={() => {
                duplicateObject(frameIndex, objId);
                close();
              }}
            >
              Duplicate
            </Menu.Item>

            <Menu.Divider />

            {/* Delete */}
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => {
                removeObject(frameIndex, objId);
                close();
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </Portal>
  );
}
