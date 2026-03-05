import {
  Stack,
  NumberInput,
  ColorInput,
  Select,
  SimpleGrid,
  Checkbox,
} from "@mantine/core";
import { useState } from "react";
import type { ShapeObject } from "@src/lib/types";
import { n } from "../utils";

interface Props {
  obj: ShapeObject;
  updateObj: (patch: Partial<ShapeObject>) => void;
}

export function ShapeObjectFields({ obj, updateObj }: Props) {
  const hasIndividual =
    obj.radiusTopLeft != null ||
    obj.radiusTopRight != null ||
    obj.radiusBottomRight != null ||
    obj.radiusBottomLeft != null;
  const [individual, setIndividual] = useState(hasIndividual);

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
        <>
          <Checkbox
            size="xs"
            checked={individual}
            onChange={(e) => {
              const on = e.currentTarget.checked;
              setIndividual(on);
              if (!on) {
                // Reset individual corners, keep uniform radius
                updateObj({
                  radiusTopLeft: undefined,
                  radiusTopRight: undefined,
                  radiusBottomRight: undefined,
                  radiusBottomLeft: undefined,
                });
              }
            }}
            label="Individual corners"
          />
          {individual ? (
            <SimpleGrid cols={2} spacing="xs">
              <NumberInput
                label="Top Left"
                size="xs"
                value={obj.radiusTopLeft ?? obj.radius ?? 0}
                min={0}
                max={200}
                onChange={(v) => updateObj({ radiusTopLeft: n(v, 0) })}
              />
              <NumberInput
                label="Top Right"
                size="xs"
                value={obj.radiusTopRight ?? obj.radius ?? 0}
                min={0}
                max={200}
                onChange={(v) => updateObj({ radiusTopRight: n(v, 0) })}
              />
              <NumberInput
                label="Bottom Left"
                size="xs"
                value={obj.radiusBottomLeft ?? obj.radius ?? 0}
                min={0}
                max={200}
                onChange={(v) => updateObj({ radiusBottomLeft: n(v, 0) })}
              />
              <NumberInput
                label="Bottom Right"
                size="xs"
                value={obj.radiusBottomRight ?? obj.radius ?? 0}
                min={0}
                max={200}
                onChange={(v) => updateObj({ radiusBottomRight: n(v, 0) })}
              />
            </SimpleGrid>
          ) : (
            <NumberInput
              label="Corner radius"
              size="xs"
              value={obj.radius ?? 0}
              min={0}
              max={200}
              onChange={(v) => updateObj({ radius: n(v, 0) })}
            />
          )}
        </>
      )}
    </Stack>
  );
}
