"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ScrollArea,
  Stack,
  Divider,
  Group,
  Text,
  ActionIcon,
  NumberInput,
  Paper,
  Portal,
  Collapse,
  Box,
  SimpleGrid,
} from "@mantine/core";
import {
  IconStack2,
  IconAdjustments,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconArrowBackUp,
  IconPlayerPlay,
  IconColorFilter,
  IconLayout,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import { ObjectEditorSection } from "@src/components/sidebar/ObjectEditorSection";
import { FiltersBlendPanel } from "@src/components/sidebar/FiltersBlendPanel";
import { FrameAnimPanel } from "@src/components/sidebar/FrameAnimPanel";
import { AnimationSection } from "@src/components/sidebar/ObjectEditorSection/AnimationSection";
import { n } from "@src/components/sidebar/utils";
import { LayersTab } from "./LayersTab";
import type { FrameObject } from "@src/lib/types";

// ─── Panel IDs ────────────────────────────────────────────────────────────────
type PanelId = "layers" | "properties" | "animation" | "filters" | "frame";

const PANEL_ORDER: PanelId[] = [
  "layers",
  "properties",
  "animation",
  "filters",
  "frame",
];

interface PanelMeta {
  title: string;
  icon: React.ReactNode;
  defaultH: number;
}

const PANEL_META: Record<PanelId, PanelMeta> = {
  layers: { title: "Layers", icon: <IconStack2 size={14} />, defaultH: 280 },
  properties: {
    title: "Properties",
    icon: <IconAdjustments size={14} />,
    defaultH: 420,
  },
  animation: {
    title: "Animation",
    icon: <IconPlayerPlay size={14} />,
    defaultH: 500,
  },
  filters: {
    title: "Filters & FX",
    icon: <IconColorFilter size={14} />,
    defaultH: 380,
  },
  frame: { title: "Frame", icon: <IconLayout size={14} />, defaultH: 320 },
};

// ─── Persisted state ──────────────────────────────────────────────────────────
interface PanelGeom {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PersistedPanel {
  collapsed: boolean;
  floating: boolean;
  geom: PanelGeom;
}

type PersistedAll = Record<PanelId, PersistedPanel>;

/** Runtime state: persisted fields + an ephemeral zIndex. */
interface RuntimePanel extends PersistedPanel {
  zIndex: number;
}

const STORAGE_KEY = "bls-panel-state-v2";

function defaultGeom(id: PanelId): PanelGeom {
  return { x: 80, y: 80, width: 320, height: PANEL_META[id].defaultH };
}

const DEFAULTS: PersistedAll = {
  layers: { collapsed: false, floating: false, geom: defaultGeom("layers") },
  properties: {
    collapsed: false,
    floating: false,
    geom: defaultGeom("properties"),
  },
  animation: {
    collapsed: true,
    floating: false,
    geom: defaultGeom("animation"),
  },
  filters: { collapsed: true, floating: false, geom: defaultGeom("filters") },
  frame: { collapsed: true, floating: false, geom: defaultGeom("frame") },
};

function loadPersistedState(): PersistedAll {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Partial<PersistedAll>;
    const result = { ...DEFAULTS };
    for (const id of PANEL_ORDER) {
      const s = saved[id];
      if (s) {
        result[id] = {
          collapsed:
            typeof s.collapsed === "boolean"
              ? s.collapsed
              : DEFAULTS[id].collapsed,
          floating: typeof s.floating === "boolean" ? s.floating : false,
          geom: s.geom ?? defaultGeom(id),
        };
      }
    }
    return result;
  } catch {
    return DEFAULTS;
  }
}

function persistPanelState(panels: Record<PanelId, RuntimePanel>) {
  const toSave: PersistedAll = {} as PersistedAll;
  for (const id of PANEL_ORDER) {
    const p = panels[id];
    toSave[id] = { collapsed: p.collapsed, floating: p.floating, geom: p.geom };
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore quota errors
  }
}

// ─── Panel content components ─────────────────────────────────────────────────

function AnimationPanelContent() {
  const store = useQuizStore();
  const { currentPreviewIndex, selectedObjectId } = store;
  const selectedObj = store.getSelectedObject();

  if (!selectedObj) {
    return (
      <Text size="xs" c="dimmed" p="md" fs="italic">
        Select an object to edit its animation.
      </Text>
    );
  }

  const updateObj = (patch: Partial<FrameObject>) => {
    if (!selectedObjectId) return;
    store.updateObject(
      currentPreviewIndex,
      selectedObjectId,
      (o) => ({ ...o, ...patch }) as FrameObject,
    );
  };

  return (
    <ScrollArea type="auto" h="100%">
      <Box p="md">
        <AnimationSection selectedObj={selectedObj} updateObj={updateObj} />
      </Box>
    </ScrollArea>
  );
}

function FiltersPanelContent() {
  const store = useQuizStore();
  const { currentPreviewIndex, selectedObjectId } = store;
  const selectedObj = store.getSelectedObject();

  if (!selectedObj) {
    return (
      <Text size="xs" c="dimmed" p="md" fs="italic">
        Select an object to edit its filters.
      </Text>
    );
  }

  const updateObj = (patch: Partial<FrameObject>) => {
    if (!selectedObjectId) return;
    store.updateObject(
      currentPreviewIndex,
      selectedObjectId,
      (o) => ({ ...o, ...patch }) as FrameObject,
    );
  };

  return (
    <ScrollArea type="auto" h="100%">
      <Box p="sm">
        <FiltersBlendPanel obj={selectedObj} updateObj={updateObj} />
      </Box>
    </ScrollArea>
  );
}

function FramePanelContent() {
  const store = useQuizStore();
  const { currentPreviewIndex } = store;
  const frame = store.getActiveFrame();

  if (!frame) {
    return (
      <Text size="xs" c="dimmed" p="md" fs="italic">
        Add a frame to see its settings.
      </Text>
    );
  }

  return (
    <ScrollArea type="auto" h="100%">
      <Box p="sm">
        <Stack gap="xs">
          <SimpleGrid cols={2} spacing="xs">
            <NumberInput
              label="Frame W"
              value={frame.w}
              min={50}
              clampBehavior="none"
              onChange={(val) => {
                const v = n(val, 50);
                if (v >= 50)
                  store.updateFrameField(currentPreviewIndex, { w: v });
              }}
              onBlur={(e) => {
                const v = Math.max(50, parseInt(e.target.value) || 50);
                store.updateFrameField(currentPreviewIndex, { w: v });
              }}
            />
            <NumberInput
              label="Frame H"
              value={frame.h}
              min={50}
              clampBehavior="none"
              onChange={(val) => {
                const v = n(val, 50);
                if (v >= 50)
                  store.updateFrameField(currentPreviewIndex, { h: v });
              }}
              onBlur={(e) => {
                const v = Math.max(50, parseInt(e.target.value) || 50);
                store.updateFrameField(currentPreviewIndex, { h: v });
              }}
            />
          </SimpleGrid>
          <FrameAnimPanel frame={frame} frameIndex={currentPreviewIndex} />
        </Stack>
      </Box>
    </ScrollArea>
  );
}

function PropertiesPanel() {
  return (
    <ScrollArea h="100%" type="auto">
      <ObjectEditorSection />
    </ScrollArea>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function RightPanel() {
  const [panels, setPanels] = useState<Record<PanelId, RuntimePanel>>(() => {
    const loaded = loadPersistedState();
    let baseZ = 2000;
    const result = {} as Record<PanelId, RuntimePanel>;
    for (const id of PANEL_ORDER) {
      result[id] = {
        ...loaded[id],
        zIndex: loaded[id].floating ? ++baseZ : 2000,
      };
    }
    return result;
  });

  const dragRef = useRef<{
    id: PanelId;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  // Write to localStorage on every state change (survives reload + browser close).
  useEffect(() => {
    persistPanelState(panels);
  }, [panels]);

  const maxZ = useMemo(
    () => Math.max(2000, ...PANEL_ORDER.map((id) => panels[id].zIndex)),
    [panels],
  );

  const update = (id: PanelId, patch: Partial<RuntimePanel>) =>
    setPanels((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const toggleCollapse = (id: PanelId) =>
    update(id, { collapsed: !panels[id].collapsed });

  const detach = (id: PanelId) =>
    update(id, { floating: true, zIndex: maxZ + 1 });

  const attach = (id: PanelId) => update(id, { floating: false });

  const bringToFront = (id: PanelId) => update(id, { zIndex: maxZ + 1 });

  const startDrag = (id: PanelId, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    bringToFront(id);
    const { x, y } = panels[id].geom;
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      originX: x,
      originY: y,
    };

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const nx = d.originX + (ev.clientX - d.startX);
      const ny = d.originY + (ev.clientY - d.startY);
      setPanels((prev) => ({
        ...prev,
        [d.id]: {
          ...prev[d.id],
          geom: { ...prev[d.id].geom, x: nx, y: ny },
        },
      }));
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const panelContent = (id: PanelId): React.ReactNode => {
    switch (id) {
      case "layers":
        return <LayersTab />;
      case "properties":
        return <PropertiesPanel />;
      case "animation":
        return <AnimationPanelContent />;
      case "filters":
        return <FiltersPanelContent />;
      case "frame":
        return <FramePanelContent />;
    }
  };

  const dockedPanels = PANEL_ORDER.filter((id) => !panels[id].floating);
  const floatingPanels = PANEL_ORDER.filter((id) => panels[id].floating);

  return (
    <>
      {/* Docked panels — whole column scrolls */}
      <ScrollArea h="100%" type="auto" p="xs">
        <Stack gap="xs" pb="md">
          {dockedPanels.map((id) => {
            const meta = PANEL_META[id];
            const state = panels[id];
            return (
              <Paper
                key={id}
                withBorder
                radius="sm"
                style={{ overflow: "hidden" }}
              >
                <Group justify="space-between" px="xs" py={6} wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    {meta.icon}
                    <Text size="sm" fw={600}>
                      {meta.title}
                    </Text>
                  </Group>
                  <Group gap={2} wrap="nowrap">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      title="Detach into floating panel"
                      aria-label={`Detach ${meta.title}`}
                      onClick={() => detach(id)}
                    >
                      <IconExternalLink size={13} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      title={state.collapsed ? "Expand" : "Collapse"}
                      aria-label={`${state.collapsed ? "Expand" : "Collapse"} ${meta.title}`}
                      onClick={() => toggleCollapse(id)}
                    >
                      {state.collapsed ? (
                        <IconChevronDown size={13} />
                      ) : (
                        <IconChevronUp size={13} />
                      )}
                    </ActionIcon>
                  </Group>
                </Group>

                <Collapse in={!state.collapsed}>
                  <Divider />
                  <div
                    style={{
                      maxHeight: meta.defaultH,
                      overflowY: "auto",
                    }}
                  >
                    {panelContent(id)}
                  </div>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Floating / detached panels rendered via Portal */}
      {floatingPanels.map((id) => {
        const state = panels[id];
        const meta = PANEL_META[id];
        return (
          <Portal key={id}>
            <Paper
              withBorder
              radius="sm"
              shadow="lg"
              style={{
                position: "fixed",
                left: state.geom.x,
                top: state.geom.y,
                width: state.geom.width,
                height: state.geom.height,
                zIndex: state.zIndex,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onMouseDown={() => bringToFront(id)}
            >
              {/* Drag handle */}
              <Group
                justify="space-between"
                px="xs"
                py={6}
                style={{
                  cursor: "move",
                  borderBottom: "1px solid var(--mantine-color-dark-4)",
                  flexShrink: 0,
                  userSelect: "none",
                }}
                onMouseDown={(e) => startDrag(id, e)}
              >
                <Group gap={6}>
                  {meta.icon}
                  <Text size="sm" fw={600}>
                    {meta.title}
                  </Text>
                </Group>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  title="Dock back to sidebar"
                  aria-label={`Dock ${meta.title} back`}
                  onClick={(e) => {
                    e.stopPropagation();
                    attach(id);
                  }}
                >
                  <IconArrowBackUp size={13} />
                </ActionIcon>
              </Group>

              {/* Content */}
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
