"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Portal, Text, Divider } from "@mantine/core";
import {
  IconCopy,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconArrowBarToUp,
  IconArrowBarDown,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";

interface CtxState {
  x: number;
  y: number;
  objId: string;
  frameIndex: number;
}

/** Drop-in global right-click context menu — add <ContextMenu /> once inside the app. */
export function ContextMenu() {
  const [ctx, setCtx] = useState<CtxState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const removeObject = useQuizStore((s) => s.removeObject);
  const duplicateObject = useQuizStore((s) => s.duplicateObject);
  const reorderObjectZ = useQuizStore((s) => s.reorderObjectZ);
  const setSelectedObject = useQuizStore((s) => s.setSelectedObject);
  const setActiveFrame = useQuizStore((s) => s.setActiveFrame);

  // Listen for right-click anywhere on the canvas
  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const objEl = target.closest<HTMLElement>("[data-obj-id]");
      if (!objEl) return;
      e.preventDefault();
      const objId = objEl.dataset.objId!;
      const fi = Number(objEl.dataset.fi ?? 0);
      setCtx({ x: e.clientX, y: e.clientY, objId, frameIndex: fi });
      setActiveFrame(fi);
      setSelectedObject(objId);
    };
    window.addEventListener("contextmenu", onContext);
    return () => window.removeEventListener("contextmenu", onContext);
  }, [setActiveFrame, setSelectedObject]);

  // Close on click outside
  useEffect(() => {
    if (!ctx) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setCtx(null);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [ctx]);

  if (!ctx) return null;

  const { x, y, objId, frameIndex } = ctx;
  const close = () => setCtx(null);

  // Clamp to viewport
  const menuW = 200;
  const menuH = 280;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  return (
    <Portal>
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          left,
          top,
          zIndex: 9999,
          minWidth: menuW,
          background: "var(--mantine-color-dark-7)",
          border: "1px solid var(--mantine-color-dark-4)",
          borderRadius: "var(--mantine-radius-sm)",
          boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          overflow: "hidden",
        }}
      >
        <Menu opened withArrow={false} shadow="none">
          <Menu.Dropdown
            style={{
              position: "static",
              border: "none",
              background: "transparent",
              boxShadow: "none",
            }}
          >
            {/* Label */}
            <Text
              size="xs"
              c="dimmed"
              px={12}
              py={6}
              fw={700}
              tt="uppercase"
              style={{
                letterSpacing: "0.08em",
                borderBottom: "1px solid var(--mantine-color-dark-5)",
              }}
            >
              Object
            </Text>

            {/* Z-Order */}
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

            <Divider />

            {/* Edit */}
            <Menu.Label>Edit</Menu.Label>
            <Menu.Item
              leftSection={<IconCopy size={14} />}
              onClick={() => {
                duplicateObject(frameIndex, objId);
                close();
              }}
            >
              Duplicate
            </Menu.Item>
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
