import { Stack, Text, Select, NumberInput, SimpleGrid } from "@mantine/core";
import { ANIM_LOOP } from "@src/lib/animPresets";
import type { LoopAnimConfig } from "@src/lib/types";
import { n } from "../utils";

interface Props {
  value: LoopAnimConfig | undefined;
  onChange: (cfg: LoopAnimConfig | undefined) => void;
}

export function LoopAnimPanel({ value, onChange }: Props) {
  const cfg: LoopAnimConfig = value ?? { type: "none", dur: 1000, delay: 0 };
  const data = ANIM_LOOP.map((p) => ({ value: p.v, label: p.l }));
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={600}>
        Decoration / Loop
      </Text>
      <SimpleGrid cols={2} spacing={4}>
        <Select
          data={data}
          value={cfg.type || "none"}
          onChange={(val) => {
            const t = val ?? "none";
            if (t === "none") {
              onChange(undefined);
            } else {
              onChange({ ...cfg, type: t });
            }
          }}
        />
        <NumberInput
          placeholder="ms"
          value={cfg.dur ?? 1000}
          min={100}
          step={100}
          onChange={(val) => onChange({ ...cfg, dur: n(val, 1000) })}
        />
      </SimpleGrid>
      {cfg.type && cfg.type !== "none" && (
        <NumberInput
          placeholder="Delay ms"
          value={cfg.delay ?? 0}
          min={0}
          onChange={(val) => onChange({ ...cfg, delay: n(val) })}
        />
      )}
    </Stack>
  );
}

