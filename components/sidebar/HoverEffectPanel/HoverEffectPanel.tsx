import { Stack, Text, Select } from "@mantine/core";
import { HOVER_PRESETS } from "@src/lib/animPresets";
import type { HoverEffect } from "@src/lib/types";

interface Props {
  value: HoverEffect | undefined;
  onChange: (effect: HoverEffect | undefined) => void;
}

export function HoverEffectPanel({ value, onChange }: Props) {
  const data = HOVER_PRESETS.map((p) => ({ value: p.v, label: p.l }));
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={600}>
        Hover Effect
      </Text>
      <Select
        data={data}
        value={value?.type ?? "none"}
        onChange={(val) => {
          const t = val ?? "none";
          if (t === "none") {
            onChange(undefined);
          } else {
            onChange({ type: t });
          }
        }}
      />
    </Stack>
  );
}
