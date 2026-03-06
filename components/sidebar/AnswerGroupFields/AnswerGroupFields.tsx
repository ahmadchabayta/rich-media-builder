import {
  Stack,
  Text,
  Group,
  Button,
  ActionIcon,
  TextInput,
  NumberInput,
  SimpleGrid,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import type { AnswerGroupObject, FrameObject } from "@src/lib/types";
import { useQuizStore, makeId } from "@src/store/quizStore";
import { n } from "../utils";

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
        <Text size="xs" c="dimmed" mt={4}>
          Button color and typography styles are now controlled from the app
          header.
        </Text>
      </SimpleGrid>

      <Text size="xs" fw={700} tt="uppercase" c="dimmed" pt={4}>
        Button Padding
      </Text>
      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Top"
          min={0}
          value={obj.btnPaddingTop ?? 0}
          onChange={(val) => updateObj({ btnPaddingTop: Math.max(0, n(val)) })}
        />
        <NumberInput
          label="Right"
          min={0}
          value={obj.btnPaddingRight ?? 14}
          onChange={(val) =>
            updateObj({ btnPaddingRight: Math.max(0, n(val)) })
          }
        />
        <NumberInput
          label="Bottom"
          min={0}
          value={obj.btnPaddingBottom ?? 0}
          onChange={(val) =>
            updateObj({ btnPaddingBottom: Math.max(0, n(val)) })
          }
        />
        <NumberInput
          label="Left"
          min={0}
          value={obj.btnPaddingLeft ?? 14}
          onChange={(val) => updateObj({ btnPaddingLeft: Math.max(0, n(val)) })}
        />
      </SimpleGrid>

      <Text size="xs" fw={700} tt="uppercase" c="dimmed" pt={4}>
        Answers
      </Text>
      <Stack gap={4}>
        {obj.answers.map((ans, i) => (
          <Group key={ans.id} gap={4} align="flex-end" wrap="nowrap">
            <Stack gap={4} style={{ flex: 1 }}>
              <TextInput
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
              <TextInput
                size="xs"
                placeholder="Data Answer (optional, e.g. yes-i-have)"
                value={ans.dataAnswer || ""}
                onChange={(e) =>
                  updateAnswers((o) => ({
                    ...o,
                    answers: o.answers.map((a, ai) =>
                      ai === i ? { ...a, dataAnswer: e.target.value } : a,
                    ),
                  }))
                }
              />
            </Stack>
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
