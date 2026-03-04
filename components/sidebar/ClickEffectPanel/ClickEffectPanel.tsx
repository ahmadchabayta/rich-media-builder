import { Stack, Text, Select } from "@mantine/core";
import { CLICK_PRESETS } from "@src/lib/animPresets";
import type { ClickEffect } from "@src/lib/types";

interface Props {
  value: ClickEffect | undefined;
  onChange: (effect: ClickEffect | undefined) => void;
}

export function ClickEffectPanel({ value, onChange }: Props) {
  const data = CLICK_PRESETS.map((p) => ({ value: p.v, label: p.l }));
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={600}>
        Click / Active Effect
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
