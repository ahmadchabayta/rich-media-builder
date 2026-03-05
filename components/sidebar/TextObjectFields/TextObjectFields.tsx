import {
  Stack,
  Text,
  NumberInput,
  Checkbox,
  SimpleGrid,
  SegmentedControl,
} from "@mantine/core";
import type { TextObject, FrameObject } from "@src/lib/types";
import { n } from "../utils";

interface Props {
  obj: TextObject;
  updateObj: (patch: Partial<FrameObject>) => void;
}

export function TextObjectFields({ obj, updateObj }: Props) {
  return (
    <Stack gap="xs">
      {/* Bg options */}
      <SimpleGrid cols={2} spacing="xs">
        <Checkbox
          size="xs"
          checked={!!obj.bgEnabled}
          onChange={(e) => updateObj({ bgEnabled: e.currentTarget.checked })}
          label="Enable bg fill"
        />
        <NumberInput
          label="Corner radius"
          placeholder="px"
          min={0}
          value={obj.radius ?? 8}
          onChange={(val) => updateObj({ radius: Math.max(0, n(val)) })}
        />
      </SimpleGrid>

      {/* Padding */}
      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Pad X"
          placeholder="px"
          value={obj.paddingX ?? 0}
          min={0}
          onChange={(val) =>
            updateObj({
              paddingX: Math.max(0, n(val as number | string)),
            } as Partial<FrameObject>)
          }
        />
        <NumberInput
          label="Pad Y"
          placeholder="px"
          value={obj.paddingY ?? 0}
          min={0}
          onChange={(val) =>
            updateObj({
              paddingY: Math.max(0, n(val as number | string)),
            } as Partial<FrameObject>)
          }
        />
      </SimpleGrid>

      {/* Text direction */}
      <SegmentedControl
        size="xs"
        fullWidth
        value={obj.direction ?? "ltr"}
        onChange={(v) => updateObj({ direction: v as "ltr" | "rtl" })}
        data={[
          { value: "ltr", label: "LTR" },
          { value: "rtl", label: "RTL" },
        ]}
      />

      {/* Text content */}
      <Text size="xs" c="dimmed" fw={600}>
        Text content
      </Text>
      <textarea
        rows={4}
        style={{
          background: "var(--mantine-color-dark-6)",
          border: "1px solid var(--mantine-color-dark-4)",
          borderRadius: "var(--mantine-radius-sm)",
          padding: "6px 10px",
          color: "inherit",
          fontSize: "var(--mantine-font-size-xs)",
          width: "100%",
          resize: "vertical",
          lineHeight: 1.5,
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
        placeholder="Object text"
        value={obj.text || ""}
        onChange={(e) => updateObj({ text: e.target.value })}
      />
    </Stack>
  );
}
