"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Stack,
  Text,
  Group,
  Badge,
  Button,
  TextInput,
  Select,
  SimpleGrid,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  Avatar,
} from "@mantine/core";
import {
  IconCloudDownload,
  IconSearch,
  IconExternalLink,
  IconRefresh,
  IconEdit,
} from "@tabler/icons-react";
import { useSanityCloud } from "@src/hooks/useSanityCloud";
import { useConfirmDialog } from "@src/context/ConfirmDialogContext";

import { STATUS_FILTER_OPTIONS, ProjectCard } from "./ProjectCard";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CloudProjectsModal({ opened, onClose }: Props) {
  const { confirm } = useConfirmDialog();
  const {
    projects,
    projectsLoading,
    listProjects,
    loadFromCloud,
    deleteProject,
  } = useSanityCloud();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (opened) listProjects();
  }, [opened, listProjects]);

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.client ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleLoad = async (id: string) => {
    const ok = await confirm({
      title: "Load cloud project",
      message: "Your current project will be replaced.",
      confirmLabel: "Load",
      confirmColor: "blue",
    });
    if (!ok) return;
    const loaded = await loadFromCloud(id);
    if (loaded) onClose();
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCloudDownload size={16} />
          <Text fw={700}>Cloud Projects</Text>
          {projects.length > 0 && (
            <Badge size="xs" color="blue" variant="light">
              {projects.length}
            </Badge>
          )}
        </Group>
      }
      size="xl"
    >
      <Stack gap="md">
        {/* Search + filter row */}
        <Group gap="sm">
          <TextInput
            placeholder="Search by name or client…"
            leftSection={<IconSearch size={13} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            data={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v ?? "all")}
            style={{ width: 160 }}
          />
          <Tooltip label="Refresh" withArrow>
            <ActionIcon
              variant="default"
              onClick={listProjects}
              loading={projectsLoading}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Manage in Studio" withArrow>
            <ActionIcon
              variant="light"
              color="violet"
              component="a"
              href="/studio"
              target="_blank"
            >
              <IconExternalLink size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {projectsLoading ? (
          <Center py="xl">
            <Loader size="md" />
          </Center>
        ) : filtered.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <Avatar size={48} radius="xl" color="dark">
                🎯
              </Avatar>
              <Text c="dimmed" size="sm">
                {projects.length === 0
                  ? "No cloud projects yet. Save your first ad to get started."
                  : "No projects match your search."}
              </Text>
              {projects.length === 0 && (
                <Button
                  size="xs"
                  variant="light"
                  component="a"
                  href="/studio"
                  target="_blank"
                  leftSection={<IconEdit size={12} />}
                >
                  Open Studio
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            {filtered.map((p) => (
              <ProjectCard
                key={p._id}
                project={p}
                onLoad={() => handleLoad(p._id)}
                onDelete={() => handleDelete(p._id)}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Modal>
  );
}
