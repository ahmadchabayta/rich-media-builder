import {
  Stack,
  Text,
  Group,
  Button,
  ActionIcon,
  TextInput,
  ColorInput,
  NumberInput,
  SimpleGrid,
  Select,
  SegmentedControl,
} from "@mantine/core";
import {
  IconX,
  IconBold,
  IconItalic,
  IconUnderline,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
} from "@tabler/icons-react";
import type { AnswerGroupObject, FrameObject } from "@src/lib/types";
import { useQuizStore, makeId } from "@src/store/quizStore";
import { n } from "../utils";
import { FontFamilySelect } from "../FontFamilySelect/FontFamilySelect";

interface Props {
  obj: AnswerGroupObject;
  updateObj: (patch: Partial<FrameObject>) => void;
}

export function AnswerGroupFields({ obj, updateObj }: Props) {
  const store = useQuizStore();
  const { currentPreviewIndex, selectedObjectId } = store;

  const updateAnswers = (
    updater: (o: AnswerGroupObject) => AnswerGroupObject,
  ) => {
    if (!selectedObjectId) return;
    store.updateObject(currentPreviewIndex, selectedObjectId, (o) =>
      o.type !== "answerGroup" ? o : updater(o as AnswerGroupObject),
    );
  };

  return (
    <Stack gap="xs">
      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Btn height"
          min={20}
          value={obj.btnHeight ?? 44}
          onChange={(val) => updateObj({ btnHeight: Math.max(20, n(val, 20)) })}
        />
        <NumberInput
          label="Gap between"
          min={0}
          value={obj.btnGap ?? 10}
          onChange={(val) => updateObj({ btnGap: Math.max(0, n(val)) })}
        />
        <NumberInput
          label="Radius"
          min={0}
          value={obj.btnRadius ?? 24}
          onChange={(val) => updateObj({ btnRadius: Math.max(0, n(val)) })}
        />
      </SimpleGrid>
      <SimpleGrid cols={2} spacing="xs">
        <ColorInput
          label="Btn color"
          value={obj.btnBgColor || "#ffffff"}
          onChange={(val) => updateObj({ btnBgColor: val })}
        />
        <NumberInput
          label="Opacity 0-100"
          min={0}
          max={100}
          value={obj.btnBgOpacity ?? 18}
          onChange={(val) =>
            updateObj({ btnBgOpacity: Math.min(100, Math.max(0, n(val))) })
          }
        />
      </SimpleGrid>
      <SimpleGrid cols={2} spacing="xs">
        <ColorInput
          label="Text color"
          value={obj.textColor || "#ffffff"}
          onChange={(val) => updateObj({ textColor: val })}
        />
        <NumberInput
          label="Font size"
          min={8}
          value={obj.fontSize ?? 16}
          onChange={(val) => updateObj({ fontSize: Math.max(8, n(val, 8)) })}
        />
      </SimpleGrid>

      {/* ── Typography ─────────────────────── */}
      <FontFamilySelect
        value={obj.fontFamily ?? null}
        onChange={(f) => updateObj({ fontFamily: f ?? undefined })}
      />
      <Group gap={4}>
        <Select
          size="xs"
          data={[
            { value: "300", label: "Light" },
            { value: "400", label: "Regular" },
            { value: "500", label: "Medium" },
            { value: "600", label: "Semi Bold" },
            { value: "700", label: "Bold" },
            { value: "800", label: "Extra Bold" },
            { value: "900", label: "Black" },
          ]}
          value={obj.fontWeight ?? "400"}
          onChange={(v) => updateObj({ fontWeight: v ?? "400" })}
          style={{ flex: 1 }}
          allowDeselect={false}
        />
        <ActionIcon
          variant={obj.italic ? "filled" : "default"}
          size="sm"
          onClick={() => updateObj({ italic: !obj.italic })}
        >
          <IconItalic size={14} />
        </ActionIcon>
        <ActionIcon
          variant={obj.underline ? "filled" : "default"}
          size="sm"
          onClick={() => updateObj({ underline: !obj.underline })}
        >
          <IconUnderline size={14} />
        </ActionIcon>
      </Group>
      <SegmentedControl
        size="xs"
        fullWidth
        value={obj.textAlign ?? "center"}
        onChange={(v) =>
          updateObj({ textAlign: v as "left" | "center" | "right" })
        }
        data={[
          {
            value: "left",
            label: <IconAlignLeft size={14} style={{ display: "block" }} />,
          },
          {
            value: "center",
            label: <IconAlignCenter size={14} style={{ display: "block" }} />,
          },
          {
            value: "right",
            label: <IconAlignRight size={14} style={{ display: "block" }} />,
          },
        ]}
      />
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
      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Letter spacing"
          step={0.5}
          value={obj.letterSpacing ?? 0}
          onChange={(val) => updateObj({ letterSpacing: n(val) })}
        />
        <NumberInput
          label="Line height"
          min={0.5}
          step={0.1}
          decimalScale={1}
          value={obj.lineHeight ?? 1.4}
          onChange={(val) => updateObj({ lineHeight: n(val, 1.4) })}
        />
      </SimpleGrid>

      <Text size="xs" fw={700} tt="uppercase" c="dimmed" pt={4}>
        Answers
      </Text>
      <Stack gap={4}>
        {obj.answers.map((ans, i) => (
          <Group key={ans.id} gap={4} wrap="nowrap">
            <TextInput
              style={{ flex: 1 }}
              placeholder={`Answer ${i + 1}`}
              value={ans.text || ""}
              onChange={(e) =>
                updateAnswers((o) => ({
                  ...o,
                  answers: o.answers.map((a, ai) =>
                    ai === i ? { ...a, text: e.target.value } : a,
                  ),
                }))
              }
            />
            <ActionIcon
              color="red"
              variant="subtle"
              style={{ flexShrink: 0 }}
              disabled={obj.answers.length <= 1}
              onClick={() =>
                updateAnswers((o) => ({
                  ...o,
                  answers: o.answers.filter((_, ai) => ai !== i),
                }))
              }
            >
              <IconX size={12} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>

      <Button
        variant="default"
        style={{ borderStyle: "dashed" }}
        fullWidth
        onClick={() =>
          updateAnswers((o) => ({
            ...o,
            answers: [
              ...o.answers,
              { id: makeId(), text: `Answer ${o.answers.length + 1}` },
            ],
          }))
        }
      >
        + Add Answer
      </Button>
    </Stack>
  );
}
