import {
  Stack,
  NumberInput,
  ColorInput,
  Select,
  SimpleGrid,
} from "@mantine/core";
import type { ShapeObject } from "@src/lib/types";
import { n } from "./utils";

interface Props {
  obj: ShapeObject;
  updateObj: (patch: Partial<ShapeObject>) => void;
}

export function ShapeObjectFields({ obj, updateObj }: Props) {
  return (
    <Stack gap="xs">
      <Select
        label="Shape"
        size="xs"
        data={[
          { value: "rect", label: "Rectangle" },
          { value: "circle", label: "Circle / Ellipse" },
        ]}
        value={obj.shape}
        onChange={(v) =>
          updateObj({ shape: (v as ShapeObject["shape"]) ?? "rect" })
        }
      />

      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Width"
          size="xs"
          value={obj.w ?? 80}
          min={1}
          onChange={(v) => updateObj({ w: n(v, 1) })}
        />
        <NumberInput
          label="Height"
          size="xs"
          value={obj.h ?? 80}
          min={1}
          onChange={(v) => updateObj({ h: n(v, 1) })}
        />
      </SimpleGrid>

      <ColorInput
        label="Fill"
        size="xs"
        value={obj.fill ?? "#3b82f6"}
        onChange={(v) => updateObj({ fill: v })}
        format="rgba"
        swatches={[
          "#3b82f6",
          "#ef4444",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
          "#ec4899",
          "#ffffff",
          "#000000",
          "transparent",
        ]}
      />

      <SimpleGrid cols={2} spacing="xs">
        <ColorInput
          label="Stroke"
          size="xs"
          value={obj.stroke ?? ""}
          placeholder="None"
          onChange={(v) => updateObj({ stroke: v || undefined })}
          format="hex"
        />
        <NumberInput
          label="Stroke W"
          size="xs"
          value={obj.strokeWidth ?? 2}
          min={0}
          max={20}
          onChange={(v) => updateObj({ strokeWidth: n(v, 0) })}
        />
      </SimpleGrid>

      {obj.shape === "rect" && (
        <NumberInput
          label="Corner radius"
          size="xs"
          value={obj.radius ?? 0}
          min={0}
          max={200}
          onChange={(v) => updateObj({ radius: n(v, 0) })}
        />
      )}
    </Stack>
  );
}
