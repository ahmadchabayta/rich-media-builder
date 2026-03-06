import { useState, useEffect } from "react";
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
import { useRichEditorContext } from "@src/context/RichEditorContext";

export function TextTypographyBar({
  obj,
  onChange,
  showBgColor = true,
}: {
  obj: TextObject;
  onChange: (patch: Partial<TextObject>) => void;
  showBgColor?: boolean;
}) {
  const { activeEditor } = useRichEditorContext();

  // Re-render whenever the editor''s selection / marks change
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!activeEditor) return;
    const tick = () => rerender((n) => n + 1);
    activeEditor.on("selectionUpdate", tick);
    activeEditor.on("transaction", tick);
    return () => {
      activeEditor.off("selectionUpdate", tick);
      activeEditor.off("transaction", tick);
    };
  }, [activeEditor]);

  // Effective display values  prefer editor''s selection when active
  const ts = activeEditor
    ? (activeEditor.getAttributes("textStyle") as Record<string, unknown>)
    : null;
  const pa = activeEditor
    ? (activeEditor.getAttributes("paragraph") as Record<string, unknown>)
    : null;

  const effFontFamily =
    (ts?.fontFamily as string | undefined) ?? obj.fontFamily;
  const effSize = ts?.fontSize != null ? Number(ts.fontSize) : obj.size;
  const effFontWeight =
    (ts?.fontWeight as string | undefined) ?? obj.fontWeight;
  const effItalic =
    ts != null ? ts.fontStyle === "italic" : (obj.italic ?? false);
  const effUnderline =
    ts != null
      ? ts.textDecorationLine === "underline"
      : (obj.underline ?? false);
  const effAlign = ((pa?.textAlign as string | undefined) ?? obj.textAlign) as
    | "left"
    | "center"
    | "right"
    | undefined;
  const effTransform = ((ts?.textTransform as string | undefined) ??
    obj.textTransform) as TextObject["textTransform"];
  const effLetterSpacing =
    ts?.letterSpacing != null ? Number(ts.letterSpacing) : obj.letterSpacing;
  const effColor = (ts?.color as string | undefined) ?? obj.color;
  const effBgColor = (ts?.backgroundColor as string | undefined) ?? obj.bgColor;

  // Route a patch to the editor (per-selection) or the object (whole object)
  const apply = (patch: Partial<TextObject>) => {
    if (!activeEditor) {
      onChange(patch);
      return;
    }
    // Per-selection inline style overrides via textStyle mark
    const markPatch: Record<string, unknown> = {};
    if (patch.fontFamily !== undefined)
      markPatch.fontFamily = patch.fontFamily ?? null;
    if (patch.size !== undefined) markPatch.fontSize = patch.size;
    if (patch.fontWeight !== undefined) markPatch.fontWeight = patch.fontWeight;
    if (patch.italic !== undefined)
      markPatch.fontStyle = patch.italic ? "italic" : null;
    if (patch.underline !== undefined)
      markPatch.textDecorationLine = patch.underline ? "underline" : null;
    if (patch.letterSpacing !== undefined)
      markPatch.letterSpacing = patch.letterSpacing;
    if (patch.textTransform !== undefined)
      markPatch.textTransform =
        patch.textTransform === "none" ? null : (patch.textTransform ?? null);
    if (patch.color !== undefined) markPatch.color = patch.color;
    if (patch.bgColor !== undefined) markPatch.backgroundColor = patch.bgColor;

    // Merge with existing mark attributes so we don't wipe other inline styles.
    // Do NOT call .focus() here — it steals DOM focus from toolbar popovers
    // (e.g. ColorInput), causing them to close on every change.
    let chain = activeEditor.chain();
    if (Object.keys(markPatch).length > 0) {
      const existing = activeEditor.getAttributes("textStyle") as Record<
        string,
        unknown
      >;
      chain = chain.setMark("textStyle", { ...existing, ...markPatch });
    }
    // Paragraph-level: text alignment
    if (patch.textAlign !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chain = (chain as any).setTextAlign(patch.textAlign);
    }
    chain.run();
  };

  return (
    <Group gap={6} wrap="nowrap" align="center" data-rich-toolbar>
      {/* Font family */}
      <Tooltip label="Font family" withArrow openDelay={400}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <FontFamilySelect
            value={effFontFamily ?? null}
            onChange={(family) => apply({ fontFamily: family ?? undefined })}
          />
        </div>
      </Tooltip>

      {/* Font size */}
      <Tooltip label="Font size" withArrow openDelay={400}>
        <NumberInput
          size="xs"
          value={effSize ?? 22}
          min={6}
          step={1}
          style={{ width: 56, flexShrink: 0 }}
          styles={{ input: { textAlign: "center" } }}
          onChange={(val) =>
            apply({ size: Math.max(6, typeof val === "number" ? val : 22) })
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
          value={effFontWeight ?? "700"}
          onChange={(v) => apply({ fontWeight: v ?? "700" })}
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
            effFontWeight === "700" || effFontWeight === "900"
              ? "filled"
              : "subtle"
          }
          onClick={() =>
            apply({
              fontWeight: effFontWeight === "700" ? "400" : "700",
            })
          }
        >
          <IconBold size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Italic" withArrow>
        <ActionIcon
          size={26}
          variant={effItalic ? "filled" : "subtle"}
          onClick={() => apply({ italic: !effItalic })}
        >
          <IconItalic size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Underline" withArrow>
        <ActionIcon
          size={26}
          variant={effUnderline ? "filled" : "subtle"}
          onClick={() => apply({ underline: !effUnderline })}
        >
          <IconUnderline size={13} />
        </ActionIcon>
      </Tooltip>

      <Divider orientation="vertical" mx={2} />

      {/* Text alignment */}
      <Tooltip label="Align left" withArrow>
        <ActionIcon
          size={26}
          variant={!effAlign || effAlign === "left" ? "filled" : "subtle"}
          onClick={() => apply({ textAlign: "left" })}
        >
          <IconAlignLeft size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Align center" withArrow>
        <ActionIcon
          size={26}
          variant={effAlign === "center" ? "filled" : "subtle"}
          onClick={() => apply({ textAlign: "center" })}
        >
          <IconAlignCenter size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Align right" withArrow>
        <ActionIcon
          size={26}
          variant={effAlign === "right" ? "filled" : "subtle"}
          onClick={() => apply({ textAlign: "right" })}
        >
          <IconAlignRight size={13} />
        </ActionIcon>
      </Tooltip>

      <Divider orientation="vertical" mx={2} />

      {/* Text transform */}
      <Tooltip
        label="Text transform (None / UPPER / lower / Title)"
        withArrow
        openDelay={400}
      >
        <Select
          size="xs"
          data={[
            { value: "none", label: "Aa" },
            { value: "uppercase", label: "AA" },
            { value: "lowercase", label: "aa" },
            { value: "capitalize", label: "Tt" },
          ]}
          value={effTransform ?? "none"}
          onChange={(v) =>
            apply({
              textTransform: (v ?? "none") as NonNullable<
                TextObject["textTransform"]
              >,
            })
          }
          style={{ width: 70, flexShrink: 0 }}
          comboboxProps={{ width: 100 }}
        />
      </Tooltip>

      <Divider orientation="vertical" mx={2} />

      {/* Letter spacing */}
      <Tooltip label="Letter spacing" withArrow openDelay={300}>
        <NumberInput
          size="xs"
          value={effLetterSpacing ?? 0}
          step={0.5}
          placeholder="0"
          style={{ width: 54, flexShrink: 0 }}
          styles={{ input: { textAlign: "center", paddingLeft: 6 } }}
          onChange={(val) =>
            apply({ letterSpacing: typeof val === "number" ? val : 0 })
          }
        />
      </Tooltip>

      {/* Line height  always object-level (paragraph property) */}
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
          value={effColor || "#ffffff"}
          onChange={(val) => apply({ color: val })}
          format="rgba"
          style={{ width: 130, flexShrink: 0 }}
          withEyeDropper
          popoverProps={{ position: "bottom" }}
        />
      </Tooltip>

      {showBgColor && (
        <Tooltip label="Background color" withArrow openDelay={300}>
          <ColorInput
            size="xs"
            value={effBgColor || "#000000"}
            onChange={(val) => apply({ bgColor: val })}
            format="rgba"
            style={{ width: 130, flexShrink: 0 }}
            withEyeDropper
            popoverProps={{ position: "bottom" }}
          />
        </Tooltip>
      )}
    </Group>
  );
}
