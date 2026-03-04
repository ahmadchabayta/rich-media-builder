"use client";

import { useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Stack,
  Button,
  Group,
  Text,
  Divider,
  ScrollArea,
  Code,
  CopyButton,
  Tooltip,
  ActionIcon,
  Chip,
  Paper,
} from "@mantine/core";
import { IconCopy, IconCheck, IconSparkles } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import {
  SIZE_PRESETS,
  AD_TYPES,
  STYLE_MOODS,
  buildPrompt,
} from "./promptBuilder";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function AiPromptModal({ opened, onClose }: Props) {
  // ─── Form state ────────────────────────────────────────────
  const [brandName, setBrandName] = useState("");
  const [adGoal, setAdGoal] = useState("");
  const [adType, setAdType] = useState<string>("Quiz / Trivia");
  const [sizePreset, setSizePreset] = useState("320×480 (Mobile Portrait)");
  const [customW, setCustomW] = useState<number>(320);
  const [customH, setCustomH] = useState<number>(480);
  const [frameCount, setFrameCount] = useState<number>(4);
  const [answersPerFrame, setAnswersPerFrame] = useState<number>(3);
  const [headline, setHeadline] = useState("");
  const [styleMood, setStyleMood] = useState<string>("Bold & Vibrant");
  const [brandColors, setBrandColors] = useState("");
  const [fontPref, setFontPref] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  // ─── Output ────────────────────────────────────────────────
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const isCustom = sizePreset === "Custom";
  const w = isCustom ? customW : (SIZE_PRESETS[sizePreset]?.w ?? 320);
  const h = isCustom ? customH : (SIZE_PRESETS[sizePreset]?.h ?? 480);

  const generate = () => {
    const prompt = buildPrompt({
      brandName,
      adGoal,
      adType,
      w,
      h,
      frameCount,
      answersPerFrame,
      headline,
      styleMood,
      brandColors,
      fontPref,
      extraNotes,
    });
    setGeneratedPrompt(prompt);
    notifications.show({
      title: "Prompt generated",
      message: "Scroll down and copy the prompt to paste into any AI chat.",
      color: "teal",
      autoClose: 3000,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="800px"
      title={
        <Group gap={8}>
          <IconSparkles
            size={18}
            style={{ color: "var(--mantine-color-violet-5)" }}
          />
          <Text fw={700}>AI Ad Prompt Generator</Text>
        </Group>
      }
      styles={{ body: { padding: 0 } }}
    >
      <ScrollArea h="70vh" type="auto" px="md" pb="md">
        <Stack gap="md" pt="sm">
          {/* ───── Brand & Goal ───── */}
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>
              Brand & Goal
            </Text>
            <Group grow>
              <TextInput
                label="Brand / Advertiser"
                placeholder="e.g. Nike, Coca-Cola…"
                value={brandName}
                onChange={(e) => setBrandName(e.currentTarget.value)}
              />
              <TextInput
                label="Campaign Goal"
                placeholder="e.g. Drive app installs, increase awareness…"
                value={adGoal}
                onChange={(e) => setAdGoal(e.currentTarget.value)}
              />
            </Group>
          </Paper>

          {/* ───── Ad Type & Size ───── */}
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>
              Ad Type & Size
            </Text>
            <Group grow>
              <Select
                label="Ad Type"
                data={AD_TYPES}
                value={adType}
                onChange={(v) => setAdType(v || "Quiz / Trivia")}
              />
              <Select
                label="Canvas Size"
                data={Object.keys(SIZE_PRESETS)}
                value={sizePreset}
                onChange={(v) =>
                  setSizePreset(v || "320×480 (Mobile Portrait)")
                }
              />
            </Group>
            {isCustom && (
              <Group grow mt="xs">
                <NumberInput
                  label="Width (px)"
                  value={customW}
                  onChange={(v) => setCustomW(Number(v) || 320)}
                  min={50}
                  max={2000}
                />
                <NumberInput
                  label="Height (px)"
                  value={customH}
                  onChange={(v) => setCustomH(Number(v) || 480)}
                  min={50}
                  max={2000}
                />
              </Group>
            )}
          </Paper>

          {/* ───── Content ───── */}
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>
              Content
            </Text>
            <Group grow>
              <NumberInput
                label="Number of Frames"
                value={frameCount}
                onChange={(v) => setFrameCount(Number(v) || 4)}
                min={2}
                max={20}
              />
              {(adType === "Quiz / Trivia" || adType === "Poll / Survey") && (
                <NumberInput
                  label="Answers per Question"
                  value={answersPerFrame}
                  onChange={(v) => setAnswersPerFrame(Number(v) || 3)}
                  min={2}
                  max={6}
                />
              )}
            </Group>
            <TextInput
              label="Headline / Hook"
              placeholder="e.g. How well do you know football?"
              mt="xs"
              value={headline}
              onChange={(e) => setHeadline(e.currentTarget.value)}
            />
          </Paper>

          {/* ───── Visual Style ───── */}
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={8}>
              Visual Style
            </Text>
            <Text size="xs" c="dimmed" mb={6}>
              Mood
            </Text>
            <Chip.Group
              multiple={false}
              value={styleMood}
              onChange={(v) => setStyleMood(v as string)}
            >
              <Group gap={6} wrap="wrap">
                {STYLE_MOODS.map((m) => (
                  <Chip key={m} value={m} size="xs" variant="outline">
                    {m}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
            <Group grow mt="xs">
              <TextInput
                label="Brand Colors"
                placeholder="e.g. #e63946, #1d3557, #f1faee"
                value={brandColors}
                onChange={(e) => setBrandColors(e.currentTarget.value)}
              />
              <TextInput
                label="Preferred Font"
                placeholder="e.g. Poppins, Montserrat, Inter"
                value={fontPref}
                onChange={(e) => setFontPref(e.currentTarget.value)}
              />
            </Group>
          </Paper>

          {/* ───── Extra Notes ───── */}
          <Textarea
            label="Additional Notes / Instructions"
            placeholder="Any extra context for the AI: specific questions, target audience, language, etc."
            autosize
            minRows={2}
            maxRows={5}
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.currentTarget.value)}
          />

          <Button
            onClick={generate}
            leftSection={<IconSparkles size={16} />}
            color="violet"
            fullWidth
            size="md"
          >
            Generate Prompt
          </Button>

          {/* ───── Output ───── */}
          {generatedPrompt && (
            <>
              <Divider label="Generated Prompt" labelPosition="center" />
              <Paper
                withBorder
                radius="sm"
                p="sm"
                style={{
                  position: "relative",
                  background: "var(--mantine-color-dark-7)",
                }}
              >
                <CopyButton value={generatedPrompt} timeout={2500}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied!" : "Copy prompt"}
                      withArrow
                    >
                      <ActionIcon
                        color={copied ? "teal" : "gray"}
                        variant="subtle"
                        onClick={copy}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 2,
                        }}
                      >
                        {copied ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconCopy size={16} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
                <Code
                  block
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 350,
                    overflow: "auto",
                    fontSize: 12,
                    background: "transparent",
                  }}
                >
                  {generatedPrompt}
                </Code>
              </Paper>
              <Text size="xs" c="dimmed" ta="center">
                Copy the prompt above and paste it into ChatGPT, Claude, or any
                AI. Then paste the JSON response into <b>File → Load Project</b>{" "}
                (save as .json first).
              </Text>
            </>
          )}
        </Stack>
      </ScrollArea>
    </Modal>
  );
}
