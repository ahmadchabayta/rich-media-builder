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
          size="xs"
          data={data}
          value={cfg.type || "none"}
          onChange={(val) => onChange({ ...cfg, type: val ?? "none" })}
        />
        <NumberInput
          size="xs"
          placeholder="ms"
          value={cfg.dur ?? 400}
          min={0}
          onChange={(val) => onChange({ ...cfg, dur: n(val) })}
        />
      </SimpleGrid>
      <NumberInput
        size="xs"
        placeholder="Delay ms"
        value={cfg.delay ?? 0}
        min={0}
        onChange={(val) => onChange({ ...cfg, delay: n(val) })}
      />
      {isActive && (
        <>
          <SimpleGrid cols={2} spacing={4} style={{ alignItems: "flex-end" }}>
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                Repeat
              </Text>
              <Text
                size="xs"
                c="dimmed"
                fs="italic"
                style={{ lineHeight: 1, marginBottom: 2 }}
              >
                0 = infinite
              </Text>
              <NumberInput
                value={
                  cfg.iterationCount === "infinite"
                    ? 0
                    : (cfg.iterationCount ?? 1)
                }
                min={0}
                onChange={(val) => {
                  const v = n(val);
                  onChange({
                    ...cfg,
                    iterationCount: v === 0 ? "infinite" : v,
                  });
                }}
                size="xs"
              />
            </Stack>
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
          <Select
            label="Fill Mode"
            data={[
              { value: "none", label: "None" },
              { value: "forwards", label: "Forwards" },
              { value: "backwards", label: "Backwards" },
              { value: "both", label: "Both" },
            ]}
            value={cfg.fillMode ?? "both"}
            onChange={(val) =>
              onChange({
                ...cfg,
                fillMode: (val as AnimConfig["fillMode"]) ?? "both",
              })
            }
            size="xs"
          />
        </>
      )}
    </Stack>
  );
}
