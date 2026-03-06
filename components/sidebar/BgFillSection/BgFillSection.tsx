import { useState, useEffect } from "react";
import {
  Stack,
  Text,
  SegmentedControl,
  ColorInput,
  SimpleGrid,
  NumberInput,
  Box,
} from "@mantine/core";
import { useQuizStore } from "@src/store/quizStore";

type BgMode = "none" | "solid" | "gradient";

export function BgFillSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const store = useQuizStore();
  const { currentPreviewIndex } = store;
  const frame = store.getActiveFrame();

  // Derive mode from store data — no local state, so SSR and client always match.
  const mode: BgMode = frame?.bgGradient
    ? "gradient"
    : frame?.bgColor
      ? "solid"
      : "none";

  // Not mounted yet: return null so server and initial client render are identical.
  // (Zustand rehydrates from localStorage only on the client, which would cause
  // a tree-structure mismatch if we rendered content before hydration is done.)
  if (!mounted || !frame) return null;

  const updateFrame = (patch: Parameters<typeof store.updateFrameField>[1]) =>
    store.updateFrameField(currentPreviewIndex, patch);

  const handleSolidChange = (color: string) => {
    updateFrame({ bgColor: color, bgGradient: null });
  };

  const handleGradientChange = (
    key: "angle" | "stop0" | "stop1",
    value: string | number,
  ) => {
    const current = frame.bgGradient ?? {
      angle: 135,
      stops: ["#1e293b", "#0f172a"] as [string, string],
    };
    if (key === "angle") {
      updateFrame({ bgGradient: { ...current, angle: Number(value) } });
    } else if (key === "stop0") {
      updateFrame({
        bgGradient: { ...current, stops: [String(value), current.stops[1]] },
      });
    } else {
      updateFrame({
        bgGradient: { ...current, stops: [current.stops[0], String(value)] },
      });
    }
  };

  const handleModeChange = (m: string) => {
    const next = m as BgMode;
    if (next === "none") updateFrame({ bgColor: undefined, bgGradient: null });
    if (next === "solid")
      updateFrame({ bgColor: frame.bgColor ?? "#1e293b", bgGradient: null });
    if (next === "gradient") {
      updateFrame({
        bgColor: undefined,
        bgGradient: { angle: 135, stops: ["#1e3a8a", "#0f172a"] },
      });
    }
  };

  const gradient = frame.bgGradient ?? {
    angle: 135,
    stops: ["#1e3a8a", "#0f172a"] as [string, string],
  };

  return (
    <Stack gap="xs">
      <Text
        size="xs"
        fw={700}
        tt="uppercase"
        c="dimmed"
        style={{ letterSpacing: "0.08em" }}
      >
        Frame Background
      </Text>

      <SegmentedControl
        size="xs"
        fullWidth
        value={mode}
        onChange={handleModeChange}
        data={[
          { value: "none", label: "None" },
          { value: "solid", label: "Solid" },
          { value: "gradient", label: "Gradient" },
        ]}
      />

      {mode === "solid" && (
        <ColorInput
          label="Background color"
          value={frame.bgColor ?? "#1e293b"}
          onChange={handleSolidChange}
          format="rgba"
          swatches={[
            "#0f172a",
            "#1e293b",
            "#334155",
            "#1e3a8a",
            "#1d4ed8",
            "#2563eb",
            "#7e22ce",
            "#9333ea",
            "#000000",
            "#ffffff",
          ]}
        />
      )}

      {mode === "gradient" && (
        <Stack gap="xs">
          <SimpleGrid cols={2} spacing="xs">
            <ColorInput
              label="Color 1"
              value={gradient.stops[0]}
              onChange={(v) => handleGradientChange("stop0", v)}
              format="hex"
            />
            <ColorInput
              label="Color 2"
              value={gradient.stops[1]}
              onChange={(v) => handleGradientChange("stop1", v)}
              format="hex"
            />
          </SimpleGrid>
          <NumberInput
            label="Angle (°)"
            value={gradient.angle}
            min={0}
            max={360}
            step={15}
            onChange={(v) => handleGradientChange("angle", Number(v))}
          />
          {/* Preview swatch */}
          <Box
            style={{
              height: 28,
              borderRadius: "var(--mantine-radius-sm)",
              background: `linear-gradient(${gradient.angle}deg, ${gradient.stops[0]}, ${gradient.stops[1]})`,
              border: "1px solid var(--mantine-color-dark-4)",
            }}
          />
        </Stack>
      )}
    </Stack>
  );
}
