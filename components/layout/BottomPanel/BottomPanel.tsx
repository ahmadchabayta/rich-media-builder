"use client";

import {
  Group,
  Box,
  Text,
  ActionIcon,
  Tooltip,
  Divider,
  Badge,
  NumberInput,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconClock,
  IconDeviceMobile,
} from "@tabler/icons-react";
import { AdPreviewModal } from "@src/components/modals/AdPreviewModal";
import { ENTER_COLOR, EXIT_COLOR, msToLabel } from "./timelineConstants";
import { usePlayback } from "./usePlayback";
import { TimelineTrack } from "./TimelineTrack";

export function BottomPanel() {
  const pb = usePlayback();

  return (
    <>
      <Box
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Transport controls bar */}
        <Group
          px="sm"
          gap={6}
          style={{
            height: 36,
            flexShrink: 0,
            borderBottom: "1px solid var(--mantine-color-dark-4)",
            flexWrap: "nowrap",
          }}
        >
          <Text
            size="xs"
            c="dimmed"
            fw={700}
            tt="uppercase"
            style={{ letterSpacing: "0.08em", flexShrink: 0 }}
          >
            Timeline
          </Text>
          <Divider orientation="vertical" />

          <Tooltip label="Go to first frame" withArrow>
            <ActionIcon
              variant="subtle"
              size="sm"
              c="dimmed"
              disabled={pb.playing}
              onClick={() => pb.stop(true)}
            >
              <IconPlayerSkipBack size={13} />
            </ActionIcon>
          </Tooltip>

          {!pb.playing || pb.paused ? (
            <Tooltip
              label={pb.paused ? "Resume" : "Play from current frame"}
              withArrow
            >
              <ActionIcon
                variant={pb.paused ? "light" : "subtle"}
                color="green"
                size="sm"
                disabled={pb.frames.length === 0}
                onClick={pb.play}
              >
                <IconPlayerPlay size={13} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <Tooltip label="Pause" withArrow>
              <ActionIcon
                variant="light"
                color="yellow"
                size="sm"
                onClick={pb.pause}
              >
                <IconPlayerPause size={13} />
              </ActionIcon>
            </Tooltip>
          )}

          <Tooltip label="Stop and reset" withArrow>
            <ActionIcon
              variant="subtle"
              size="sm"
              c="dimmed"
              disabled={!pb.playing && !pb.paused}
              onClick={() => pb.stop(true)}
            >
              <IconPlayerStop size={13} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Skip to last frame" withArrow>
            <ActionIcon
              variant="subtle"
              size="sm"
              c="dimmed"
              disabled={pb.playing}
              onClick={() => {
                pb.stop(false);
                pb.setActiveFrame(pb.frames.length - 1);
              }}
            >
              <IconPlayerSkipForward size={13} />
            </ActionIcon>
          </Tooltip>

          <Divider orientation="vertical" />
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <IconClock size={12} opacity={0.4} />
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              Hold:
            </Text>
            <NumberInput
              size="xs"
              value={pb.holdMs}
              min={0}
              max={10000}
              step={100}
              style={{ width: 72 }}
              styles={{ input: { height: 22, minHeight: 22, fontSize: 11 } }}
              onChange={(v) => typeof v === "number" && pb.setHoldMs(v)}
              disabled={pb.playing}
            />
            <Text size="xs" c="dimmed">
              ms
            </Text>
          </Group>

          <Divider orientation="vertical" />
          <Badge
            size="xs"
            variant="outline"
            color="gray"
            style={{ flexShrink: 0 }}
          >
            {msToLabel(pb.totalDuration)} total
          </Badge>
          <Box style={{ flex: 1 }} />
          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
            {pb.currentPreviewIndex + 1} / {pb.frames.length}
          </Text>
          <Divider orientation="vertical" />

          <Tooltip label="Preview ad with animations" withArrow>
            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              disabled={pb.frames.length === 0}
              onClick={() => pb.setPreviewOpen(true)}
            >
              <IconDeviceMobile size={13} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Timeline track area */}
        <TimelineTrack
          frames={pb.frames}
          timings={pb.timings}
          totalDuration={pb.totalDuration}
          totalPx={pb.totalPx}
          frameStartPx={pb.frameStartPx}
          currentPreviewIndex={pb.currentPreviewIndex}
          playing={pb.playing}
          paused={pb.paused}
          playheadPx={pb.playheadPx}
          setActiveFrame={pb.setActiveFrame}
        />

        {/* Legend bar */}
        <Group
          px="sm"
          gap="md"
          style={{
            height: 22,
            flexShrink: 0,
            borderTop: "1px solid var(--mantine-color-dark-5)",
            background: "var(--mantine-color-dark-8)",
          }}
        >
          <Group gap={4}>
            <Box
              style={{
                width: 10,
                height: 8,
                borderRadius: 2,
                background: ENTER_COLOR,
              }}
            />
            <Text size="9px" c="dimmed">
              Enter
            </Text>
          </Group>
          <Group gap={4}>
            <Box
              style={{
                width: 10,
                height: 8,
                borderRadius: 2,
                background: "rgba(255,255,255,0.12)",
              }}
            />
            <Text size="9px" c="dimmed">
              Hold
            </Text>
          </Group>
          <Group gap={4}>
            <Box
              style={{
                width: 10,
                height: 8,
                borderRadius: 2,
                background: EXIT_COLOR,
              }}
            />
            <Text size="9px" c="dimmed">
              Exit
            </Text>
          </Group>
          <Group gap={4}>
            <Box
              style={{
                width: 10,
                height: 3,
                borderRadius: 1,
                background: "var(--mantine-color-yellow-4)",
              }}
            />
            <Text size="9px" c="dimmed">
              Playhead
            </Text>
          </Group>
          <Text
            size="9px"
            c="dimmed"
            opacity={0.4}
            style={{ marginLeft: "auto" }}
          >
            Click frame to select
          </Text>
        </Group>
      </Box>

      <AdPreviewModal
        opened={pb.previewOpen}
        onClose={() => pb.setPreviewOpen(false)}
      />
    </>
  );
}
