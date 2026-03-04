"use client";

import { useState } from "react";
import { Stack, Text, Group, Badge, Button } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import type { Template } from "@src/lib/templates";

import { MiniPreview } from "./MiniPreview";

export function TemplateCard({
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
            style={{
              flexShrink: 0,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
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
