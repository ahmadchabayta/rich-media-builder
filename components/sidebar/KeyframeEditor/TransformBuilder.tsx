"use client";
import { useState, useEffect } from "react";
import {
  NumberInput,
  Select,
  Text,
  Stack,
  Group,
  Anchor,
  TextInput,
} from "@mantine/core";

// ── Parser ────────────────────────────────────────────────────────────────────

interface Parsed {
  tx: number;
  txUnit: "%" | "px";
  ty: number;
  tyUnit: "%" | "px";
  scale: number;
  rotate: number;
  advanced: boolean; // true when string has something we can't model
}

function parseValue(raw: string): Parsed {
  const base: Parsed = {
    tx: 0,
    txUnit: "%",
    ty: 0,
    tyUnit: "%",
    scale: 1,
    rotate: 0,
    advanced: false,
  };
  if (!raw || raw.trim() === "" || raw.trim() === "none") return base;

  let work = raw.trim();
  let tx = 0,
    txUnit: "%" | "px" = "%";
  let ty = 0,
    tyUnit: "%" | "px" = "%";
  let scale = 1;
  let rotate = 0;

  // Helper: extract a single number+unit from "10%" or "10px" or "10"
  const numUnit = (s: string): [number, "%" | "px"] => {
    const m = s.trim().match(/^(-?[\d.]+)(%|px)?$/);
    if (!m) return [parseFloat(s) || 0, "%"];
    return [parseFloat(m[1]), m[2] === "px" ? "px" : "%"];
  };

  // Strip known functions one by one
  work = work.replace(
    /translate\(\s*(-?[\d.]+%?p?x?)\s*,\s*(-?[\d.]+%?p?x?)\s*\)/g,
    (_, a, b) => {
      [tx, txUnit] = numUnit(a);
      [ty, tyUnit] = numUnit(b);
      return "";
    },
  );
  work = work.replace(/translateX\(\s*(-?[\d.]+(?:%|px)?)\s*\)/g, (_, a) => {
    [tx, txUnit] = numUnit(a);
    return "";
  });
  work = work.replace(/translateY\(\s*(-?[\d.]+(?:%|px)?)\s*\)/g, (_, a) => {
    [ty, tyUnit] = numUnit(a);
    return "";
  });
  work = work.replace(/scale\(\s*(-?[\d.]+)\s*\)/g, (_, a) => {
    scale = parseFloat(a);
    return "";
  });
  work = work.replace(/rotate\(\s*(-?[\d.]+)deg\s*\)/g, (_, a) => {
    rotate = parseFloat(a);
    return "";
  });

  // If anything non-whitespace remains, it's advanced
  const remaining = work.replace(/\s+/g, "");
  // const advanced =
  //   remaining.length > 0 && consumed < /* tokens in original */ 4;

  return {
    tx,
    txUnit,
    ty,
    tyUnit,
    scale,
    rotate,
    advanced: remaining.length > 0,
  };
}

// ── Composer ──────────────────────────────────────────────────────────────────

function composeValue(
  tx: number,
  txUnit: "%" | "px",
  ty: number,
  tyUnit: "%" | "px",
  scale: number,
  rotate: number,
): string {
  const parts: string[] = [];
  if (tx !== 0) parts.push(`translateX(${tx}${txUnit})`);
  if (ty !== 0) parts.push(`translateY(${ty}${tyUnit})`);
  if (scale !== 1) parts.push(`scale(${scale})`);
  if (rotate !== 0) parts.push(`rotate(${rotate}deg)`);
  return parts.join(" ") || "none";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (css: string) => void;
}

export function TransformBuilder({ value, onChange }: Props) {
  const parsed = parseValue(value);
  const [showRaw, setShowRaw] = useState(parsed.advanced);

  // Sync showRaw if prop changes externally to something advanced
  useEffect(() => {
    if (parsed.advanced) {
      const timeout = setTimeout(() => setShowRaw(true), 100); // avoid setting state during render
      return () => clearTimeout(timeout);
    }
  }, [parsed.advanced]);

  if (showRaw) {
    return (
      <Stack gap={4}>
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Transform (CSS)
          </Text>
          <Anchor size="xs" c="blue.4" onClick={() => setShowRaw(false)}>
            Simple mode
          </Anchor>
        </Group>
        <TextInput
          size="xs"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          styles={{ input: { fontFamily: "monospace", fontSize: 11 } }}
        />
      </Stack>
    );
  }

  const emit = (
    tx: number,
    txU: "%" | "px",
    ty: number,
    tyU: "%" | "px",
    sc: number,
    rot: number,
  ) => onChange(composeValue(tx, txU, ty, tyU, sc, rot));

  return (
    <Stack gap={6}>
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          Transform
        </Text>
        <Anchor size="xs" c="dimmed" onClick={() => setShowRaw(true)}>
          Edit as CSS
        </Anchor>
      </Group>

      {/* Slide X */}
      <Group gap={4} align="flex-end" wrap="nowrap">
        <Text size="xs" style={{ width: 54, flexShrink: 0 }}>
          Slide X
        </Text>
        <NumberInput
          size="xs"
          value={parsed.tx}
          step={1}
          style={{ flex: 1 }}
          onChange={(v) =>
            emit(
              typeof v === "number" ? v : 0,
              parsed.txUnit,
              parsed.ty,
              parsed.tyUnit,
              parsed.scale,
              parsed.rotate,
            )
          }
        />
        <Select
          size="xs"
          style={{ width: 56 }}
          data={[
            { value: "%", label: "%" },
            { value: "px", label: "px" },
          ]}
          value={parsed.txUnit}
          onChange={(u) =>
            emit(
              parsed.tx,
              (u ?? "%") as "%" | "px",
              parsed.ty,
              parsed.tyUnit,
              parsed.scale,
              parsed.rotate,
            )
          }
          allowDeselect={false}
        />
      </Group>

      {/* Slide Y */}
      <Group gap={4} align="flex-end" wrap="nowrap">
        <Text size="xs" style={{ width: 54, flexShrink: 0 }}>
          Slide Y
        </Text>
        <NumberInput
          size="xs"
          value={parsed.ty}
          step={1}
          style={{ flex: 1 }}
          onChange={(v) =>
            emit(
              parsed.tx,
              parsed.txUnit,
              typeof v === "number" ? v : 0,
              parsed.tyUnit,
              parsed.scale,
              parsed.rotate,
            )
          }
        />
        <Select
          size="xs"
          style={{ width: 56 }}
          data={[
            { value: "%", label: "%" },
            { value: "px", label: "px" },
          ]}
          value={parsed.tyUnit}
          onChange={(u) =>
            emit(
              parsed.tx,
              parsed.txUnit,
              parsed.ty,
              (u ?? "%") as "%" | "px",
              parsed.scale,
              parsed.rotate,
            )
          }
          allowDeselect={false}
        />
      </Group>

      {/* Scale */}
      <Group gap={4} align="flex-end" wrap="nowrap">
        <Text size="xs" style={{ width: 54, flexShrink: 0 }}>
          Scale
        </Text>
        <NumberInput
          size="xs"
          value={parsed.scale}
          step={0.05}
          min={0}
          decimalScale={2}
          style={{ flex: 1 }}
          onChange={(v) =>
            emit(
              parsed.tx,
              parsed.txUnit,
              parsed.ty,
              parsed.tyUnit,
              typeof v === "number" ? v : 1,
              parsed.rotate,
            )
          }
        />
        <Text size="xs" c="dimmed" style={{ width: 56, textAlign: "center" }}>
          ×
        </Text>
      </Group>

      {/* Rotate */}
      <Group gap={4} align="flex-end" wrap="nowrap">
        <Text size="xs" style={{ width: 54, flexShrink: 0 }}>
          Rotate
        </Text>
        <NumberInput
          size="xs"
          value={parsed.rotate}
          step={1}
          style={{ flex: 1 }}
          onChange={(v) =>
            emit(
              parsed.tx,
              parsed.txUnit,
              parsed.ty,
              parsed.tyUnit,
              parsed.scale,
              typeof v === "number" ? v : 0,
            )
          }
        />
        <Text size="xs" c="dimmed" style={{ width: 56, textAlign: "center" }}>
          °
        </Text>
      </Group>
    </Stack>
  );
}
