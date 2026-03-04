import {
  Group,
  Divider,
  Tooltip,
  NumberInput,
  Select,
  ColorInput,
  ActionIcon,
} from "@mantine/core";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
} from "@tabler/icons-react";
import { FontFamilySelect } from "@src/components/sidebar/FontFamilySelect";
import type { TextObject } from "@src/lib/types";

export function TextTypographyBar({
  obj,
  onChange,
}: {
  obj: TextObject;
  onChange: (patch: Partial<TextObject>) => void;
}) {
  return (
    <Group gap={6} wrap="nowrap" align="center">
      {/* Font family */}
      <Tooltip label="Font family" withArrow openDelay={400}>
        <div style={{ width: 152, flexShrink: 0 }}>
          <FontFamilySelect
            value={obj.fontFamily ?? null}
            onChange={(family) => onChange({ fontFamily: family ?? undefined })}
          />
        </div>
      </Tooltip>

      {/* Font size */}
      <Tooltip label="Font size" withArrow openDelay={400}>
        <NumberInput
          size="xs"
          value={obj.size ?? 22}
          min={6}
          step={1}
          style={{ width: 56, flexShrink: 0 }}
          styles={{ input: { textAlign: "center" } }}
          onChange={(val) =>
            onChange({ size: Math.max(6, typeof val === "number" ? val : 22) })
          }
        />
      </Tooltip>

      {/* Weight */}
      <Tooltip label="Font weight" withArrow openDelay={400}>
        <Select
          size="xs"
          data={[
            { value: "400", label: "Regular" },
            { value: "600", label: "Semi" },
            { value: "700", label: "Bold" },
            { value: "900", label: "Black" },
          ]}
          value={obj.fontWeight ?? "700"}
          onChange={(v) => onChange({ fontWeight: v ?? "700" })}
          style={{ width: 82, flexShrink: 0 }}
          comboboxProps={{ width: 110 }}
        />
      </Tooltip>

      <Divider orientation="vertical" mx={2} />

      {/* B / I / U */}
      <Tooltip label="Bold" withArrow>
        <ActionIcon
          size={26}
          variant={
            obj.fontWeight === "700" || obj.fontWeight === "900"
              ? "filled"
              : "subtle"
          }
          onClick={() =>
            onChange({ fontWeight: obj.fontWeight === "700" ? "400" : "700" })
          }
        >
          <IconBold size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Italic" withArrow>
        <ActionIcon
          size={26}
          variant={obj.italic ? "filled" : "subtle"}
          onClick={() => onChange({ italic: !obj.italic })}
        >
          <IconItalic size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Underline" withArrow>
        <ActionIcon
          size={26}
          variant={obj.underline ? "filled" : "subtle"}
          onClick={() => onChange({ underline: !obj.underline })}
        >
          <IconUnderline size={13} />
        </ActionIcon>
      </Tooltip>

      <Divider orientation="vertical" mx={2} />

      {/* Text alignment */}
      <Tooltip label="Align left" withArrow>
        <ActionIcon
          size={26}
          variant={
            !obj.textAlign || obj.textAlign === "left" ? "filled" : "subtle"
          }
          onClick={() => onChange({ textAlign: "left" })}
        >
          <IconAlignLeft size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Align center" withArrow>
        <ActionIcon
          size={26}
          variant={obj.textAlign === "center" ? "filled" : "subtle"}
          onClick={() => onChange({ textAlign: "center" })}
        >
          <IconAlignCenter size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Align right" withArrow>
        <ActionIcon
          size={26}
          variant={obj.textAlign === "right" ? "filled" : "subtle"}
          onClick={() => onChange({ textAlign: "right" })}
        >
          <IconAlignRight size={13} />
        </ActionIcon>
      </Tooltip>

      <Divider orientation="vertical" mx={2} />

      {/* Letter spacing */}
      <Tooltip label="Letter spacing" withArrow openDelay={300}>
        <NumberInput
          size="xs"
          value={obj.letterSpacing ?? 0}
          step={0.5}
          placeholder="0"
          style={{ width: 54, flexShrink: 0 }}
          styles={{ input: { textAlign: "center", paddingLeft: 6 } }}
          onChange={(val) =>
            onChange({ letterSpacing: typeof val === "number" ? val : 0 })
          }
        />
      </Tooltip>

      {/* Line height */}
      <Tooltip label="Line height" withArrow openDelay={300}>
        <NumberInput
          size="xs"
          value={obj.lineHeight ?? 1.2}
          step={0.1}
          min={0.5}
          max={4}
          decimalScale={2}
          placeholder="1.2"
          style={{ width: 54, flexShrink: 0 }}
          styles={{ input: { textAlign: "center", paddingLeft: 6 } }}
          onChange={(val) =>
            onChange({ lineHeight: typeof val === "number" ? val : 1.2 })
          }
        />
      </Tooltip>

      <Divider orientation="vertical" mx={2} />

      {/* Text color */}
      <Tooltip label="Text color" withArrow openDelay={300}>
        <ColorInput
          size="xs"
          value={obj.color || "#ffffff"}
          onChange={(val) => onChange({ color: val })}
          format="rgba"
          style={{ width: 130, flexShrink: 0 }}
          withEyeDropper={false}
          popoverProps={{ position: "bottom" }}
        />
      </Tooltip>

      {/* Background color */}
      <Tooltip label="Background color" withArrow openDelay={300}>
        <ColorInput
          size="xs"
          value={obj.bgColor || "#000000"}
          onChange={(val) => onChange({ bgColor: val })}
          format="rgba"
          style={{ width: 130, flexShrink: 0 }}
          withEyeDropper={false}
          popoverProps={{ position: "bottom" }}
        />
      </Tooltip>
    </Group>
  );
}
