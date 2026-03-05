import {
  Stack,
  Text,
  Group,
  Button,
  ActionIcon,
  TextInput,
  NumberInput,
  Select,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { KeyframeStop } from "@src/lib/types";
import { TransformBuilder } from "./TransformBuilder";

export const PROPERTY_OPTIONS = [
  { value: "opacity", label: "Opacity" },
  { value: "transform", label: "Transform" },
  { value: "filter", label: "Filter" },
  { value: "clip-path", label: "Clip Path" },
  { value: "box-shadow", label: "Box Shadow" },
  { value: "background-color", label: "Bg Color" },
  { value: "color", label: "Color" },
  { value: "border-radius", label: "Border Radius" },
  { value: "transform-origin", label: "Transform Origin" },
];

export interface StopEditorProps {
  stop: KeyframeStop;
  onUpdateStop: (updated: KeyframeStop) => void;
  onDeleteStop: () => void;
  canDelete: boolean;
}

export function StopEditor({
  stop,
  onUpdateStop,
  onDeleteStop,
  canDelete,
}: StopEditorProps) {
  const entries = Object.entries(stop.props);

  const updateProp = (oldKey: string, newKey: string, newVal: string) => {
    const newProps = { ...stop.props };
    if (oldKey !== newKey) delete newProps[oldKey];
    newProps[newKey] = newVal;
    onUpdateStop({ ...stop, props: newProps });
  };

  const removeProp = (key: string) => {
    const newProps = { ...stop.props };
    delete newProps[key];
    onUpdateStop({ ...stop, props: newProps });
  };

  const addProp = () => {
    const usedKeys = new Set(Object.keys(stop.props));
    const available = PROPERTY_OPTIONS.find((p) => !usedKeys.has(p.value));
    const key = available?.value ?? "opacity";
    if (usedKeys.has(key)) return;
    onUpdateStop({
      ...stop,
      props: { ...stop.props, [key]: key === "opacity" ? "1" : "" },
    });
  };

  return (
    <Stack
      gap={4}
      p="xs"
      style={{
        background: "#25262b",
        borderRadius: 6,
        border: "1px solid #373a40",
      }}
    >
      <Group justify="space-between">
        <Text size="xs" c="yellow.4" fw={700}>
          Stop @ {Math.round(stop.offset * 100)}%
        </Text>
        {canDelete && (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="red"
            onClick={onDeleteStop}
          >
            <IconTrash size={12} />
          </ActionIcon>
        )}
      </Group>

      <NumberInput
        size="xs"
        label="Offset %"
        value={Math.round(stop.offset * 100)}
        min={0}
        max={100}
        step={1}
        onChange={(v) => {
          const n = typeof v === "number" ? v : 0;
          onUpdateStop({
            ...stop,
            offset: Math.max(0, Math.min(100, n)) / 100,
          });
        }}
      />

      {entries.map(([key, val], i) => (
        <Stack key={`${key}-${i}`} gap={4}>
          <Group gap={4} align="flex-end" wrap="nowrap">
            <Select
              size="xs"
              data={PROPERTY_OPTIONS}
              value={PROPERTY_OPTIONS.find((p) => p.value === key) ? key : null}
              onChange={(newKey) => {
                if (newKey) updateProp(key, newKey, newKey === key ? val : "");
              }}
              searchable
              allowDeselect={false}
              style={{ flex: 1 }}
              styles={{ input: { fontSize: 11 } }}
            />
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => removeProp(key)}
            >
              <IconTrash size={10} />
            </ActionIcon>
          </Group>
          {key === "transform" ? (
            <TransformBuilder
              value={val}
              onChange={(css) => updateProp(key, key, css)}
            />
          ) : (
            <TextInput
              size="xs"
              value={val}
              onChange={(e) => updateProp(key, key, e.currentTarget.value)}
              styles={{ input: { fontFamily: "monospace", fontSize: 11 } }}
            />
          )}
        </Stack>
      ))}

      <Button
        size="compact-xs"
        variant="subtle"
        color="blue"
        leftSection={<IconPlus size={10} />}
        onClick={addProp}
        style={{ fontSize: 10 }}
      >
        Add Property
      </Button>
    </Stack>
  );
}
