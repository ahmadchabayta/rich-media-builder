import {
  Stack,
  NumberInput,
  ColorInput,
  Select,
  SimpleGrid,
} from "@mantine/core";
import type { DividerObject } from "@src/lib/types";
import { n } from "../utils";

interface Props {
  obj: DividerObject;
  updateObj: (patch: Partial<DividerObject>) => void;
}

export function DividerObjectFields({ obj, updateObj }: Props) {
  return (
    <Stack gap="xs">
      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Width"
          size="xs"
          value={obj.w ?? 200}
          min={10}
          onChange={(v) => updateObj({ w: n(v, 10) })}
        />
        <NumberInput
          label="Thickness"
          size="xs"
          value={obj.thickness ?? 2}
          min={1}
          max={40}
          onChange={(v) => updateObj({ thickness: n(v, 1) })}
        />
      </SimpleGrid>

      <ColorInput
        label="Color"
        size="xs"
        value={obj.color ?? "#ffffff"}
        onChange={(v) => updateObj({ color: v })}
        format="rgba"
        swatches={[
          "#ffffff",
          "#000000",
          "#3b82f6",
          "#ef4444",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
        ]}
      />

      <Select
        label="Style"
        size="xs"
        data={[
          { value: "solid", label: "Solid" },
          { value: "dashed", label: "Dashed" },
          { value: "dotted", label: "Dotted" },
        ]}
        value={obj.lineStyle ?? "solid"}
        onChange={(v) =>
          updateObj({ lineStyle: (v as DividerObject["lineStyle"]) ?? "solid" })
        }
      />
    </Stack>
  );
}

