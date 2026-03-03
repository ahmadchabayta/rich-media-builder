import { useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon, Badge, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import type { Frame } from "@src/lib/types";
import type { GuideEvent } from "@src/lib/snapGuides";
import { RuledCanvas } from "./RuledCanvas";
import { FrameObjectEl } from "./FrameObject";
import { useDragContext } from "@src/context/DragContext";
import { useQuizStore } from "@src/store/quizStore";

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
      // Remove old lines
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

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`frame-card${isActive ? " active" : ""}`}
      data-card-index={index}
    >
      {/* Handle bar (drag to reorder) */}
      <div className="frame-handle" {...attributes} {...listeners}>
        <Text span size="xs" fw={600} c="dimmed">
          Frame {index + 1}
        </Text>
        <Badge
          className="frame-badge"
          style={{ textTransform: "none", fontVariantNumeric: "tabular-nums" }}
        >
          {frame.w}×{frame.h}
        </Badge>
      </div>

      {/* Ruled canvas with objects */}
      <RuledCanvas
        frame={frame}
        onCanvasClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-obj-id]")) return;
          setActiveFrame(index);
          setSelectedObject(null);
        }}
      >
        {/* Per-frame background color or gradient */}
        {(frame.bgColor || frame.bgGradient) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: frame.bgGradient
                ? `linear-gradient(${frame.bgGradient.angle}deg, ${frame.bgGradient.stops[0]}, ${frame.bgGradient.stops[1]})`
                : frame.bgColor,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Global background */}
        {quizData.bg && (
          <img
            src={quizData.bg}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
            }}
            alt=""
          />
        )}

        {/* Frame base image */}
        {frame.src ? (
          <img
            src={frame.src}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
            alt=""
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{ color: "#334155", fontSize: 11, textAlign: "center" }}
            >
              Empty
              <br />
              frame
            </span>
          </div>
        )}

        {/* Overlay objects */}
        {frame.objects.map((obj) => (
          <FrameObjectEl key={obj.id} obj={obj} frameIndex={index} />
        ))}

        {/* Smart alignment guide lines — updated via DOM events, no React state */}
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
      </RuledCanvas>

      {/* SE resize grip */}
      <div
        className="frame-resize-grip"
        title="Drag to resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          startFrameResize(e, index);
        }}
      />

      {/* Delete button */}
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
    </div>
  );
}
