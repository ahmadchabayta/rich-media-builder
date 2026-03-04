/**
 * EasingPicker.tsx
 * ────────────────
 * A visual cubic-bezier easing curve editor with preset buttons.
 *
 * The user drags two control points on a normalised [0,1] graph.
 * Preset buttons: linear, ease, ease-in, ease-out, ease-in-out.
 * Returns the easing value as a CSS string.
 */

"use client";

import {
  useState,
  useRef,
  useCallback,
  type PointerEvent,
  useEffect,
} from "react";
import { Stack, Text, Group, Button, TextInput } from "@mantine/core";

// ── Preset curves (P1x, P1y, P2x, P2y) ─────────────────────────────────────

const EASING_PRESETS: {
  label: string;
  value: [number, number, number, number];
}[] = [
  { label: "Linear", value: [0, 0, 1, 1] },
  { label: "Ease", value: [0.25, 0.1, 0.25, 1] },
  { label: "Ease-In", value: [0.42, 0, 1, 1] },
  { label: "Ease-Out", value: [0, 0, 0.58, 1] },
  { label: "Ease-In-Out", value: [0.42, 0, 0.58, 1] },
  { label: "Snap", value: [0.2, 0.8, 0.2, 1] },
];

// ── Parse CSS easing → 4 control values ─────────────────────────────────────

function parseEasing(easing: string): [number, number, number, number] {
  const named: Record<string, [number, number, number, number]> = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
  };
  const lower = easing.trim().toLowerCase();
  if (named[lower]) return named[lower];

  const m = lower.match(
    /cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/,
  );
  if (m) return [+m[1], +m[2], +m[3], +m[4]];

  return [0.25, 0.1, 0.25, 1]; // fallback: ease
}

function formatEasing(pts: [number, number, number, number]): string {
  // Check if it matches a named preset exactly
  for (const p of EASING_PRESETS) {
    if (
      p.value[0] === pts[0] &&
      p.value[1] === pts[1] &&
      p.value[2] === pts[2] &&
      p.value[3] === pts[3]
    ) {
      return p.label.toLowerCase().replace(" ", "-");
    }
  }
  return `cubic-bezier(${pts.map((v) => +v.toFixed(3)).join(",")})`;
}

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  value: string; // e.g. "ease-out" or "cubic-bezier(0.2,0.8,0.2,1)"
  onChange: (easing: string) => void;
}

export function EasingPicker({ value, onChange }: Props) {
  const pts = parseEasing(value);
  const [p1x, setP1x] = useState(pts[0]);
  const [p1y, setP1y] = useState(pts[1]);
  const [p2x, setP2x] = useState(pts[2]);
  const [p2y, setP2y] = useState(pts[3]);
  const [dragging, setDragging] = useState<"p1" | "p2" | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Sync when external prop changes
  useEffect(() => {
    const np = parseEasing(value);
    if (np[0] !== p1x || np[1] !== p1y || np[2] !== p2x || np[3] !== p2y) {
      setP1x(np[0]);
      setP1y(np[1]);
      setP2x(np[2]);
      setP2y(np[3]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      onChange(formatEasing([x1, y1, x2, y2]));
    },
    [onChange],
  );

  // SVG viewport: 200×200, curve origin at (20, 170) → (180, 10)
  const W = 200;
  const H = 200;
  const PAD = 20;
  const graphW = W - PAD * 2;
  const graphH = H - PAD * 2;

  // Convert normalised [0,1] to SVG coords (y is flipped)
  const toSvgX = (v: number) => PAD + v * graphW;
  const toSvgY = (v: number) => PAD + (1 - v) * graphH;
  const fromSvgX = (px: number) =>
    Math.max(0, Math.min(1, (px - PAD) / graphW));
  const fromSvgY = (px: number) => {
    const v = 1 - (px - PAD) / graphH;
    return Math.max(-0.5, Math.min(1.5, v)); // allow slight overshoot
  };

  const onPointerDown = (point: "p1" | "p2") => (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(point);
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = fromSvgX(((e.clientX - rect.left) / rect.width) * W);
      const y = fromSvgY(((e.clientY - rect.top) / rect.height) * H);

      if (dragging === "p1") {
        setP1x(+x.toFixed(3));
        setP1y(+y.toFixed(3));
        emit(+x.toFixed(3), +y.toFixed(3), p2x, p2y);
      } else {
        setP2x(+x.toFixed(3));
        setP2y(+y.toFixed(3));
        emit(p1x, p1y, +x.toFixed(3), +y.toFixed(3));
      }
    },
    [dragging, emit, p1x, p1y, p2x, p2y], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onPointerUp = useCallback(() => setDragging(null), []);

  // Bezier path
  const sx = toSvgX(0),
    sy = toSvgY(0);
  const ex = toSvgX(1),
    ey = toSvgY(1);
  const c1x = toSvgX(p1x),
    c1y = toSvgY(p1y);
  const c2x = toSvgX(p2x),
    c2y = toSvgY(p2y);

  const easingStr = formatEasing([p1x, p1y, p2x, p2y]);

  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={600}>
        Easing
      </Text>

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{
          background: "#1a1b1e",
          borderRadius: 6,
          cursor: dragging ? "grabbing" : "default",
          userSelect: "none",
          touchAction: "none",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1={toSvgX(v)}
              y1={toSvgY(0)}
              x2={toSvgX(v)}
              y2={toSvgY(1)}
              stroke="#333"
              strokeWidth={0.5}
            />
            <line
              x1={toSvgX(0)}
              y1={toSvgY(v)}
              x2={toSvgX(1)}
              y2={toSvgY(v)}
              stroke="#333"
              strokeWidth={0.5}
            />
          </g>
        ))}

        {/* Diagonal reference (linear) */}
        <line
          x1={sx}
          y1={sy}
          x2={ex}
          y2={ey}
          stroke="#444"
          strokeWidth={0.8}
          strokeDasharray="4 2"
        />

        {/* Control lines */}
        <line
          x1={sx}
          y1={sy}
          x2={c1x}
          y2={c1y}
          stroke="#4dabf7"
          strokeWidth={1}
          opacity={0.6}
        />
        <line
          x1={ex}
          y1={ey}
          x2={c2x}
          y2={c2y}
          stroke="#f783ac"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* Bezier curve */}
        <path
          d={`M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`}
          fill="none"
          stroke="#ffd43b"
          strokeWidth={2.5}
        />

        {/* End points */}
        <circle cx={sx} cy={sy} r={3} fill="#666" />
        <circle cx={ex} cy={ey} r={3} fill="#666" />

        {/* Control point 1 */}
        <circle
          cx={c1x}
          cy={c1y}
          r={6}
          fill="#4dabf7"
          stroke="#fff"
          strokeWidth={1.5}
          style={{ cursor: "grab" }}
          onPointerDown={onPointerDown("p1")}
        />

        {/* Control point 2 */}
        <circle
          cx={c2x}
          cy={c2y}
          r={6}
          fill="#f783ac"
          stroke="#fff"
          strokeWidth={1.5}
          style={{ cursor: "grab" }}
          onPointerDown={onPointerDown("p2")}
        />
      </svg>

      {/* Preset buttons */}
      <Group gap={4} wrap="wrap">
        {EASING_PRESETS.map((p) => (
          <Button
            key={p.label}
            size="compact-xs"
            variant={easingStr === formatEasing(p.value) ? "filled" : "default"}
            color="yellow"
            onClick={() => {
              setP1x(p.value[0]);
              setP1y(p.value[1]);
              setP2x(p.value[2]);
              setP2y(p.value[3]);
              onChange(formatEasing(p.value));
            }}
            style={{ fontSize: 10, padding: "2px 6px" }}
          >
            {p.label}
          </Button>
        ))}
      </Group>

      {/* Raw value */}
      <TextInput
        size="xs"
        value={easingStr}
        onChange={(e) => {
          const parsed = parseEasing(e.currentTarget.value);
          setP1x(parsed[0]);
          setP1y(parsed[1]);
          setP2x(parsed[2]);
          setP2y(parsed[3]);
          onChange(formatEasing(parsed));
        }}
        styles={{ input: { fontFamily: "monospace", fontSize: 11 } }}
      />
    </Stack>
  );
}
