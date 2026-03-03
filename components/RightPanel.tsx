"use client";

import {
  Tabs,
  ScrollArea,
  Stack,
  Text,
  Box,
  Group,
  ActionIcon,
  Divider,
} from "@mantine/core";
import {
  IconStack2,
  IconAdjustments,
  IconTypography,
  IconPhoto,
  IconLayoutList,
  IconEye,
  IconSquare,
  IconMinus,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import type { FrameObject } from "@src/lib/types";
import { useState, useEffect } from "react";
import { ObjectEditorSection } from "./sidebar/ObjectEditorSection";

const OBJECT_ICON: Record<FrameObject["type"], React.ReactNode> = {
  text: <IconTypography size={12} />,
  image: <IconPhoto size={12} />,
  answerGroup: <IconLayoutList size={12} />,
  shape: <IconSquare size={12} />,
  divider: <IconMinus size={12} />,
};

function LayersTab() {
  const getActiveFrame = useQuizStore((s) => s.getActiveFrame);
  const selectedObjectId = useQuizStore((s) => s.selectedObjectId);
  const setSelectedObject = useQuizStore((s) => s.setSelectedObject);
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const frames = useQuizStore((s) => s.quizData.frames);

  // Avoid SSR/client hydration mismatch: Zustand's IndexedDB persist
  // loads data only on the client, so defer rendering until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const frame = getActiveFrame();
  const objects = frame ? [...frame.objects].reverse() : [];

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
        {objects.map((obj) => {
          const isSelected = obj.id === selectedObjectId;
          return (
            <Group
              key={obj.id}
              gap={6}
              px={8}
              py={5}
              wrap="nowrap"
              style={{
                borderRadius: 4,
                cursor: "pointer",
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
                style={{ flex: 1 }}
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
                c="dimmed"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <IconEye size={11} />
              </ActionIcon>
            </Group>
          );
        })}
      </Stack>
    </ScrollArea>
  );
}

function PropertiesTab() {
  return (
    <ScrollArea h="100%" type="auto">
      <ObjectEditorSection />
    </ScrollArea>
  );
}

export function RightPanel() {
  const selectedObjectId = useQuizStore((s) => s.selectedObjectId);
  const [activeTab, setActiveTab] = useState<string | null>("layers");
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);

  // Auto-switch to Properties tab when a new object is selected (render-phase derived state)
  if (selectedObjectId !== prevSelectedId) {
    setPrevSelectedId(selectedObjectId);
    if (selectedObjectId) {
      setActiveTab("properties");
    }
  }

  return (
    <Tabs
      value={activeTab}
      onChange={setActiveTab}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      styles={{
        root: { height: "100%" },
        panel: { flex: 1, minHeight: 0, overflow: "hidden" },
      }}
    >
      <Tabs.List>
        <Tabs.Tab value="layers" leftSection={<IconStack2 size={13} />}>
          Layers
        </Tabs.Tab>
        <Tabs.Tab
          value="properties"
          leftSection={<IconAdjustments size={13} />}
        >
          Properties
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="layers" style={{ height: "100%", overflow: "hidden" }}>
        <LayersTab />
      </Tabs.Panel>
      <Tabs.Panel
        value="properties"
        style={{ height: "100%", overflow: "hidden" }}
      >
        <PropertiesTab />
      </Tabs.Panel>
    </Tabs>
  );
}
