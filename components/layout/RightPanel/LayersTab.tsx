"use client";

import {
  ScrollArea,
  Stack,
  Text,
  Box,
  Group,
  ActionIcon,
  Divider,
} from "@mantine/core";
import {
  IconTypography,
  IconPhoto,
  IconLayoutList,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
  IconSquare,
  IconMinus,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import type { FrameObject } from "@src/lib/types";
import { useState, useEffect, useRef } from "react";

const OBJECT_ICON: Record<FrameObject["type"], React.ReactNode> = {
  text: <IconTypography size={12} />,
  image: <IconPhoto size={12} />,
  answerGroup: <IconLayoutList size={12} />,
  shape: <IconSquare size={12} />,
  divider: <IconMinus size={12} />,
};

export function LayersTab() {
  const getActiveFrame = useQuizStore((s) => s.getActiveFrame);
  const selectedObjectId = useQuizStore((s) => s.selectedObjectId);
  const setSelectedObject = useQuizStore((s) => s.setSelectedObject);
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const frames = useQuizStore((s) => s.quizData.frames);
  const toggleObjectVisibility = useQuizStore((s) => s.toggleObjectVisibility);
  const toggleObjectLock = useQuizStore((s) => s.toggleObjectLock);
  const moveObjectToIndex = useQuizStore((s) => s.moveObjectToIndex);

  const dragFromStoreIndex = useRef<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<number | null>(null);

  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const frame = getActiveFrame();
  const objects = frame ? [...frame.objects].reverse() : [];
  const totalObjects = objects.length;

  const toStoreIdx = (displayIdx: number) => totalObjects - 1 - displayIdx;

  if (!mounted) return null;

  return (
    <ScrollArea h="100%" type="auto">
      <Stack gap={0} p="xs">
        {/* Frame strip */}
        <Text
          size="xs"
          c="dimmed"
          fw={700}
          tt="uppercase"
          px={4}
          pb={4}
          style={{ letterSpacing: "0.08em" }}
        >
          Frames
        </Text>
        {frames.map((f, i) => (
          <Box
            key={f.id}
            px={8}
            py={4}
            style={{
              borderRadius: 4,
              cursor: "pointer",
              background:
                i === currentPreviewIndex
                  ? "var(--mantine-color-blue-9)"
                  : "transparent",
            }}
            onClick={() => useQuizStore.getState().setActiveFrame(i)}
          >
            <Text size="xs" c={i === currentPreviewIndex ? "white" : "dimmed"}>
              Frame {i + 1}
              {f.isEndFrame ? " — End" : ""}
            </Text>
          </Box>
        ))}

        <Divider my="xs" />

        {/* Object layers for active frame */}
        <Text
          size="xs"
          c="dimmed"
          fw={700}
          tt="uppercase"
          px={4}
          pb={4}
          style={{ letterSpacing: "0.08em" }}
        >
          Objects
        </Text>
        {objects.length === 0 && (
          <Text size="xs" c="dimmed" px={4} fs="italic">
            No objects
          </Text>
        )}
        {objects.map((obj, displayIdx) => {
          const isSelected = obj.id === selectedObjectId;
          const showIndicatorAbove = dropIndicator === displayIdx;
          return (
            <div key={obj.id}>
              <div
                style={{
                  height: showIndicatorAbove ? 2 : 0,
                  background: showIndicatorAbove
                    ? "var(--mantine-color-blue-4)"
                    : "transparent",
                  borderRadius: 1,
                  marginBottom: showIndicatorAbove ? 2 : 0,
                  transition: "height 80ms",
                }}
              />
              <Group
                gap={6}
                px={8}
                py={5}
                wrap="nowrap"
                draggable
                onDragStart={(e) => {
                  dragFromStoreIndex.current = toStoreIdx(displayIdx);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setDragImage(e.currentTarget, 12, 12);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropIndicator(displayIdx);
                }}
                onDragLeave={() => setDropIndicator(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropIndicator(null);
                  const from = dragFromStoreIndex.current;
                  if (from === null) return;
                  const to = toStoreIdx(displayIdx);
                  moveObjectToIndex(currentPreviewIndex, from, to);
                  dragFromStoreIndex.current = null;
                }}
                onDragEnd={() => {
                  setDropIndicator(null);
                  dragFromStoreIndex.current = null;
                }}
                style={{
                  borderRadius: 4,
                  cursor: "grab",
                  background: isSelected
                    ? "var(--mantine-color-blue-9)"
                    : "transparent",
                }}
                onClick={() => setSelectedObject(obj.id)}
              >
                <Box
                  c={isSelected ? "white" : "dimmed"}
                  style={{ lineHeight: 1 }}
                >
                  {OBJECT_ICON[obj.type]}
                </Box>
                <Text
                  size="xs"
                  c={isSelected ? "white" : "dimmed"}
                  style={{ flex: 1, opacity: obj.hidden ? 0.4 : 1 }}
                >
                  {obj.type === "text"
                    ? (obj as { text?: string }).text?.slice(0, 20) || "Text"
                    : obj.type === "answerGroup"
                      ? "Answer Group"
                      : obj.type === "shape"
                        ? obj.label || "Shape"
                        : obj.type === "divider"
                          ? obj.label || "Line"
                          : "Image"}
                </Text>
                <ActionIcon
                  size={16}
                  variant="transparent"
                  c={obj.locked ? "yellow" : "dimmed"}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleObjectLock(currentPreviewIndex, obj.id);
                  }}
                  title={obj.locked ? "Unlock" : "Lock"}
                >
                  {obj.locked ? (
                    <IconLock size={11} />
                  ) : (
                    <IconLockOpen size={11} />
                  )}
                </ActionIcon>
                <ActionIcon
                  size={16}
                  variant="transparent"
                  c={obj.hidden ? "red" : "dimmed"}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleObjectVisibility(currentPreviewIndex, obj.id);
                  }}
                  title={obj.hidden ? "Show" : "Hide"}
                >
                  {obj.hidden ? (
                    <IconEyeOff size={11} />
                  ) : (
                    <IconEye size={11} />
                  )}
                </ActionIcon>
              </Group>
            </div>
          );
        })}
        {/* Drop indicator at the bottom */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDropIndicator(totalObjects);
          }}
          onDragLeave={() => setDropIndicator(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDropIndicator(null);
            const from = dragFromStoreIndex.current;
            if (from === null) return;
            moveObjectToIndex(currentPreviewIndex, from, 0);
            dragFromStoreIndex.current = null;
          }}
          style={{ height: 8 }}
        >
          <div
            style={{
              height: dropIndicator === totalObjects ? 2 : 0,
              background:
                dropIndicator === totalObjects
                  ? "var(--mantine-color-blue-4)"
                  : "transparent",
              borderRadius: 1,
              transition: "height 80ms",
            }}
          />
        </div>
      </Stack>
    </ScrollArea>
  );
}
