import { Box, Stack, Text } from "@mantine/core";
import type { Template } from "@src/lib/templates";

export function MiniPreview({ tpl }: { tpl: Template }) {
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
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
        }}
      />

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
      <Stack
        gap={4}
        px={10}
        style={{ position: "absolute", top: 22, left: 0, right: 0 }}
      >
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
