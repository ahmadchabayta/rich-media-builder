"use client";

import { useState } from "react";
import {
  Modal,
  Badge,
  Text,
  Title,
  Group,
  SimpleGrid,
  Box,
  UnstyledButton,
  Divider,
} from "@mantine/core";
import { IconTemplate, IconBolt, IconStar } from "@tabler/icons-react";
import { TEMPLATES } from "@src/lib/templates";
import { useQuizStore } from "@src/store/quizStore";
import type { Template } from "@src/lib/templates";

import { TemplateCard } from "./TemplateCard";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "quiz", label: "Quiz" },
  { value: "poll", label: "Poll" },
  { value: "sport", label: "Sport" },
  { value: "promo", label: "Promo" },
  { value: "news", label: "News" },
  { value: "brand", label: "Brand" },
];

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function TemplateGallery({ opened, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const loadProject = useQuizStore((s) => s.loadProject);
  const addFrame = useQuizStore((s) => s.addFrame);

  const filtered =
    activeCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUse = (tpl: Template) => {
    if (
      !window.confirm(
        "Load this template? Your current project will be replaced.",
      )
    )
      return;
    loadProject(tpl.snapshot);
    onClose();
  };

  const handleDuplicate = (tpl: Template) => {
    const frames = tpl.snapshot.quizData?.frames;
    if (!frames || frames.length === 0) return;
    for (const frame of frames) {
      // Give each frame + objects new IDs to avoid collisions
      const newFrame = JSON.parse(JSON.stringify(frame));
      newFrame.id = String(Date.now() + Math.random());
      for (const obj of newFrame.objects) {
        obj.id = String(Date.now() + Math.random());
      }
      addFrame(newFrame);
    }
    onClose();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    import("@mantine/notifications").then(({ notifications }) =>
      notifications.show({
        title: "Template duplicated",
        message: `Added ${frames.length} frame${frames.length !== 1 ? "s" : ""} to your project.`,
        color: "teal",
        autoClose: 3000,
      }),
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="900px"
      title={
        <Group gap="xs">
          <IconTemplate size={18} color="var(--mantine-color-blue-4)" />
          <Title order={4} style={{ color: "#fff" }}>
            Templates
          </Title>
          <Badge size="sm" variant="light" color="blue">
            {TEMPLATES.length} included
          </Badge>
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
        content: {
          background: "var(--mantine-color-dark-8)",
        },
      }}
      centered
      overlayProps={{ blur: 4 }}
    >
      {/* Filter chips */}
      <Group gap={6} mb={16}>
        {CATEGORIES.map((cat) => (
          <UnstyledButton
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
              border: "1px solid",
              borderColor:
                activeCategory === cat.value
                  ? "var(--mantine-color-blue-5)"
                  : "var(--mantine-color-dark-4)",
              background:
                activeCategory === cat.value
                  ? "var(--mantine-color-blue-9)"
                  : "var(--mantine-color-dark-6)",
              color:
                activeCategory === cat.value
                  ? "var(--mantine-color-blue-3)"
                  : "var(--mantine-color-dimmed)",
              transition: "all 120ms ease",
            }}
          >
            {cat.label}
          </UnstyledButton>
        ))}
      </Group>

      <Divider color="var(--mantine-color-dark-5)" mb={16} />

      {/* Info bar */}
      <Group mb={14} gap="xs">
        <IconStar size={12} color="var(--mantine-color-yellow-4)" />
        <Text size="xs" c="dimmed">
          All templates are fully editable — swap text, colors, images and
          animations after loading.
        </Text>
        <IconBolt size={12} color="var(--mantine-color-yellow-4)" />
      </Group>

      {/* Grid */}
      <SimpleGrid
        cols={{
          base: 2,
          sm: 3,
          lg: filtered.length >= 4 ? 3 : filtered.length,
        }}
        spacing="md"
      >
        {filtered.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            tpl={tpl}
            onUse={handleUse}
            onDuplicate={handleDuplicate}
          />
        ))}
      </SimpleGrid>

      {filtered.length === 0 && (
        <Box py={40} style={{ textAlign: "center" }}>
          <Text c="dimmed">No templates in this category yet.</Text>
        </Box>
      )}
    </Modal>
  );
}
