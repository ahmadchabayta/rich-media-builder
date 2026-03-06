"use client";

import {
  ScrollArea,
  Stack,
  Text,
  Box,
  Group,
  ActionIcon,
  Divider,
  FileButton,
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
  IconVector,
  IconCopy,
  IconX,
  IconPlus,
  IconUpload,
} from "@tabler/icons-react";
import { useQuizStore, makeId } from "@src/store/quizStore";
import type { FrameObject } from "@src/lib/types";
import { useState, useEffect, useRef } from "react";

const OBJECT_ICON: Record<FrameObject["type"], React.ReactNode> = {
  text: <IconTypography size={12} />,
  image: <IconPhoto size={12} />,
  answerGroup: <IconLayoutList size={12} />,
  shape: <IconSquare size={12} />,
  divider: <IconMinus size={12} />,
  path: <IconVector size={12} />,
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
  const defaultW = useQuizStore((s) => s.defaultW);
  const defaultH = useQuizStore((s) => s.defaultH);
  const addFrame = useQuizStore((s) => s.addFrame);
  const removeFrame = useQuizStore((s) => s.removeFrame);
  const duplicateFrame = useQuizStore((s) => s.duplicateFrame);

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

  const handleAddBlankFrame = () => {
    addFrame({
      id: makeId(),
      src: null,
      objects: [],
      w: defaultW,
      h: defaultH,
      isDefault: false,
      isEndFrame: false,
      animEnter: { type: "blsFadeIn", dur: 400 },
      animExit: { type: "blsFadeOut", dur: 300 },
      answerStagger: 80,
    });
  };

  const handleFrameFiles = (files: File[]) => {
    if (!files.length) return;
    // If there's only a single default frame, remove it
    if (frames.length === 1 && frames[0].isDefault) {
      removeFrame(0);
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (f) => {
        addFrame({
          id: makeId(),
          src: f.target!.result as string,
          objects: [],
          w: defaultW,
          h: defaultH,
          isDefault: false,
          isEndFrame: false,
          animEnter: { type: "blsFadeIn", dur: 400 },
          animExit: { type: "blsFadeOut", dur: 300 },
          answerStagger: 80,
        });
      };
      reader.readAsDataURL(file);
    });
  };

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
          <Group
            key={f.id}
            px={8}
            py={4}
            gap={4}
            wrap="nowrap"
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
            <Text
              size="xs"
              c={i === currentPreviewIndex ? "white" : "dimmed"}
              style={{ flex: 1 }}
            >
              Frame {i + 1}
              {f.isEndFrame ? " — End" : ""}
            </Text>
            <ActionIcon
              size={16}
              variant="transparent"
              c="dimmed"
              tabIndex={-1}
              title="Duplicate frame"
              onClick={(e) => {
                e.stopPropagation();
                duplicateFrame(i);
              }}
            >
              <IconCopy size={11} />
            </ActionIcon>
            <ActionIcon
              size={16}
              variant="transparent"
              c="red"
              tabIndex={-1}
              title="Delete frame"
              onClick={(e) => {
                e.stopPropagation();
                removeFrame(i);
              }}
            >
              <IconX size={11} />
            </ActionIcon>
          </Group>
        ))}

        {/* Frame management buttons */}
        <Group gap={4} px={4} pt={4}>
          <ActionIcon
            size="xs"
            variant="subtle"
            title="Add blank frame"
            onClick={handleAddBlankFrame}
          >
            <IconPlus size={12} />
          </ActionIcon>
          <FileButton onChange={handleFrameFiles} accept="image/*" multiple>
            {(props) => (
              <ActionIcon
                size="xs"
                variant="subtle"
                title="Upload frame images"
                {...props}
              >
                <IconUpload size={12} />
              </ActionIcon>
            )}
          </FileButton>
        </Group>

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
