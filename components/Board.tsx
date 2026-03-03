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
import { Box, Text } from "@mantine/core";
import { useQuizStore } from "@src/store/quizStore";
import { FrameCard } from "./FrameCard";

export function Board() {
  const quizData = useQuizStore((s) => s.quizData);
  const reorderFrame = useQuizStore((s) => s.reorderFrame);

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={quizData.frames.map((f) => f.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              id="boardContainer"
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "flex-start",
                gap: 20,
                padding: 24,
                minHeight: "100%",
              }}
            >
              {quizData.frames.map((frame, index) => (
                <FrameCard key={frame.id} frame={frame} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <Text
        size="xs"
        c="dimmed"
        ta="center"
        style={{
          borderTop: "1px solid var(--mantine-color-dark-4)",
          padding: "6px 16px",
        }}
      >
        Drag handle to reorder · Drag corner grip to resize · Drag objects to
        reposition
      </Text>
    </Box>
  );
}
