import {
  Stack,
  Text,
  ColorInput,
  NumberInput,
  Checkbox,
  SimpleGrid,
  Select,
  Group,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
} from "@tabler/icons-react";
import { FONT_SELECT_DATA, ensureFont } from "@src/lib/fonts";
import type { TextObject, FrameObject } from "@src/lib/types";
import { n } from "./utils";

interface Props {
  obj: TextObject;
  updateObj: (patch: Partial<FrameObject>) => void;
}

export function TextObjectFields({ obj, updateObj }: Props) {
  const setFont = (family: string | null) => {
    if (family) ensureFont(family);
    updateObj({ fontFamily: family ?? undefined } as Partial<FrameObject>);
  };

  return (
    <Stack gap="xs">
      {/* Font family */}
      <Select
        label="Font family"
        data={FONT_SELECT_DATA}
        value={obj.fontFamily ?? ""}
        placeholder="Default"
        searchable
        clearable
        onChange={setFont}
        styles={{ input: { fontFamily: obj.fontFamily ?? "inherit" } }}
      />

      {/* Size + weight */}
      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Font size"
          value={obj.size ?? 22}
          min={8}
          onChange={(val) => updateObj({ size: Math.max(8, n(val, 8)) })}
        />
        <Select
          label="Weight"
          data={[
            { value: "400", label: "Regular" },
            { value: "600", label: "Semi-bold" },
            { value: "700", label: "Bold" },
            { value: "900", label: "Black" },
          ]}
          value={obj.fontWeight ?? "700"}
          onChange={(v) =>
            updateObj({ fontWeight: v ?? "700" } as Partial<FrameObject>)
          }
        />
      </SimpleGrid>

      {/* Color row */}
      <SimpleGrid cols={2} spacing="xs">
        <ColorInput
          label="Text color"
          value={obj.color || "#ffffff"}
          onChange={(val) => updateObj({ color: val })}
          format="rgba"
        />
        <ColorInput
          label="Bg color"
          value={obj.bgColor || "#000000"}
          onChange={(val) => updateObj({ bgColor: val })}
          format="rgba"
        />
      </SimpleGrid>

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

      {/* Style toggles */}
      <Stack gap={4}>
        <Text size="xs" c="dimmed" fw={600}>
          Style
        </Text>
        <Group gap={4}>
          <Tooltip label="Bold" withArrow>
            <ActionIcon
              size={28}
              variant={
                obj.fontWeight === "700" || obj.fontWeight === "900"
                  ? "filled"
                  : "default"
              }
              onClick={() =>
                updateObj({
                  fontWeight: obj.fontWeight === "700" ? "400" : "700",
                } as Partial<FrameObject>)
              }
            >
              <IconBold size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Italic" withArrow>
            <ActionIcon
              size={28}
              variant={obj.italic ? "filled" : "default"}
              onClick={() =>
                updateObj({ italic: !obj.italic } as Partial<FrameObject>)
              }
            >
              <IconItalic size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Underline" withArrow>
            <ActionIcon
              size={28}
              variant={obj.underline ? "filled" : "default"}
              onClick={() =>
                updateObj({ underline: !obj.underline } as Partial<FrameObject>)
              }
            >
              <IconUnderline size={14} />
            </ActionIcon>
          </Tooltip>
          <ActionIcon
            size={28}
            variant={
              !obj.textAlign || obj.textAlign === "left" ? "filled" : "default"
            }
            onClick={() =>
              updateObj({ textAlign: "left" } as Partial<FrameObject>)
            }
          >
            <IconAlignLeft size={14} />
          </ActionIcon>
          <ActionIcon
            size={28}
            variant={obj.textAlign === "center" ? "filled" : "default"}
            onClick={() =>
              updateObj({ textAlign: "center" } as Partial<FrameObject>)
            }
          >
            <IconAlignCenter size={14} />
          </ActionIcon>
          <ActionIcon
            size={28}
            variant={obj.textAlign === "right" ? "filled" : "default"}
            onClick={() =>
              updateObj({ textAlign: "right" } as Partial<FrameObject>)
            }
          >
            <IconAlignRight size={14} />
          </ActionIcon>
        </Group>
      </Stack>

      {/* Spacing */}
      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Letter spacing"
          placeholder="px"
          value={obj.letterSpacing ?? 0}
          step={0.5}
          onChange={(val) =>
            updateObj({ letterSpacing: n(val) } as Partial<FrameObject>)
          }
        />
        <NumberInput
          label="Line height"
          placeholder="e.g. 1.2"
          value={obj.lineHeight ?? 1.2}
          step={0.1}
          min={0.5}
          max={4}
          decimalScale={2}
          onChange={(val) =>
            updateObj({ lineHeight: n(val, 1.2) } as Partial<FrameObject>)
          }
        />
      </SimpleGrid>

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
