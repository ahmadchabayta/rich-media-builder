"use client";

import { useRef } from "react";
import {
  Stack,
  ActionIcon,
  Tooltip,
  Divider,
  Popover,
  Box,
  UnstyledButton,
  Textarea,
  Text,
} from "@mantine/core";
import {
  IconTypography,
  IconPhoto,
  IconSquare,
  IconCircle,
  IconMinus,
  IconLayoutList,
  IconVector,
  IconCode,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import {
  createDefaultText,
  createDefaultRect,
  createDefaultCircle,
  createDefaultLine,
  createDefaultAnswers,
  createImageFromFile,
} from "@src/lib/insertHelpers";
import { BgFillSection } from "@src/components/sidebar/BgFillSection";
import type { FrameObject } from "@src/lib/types";

const TOOLBAR_W = 48;

export function VerticalToolbar() {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const addObject = useQuizStore((s) => s.addObject);
  const getActiveFrame = useQuizStore((s) => s.getActiveFrame);
  const penMode = useQuizStore((s) => s.penMode);
  const setPenMode = useQuizStore((s) => s.setPenMode);
  const customCss = useQuizStore((s) => s.customCss);
  const setCustomCss = useQuizStore((s) => s.setCustomCss);
  const defaultTypography = useQuizStore((s) => s.defaultTypography);

  const frame = useQuizStore((s) => s.getActiveFrame());

  const addInsert = (
    factory: (frame: { w: number; h: number }) => FrameObject,
  ) => {
    const f = getActiveFrame();
    if (!f) return;
    addObject(currentPreviewIndex, factory(f));
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const f = getActiveFrame();
    if (!file || !f) return;
    createImageFromFile(file, f, (obj) => addObject(currentPreviewIndex, obj));
    e.target.value = "";
  };

  // BgColor swatch
  let bgSwatchBg: string;
  if (frame?.bgGradient) {
    const g = frame.bgGradient;
    bgSwatchBg = `linear-gradient(${g.angle}deg, ${g.stops[0]}, ${g.stops[1]})`;
  } else if (frame?.bgColor) {
    bgSwatchBg = frame.bgColor;
  } else {
    bgSwatchBg =
      "repeating-conic-gradient(#475569 0% 25%, #334155 0% 50%) 0 0 / 8px 8px";
  }

  const iconSize = 18;
  const btnSize = "md" as const;

  return (
    <div
      style={{
        width: TOOLBAR_W,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "var(--mantine-color-dark-7)",
        borderRight: "1px solid var(--mantine-color-dark-4)",
        paddingTop: 8,
        paddingBottom: 8,
        gap: 2,
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
      }}
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFile}
      />

      {/* ── Insert tools ── */}
      <Tooltip label="Text" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          size={btnSize}
          onClick={() => {
            const f = getActiveFrame();
            if (f)
              addObject(
                currentPreviewIndex,
                createDefaultText(f.objects.length, defaultTypography),
              );
          }}
        >
          <IconTypography size={iconSize} color="#60a5fa" />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Image" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          size={btnSize}
          onClick={() => imageInputRef.current?.click()}
        >
          <IconPhoto size={iconSize} color="#a78bfa" />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Rectangle" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          size={btnSize}
          onClick={() => addInsert(createDefaultRect)}
        >
          <IconSquare size={iconSize} color="#22d3ee" />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Circle" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          size={btnSize}
          onClick={() => addInsert(createDefaultCircle)}
        >
          <IconCircle size={iconSize} color="#f472b6" />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Line" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          size={btnSize}
          onClick={() => addInsert(createDefaultLine)}
        >
          <IconMinus size={iconSize} color="#94a3b8" />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Answer Buttons" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          size={btnSize}
          onClick={() => addInsert(createDefaultAnswers)}
        >
          <IconLayoutList size={iconSize} color="#34d399" />
        </ActionIcon>
      </Tooltip>

      <Divider w="60%" my={4} />

      <Tooltip
        label={penMode ? "Pen Tool (active)" : "Pen Tool"}
        position="right"
        withArrow
      >
        <ActionIcon
          variant={penMode ? "light" : "subtle"}
          color={penMode ? "orange" : undefined}
          size={btnSize}
          onClick={() => setPenMode(!penMode)}
        >
          <IconVector
            size={iconSize}
            color={penMode ? "var(--mantine-color-orange-4)" : "#e2e8f0"}
          />
        </ActionIcon>
      </Tooltip>

      <Divider w="60%" my={4} />

      {/* ── BG Color ── */}
      <Popover width={240} position="right-start" shadow="md" withArrow>
        <Popover.Target>
          <Tooltip label="Frame Background" position="right" withArrow>
            <UnstyledButton
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: "2px solid var(--mantine-color-dark-4)",
                  cursor: "pointer",
                  background: bgSwatchBg,
                }}
              />
            </UnstyledButton>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown p="sm">
          <BgFillSection />
        </Popover.Dropdown>
      </Popover>

      <Divider w="60%" my={4} />

      {/* ── Custom CSS ── */}
      <Popover width={300} position="right-start" shadow="md" withArrow>
        <Popover.Target>
          <Tooltip label="Custom CSS" position="right" withArrow>
            <ActionIcon variant="subtle" size={btnSize}>
              <IconCode size={iconSize} color="#94a3b8" />
            </ActionIcon>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown p="sm">
          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Custom CSS
            </Text>
            <Textarea
              placeholder=".my-class { color: red; }"
              autosize
              minRows={4}
              maxRows={14}
              value={customCss}
              onChange={(e) => setCustomCss(e.currentTarget.value)}
              styles={{
                input: {
                  fontFamily: "monospace",
                  fontSize: "var(--mantine-font-size-xs)",
                },
              }}
            />
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}

export { TOOLBAR_W };
