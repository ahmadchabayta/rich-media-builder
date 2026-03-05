"use client";
/**
 * PenCanvas – Overlay rendered inside a FrameCard when penMode is active.
 * Lets the user click to add anchor points and creates a PathObject when
 * they press Enter or double-click the last point.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import type { PathObject } from "@src/lib/types";
import { makeId } from "@src/store/quizStore";

interface Point {
  x: number;
  y: number;
}

interface Props {
  frameW: number;
  frameH: number;
  onCommit: (path: PathObject) => void;
  onCancel: () => void;
}

function pointsToD(points: Point[], closed: boolean): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const parts = [`M ${first.x} ${first.y}`];
  for (const p of rest) {
    parts.push(`L ${p.x} ${p.y}`);
  }
  if (closed) parts.push("Z");
  return parts.join(" ");
}

function getBBox(points: Point[]): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  if (points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    w: Math.max(1, Math.max(...xs) - minX),
    h: Math.max(1, Math.max(...ys) - minY),
  };
}

export function PenCanvas({ frameW, frameH, onCommit, onCancel }: Props) {
  const [points, setPoints] = useState<Point[]>([]);
  const [cursor, setCursor] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const getPoint = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): Point => {
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      // getBoundingClientRect() returns scaled (screen-pixel) dimensions;
      // frameW/H are the logical CSS dimensions — dividing corrects for zoom.
      const scaleX = rect.width / (frameW || 1);
      const scaleY = rect.height / (frameH || 1);
      return {
        x: Math.round((e.clientX - rect.left) / scaleX),
        y: Math.round((e.clientY - rect.top) / scaleY),
      };
    },
    [frameW, frameH],
  );

  const CLOSE_RADIUS = 12; // px – clicking within this of the first point closes the path

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    const pt = getPoint(e);
    // Double-click: commit open path
    if (e.detail === 2 && points.length >= 2) {
      commitPath(points, false);
      return;
    }
    // Proximity close: clicking near first point closes the shape
    if (points.length >= 2) {
      const first = points[0];
      const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
      if (dist <= CLOSE_RADIUS) {
        commitPath(points, true);
        return;
      }
    }
    // Single click: add point
    setPoints((prev) => [...prev, pt]);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    setCursor(getPoint(e));
  };

  const commitPath = useCallback(
    (pts: Point[], closed: boolean) => {
      if (pts.length < 2) {
        onCancel();
        return;
      }
      const bbox = getBBox(pts);
      // Translate every point to bbox-relative coords so the SVG's internal
      // path data starts at (0,0). The object's x/y fields carry the frame
      // offset, so dragging only needs to update x/y — not rewrite `d`.
      const relPts = pts.map((p) => ({ x: p.x - bbox.x, y: p.y - bbox.y }));
      const obj: PathObject = {
        id: makeId(),
        type: "path",
        label: "Path",
        d: pointsToD(relPts, closed),
        x: bbox.x,
        y: bbox.y,
        w: bbox.w,
        h: bbox.h,
        stroke: "#ffffff",
        strokeWidth: 2,
        fill: closed ? "rgba(59,130,246,0.3)" : "none",
        closed,
      };
      onCommit(obj);
    },
    [onCommit, onCancel],
  );

  // Keyboard: Enter = commit open, Escape = cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        commitPath(points, false);
      } else if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "c" || e.key === "C") {
        // c = close path
        commitPath(points, true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [points, commitPath, onCancel]);

  // Preview line from last point to cursor
  const previewD =
    points.length > 0 && cursor
      ? `M ${points[points.length - 1].x} ${points[points.length - 1].y} L ${cursor.x} ${cursor.y}`
      : "";

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        inset: 0,
        width: frameW,
        height: frameH,
        zIndex: 100,
        cursor: "crosshair",
        pointerEvents: "all",
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      {/* Already drawn segments */}
      {points.length >= 2 && (
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          stroke="#38bdf8"
          strokeWidth={2}
          fill="none"
          strokeDasharray="none"
        />
      )}

      {/* Preview segment to cursor */}
      {previewD && (
        <path
          d={previewD}
          stroke="#38bdf8"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          fill="none"
          pointerEvents="none"
        />
      )}

      {/* Anchor dots */}
      {points.map((p, i) => {
        const isFirst = i === 0;
        const nearFirst =
          isFirst &&
          points.length >= 2 &&
          cursor != null &&
          Math.hypot(cursor.x - p.x, cursor.y - p.y) <= CLOSE_RADIUS;
        return (
          <g key={i} pointerEvents="none">
            {/* Larger transparent hit-zone on first dot to show close hint */}
            {isFirst && points.length >= 2 && (
              <circle
                cx={p.x}
                cy={p.y}
                r={CLOSE_RADIUS}
                fill="rgba(245,158,11,0.15)"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={isFirst ? 6 : 4}
              fill={isFirst ? (nearFirst ? "#f59e0b" : "#f59e0b") : "#38bdf8"}
              stroke={nearFirst ? "#fff" : "#fff"}
              strokeWidth={nearFirst ? 2 : 1}
            />
          </g>
        );
      })}

      {/* Instruction text */}
      <text
        x={8}
        y={frameH - 10}
        style={{
          fontSize: 11,
          fill: "rgba(255,255,255,0.7)",
          pointerEvents: "none",
        }}
      >
        Click to add points · Enter to finish · C to close · Esc to cancel
      </text>
    </svg>
  );
}
