"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  TagsInput,
  MultiSelect,
  Stack,
  Group,
  Button,
  ActionIcon,
  Text,
  SimpleGrid,
  Title,
  Badge,
  Divider,
} from "@mantine/core";
import {
  IconSettings,
  IconPlus,
  IconTrash,
  IconDownload,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import type { ExportCountry } from "@src/store/types";

interface Props {
  opened: boolean;
  onClose: () => void;
  onExport: () => void;
}

export function ExportSettingsModal({ opened, onClose, onExport }: Props) {
  const exportMeta = useQuizStore((s) => s.exportMeta);
  const setExportMeta = useQuizStore((s) => s.setExportMeta);
  const cloudProjectTitle = useQuizStore((s) => s.cloudProjectTitle);
  const cloudProjectClient = useQuizStore((s) => s.cloudProjectClient);
  const cloudProjectLocales = useQuizStore((s) => s.cloudProjectLocales);
  const cloudProjectRegions = useQuizStore((s) => s.cloudProjectRegions);
  const cloudProjectId = useQuizStore((s) => s.cloudProjectId);
  const setCloudProjectTitle = useQuizStore((s) => s.setCloudProjectTitle);
  const setCloudProjectClient = useQuizStore((s) => s.setCloudProjectClient);
  const setCloudProjectLocales = useQuizStore((s) => s.setCloudProjectLocales);
  const setCloudProjectRegions = useQuizStore((s) => s.setCloudProjectRegions);
  const [localMeta, setLocalMeta] = useState(exportMeta);

  /** Slugify a string for use as a folder/file name */
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  /** Migrate persisted countries that still have the old `language: string` shape */
  const normalizeCountries = (meta: typeof exportMeta) => ({
    ...meta,
    countries: meta.countries.map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legacy = c as any;
      if (!Array.isArray(c.languages)) {
        return {
          code: c.code,
          languages: legacy.language ? [legacy.language] : ["en"],
        };
      }
      return c;
    }),
  });

  // Sync local state when modal opens; auto-fill from cloud data if fields are empty
  useEffect(() => {
    if (!opened) return;

    const normalizedMeta = normalizeCountries(exportMeta);

    // Fields are "still default" when the user hasn't typed anything yet
    const fieldsAreBlank = !normalizedMeta.clientName && !normalizedMeta.adName;

    const applyCloudData = (
      title: string | null,
      client: string | null,
      locales?: string[],
      regions?: string[],
    ) => {
      const base = { ...normalizedMeta };
      if (!base.clientName && client) base.clientName = slugify(client);
      if (!base.adName && title) base.adName = slugify(title);

      const filteredLocales = (locales ?? []).filter((l) => l !== "__init__");
      // English is the base language and must always be present
      const allLocales = ["en", ...filteredLocales.filter((l) => l !== "en")];
      const filteredRegions = (regions ?? []).filter(Boolean);

      if (
        fieldsAreBlank &&
        (filteredRegions.length > 0 || filteredLocales.length > 0)
      ) {
        if (filteredRegions.length > 0) {
          // One row per region, all locales (incl. en) as languages for each
          base.countries = filteredRegions.map((r) => ({
            code: r,
            languages: allLocales,
          }));
        } else {
          // No regions — blank code row with all locales
          base.countries = [{ code: "", languages: allLocales }];
        }
      }
      setLocalMeta(base);
    };

    // If we already have the data in the store, use it immediately
    if (cloudProjectTitle || cloudProjectClient) {
      applyCloudData(
        cloudProjectTitle,
        cloudProjectClient,
        cloudProjectLocales,
        cloudProjectRegions,
      );
      return;
    }

    // If a cloud project is linked but metadata wasn't cached, fetch it now
    if (cloudProjectId) {
      fetch(`/api/cloud/projects/${cloudProjectId}`)
        .then((r) => r.json())
        .then((doc) => {
          if (!doc || doc.error) return;
          const title = doc.title ?? null;
          const client = doc.client ?? null;
          const locales: string[] = doc.availableLocales ?? [];
          const regions: string[] = doc.regions ?? [];
          // Cache in store so future opens are instant
          setCloudProjectTitle(title);
          setCloudProjectClient(client);
          setCloudProjectLocales(locales);
          setCloudProjectRegions(regions);
          applyCloudData(title, client, locales, regions);
        })
        .catch(() => {
          setLocalMeta(normalizedMeta);
        });
      return;
    }

    setLocalMeta(normalizedMeta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const updateCountry = (idx: number, patch: Partial<ExportCountry>) => {
    const updated = [...localMeta.countries];
    updated[idx] = { ...updated[idx], ...patch };
    setLocalMeta({ ...localMeta, countries: updated });
  };

  const addCountry = () => {
    setLocalMeta({
      ...localMeta,
      countries: [...localMeta.countries, { code: "", languages: ["en"] }],
    });
  };

  const removeCountry = (idx: number) => {
    if (localMeta.countries.length <= 1) return;
    setLocalMeta({
      ...localMeta,
      countries: localMeta.countries.filter((_, i) => i !== idx),
    });
  };

  const handleExport = () => {
    setExportMeta(localMeta);
    onClose();
    // Give state time to persist
    setTimeout(() => onExport(), 50);
  };

  const canExport =
    localMeta.clientName.trim() &&
    localMeta.adName.trim() &&
    localMeta.countries.every((c) => c.code.trim() && c.languages.length > 0);

  // Cloud-constrained options (empty = free-form); always include "en"
  const cloudLocales = cloudProjectLocales.filter((l) => l !== "__init__");
  const localeOptions =
    cloudLocales.length > 0
      ? ["en", ...cloudLocales.filter((l) => l !== "en")].map((l) => ({
          value: l,
          label: l,
        }))
      : [];
  const hasCloudRegions = cloudProjectRegions.length > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={
        <Group gap="xs">
          <IconSettings size={18} color="var(--mantine-color-blue-4)" />
          <Title order={4} style={{ color: "#fff" }}>
            Export Settings
          </Title>
        </Group>
      }
      styles={{
        header: {
          background: "var(--mantine-color-dark-7)",
          borderBottom: "1px solid var(--mantine-color-dark-5)",
        },
        body: {
          background: "var(--mantine-color-dark-8)",
          paddingTop: 16,
        },
        content: { background: "var(--mantine-color-dark-8)" },
      }}
      centered
      overlayProps={{ blur: 4 }}
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          Configure tracker and folder structure for exported ad. Each country
          will produce two folders (exposed + controlled).
        </Text>

        <SimpleGrid cols={2} spacing="xs">
          <TextInput
            label="Client Name"
            placeholder="e.g. chuck-e-cheese"
            size="xs"
            value={localMeta.clientName}
            onChange={(e) =>
              setLocalMeta({ ...localMeta, clientName: e.currentTarget.value })
            }
          />
          <TextInput
            label="Ad Name"
            placeholder="e.g. summer-promo"
            size="xs"
            value={localMeta.adName}
            onChange={(e) =>
              setLocalMeta({ ...localMeta, adName: e.currentTarget.value })
            }
          />
        </SimpleGrid>

        <TextInput
          label="Ad Kind"
          placeholder="e.g. bls"
          size="xs"
          value={localMeta.adKind}
          onChange={(e) =>
            setLocalMeta({ ...localMeta, adKind: e.currentTarget.value })
          }
          style={{ maxWidth: 200 }}
        />

        <Divider color="var(--mantine-color-dark-5)" />

        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm" fw={600}>
              Countries
            </Text>
            <Badge size="xs" variant="light" color="blue">
              {localMeta.countries.length}
            </Badge>
          </Group>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={12} />}
            onClick={addCountry}
            style={{ display: hasCloudRegions ? "none" : undefined }}
          >
            Add Country
          </Button>
        </Group>

        <Stack gap={8}>
          {localMeta.countries.map((c, idx) => (
            <Group key={idx} gap="xs" align="flex-end">
              <TextInput
                label={idx === 0 ? "Country Code" : undefined}
                placeholder="ksa"
                size="xs"
                value={c.code}
                onChange={(e) =>
                  updateCountry(idx, { code: e.currentTarget.value })
                }
                style={{ flex: 1 }}
              />
              {localeOptions.length > 0 ? (
                <MultiSelect
                  label={idx === 0 ? "Language(s)" : undefined}
                  placeholder="select..."
                  size="xs"
                  data={localeOptions}
                  value={c.languages}
                  onChange={(vals) => updateCountry(idx, { languages: vals })}
                  style={{ flex: 2 }}
                />
              ) : (
                <TagsInput
                  label={idx === 0 ? "Language(s)" : undefined}
                  placeholder="en"
                  size="xs"
                  value={c.languages}
                  onChange={(vals) => updateCountry(idx, { languages: vals })}
                  style={{ flex: 2 }}
                />
              )}
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => removeCountry(idx)}
                disabled={localMeta.countries.length <= 1}
              >
                <IconTrash size={12} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>

        <Divider color="var(--mantine-color-dark-5)" />

        {/* Preview folder structure */}
        {localMeta.clientName.trim() && localMeta.adName.trim() && (
          <Stack gap={4}>
            <Text size="xs" fw={600} c="dimmed">
              Export structure preview:
            </Text>
            {localMeta.countries
              .filter((c) => c.code.trim())
              .flatMap((c) => {
                const cc = c.code.toLowerCase();
                return c.languages
                  .map((l) => l.trim().toLowerCase())
                  .filter(Boolean)
                  .flatMap((ln) => [
                    `${localMeta.clientName}/${localMeta.adKind}-${ln}/${localMeta.adName}-exposed/${cc}/`,
                    `${localMeta.clientName}/${localMeta.adKind}-${ln}/${localMeta.adName}-controlled/${cc}/`,
                  ]);
              })
              .map((path, i) => (
                <Text key={i} size="10px" c="dimmed" ff="monospace">
                  {path}
                </Text>
              ))}
          </Stack>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            color="green"
            leftSection={<IconDownload size={14} />}
            disabled={!canExport}
            onClick={handleExport}
          >
            Export
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
