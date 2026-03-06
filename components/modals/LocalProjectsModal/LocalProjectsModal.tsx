"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Stack,
  Group,
  Button,
  Text,
  TextInput,
  SimpleGrid,
  Paper,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconFolderOpen,
  IconTrash,
  IconEdit,
  IconRefresh,
  IconDownload,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useQuizStore, type ProjectSnapshot } from "@src/store/quizStore";
import {
  deleteLocalProject,
  listLocalProjects,
  loadLocalProject,
  renameLocalProject,
  saveLocalProject,
  type LocalProjectMeta,
} from "@src/lib/localProjects";
import { useConfirmDialog } from "@src/context/ConfirmDialogContext";

interface Props {
  opened: boolean;
  onClose: () => void;
}

function fmt(ts: number) {
  return new Date(ts).toLocaleString();
}

export function LocalProjectsModal({ opened, onClose }: Props) {
  const { confirm } = useConfirmDialog();

  const [projects, setProjects] = useState<LocalProjectMeta[]>([]);
  const [search, setSearch] = useState("");
  const [savingName, setSavingName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProject = useQuizStore((s) => s.loadProject);
  const markSaved = useQuizStore((s) => s.markSaved);

  const refresh = async () => {
    const next = await listLocalProjects();
    setProjects(next);
  };

  useEffect(() => {
    if (!opened) return;
    void refresh();
  }, [opened]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, search]);

  const createSnapshot = (): ProjectSnapshot => {
    const { quizData, defaultW, defaultH, currentPreviewIndex } =
      useQuizStore.getState();
    return {
      version: 1,
      quizData,
      defaultW,
      defaultH,
      currentPreviewIndex,
    };
  };

  const handleSaveCurrent = async () => {
    const nextName =
      savingName.trim() || `Project ${new Date().toLocaleDateString()}`;
    setSaving(true);
    try {
      await saveLocalProject({ name: nextName, snapshot: createSnapshot() });
      markSaved();
      setSavingName("");
      await refresh();
      notifications.show({
        title: "Saved locally",
        message: `${nextName} is available in local projects.`,
        color: "teal",
        autoClose: 2200,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (id: string) => {
    const ok = await confirm({
      title: "Load local project",
      message: "Load this local project and replace the current canvas?",
      confirmLabel: "Load",
      confirmColor: "blue",
    });
    if (!ok) return;

    const data = await loadLocalProject(id);
    if (!data) {
      notifications.show({
        title: "Missing project data",
        message: "This local project could not be loaded.",
        color: "red",
      });
      return;
    }

    loadProject(data);
    notifications.show({
      title: "Project loaded",
      message: "Local project opened successfully.",
      color: "teal",
      autoClose: 2200,
    });
    onClose();
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Delete local project",
      message: `Delete ${name} from local storage? This can be undone only if re-saved.`,
      confirmLabel: "Delete",
      confirmColor: "red",
      requireText: name,
    });
    if (!ok) return;

    await deleteLocalProject(id);
    await refresh();
    notifications.show({
      title: "Deleted",
      message: `${name} was removed from local storage.`,
      color: "red",
      autoClose: 2200,
    });
  };

  const handleRename = async (id: string, currentName: string) => {
    const nextName = window.prompt("Rename local project", currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    await renameLocalProject(id, nextName);
    await refresh();
  };

  const handleExport = async (id: string, name: string) => {
    const data = await loadLocalProject(id);
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Local Projects"
      size="xl"
      centered
    >
      <Stack gap="sm">
        <Group align="flex-end" gap="xs">
          <TextInput
            label="Save current project as"
            placeholder="Project name"
            value={savingName}
            onChange={(e) => setSavingName(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconDeviceFloppy size={14} />}
            onClick={() => void handleSaveCurrent()}
            loading={saving}
          >
            Save Local
          </Button>
        </Group>

        <Group gap="xs">
          <TextInput
            placeholder="Search local projects…"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Tooltip label="Refresh" withArrow>
            <ActionIcon variant="default" onClick={() => void refresh()}>
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {filtered.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            No local projects yet. Save your current project to create one.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            {filtered.map((p) => (
              <Paper key={p.id} withBorder p="sm" radius="md">
                <Stack gap={6}>
                  <Group justify="space-between" align="flex-start">
                    <Text fw={600} lineClamp={1}>
                      {p.name}
                    </Text>
                    <Badge size="xs" variant="light">
                      {p.frameCount} frames
                    </Badge>
                  </Group>

                  <Text size="xs" c="dimmed">
                    Updated: {fmt(p.updatedAt)}
                  </Text>

                  <Group gap={6} mt={4}>
                    <Button
                      size="xs"
                      leftSection={<IconFolderOpen size={12} />}
                      onClick={() => void handleLoad(p.id)}
                    >
                      Load
                    </Button>
                    <Tooltip label="Rename" withArrow>
                      <ActionIcon
                        size="sm"
                        variant="default"
                        onClick={() => void handleRename(p.id, p.name)}
                      >
                        <IconEdit size={12} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Export JSON" withArrow>
                      <ActionIcon
                        size="sm"
                        variant="default"
                        onClick={() => void handleExport(p.id, p.name)}
                      >
                        <IconDownload size={12} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete" withArrow>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => void handleDelete(p.id, p.name)}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Modal>
  );
}
