"use client";
/**
 * TranslationModal
 * ─────────────────
 * Lets users add translation strings for every text object in the project,
 * keyed by locale (e.g. "ar", "fr"). At export time the engine can swap text
 * content based on the active locale.
 */
import { useState } from "react";
import {
  Modal,
  Stack,
  Group,
  TextInput,
  ActionIcon,
  Tabs,
  Textarea,
  Text,
  Button,
  ScrollArea,
  Tooltip,
  Badge,
  Divider,
  Box,
  CopyButton,
  Paper,
  Code,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconLanguage,
  IconRobot,
  IconCheck,
  IconClipboardText,
  IconCopyPlus,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import type { TextObject, AnswerGroupObject } from "@src/lib/types";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function TranslationModal({ opened, onClose }: Props) {
  const quizData = useQuizStore((s) => s.quizData);
  const setTranslation = useQuizStore((s) => s.setTranslation);
  const removeTranslationLocale = useQuizStore(
    (s) => s.removeTranslationLocale,
  );
  const duplicateFramesAsLocale = useQuizStore(
    (s) => s.duplicateFramesAsLocale,
  );

  const [newLocale, setNewLocale] = useState("");
  const [activeLocale, setActiveLocale] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [localeToDelete, setLocaleToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Collect all translatable items (text objects + answer group answers) across non-locale frames
  const textObjects: Array<{
    id: string; // actual obj/answer ID used in store
    labelKey: string; // human-readable key used in AI prompt
    text: string;
    frameIdx: number;
    isAnswer?: boolean;
  }> = [];
  for (const [fi, frame] of quizData.frames.entries()) {
    if (frame.locale) continue; // skip duplicated locale frames
    for (const obj of frame.objects) {
      if (obj.type === "text") {
        if (!textObjects.find((t) => t.id === obj.id)) {
          textObjects.push({
            id: obj.id,
            labelKey: `f${fi + 1}_${obj.label || obj.id}`,
            text: (obj as TextObject).text ?? "",
            frameIdx: fi,
          });
        }
      } else if (obj.type === "answerGroup") {
        const ag = obj as AnswerGroupObject;
        for (const [ai, ans] of ag.answers.entries()) {
          if (!textObjects.find((t) => t.id === ans.id)) {
            textObjects.push({
              id: ans.id,
              labelKey: `f${fi + 1}_${obj.label || `ag${obj.id.slice(-4)}`}_${ai + 1}`,
              text: ans.text ?? "",
              frameIdx: fi,
              isAnswer: true,
            });
          }
        }
      }
    }
  }

  // Reverse map: labelKey → actual ID (for import resolution)
  const labelKeyToId = Object.fromEntries(
    textObjects.map((t) => [t.labelKey, t.id]),
  );

  const locales = Object.keys(quizData.translations ?? {});

  const handleAddLocale = () => {
    const lc = newLocale.trim().toLowerCase();
    if (!lc) return;
    if (locales.includes(lc)) {
      setActiveLocale(lc);
      setNewLocale("");
      return;
    }
    setTranslation(lc, "__init__", "");
    setActiveLocale(lc);
    setNewLocale("");
  };

  const currentLc = activeLocale ?? locales[0] ?? null;

  const buildAiPrompt = () => {
    const targetLocales = locales
      .filter((l) => l !== "__init__")
      .map((l) => l.toUpperCase());
    // Use labelKey (human-readable) as the prompt key so AI output is easy to read/verify
    const payload: Record<string, string> = {};
    for (const t of textObjects) {
      payload[t.labelKey] = t.text;
    }
    return (
      `Translate the following text values into these languages: ${targetLocales.join(", ")}.\n` +
      `Return ONLY a valid JSON object where each key maps to an object of locale → translation.\n` +
      `Example format: { "key1": { "AR": "...", "EN": "..." } }\n` +
      `IMPORTANT: For Arabic, use Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) for all digits. Do NOT spell numbers out as words.\n` +
      `No extra text, no markdown, just the JSON.\n\n` +
      JSON.stringify(payload, null, 2)
    );
  };

  const handleApplyImport = () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importText);
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        setImportError("Expected a JSON object");
        return;
      }
      // Detect nested format and clear stale translations for affected locales first
      const affectedLocales = new Set<string>();
      for (const val of Object.values(parsed)) {
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          for (const locale of Object.keys(val as Record<string, unknown>)) {
            affectedLocales.add(locale.toLowerCase());
          }
        }
      }
      // Wipe existing translations for each affected locale so stale entries don't persist
      for (const lc of affectedLocales) {
        removeTranslationLocale(lc);
      }
      let count = 0;
      for (const [rawKey, val] of Object.entries(parsed)) {
        // Resolve human-readable labelKey → actual obj ID; fall back to rawKey for direct-ID imports
        const resolvedId = labelKeyToId[rawKey] ?? rawKey;
        if (typeof val === "string") {
          // Flat format: { key: "translated text" } — apply to current tab locale
          if (currentLc) {
            setTranslation(currentLc, resolvedId, val);
            count++;
          }
        } else if (
          typeof val === "object" &&
          val !== null &&
          !Array.isArray(val)
        ) {
          // Nested format: { key: { AR: "...", EN: "..." } } — apply each locale
          for (const [locale, text] of Object.entries(
            val as Record<string, unknown>,
          )) {
            if (typeof text === "string") {
              const lc = locale.toLowerCase();
              if (!quizData.translations?.[lc]) {
                setTranslation(lc, "__init__", "");
              }
              setTranslation(lc, resolvedId, text);
              count++;
            }
          }
        }
      }
      if (count === 0) {
        setImportError("No translations were found in the pasted JSON.");
        return;
      }
      setShowImport(false);
      setImportText("");
    } catch {
      setImportError("Invalid JSON — paste the response exactly as returned.");
    }
  };

  const translations = quizData.translations ?? {};

  const openDeleteLocaleConfirm = (locale: string) => {
    setLocaleToDelete(locale);
    setDeleteConfirmText("");
  };

  const handleConfirmDeleteLocale = () => {
    if (!localeToDelete) return;
    if (
      deleteConfirmText.trim().toLowerCase() !== localeToDelete.toLowerCase()
    ) {
      return;
    }
    removeTranslationLocale(localeToDelete);
    if (activeLocale === localeToDelete) setActiveLocale(null);
    setLocaleToDelete(null);
    setDeleteConfirmText("");
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={6}>
          <IconLanguage size={16} />
          <Text fw={600}>Translations</Text>
        </Group>
      }
      size="xl"
      styles={{ body: { padding: "12px 16px" } }}
    >
      <Stack gap={12}>
        {/* Add new locale */}
        <Group gap={8} align="flex-end">
          <TextInput
            label="Add locale"
            placeholder="e.g. ar, fr, de"
            value={newLocale}
            onChange={(e) => setNewLocale(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLocale()}
            size="xs"
            style={{ flex: 1 }}
          />
          <Button
            size="xs"
            leftSection={<IconPlus size={13} />}
            onClick={handleAddLocale}
            disabled={!newLocale.trim()}
          >
            Add
          </Button>
        </Group>

        {locales.length === 0 && (
          <Text c="dimmed" size="sm" ta="center" py={24}>
            No locales yet. Add one above to start translating.
          </Text>
        )}

        {locales.length > 0 && (
          <Tabs
            value={currentLc}
            onChange={(v) => {
              setActiveLocale(v);
              setShowImport(false);
            }}
          >
            <Tabs.List>
              {locales.map((lc) => (
                /* Wrap tab + delete button in a Box so the ActionIcon is NOT inside the Tab button */
                <Box
                  key={lc}
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  <Tabs.Tab value={lc}>
                    <Group gap={4}>
                      <Text size="xs" fw={500}>
                        {lc.toUpperCase()}
                      </Text>
                      <Badge size="xs" variant="light">
                        {
                          Object.keys(translations[lc] ?? {}).filter(
                            (k) => k !== "__init__" && translations[lc][k],
                          ).length
                        }
                        /{textObjects.length}
                      </Badge>
                    </Group>
                  </Tabs.Tab>
                  <Tooltip label="Remove locale" withArrow>
                    <ActionIcon
                      size={14}
                      variant="subtle"
                      color="red"
                      style={{ marginLeft: 2 }}
                      onClick={() => openDeleteLocaleConfirm(lc)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Tooltip>
                </Box>
              ))}
            </Tabs.List>

            {locales.map((lc) => (
              <Tabs.Panel key={lc} value={lc} pt={10}>
                <ScrollArea h={360} offsetScrollbars>
                  <Stack gap={10}>
                    {textObjects.length === 0 && (
                      <Text c="dimmed" size="sm" ta="center" py={24}>
                        No text objects found in the project.
                      </Text>
                    )}
                    {textObjects.map((t, i) => {
                      const tMap = translations[lc] ?? {};
                      return (
                        <Stack key={t.id} gap={4}>
                          <Group gap={6} align="flex-start">
                            <Stack gap={2} style={{ flex: 1 }}>
                              <Group gap={6}>
                                <Text size="xs" c="dimmed">
                                  Frame {t.frameIdx + 1}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  ·
                                </Text>
                                {t.isAnswer && (
                                  <>
                                    <Text size="xs" c="blue.4">
                                      Answer
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      ·
                                    </Text>
                                  </>
                                )}
                                <Text
                                  size="xs"
                                  c="dimmed"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  {t.labelKey}
                                </Text>
                              </Group>
                              <Text
                                size="xs"
                                c="gray.4"
                                style={{ wordBreak: "break-word" }}
                              >
                                Original: {t.text || <em>(empty)</em>}
                              </Text>
                              <Textarea
                                placeholder="Enter translation…"
                                value={tMap[t.id] ?? ""}
                                onChange={(e) =>
                                  setTranslation(
                                    lc,
                                    t.id,
                                    e.currentTarget.value,
                                  )
                                }
                                autosize
                                minRows={1}
                                maxRows={4}
                                size="xs"
                              />
                            </Stack>
                          </Group>
                          {i < textObjects.length - 1 && <Divider />}
                        </Stack>
                      );
                    })}
                  </Stack>
                </ScrollArea>
              </Tabs.Panel>
            ))}
          </Tabs>
        )}

        {/* Global AI + Duplicate toolbar — always visible when locales exist */}
        {locales.length > 0 && (
          <Stack gap={8}>
            <Divider label="Actions" labelPosition="left" />
            <Group gap={8}>
              <CopyButton value={buildAiPrompt()}>
                {({ copied, copy }) => (
                  <Button
                    size="xs"
                    variant="light"
                    color={copied ? "teal" : "violet"}
                    leftSection={
                      copied ? <IconCheck size={13} /> : <IconRobot size={13} />
                    }
                    onClick={copy}
                  >
                    {copied ? "Prompt copied!" : "Copy AI prompt"}
                  </Button>
                )}
              </CopyButton>
              <Button
                size="xs"
                variant="light"
                color="blue"
                leftSection={<IconClipboardText size={13} />}
                onClick={() => setShowImport((v) => !v)}
              >
                Paste AI response
              </Button>
            </Group>
            {showImport && (
              <Paper withBorder p={10} radius="sm">
                <Stack gap={6}>
                  <Text size="xs" fw={500}>
                    Paste the JSON returned by the AI:
                  </Text>
                  <Textarea
                    placeholder={'{ "key": { "AR": "...", "EN": "..." } }'}
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.currentTarget.value);
                      setImportError("");
                    }}
                    minRows={4}
                    maxRows={10}
                    autosize
                    size="xs"
                    styles={{
                      input: { fontFamily: "monospace", fontSize: 11 },
                    }}
                    error={importError}
                  />
                  <Group gap={8}>
                    <Button
                      size="xs"
                      onClick={handleApplyImport}
                      disabled={!importText.trim()}
                    >
                      Apply
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={() => {
                        setShowImport(false);
                        setImportText("");
                        setImportError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            )}
            {/* One Duplicate button per locale that has real translations */}
            <Group gap={8}>
              {locales
                .filter((lc) => {
                  const map = translations[lc] ?? {};
                  return (
                    Object.keys(map).filter((k) => k !== "__init__" && map[k])
                      .length > 0
                  );
                })
                .map((lc) => (
                  <Group key={lc} gap={4}>
                    <Button
                      size="xs"
                      variant="filled"
                      color="teal"
                      leftSection={<IconCopyPlus size={13} />}
                      onClick={() => {
                        duplicateFramesAsLocale(lc);
                        onClose();
                      }}
                    >
                      Duplicate as {lc.toUpperCase()}
                    </Button>
                    <Tooltip
                      label={`Clear all ${lc.toUpperCase()} translations`}
                      withArrow
                    >
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => openDeleteLocaleConfirm(lc)}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ))}
            </Group>
          </Stack>
        )}

        <Text size="xs" c="dimmed">
          Translations are embedded in exported HTML. Add <Code>?lang=ar</Code>{" "}
          (or set <Code>window.__BLS_LANG__</Code>) to switch locale at runtime.
        </Text>
      </Stack>

      <Modal
        opened={localeToDelete != null}
        onClose={() => {
          setLocaleToDelete(null);
          setDeleteConfirmText("");
        }}
        title="Delete locale"
        centered
        size="sm"
      >
        <Stack gap={10}>
          <Text size="sm">
            This will delete all translations and duplicated frames for locale{" "}
            <Code>{(localeToDelete ?? "").toUpperCase()}</Code>. Other locales
            remain untouched.
          </Text>
          <Text size="xs" c="dimmed">
            Type <Code>{localeToDelete ?? ""}</Code> to confirm.
          </Text>
          <TextInput
            placeholder={localeToDelete ?? ""}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.currentTarget.value)}
            size="xs"
            autoFocus
          />
          <Group justify="flex-end" gap={8}>
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => {
                setLocaleToDelete(null);
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="xs"
              color="red"
              onClick={handleConfirmDeleteLocale}
              disabled={
                !localeToDelete ||
                deleteConfirmText.trim().toLowerCase() !==
                  localeToDelete.toLowerCase()
              }
            >
              Delete locale
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  );
}
