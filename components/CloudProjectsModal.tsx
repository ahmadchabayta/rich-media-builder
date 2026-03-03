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
  Card,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  Divider,
  Popover,
  Avatar,
} from "@mantine/core";
import {
  IconCloudDownload,
  IconTrash,
  IconSearch,
  IconExternalLink,
  IconRefresh,
  IconCalendar,
  IconEdit,
} from "@tabler/icons-react";
import {
  useSanityCloud,
  type CloudProjectMeta,
} from "@src/hooks/useSanityCloud";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const STATUS_COLOR: Record<string, string> = {
  draft: "gray",
  "in-review": "yellow",
  approved: "blue",
  published: "green",
  paused: "orange",
  archived: "dark",
};

const STATUS_EMOJI: Record<string, string> = {
  draft: "✏️",
  "in-review": "🔍",
  approved: "✅",
  published: "🟢",
  paused: "⏸️",
  archived: "🗄️",
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "draft", label: "✏️ Draft" },
  { value: "in-review", label: "🔍 In Review" },
  { value: "approved", label: "✅ Approved" },
  { value: "published", label: "🟢 Published" },
  { value: "paused", label: "⏸️ Paused" },
  { value: "archived", label: "🗄️ Archived" },
];

interface Props {
  opened: boolean;
  onClose: () => void;
}

function daysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  return dayjs(endDate).diff(dayjs(), "day");
}

function ProjectCard({
  project,
  onLoad,
  onDelete,
}: {
  project: CloudProjectMeta;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const days = daysRemaining(project.endDate);
  const isExpired = days !== null && days < 0;
  const isEndingSoon = days !== null && days >= 0 && days <= 3;

  return (
    <Card withBorder padding="sm" radius="md" style={{ position: "relative" }}>
      {/* Thumbnail or placeholder */}
      <Card.Section>
        {project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            style={{
              width: "100%",
              height: 100,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <Center
            style={{
              height: 100,
              background: "var(--mantine-color-dark-6)",
              fontSize: 32,
            }}
          >
            🎯
          </Center>
        )}
      </Card.Section>

      <Stack gap={6} mt="sm">
        <Group justify="space-between" wrap="nowrap" gap={4}>
          <Text fw={700} size="sm" lineClamp={1} style={{ flex: 1 }}>
            {project.title}
          </Text>
          <Badge
            size="xs"
            color={STATUS_COLOR[project.status] ?? "gray"}
            variant="light"
            style={{ flexShrink: 0 }}
          >
            {STATUS_EMOJI[project.status] ?? ""} {project.status}
          </Badge>
        </Group>

        <Group gap={4} wrap="wrap">
          {project.adSizeW && project.adSizeH && (
            <Badge size="xs" color="indigo" variant="dot">
              {project.adSizeW}×{project.adSizeH}
            </Badge>
          )}
          {project.format && (
            <Badge size="xs" color="violet" variant="dot">
              {project.format}
            </Badge>
          )}
          {project.client && (
            <Badge size="xs" color="gray" variant="outline">
              {project.client}
            </Badge>
          )}
        </Group>

        {project.publishDate && (
          <Group gap={4}>
            <IconCalendar size={11} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              {dayjs(project.publishDate).format("MMM D, YYYY")}
              {project.endDate &&
                ` → ${dayjs(project.endDate).format("MMM D")}`}
            </Text>
          </Group>
        )}

        {days !== null && (
          <Text
            size="xs"
            c={isExpired ? "red" : isEndingSoon ? "orange" : "dimmed"}
            fw={isEndingSoon || isExpired ? 700 : undefined}
          >
            {isExpired
              ? `⚠️ Expired ${Math.abs(days)}d ago`
              : `${days}d remaining`}
          </Text>
        )}

        {project.platforms && project.platforms.length > 0 && (
          <Group gap={3}>
            {project.platforms.slice(0, 4).map((p) => (
              <Badge key={p} size="xs" variant="default" color="dark">
                {p.toUpperCase()}
              </Badge>
            ))}
            {project.platforms.length > 4 && (
              <Text size="xs" c="dimmed">
                +{project.platforms.length - 4}
              </Text>
            )}
          </Group>
        )}

        <Text size="xs" c="dimmed">
          Updated {dayjs(project._updatedAt).fromNow()}
        </Text>

        <Divider />

        <Group justify="space-between">
          <Button
            size="xs"
            onClick={onLoad}
            leftSection={<IconCloudDownload size={12} />}
          >
            Load
          </Button>
          <Group gap={4}>
            <Tooltip label="Open in Studio" withArrow>
              <ActionIcon
                variant="subtle"
                size="sm"
                component="a"
                href={`/studio/desk/adProject;${project._id}`}
                target="_blank"
              >
                <IconExternalLink size={12} />
              </ActionIcon>
            </Tooltip>
            <Popover
              opened={deleteConfirm}
              onChange={setDeleteConfirm}
              withArrow
              shadow="md"
              position="top"
            >
              <Popover.Target>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <IconTrash size={12} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Text size="xs" mb={6}>
                  Delete permanently?
                </Text>
                <Group gap={6}>
                  <Button
                    size="xs"
                    color="red"
                    onClick={() => {
                      setDeleteConfirm(false);
                      onDelete();
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </Group>
              </Popover.Dropdown>
            </Popover>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}

export function CloudProjectsModal({ opened, onClose }: Props) {
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
    const ok = await loadFromCloud(id);
    if (ok) onClose();
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
