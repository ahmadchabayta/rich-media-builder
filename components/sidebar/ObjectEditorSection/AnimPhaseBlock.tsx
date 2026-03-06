import { useState } from "react";
import { Stack, Group, Text, SegmentedControl, Select } from "@mantine/core";
import { ANIM_IN, ANIM_OUT } from "@src/lib/animPresets";
import type { AnimConfig, LoopAnimConfig, CustomAnim } from "@src/lib/types";
import { AnimPanel } from "@src/components/sidebar/AnimPanel";
import { LoopAnimPanel } from "@src/components/sidebar/LoopAnimPanel";
import { EasingPicker } from "@src/components/sidebar/EasingPicker";
import { KeyframeEditor } from "@src/components/sidebar/KeyframeEditor";
import { presetToCustomAnim } from "@src/lib/presetLibrary";

export function AnimPhaseBlock({
  label,
  phase,
  presetList,
  presetValue,
  customValue,
  onPresetChange,
  onCustomChange,
}: {
  label: string;
  phase: "in" | "out" | "loop";
  presetList?: typeof ANIM_IN | typeof ANIM_OUT;
  presetValue?: AnimConfig | LoopAnimConfig;
  customValue?: CustomAnim;
  onPresetChange: (cfg: AnimConfig | LoopAnimConfig | undefined) => void;
  onCustomChange: (anim: CustomAnim | undefined) => void;
}) {
  const hasCustom = !!customValue?.stops?.length;
  const [mode, setMode] = useState<"preset" | "custom">(
    hasCustom ? "custom" : "preset",
  );
  const resolvedMode = hasCustom ? "custom" : mode;

  const handleModeChange = (val: string) => {
    const newMode = val as "preset" | "custom";
    setMode(newMode);
    if (newMode === "custom" && !customValue) {
      const presetType = (presetValue as AnimConfig | undefined)?.type;
      const dur = (presetValue as AnimConfig | undefined)?.dur ?? 400;
      const delay = (presetValue as AnimConfig | undefined)?.delay;
      const fromPreset = presetType
        ? presetToCustomAnim(presetType, dur, phase, delay)
        : null;
      if (fromPreset) {
        onCustomChange(fromPreset);
      } else {
        onCustomChange({
          name: `blsc_custom_${Date.now()}`,
          stops: [
            { offset: 0, props: { opacity: "0" } },
            { offset: 1, props: { opacity: "1" } },
          ],
          dur: 400,
          delay: 0,
          easing: "ease-out",
          iterationCount: phase === "loop" ? "infinite" : 1,
          direction: phase === "loop" ? "alternate" : "normal",
          fillMode: "both",
        });
      }
    } else if (newMode === "preset") {
      onCustomChange(undefined);
    }
  };

  return (
    <Stack gap={4}>
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed" fw={600}>
          {label}
        </Text>
        <SegmentedControl
          size="xs"
          data={[
            { value: "preset", label: "Preset" },
            { value: "custom", label: "Custom" },
          ]}
          value={resolvedMode}
          onChange={handleModeChange}
          styles={{
            root: { height: 22 },
            label: { fontSize: 10, padding: "0 6px" },
          }}
        />
      </Group>

      {resolvedMode === "preset" && presetList && phase !== "loop" && (
        <AnimPanel
          label=""
          list={presetList}
          value={presetValue as AnimConfig | undefined}
          onChange={(cfg) => onPresetChange(cfg)}
        />
      )}

      {resolvedMode === "preset" && phase === "loop" && (
        <LoopAnimPanel
          value={presetValue as LoopAnimConfig | undefined}
          onChange={(cfg) => onPresetChange(cfg)}
        />
      )}

      {resolvedMode === "custom" && customValue && (
        <Stack gap={6}>
          <EasingPicker
            value={customValue.easing ?? "ease"}
            onChange={(easing) => onCustomChange({ ...customValue, easing })}
          />
          <Select
            size="xs"
            label="Fill Mode"
            data={[
              { value: "none", label: "None" },
              { value: "forwards", label: "Forwards" },
              { value: "backwards", label: "Backwards" },
              { value: "both", label: "Both" },
            ]}
            value={customValue.fillMode ?? "both"}
            onChange={(v) =>
              onCustomChange({
                ...customValue,
                fillMode: (v ?? "both") as CustomAnim["fillMode"],
              })
            }
            allowDeselect={false}
          />
          <KeyframeEditor
            anim={customValue}
            onChange={(anim) => onCustomChange(anim)}
          />
        </Stack>
      )}
    </Stack>
  );
}
