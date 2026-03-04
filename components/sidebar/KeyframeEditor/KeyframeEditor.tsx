/**
 * KeyframeEditor — horizontal strip for authoring CustomAnim keyframe stops.
 *
 * Features:
 *  - Horizontal 0%–100% track with diamond markers at each stop
 *  - Drag diamonds to reposition offsets
 *  - Click to select a stop → edit its CSS properties below
 *  - Add / remove stops via buttons
 *  - Easing per stop (optional: inherits from overall easing)
 */

"use client";

import {
  useState,
  useRef,
  useCallback,
  useMemo,
  type PointerEvent,
} from "react";
import {
  Stack,
  Text,
  Group,
  NumberInput,
  Select,
  Box,
  Tooltip,
} from "@mantine/core";
import type { KeyframeStop, CustomAnim } from "@src/lib/types";

import { Diamond } from "./Diamond";
import { StopEditor } from "./StopEditor";

interface Props {
  anim: CustomAnim;
  onChange: (anim: CustomAnim) => void;
}

export function KeyframeEditor({ anim, onChange }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () =>
      anim.stops
        .map((stop, i) => ({ ...stop, _originalIdx: i }))
        .sort((a, b) => a.offset - b.offset),
    [anim.stops],
  );

  const pointerToOffset = useCallback((clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const onDiamondPointerDown = (idx: number) => (e: PointerEvent) => {
    const stop = anim.stops[idx];
    if (stop.offset === 0 || stop.offset === 1) return;
    e.preventDefault();
    e.stopPropagation();
    setDragIdx(idx);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onTrackPointerMove = useCallback(
    (e: PointerEvent) => {
      if (dragIdx === null) return;
      const offset = pointerToOffset(e.clientX);
      const newStops = [...anim.stops];
      newStops[dragIdx] = { ...newStops[dragIdx], offset: +offset.toFixed(3) };
      onChange({ ...anim, stops: newStops });
    },
    [dragIdx, anim, onChange, pointerToOffset],
  );

  const onTrackPointerUp = useCallback(() => setDragIdx(null), []);

  const onTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragIdx !== null) return;
      const offset = pointerToOffset(e.clientX);
      const tooClose = anim.stops.some(
        (s) => Math.abs(s.offset - offset) < 0.02,
      );
      if (tooClose) return;

      const stopsSorted = [...anim.stops].sort((a, b) => a.offset - b.offset);
      let beforeStop = stopsSorted[0];
      for (const s of stopsSorted) {
        if (s.offset <= offset) beforeStop = s;
      }

      const newStop: KeyframeStop = {
        offset: +offset.toFixed(3),
        props: { ...beforeStop.props },
      };

      const newStops = [...anim.stops, newStop];
      const newIdx = newStops.length - 1;
      onChange({ ...anim, stops: newStops });
      setSelectedIdx(newIdx);
    },
    [anim, onChange, dragIdx, pointerToOffset],
  );

  const updateStop = useCallback(
    (idx: number, updated: KeyframeStop) => {
      const newStops = [...anim.stops];
      newStops[idx] = updated;
      onChange({ ...anim, stops: newStops });
    },
    [anim, onChange],
  );

  const deleteStop = useCallback(
    (idx: number) => {
      if (anim.stops.length <= 2) return;
      const newStops = anim.stops.filter((_, i) => i !== idx);
      onChange({ ...anim, stops: newStops });
      setSelectedIdx(null);
    },
    [anim, onChange],
  );

  const selectedStop = selectedIdx !== null ? anim.stops[selectedIdx] : null;
  const canDeleteSelected = selectedStop
    ? selectedStop.offset !== 0 &&
      selectedStop.offset !== 1 &&
      anim.stops.length > 2
    : false;

  return (
    <Stack gap={6}>
      <Group justify="space-between">
        <Text size="xs" c="dimmed" fw={600}>
          Keyframes
        </Text>
        <Text size="xs" c="dimmed">
          {anim.stops.length} stops
        </Text>
      </Group>

      {/* Timeline strip */}
      <Tooltip label="Click track to add keyframe" position="top" withArrow>
        <Box
          ref={trackRef}
          onClick={onTrackClick}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerUp}
          onPointerLeave={onTrackPointerUp}
          style={{
            position: "relative",
            height: 32,
            background:
              "linear-gradient(90deg, #1a1b1e 0%, #2c2e33 50%, #1a1b1e 100%)",
            borderRadius: 6,
            border: "1px solid #373a40",
            cursor: dragIdx !== null ? "grabbing" : "crosshair",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          {/* Track line */}
          <div
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              top: "50%",
              height: 2,
              background: "#4dabf7",
              transform: "translateY(-50%)",
              opacity: 0.4,
              borderRadius: 1,
            }}
          />

          {/* Percentage markers */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <Text
              key={pct}
              size="xs"
              c="dimmed"
              style={{
                position: "absolute",
                left: `${pct}%`,
                bottom: 1,
                transform: "translateX(-50%)",
                fontSize: 8,
                opacity: 0.5,
                pointerEvents: "none",
              }}
            >
              {pct}
            </Text>
          ))}

          {/* Diamond markers */}
          {sorted.map((stop) => {
            const originalIdx = stop._originalIdx;
            return (
              <Diamond
                key={originalIdx}
                x={stop.offset}
                selected={selectedIdx === originalIdx}
                isEndpoint={stop.offset === 0 || stop.offset === 1}
                onPointerDown={onDiamondPointerDown(originalIdx)}
                onClick={() => setSelectedIdx(originalIdx)}
              />
            );
          })}
        </Box>
      </Tooltip>

      {/* Duration & Delay */}
      <Group gap={4}>
        <NumberInput
          size="xs"
          label="Duration (ms)"
          value={anim.dur}
          min={50}
          step={50}
          onChange={(v) =>
            onChange({ ...anim, dur: typeof v === "number" ? v : 400 })
          }
          style={{ flex: 1 }}
        />
        <NumberInput
          size="xs"
          label="Delay (ms)"
          value={anim.delay ?? 0}
          min={0}
          step={50}
          onChange={(v) =>
            onChange({ ...anim, delay: typeof v === "number" ? v : 0 })
          }
          style={{ flex: 1 }}
        />
      </Group>

      {/* Iteration & Direction */}
      <Group gap={4}>
        <NumberInput
          size="xs"
          label="Repeat"
          description="0 = infinite"
          value={
            anim.iterationCount === "infinite" ? 0 : (anim.iterationCount ?? 1)
          }
          min={0}
          onChange={(v) => {
            const n = typeof v === "number" ? v : 1;
            onChange({ ...anim, iterationCount: n === 0 ? "infinite" : n });
          }}
          style={{ flex: 1 }}
        />
        <Select
          size="xs"
          label="Direction"
          data={[
            { value: "normal", label: "Normal" },
            { value: "reverse", label: "Reverse" },
            { value: "alternate", label: "Alternate" },
            { value: "alternate-reverse", label: "Alt-Reverse" },
          ]}
          value={anim.direction ?? "normal"}
          onChange={(v) =>
            onChange({
              ...anim,
              direction: (v as CustomAnim["direction"]) ?? "normal",
            })
          }
          style={{ flex: 1 }}
        />
      </Group>

      {/* Selected stop editor */}
      {selectedStop && selectedIdx !== null && (
        <StopEditor
          stop={selectedStop}
          onUpdateStop={(updated) => updateStop(selectedIdx, updated)}
          onDeleteStop={() => deleteStop(selectedIdx)}
          canDelete={canDeleteSelected}
        />
      )}
    </Stack>
  );
}
