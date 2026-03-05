import React, { useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon, Badge, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import type { Frame } from "@src/lib/types";
import type { GuideEvent } from "@src/lib/snapGuides";
import { RuledCanvas } from "@src/components/canvas/RuledCanvas";
import { FrameObjectEl } from "@src/components/canvas/FrameObject";
import { useDragContext } from "@src/context/DragContext";
import { useQuizStore } from "@src/store/quizStore";
import { FrameBackground } from "./FrameBackground";
import { PenCanvas } from "@src/components/canvas/PenCanvas";

interface Props {
  frame: Frame;
  index: number;
}

export function FrameCard({ frame, index }: Props) {
  const { startFrameResize } = useDragContext();
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const quizData = useQuizStore((s) => s.quizData);
  const setActiveFrame = useQuizStore((s) => s.setActiveFrame);
  const setSelectedObject = useQuizStore((s) => s.setSelectedObject);
  const removeFrame = useQuizStore((s) => s.removeFrame);
  const updateFrameField = useQuizStore((s) => s.updateFrameField);
  const setBg = useQuizStore((s) => s.setBg);
  const showRuler = useQuizStore((s) => s.showRuler);
  const showGrid = useQuizStore((s) => s.showGrid);
  const showCursorLines = useQuizStore((s) => s.showCursorLines);
  const playback = useQuizStore((s) => s.playback);
  const penMode = useQuizStore((s) => s.penMode);
  const setPenMode = useQuizStore((s) => s.setPenMode);
  const addObject = useQuizStore((s) => s.addObject);

  const isActive = index === currentPreviewIndex;

  // ── Smart guide lines overlay ─────────────────────────────────────────────
  const guidesSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { frameIndex, vLines, hLines } = (e as CustomEvent<GuideEvent>)
        .detail;
      if (frameIndex !== index) return;
      const svg = guidesSvgRef.current;
      if (!svg) return;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const makeLine = (x1: number, y1: number, x2: number, y2: number) => {
        const ln = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        ln.setAttribute("x1", String(x1));
        ln.setAttribute("y1", String(y1));
        ln.setAttribute("x2", String(x2));
        ln.setAttribute("y2", String(y2));
        ln.setAttribute("stroke", "#f43f5e");
        ln.setAttribute("stroke-width", "1");
        ln.setAttribute("stroke-dasharray", "4 3");
        svg.appendChild(ln);
      };
      for (const x of vLines) makeLine(x, 0, x, frame.h);
      for (const y of hLines) makeLine(0, y, frame.w, y);
    };
    window.addEventListener("bls-guides", handler);
    return () => window.removeEventListener("bls-guides", handler);
  }, [index, frame.w, frame.h]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: frame.id });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Frame-level enter/exit animation during timeline playback
  let frameAnimStyle: React.CSSProperties = {};
  if (playback && playback.frameIdx === index) {
    const { phase } = playback;
    if (phase === "enter") {
      const a = frame.animEnter || { type: "blsFadeIn", dur: 400 };
      if (a.type && a.type !== "none")
        frameAnimStyle = { animation: `${a.type} ${a.dur}ms ease-out both` };
    } else if (phase === "exit") {
      const a = frame.animExit || { type: "blsFadeOut", dur: 300 };
      if (a.type && a.type !== "none")
        frameAnimStyle = { animation: `${a.type} ${a.dur}ms ease-in forwards` };
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...sortableStyle, ...frameAnimStyle }}
      className={`frame-card${isActive ? " active" : ""}`}
      data-card-index={index}
    >
      {/* Handle bar (drag to reorder) */}
      {!playback && (
        <div className="frame-handle" {...attributes} {...listeners}>
          <Text span size="xs" fw={600} c="dimmed">
            Frame {index + 1}
          </Text>
          <Badge
            className="frame-badge"
            style={{
              textTransform: "none",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {frame.w}×{frame.h}
          </Badge>
        </div>
      )}

      <RuledCanvas
        frame={frame}
        showRuler={showRuler}
        showGrid={showGrid}
        showCursorLines={showCursorLines}
        onCanvasClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-obj-id]")) return;
          setActiveFrame(index);
          setSelectedObject(null);
        }}
      >
        <FrameBackground
          frame={frame}
          quizBg={quizData.bg}
          index={index}
          updateFrameField={updateFrameField}
          setBg={setBg}
        />

        {frame.objects.map((obj) => (
          <FrameObjectEl key={obj.id} obj={obj} frameIndex={index} />
        ))}

        <svg
          ref={guidesSvgRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
            zIndex: 50,
          }}
        />

        {penMode && isActive && (
          <PenCanvas
            frameW={frame.w}
            frameH={frame.h}
            onCommit={(pathObj) => {
              addObject(index, pathObj);
              setPenMode(false);
            }}
            onCancel={() => setPenMode(false)}
          />
        )}
      </RuledCanvas>

      {/* SE resize grip */}
      {!playback && (
        <div
          className="frame-resize-grip"
          title="Drag to resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            startFrameResize(e, index);
          }}
        />
      )}

      {/* Delete button */}
      {!playback && (
        <ActionIcon
          className="frame-del"
          title="Remove frame"
          color="red"
          variant="filled"
          radius="xl"
          size={18}
          style={{ position: "absolute", top: -8, right: -8, zIndex: 20 }}
          onClick={(e) => {
            e.stopPropagation();
            removeFrame(index);
          }}
        >
          <IconX size={10} />
        </ActionIcon>
      )}
    </div>
  );
}
