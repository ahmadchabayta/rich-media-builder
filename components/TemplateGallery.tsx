"use client";
import { useState } from "react";
import {
  Modal,
  Badge,
  Button,
  Text,
  Title,
  Group,
  Stack,
  SimpleGrid,
  Box,
  UnstyledButton,
  Divider,
} from "@mantine/core";
import {
  IconTemplate,
  IconBolt,
  IconStar,
  IconCheck,
} from "@tabler/icons-react";
import { TEMPLATES, type Template } from "@src/lib/templates";
import { useQuizStore } from "@src/store/quizStore";

// ─── Mini preview renderer ────────────────────────────────────────────────────
function MiniPreview({ tpl }: { tpl: Template }) {
  const accent = tpl.accentColor;

  return (
    <Box
      style={{
        width: "100%",
        aspectRatio: "2/3",
        borderRadius: 8,
        background: tpl.previewGradient,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${accent}22`,
        flexShrink: 0,
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />

      {/* Glow circle */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          right: "-10%",
          width: "60%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: `${accent}18`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          left: "-15%",
          width: "55%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: `${accent}10`,
        }}
      />

      {/* Frame count pill */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: `${accent}33`,
          border: `1px solid ${accent}55`,
          borderRadius: 10,
          padding: "2px 7px",
          fontSize: 9,
          fontWeight: 700,
          color: accent,
          letterSpacing: 1,
        }}
      >
        {tpl.snapshot.quizData.frames.length}F
      </div>

      {/* Content area */}
      <Stack gap={4} px={10} style={{ position: "absolute", top: 22, left: 0, right: 0 }}>
        {/* Category tag */}
        <Text
          size="8px"
          fw={700}
          style={{
            color: accent,
            letterSpacing: 2,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {tpl.category}
        </Text>

        {/* Title lines */}
        {tpl.name.split(" ").map((word, i) => (
          <Text
            key={i}
            size={i === 0 ? "15px" : "13px"}
            fw={900}
            style={{
              color: i === 0 ? "#ffffff" : accent,
              textAlign: "center",
              lineHeight: 1.1,
              letterSpacing: -0.5,
            }}
          >
            {word.toUpperCase()}
          </Text>
        ))}

        {/* Thin divider */}
        <div
          style={{
            height: 1,
            background: `${accent}44`,
            margin: "4px 20% 0",
          }}
        />
      </Stack>

      {/* Answer button previews at bottom */}
      <Stack
        gap={3}
        px={10}
        style={{ position: "absolute", bottom: 12, left: 0, right: 0 }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 12,
              borderRadius: 4,
              background: `${accent}20`,
              border: `1px solid ${accent}30`,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

// ─── Category filters ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "quiz", label: "Quiz" },
  { value: "poll", label: "Poll" },
  { value: "sport", label: "Sport" },
  { value: "promo", label: "Promo" },
  { value: "news", label: "News" },
  { value: "brand", label: "Brand" },
];

// ─── Single template card ─────────────────────────────────────────────────────
function TemplateCard({
  tpl,
  onUse,
}: {
  tpl: Template;
  onUse: (tpl: Template) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = tpl.accentColor;

  return (
    <Stack
      gap={10}
      style={{
        background: hovered
          ? "var(--mantine-color-dark-6)"
          : "var(--mantine-color-dark-7)",
        border: `1px solid ${hovered ? accent + "55" : "var(--mantine-color-dark-4)"}`,
        borderRadius: 12,
        padding: 14,
        transition: "all 150ms ease",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview */}
      <MiniPreview tpl={tpl} />

      {/* Info */}
      <Stack gap={4}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text fw={700} size="sm" style={{ color: "#fff", lineHeight: 1.2 }}>
            {tpl.name}
          </Text>
          <Badge
            size="xs"
            variant="dot"
            color="gray"
            style={{ flexShrink: 0, textTransform: "uppercase", letterSpacing: 1 }}
          >
            {tpl.category}
          </Badge>
        </Group>

        <Text size="11px" c="dimmed" style={{ lineHeight: 1.45 }}>
          {tpl.description}
        </Text>

        {/* Tags row */}
        <Group gap={4} mt={2}>
          {tpl.tags.map((tag) => (
            <Badge
              key={tag}
              size="xs"
              variant="outline"
              style={{
                borderColor: `${accent}44`,
                color: accent,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {tag}
            </Badge>
          ))}
        </Group>
      </Stack>

      {/* Use button */}
      <Button
        size="xs"
        fullWidth
        variant={hovered ? "filled" : "light"}
        color="gray"
        leftSection={<IconCheck size={12} />}
        onClick={() => onUse(tpl)}
        style={{
          background: hovered ? accent : undefined,
          borderColor: hovered ? accent : undefined,
          color: hovered ? "#fff" : undefined,
          transition: "all 150ms ease",
        }}
      >
        Use Template
      </Button>
    </Stack>
  );
}

// ─── Main gallery component ────────────────────────────────────────────────────
interface Props {
  opened: boolean;
  onClose: () => void;
}

export function TemplateGallery({ opened, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const loadProject = useQuizStore((s) => s.loadProject);

  const filtered =
    activeCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUse = (tpl: Template) => {
    loadProject(tpl.snapshot);
    onClose();
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
          All templates are fully editable — swap text, colors, images and animations after loading.
        </Text>
        <IconBolt size={12} color="var(--mantine-color-yellow-4)" />
      </Group>

      {/* Grid */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: filtered.length >= 4 ? 3 : filtered.length }} spacing="md">
        {filtered.map((tpl) => (
          <TemplateCard key={tpl.id} tpl={tpl} onUse={handleUse} />
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
