import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Box, Text, ActionIcon, Group, Tooltip } from "@mantine/core";
import { IconZoomIn, IconZoomOut, IconZoomReset } from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import { FrameCard } from "@src/components/canvas/FrameCard";
import { useCallback, useEffect, useRef } from "react";

export function Board() {
  const quizData = useQuizStore((s) => s.quizData);
  const reorderFrame = useQuizStore((s) => s.reorderFrame);
  const playback = useQuizStore((s) => s.playback);
  const zoom = useQuizStore((s) => s.zoom);
  const setZoom = useQuizStore((s) => s.setZoom);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Ctrl+Scroll to zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    },
    [zoom, setZoom],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = quizData.frames.findIndex((f) => f.id === active.id);
    const to = quizData.frames.findIndex((f) => f.id === over.id);
    if (from !== -1 && to !== -1) reorderFrame(from, to);
  };

  return (
    <Box
      component="section"
      className="flex-1 flex flex-col overflow-hidden canvas-container"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative"
        style={{ flex: 1, overflow: "auto", position: "relative" }}
      >
        {quizData.frames.length === 0 && (
          <Text
            c="dimmed"
            size="sm"
            ta="center"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            Upload frames or add a blank frame to get started
          </Text>
        )}

        {playback ? (
          /* ── Playback mode: single active frame, centred ───────────── */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              minHeight: "100%",
              transform: `scale(${zoom})`,
              transformOrigin: "center top",
            }}
          >
            {quizData.frames[playback.frameIdx] && (
              <FrameCard
                key={quizData.frames[playback.frameIdx].id}
                frame={quizData.frames[playback.frameIdx]}
                index={playback.frameIdx}
              />
            )}
          </div>
        ) : (
          /* ── Editor mode: frames grouped into rows by locale ─────── */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {(() => {
              // Group frames into rows: undefined/null locale = "original" row
              const rowMap = new Map<string, typeof quizData.frames>();
              const rowOrder: string[] = [];
              for (const frame of quizData.frames) {
                const key = frame.locale ?? "__original__";
                if (!rowMap.has(key)) {
                  rowMap.set(key, []);
                  rowOrder.push(key);
                }
                rowMap.get(key)!.push(frame);
              }
              return rowOrder.map((rowKey) => {
                const rowFrames = rowMap.get(rowKey)!;
                const label =
                  rowKey === "__original__" ? null : rowKey.toUpperCase();
                return (
                  <div key={rowKey}>
                    {label && (
                      <div
                        style={{
                          paddingLeft: 24,
                          paddingTop: 12,
                          paddingBottom: 4,
                        }}
                      >
                        <Text
                          size="xs"
                          fw={600}
                          c="dimmed"
                          style={{
                            letterSpacing: 1,
                            textTransform: "uppercase",
                          }}
                        >
                          {label}
                        </Text>
                      </div>
                    )}
                    <SortableContext
                      items={rowFrames.map((f) => f.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div
                        id={
                          rowKey === "__original__"
                            ? "boardContainer"
                            : undefined
                        }
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          flexWrap: "nowrap",
                          alignItems: "flex-start",
                          gap: 20,
                          padding: "8px 24px 24px",
                          transform: `scale(${zoom})`,
                          transformOrigin: "top left",
                        }}
                      >
                        {rowFrames.map((frame) => {
                          const index = quizData.frames.indexOf(frame);
                          return (
                            <FrameCard
                              key={frame.id}
                              frame={frame}
                              index={index}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </div>
                );
              });
            })()}
          </DndContext>
        )}
      </div>
      <Group
        justify="space-between"
        align="center"
        style={{
          borderTop: "1px solid var(--mantine-color-dark-4)",
          padding: "4px 16px",
        }}
      >
        <Text size="xs" c="dimmed">
          Drag handle to reorder · Drag corner grip to resize · Ctrl+Scroll to
          zoom
        </Text>
        <Group gap={4}>
          <Tooltip label="Zoom Out" withArrow>
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={() => setZoom(zoom - 0.1)}
              disabled={zoom <= 0.25}
            >
              <IconZoomOut size={14} />
            </ActionIcon>
          </Tooltip>
          <Text
            size="xs"
            c="dimmed"
            style={{
              width: 42,
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
              cursor: "pointer",
            }}
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </Text>
          <Tooltip label="Zoom In" withArrow>
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={() => setZoom(zoom + 0.1)}
              disabled={zoom >= 3}
            >
              <IconZoomIn size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reset Zoom" withArrow>
            <ActionIcon variant="subtle" size="xs" onClick={() => setZoom(1)}>
              <IconZoomReset size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  );
}
