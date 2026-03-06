import { useRef } from "react";
import {
  Accordion,
  Stack,
  Group,
  Text,
  Select,
  NumberInput,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Divider,
  Slider,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import type { CSSFilterConfig, FrameObject } from "@src/lib/types";

// ── Scrub-draggable number input ──────────────────────────────────────────────
interface DragNumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** screen pixels of horizontal drag that equal one step */
  pxPerStep?: number;
  onChange: (v: number) => void;
}

function DragNumberInput({
  label,
  value,
  min = -Infinity,
  max = Infinity,
  step = 1,
  pxPerStep = 1,
  onChange,
}: DragNumberInputProps) {
  const drag = useRef<{ startX: number; startVal: number } | null>(null);

  const handleLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    drag.current = { startX: e.clientX, startVal: value };

    const onMove = (ev: MouseEvent) => {
      if (!drag.current) return;
      const delta = (ev.clientX - drag.current.startX) / pxPerStep;
      const raw = drag.current.startVal + delta * step;
      const clamped = Math.min(max, Math.max(min, raw));
      const rounded = parseFloat(
        (Math.round(clamped / step) * step).toFixed(10),
      );
      onChange(rounded);
    };

    const onUp = () => {
      drag.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const draggableLabel = (
    <span
      onMouseDown={handleLabelMouseDown}
      title="Drag left / right to scrub value"
      style={{
        cursor: "ew-resize",
        userSelect: "none",
        borderBottom: "1px dashed rgba(255,255,255,0.25)",
        paddingBottom: 1,
      }}
    >
      {label}
    </span>
  );

  return (
    <NumberInput
      label={draggableLabel}
      size="xs"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(v) => onChange(Number(v))}
    />
  );
}

const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
];

const FILTER_PRESETS: Array<{
  id: string;
  label: string;
  recommendedFor?: FrameObject["type"][];
  patch: Partial<CSSFilterConfig>;
}> = [
  {
    id: "none",
    label: "None",
    patch: {
      opacity: 100,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      hueRotate: 0,
      blur: 0,
      grayscale: 0,
      sepia: 0,
      invert: 0,
    },
  },
  {
    id: "headline-pop",
    label: "Headline Pop",
    recommendedFor: ["text", "answerGroup"],
    patch: { brightness: 112, contrast: 120, saturate: 115 },
  },
  {
    id: "cinematic",
    label: "Cinematic",
    recommendedFor: ["image"],
    patch: { brightness: 92, contrast: 120, saturate: 88, sepia: 8 },
  },
  {
    id: "soft-focus",
    label: "Soft Focus",
    recommendedFor: ["image", "shape"],
    patch: { contrast: 92, saturate: 90, blur: 1.5 },
  },
  {
    id: "high-energy",
    label: "High Energy",
    recommendedFor: ["image", "text", "answerGroup"],
    patch: { brightness: 108, contrast: 128, saturate: 135 },
  },
  {
    id: "mono-clean",
    label: "Monochrome Clean",
    recommendedFor: ["text", "image", "shape"],
    patch: { grayscale: 100, contrast: 110, saturate: 0 },
  },
];

interface Props {
  obj: FrameObject;
  updateObj: (patch: Partial<FrameObject>) => void;
}

function patchFilter(
  current: CSSFilterConfig | undefined,
  key: keyof CSSFilterConfig,
  value: number | undefined,
): CSSFilterConfig | undefined {
  const next = { ...current, [key]: value };
  // If all values are at defaults, return undefined to clean up
  const isDefault =
    (next.opacity == null || next.opacity === 100) &&
    (next.brightness == null || next.brightness === 100) &&
    (next.contrast == null || next.contrast === 100) &&
    (next.saturate == null || next.saturate === 100) &&
    (next.hueRotate == null || next.hueRotate === 0) &&
    (next.blur == null || next.blur === 0) &&
    (next.grayscale == null || next.grayscale === 0) &&
    (next.sepia == null || next.sepia === 0) &&
    (next.invert == null || next.invert === 0);
  return isDefault ? undefined : next;
}

export function FiltersBlendPanel({ obj, updateObj }: Props) {
  const f = obj.cssFilter ?? {};

  const recommended = FILTER_PRESETS.filter(
    (p) => p.recommendedFor && p.recommendedFor.includes(obj.type),
  );
  const general = FILTER_PRESETS.filter((p) => !p.recommendedFor);
  const other = FILTER_PRESETS.filter(
    (p) => p.recommendedFor && !p.recommendedFor.includes(obj.type),
  );
  const presetOptions = [...recommended, ...general, ...other].map((p) => ({
    value: p.id,
    label: p.label,
  }));

  const set = (key: keyof CSSFilterConfig, val: number) => {
    if (isNaN(val)) return;
    const cssFilter = patchFilter(obj.cssFilter, key, val);
    updateObj({
      cssFilter,
      ...(key === "opacity" ? { opacity: val } : {}),
    } as Partial<FrameObject>);
  };

  const resetFilters = () => {
    updateObj({ cssFilter: undefined, opacity: 100 } as Partial<FrameObject>);
  };

  const applyPreset = (presetId: string | null) => {
    if (!presetId) return;
    const preset = FILTER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const next: CSSFilterConfig = {
      ...(obj.cssFilter ?? {}),
      ...preset.patch,
    };
    updateObj({
      cssFilter: patchFilter(next, "opacity", next.opacity ?? 100),
      opacity: next.opacity ?? 100,
    } as Partial<FrameObject>);
  };

  const hasFilter = obj.cssFilter != null;

  return (
    <Accordion
      multiple
      defaultValue={["effects"]}
      variant="separated"
      radius="sm"
    >
      <Accordion.Item value="effects">
        <Accordion.Control>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="xs" fw={700} c="dimmed">
              Effects
            </Text>
            {hasFilter && (
              <Tooltip label="Reset all effects" withArrow>
                <ActionIcon
                  size={18}
                  variant="subtle"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetFilters();
                  }}
                >
                  <IconRefresh size={12} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="xs">
            <Select
              label="Smart preset"
              size="xs"
              data={presetOptions}
              placeholder="Choose a preset"
              onChange={applyPreset}
              searchable
            />

            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={600}>
                Opacity
              </Text>
              <Slider
                min={0}
                max={100}
                value={f.opacity ?? obj.opacity ?? 100}
                onChange={(val) => set("opacity", val)}
                label={(v) => `${v}%`}
                size="xs"
                marks={[{ value: 0 }, { value: 50 }, { value: 100 }]}
              />
            </Stack>

            <Select
              label="Blend mode"
              size="xs"
              data={BLEND_MODES.map((m) => ({ value: m, label: m }))}
              value={obj.blendMode ?? "normal"}
              onChange={(v) =>
                updateObj({
                  blendMode: v === "normal" ? undefined : (v ?? undefined),
                } as Partial<FrameObject>)
              }
              clearable
              placeholder="normal"
            />

            <Divider />

            <SimpleGrid cols={2} spacing="xs">
              <DragNumberInput
                label="Brightness %"
                value={f.brightness ?? 100}
                min={0}
                max={300}
                step={1}
                pxPerStep={1}
                onChange={(v) => set("brightness", v)}
              />
              <DragNumberInput
                label="Contrast %"
                value={f.contrast ?? 100}
                min={0}
                max={300}
                step={1}
                pxPerStep={1}
                onChange={(v) => set("contrast", v)}
              />
              <DragNumberInput
                label="Saturate %"
                value={f.saturate ?? 100}
                min={0}
                max={400}
                step={1}
                pxPerStep={1}
                onChange={(v) => set("saturate", v)}
              />
              <DragNumberInput
                label="Hue Rotate °"
                value={f.hueRotate ?? 0}
                min={-180}
                max={180}
                step={1}
                pxPerStep={1}
                onChange={(v) => set("hueRotate", v)}
              />
              <DragNumberInput
                label="Blur px"
                value={f.blur ?? 0}
                min={0}
                max={40}
                step={0.5}
                pxPerStep={2}
                onChange={(v) => set("blur", v)}
              />
              <DragNumberInput
                label="Grayscale %"
                value={f.grayscale ?? 0}
                min={0}
                max={100}
                step={1}
                pxPerStep={1}
                onChange={(v) => set("grayscale", v)}
              />
              <DragNumberInput
                label="Sepia %"
                value={f.sepia ?? 0}
                min={0}
                max={100}
                step={1}
                pxPerStep={1}
                onChange={(v) => set("sepia", v)}
              />
              <DragNumberInput
                label="Invert %"
                value={f.invert ?? 0}
                min={0}
                max={100}
                step={5}
                onChange={(v) => set("invert", Number(v))}
              />
            </SimpleGrid>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
