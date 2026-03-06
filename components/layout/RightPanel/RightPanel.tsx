"use client";

import {
  ScrollArea,
  Stack,
  Divider,
  Group,
  Text,
  ActionIcon,
  Paper,
  Portal,
  Collapse,
} from "@mantine/core";
import {
  IconStack2,
  IconAdjustments,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import { useMemo, useRef, useState } from "react";
import { ObjectEditorSection } from "@src/components/sidebar/ObjectEditorSection";
import { BgImageSection } from "@src/components/sidebar/BgImageSection";
import { LayersTab } from "./LayersTab";

type PanelId = "layers" | "properties";

interface DetachedPanelState {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

function PropertiesPanel() {
  const selectedObjectId = useQuizStore((s) => s.selectedObjectId);
  return (
    <ScrollArea h="100%" type="auto">
      {selectedObjectId ? (
        <ObjectEditorSection />
      ) : (
        <Stack p="md" gap="lg">
          <BgImageSection />
        </Stack>
      )}
    </ScrollArea>
  );
}

export function RightPanel() {
  const [collapsed, setCollapsed] = useState<Record<PanelId, boolean>>({
    layers: false,
    properties: false,
  });
  const [detached, setDetached] = useState<
    Partial<Record<PanelId, DetachedPanelState>>
  >({});
  const dragRef = useRef<{
    panel: PanelId;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const baseZ = useMemo(() => {
    const zVals = Object.values(detached)
      .filter(Boolean)
      .map((p) => p!.zIndex);
    return zVals.length ? Math.max(...zVals) + 1 : 2000;
  }, [detached]);

  const panelTitles: Record<PanelId, string> = {
    layers: "Layers",
    properties: "Properties",
  };

  const panelIcon = (id: PanelId) =>
    id === "layers" ? <IconStack2 size={14} /> : <IconAdjustments size={14} />;

  const panelContent = (id: PanelId) =>
    id === "layers" ? <LayersTab /> : <PropertiesPanel />;

  const toggleCollapse = (id: PanelId) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const detachPanel = (id: PanelId) => {
    setDetached((prev) => ({
      ...prev,
      [id]: {
        x: 60,
        y: 90,
        width: 320,
        height: 460,
        zIndex: baseZ,
      },
    }));
  };

  const attachPanel = (id: PanelId) => {
    setDetached((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const bringToFront = (id: PanelId) => {
    setDetached((prev) => {
      const pane = prev[id];
      if (!pane) return prev;
      return {
        ...prev,
        [id]: { ...pane, zIndex: baseZ },
      };
    });
  };

  const startDrag = (id: PanelId, e: React.MouseEvent<HTMLDivElement>) => {
    const pane = detached[id];
    if (!pane) return;
    e.preventDefault();
    bringToFront(id);
    dragRef.current = {
      panel: id,
      startX: e.clientX,
      startY: e.clientY,
      originX: pane.x,
      originY: pane.y,
    };

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const nx = d.originX + (ev.clientX - d.startX);
      const ny = d.originY + (ev.clientY - d.startY);
      setDetached((prev) => {
        const current = prev[d.panel];
        if (!current) return prev;
        return {
          ...prev,
          [d.panel]: { ...current, x: nx, y: ny },
        };
      });
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const dockedOrder: PanelId[] = ["layers", "properties"];

  return (
    <>
      <Stack h="100%" gap={0} p="xs">
        {dockedOrder.map((id) => {
          if (detached[id]) return null;
          const isCollapsed = collapsed[id];
          return (
            <Paper
              key={id}
              withBorder
              radius="sm"
              mb="xs"
              style={{ overflow: "hidden" }}
            >
              <Group justify="space-between" px="xs" py={6} wrap="nowrap">
                <Group gap={6} wrap="nowrap">
                  {panelIcon(id)}
                  <Text size="sm" fw={600}>
                    {panelTitles[id]}
                  </Text>
                </Group>
                <Group gap={2} wrap="nowrap">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => detachPanel(id)}
                    aria-label={`Detach ${panelTitles[id]}`}
                    title="Detach"
                  >
                    <IconExternalLink size={13} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => toggleCollapse(id)}
                    aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${panelTitles[id]}`}
                    title={isCollapsed ? "Expand" : "Collapse"}
                  >
                    {isCollapsed ? (
                      <IconChevronDown size={13} />
                    ) : (
                      <IconChevronUp size={13} />
                    )}
                  </ActionIcon>
                </Group>
              </Group>
              <Collapse in={!isCollapsed}>
                <Divider />
                <div
                  style={{
                    height: id === "properties" ? "calc(100vh - 220px)" : 280,
                    minHeight: 180,
                    overflow: "hidden",
                  }}
                >
                  {panelContent(id)}
                </div>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>

      {(Object.keys(detached) as PanelId[]).map((id) => {
        const pane = detached[id];
        if (!pane) return null;
        return (
          <Portal key={id}>
            <Paper
              withBorder
              radius="sm"
              shadow="lg"
              style={{
                position: "fixed",
                left: pane.x,
                top: pane.y,
                width: pane.width,
                height: pane.height,
                zIndex: pane.zIndex,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onMouseDown={() => bringToFront(id)}
            >
              <Group
                justify="space-between"
                px="xs"
                py={6}
                style={{
                  cursor: "move",
                  borderBottom: "1px solid var(--mantine-color-dark-4)",
                }}
                onMouseDown={(e) => startDrag(id, e)}
              >
                <Group gap={6}>
                  {panelIcon(id)}
                  <Text size="sm" fw={600}>
                    {panelTitles[id]}
                  </Text>
                </Group>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    attachPanel(id);
                  }}
                  aria-label={`Attach ${panelTitles[id]} back`}
                  title="Attach back"
                >
                  <IconArrowBackUp size={13} />
                </ActionIcon>
              </Group>
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                {panelContent(id)}
              </div>
            </Paper>
          </Portal>
        );
      })}
    </>
  );
}
