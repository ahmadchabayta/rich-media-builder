import { Stack, Text, Select, NumberInput, SimpleGrid } from "@mantine/core";
import { ANIM_IN, ANIM_OUT } from "@src/lib/animPresets";
import type { AnimConfig } from "@src/lib/types";
import { n } from "../utils";

interface Props {
  label: string;
  list: typeof ANIM_IN | typeof ANIM_OUT;
  value: AnimConfig | undefined;
  onChange: (cfg: AnimConfig) => void;
}

export function AnimPanel({ label, list, value, onChange }: Props) {
  const cfg: AnimConfig = value ?? { type: "none", dur: 400, delay: 0 };
  const data = list.map((p) => ({ value: p.v, label: p.l }));
  const isActive = cfg.type && cfg.type !== "none";
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={600}>
        {label}
      </Text>
      <SimpleGrid cols={2} spacing={4}>
        <Select
          data={data}
          value={cfg.type || "none"}
          onChange={(val) => onChange({ ...cfg, type: val ?? "none" })}
        />
        <NumberInput
          placeholder="ms"
          value={cfg.dur ?? 400}
          min={0}
          onChange={(val) => onChange({ ...cfg, dur: n(val) })}
        />
      </SimpleGrid>
      <NumberInput
        placeholder="Delay ms"
        value={cfg.delay ?? 0}
        min={0}
        onChange={(val) => onChange({ ...cfg, delay: n(val) })}
      />
      {isActive && (
        <SimpleGrid cols={2} spacing={4}>
          <NumberInput
            placeholder="Repeats"
            label="Repeat"
            value={
              cfg.iterationCount === "infinite" ? 0 : (cfg.iterationCount ?? 1)
            }
            min={0}
            onChange={(val) => {
              const v = n(val);
              onChange({ ...cfg, iterationCount: v === 0 ? "infinite" : v });
            }}
            description="0 = infinite"
            size="xs"
          />
          <Select
            label="Direction"
            data={[
              { value: "normal", label: "Normal" },
              { value: "reverse", label: "Reverse" },
              { value: "alternate", label: "Alternate" },
              { value: "alternate-reverse", label: "Alt-Reverse" },
            ]}
            value={cfg.direction ?? "normal"}
            onChange={(val) =>
              onChange({
                ...cfg,
                direction: (val as AnimConfig["direction"]) ?? "normal",
              })
            }
            size="xs"
          />
        </SimpleGrid>
      )}
    </Stack>
  );
}

