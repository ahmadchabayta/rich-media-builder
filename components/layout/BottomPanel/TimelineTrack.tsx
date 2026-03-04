"use client";

import { Box, ScrollArea, Text } from "@mantine/core";
import type { Frame } from "@src/lib/types";
import {
  TRACK_H,
  LABEL_W,
  ENTER_COLOR,
  HOLD_COLOR,
  EXIT_COLOR,
  ACTIVE_BORDER,
  INACTIVE_BORDER,
  msToLabel,
  type FrameTiming,
} from "./timelineConstants";

interface TimelineTrackProps {
  frames: Frame[];
  timings: FrameTiming[];
  totalDuration: number;
  totalPx: number;
  frameStartPx: number[];
  currentPreviewIndex: number;
  playing: boolean;
  paused: boolean;
  playheadPx: number;
  setActiveFrame: (i: number) => void;
}

export function TimelineTrack({
  frames,
  timings,
  totalDuration,
  totalPx,
  frameStartPx,
  currentPreviewIndex,
  playing,
  paused,
  playheadPx,
  setActiveFrame,
}: TimelineTrackProps) {
  return (
    <Box style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Labels column */}
      <Box
        style={{
          width: LABEL_W,
          flexShrink: 0,
          borderRight: "1px solid var(--mantine-color-dark-4)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Text
          size="xs"
          c="dimmed"
          px={8}
          style={{
            lineHeight: `${TRACK_H}px`,
            borderBottom: "1px solid var(--mantine-color-dark-5)",
            flexShrink: 0,
          }}
        >
          Frames
        </Text>
        <Text
          size="xs"
          c="dimmed"
          px={8}
          style={{ lineHeight: `${TRACK_H}px`, opacity: 0.3 }}
        >
          Audio
        </Text>
      </Box>

      {/* Scrollable tracks */}
      <ScrollArea type="auto" style={{ flex: 1 }} scrollbarSize={6}>
        <Box
          style={{
            position: "relative",
            padding: "0 8px",
            minWidth: totalPx + 16,
          }}
        >
          {/* Frame blocks row */}
          <Box
            style={{
              height: TRACK_H,
              position: "relative",
              alignItems: "center",
              display: "flex",
            }}
          >
            {frames.map((f, i) => {
              const t = timings[i];
              const framePx = (t.total / totalDuration) * totalPx;
              const isActive = i === currentPreviewIndex;
              return (
                <Box
                  key={f.id}
                  onClick={() => {
                    if (!playing) setActiveFrame(i);
                  }}
                  style={{
                    width: framePx,
                    height: TRACK_H - 8,
                    flexShrink: 0,
                    borderRadius: 5,
                    border: `1.5px solid ${isActive ? ACTIVE_BORDER : INACTIVE_BORDER}`,
                    background: isActive
                      ? "rgba(59,130,246,0.10)"
                      : "var(--mantine-color-dark-6)",
                    cursor: playing ? "default" : "pointer",
                    overflow: "hidden",
                    display: "flex",
                    position: "relative",
                    marginRight: 4,
                    boxShadow: isActive
                      ? "0 0 0 1px var(--mantine-color-blue-6)"
                      : undefined,
                    transition: "border-color 150ms, box-shadow 150ms",
                  }}
                >
                  <Box
                    style={{
                      width: `${(t.enterDur / t.total) * 100}%`,
                      height: "100%",
                      background: ENTER_COLOR,
                      borderRight: "1px solid rgba(255,255,255,0.08)",
                      flexShrink: 0,
                    }}
                  />
                  <Box
                    style={{
                      width: `${(t.holdDur / t.total) * 100}%`,
                      height: "100%",
                      background: HOLD_COLOR,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {framePx > 64 && (
                      <Text
                        size="9px"
                        c={isActive ? "blue.3" : "dimmed"}
                        fw={700}
                        style={{
                          whiteSpace: "nowrap",
                          letterSpacing: "0.05em",
                        }}
                      >
                        F{i + 1}
                        {f.isEndFrame ? " END" : ""}
                      </Text>
                    )}
                  </Box>
                  <Box
                    style={{
                      width: `${(t.exitDur / t.total) * 100}%`,
                      height: "100%",
                      background: EXIT_COLOR,
                      borderLeft: "1px solid rgba(255,255,255,0.08)",
                      flexShrink: 0,
                    }}
                  />
                </Box>
              );
            })}
          </Box>

          {/* Duration labels */}
          <Box style={{ position: "relative", height: 16, marginTop: 2 }}>
            {timings.map((t, i) => {
              const framePx = (t.total / totalDuration) * totalPx;
              return (
                <Box
                  key={i}
                  style={{
                    position: "absolute",
                    left: frameStartPx[i] + framePx / 2 - 16,
                    top: 0,
                    width: 32,
                    textAlign: "center",
                  }}
                >
                  <Text size="9px" c="dimmed" opacity={0.5}>
                    {msToLabel(t.total)}
                  </Text>
                </Box>
              );
            })}
          </Box>

          {/* Audio placeholder */}
          <Box
            style={{
              height: TRACK_H,
              display: "flex",
              alignItems: "center",
              opacity: 0.25,
            }}
          >
            <Box
              style={{
                width: totalPx,
                height: TRACK_H - 14,
                borderRadius: 4,
                border: "1px dashed var(--mantine-color-dark-4)",
                display: "flex",
                alignItems: "center",
                paddingLeft: 8,
              }}
            >
              <Text size="xs" c="dimmed" fs="italic">
                No audio track
              </Text>
            </Box>
          </Box>

          {/* Playhead */}
          {(playing || paused) && (
            <Box
              style={{
                position: "absolute",
                top: 0,
                left: 8 + playheadPx,
                bottom: 0,
                width: 2,
                background: "var(--mantine-color-yellow-4)",
                borderRadius: 2,
                pointerEvents: "none",
                zIndex: 10,
                boxShadow: "0 0 6px var(--mantine-color-yellow-5)",
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  top: -1,
                  left: -4,
                  width: 10,
                  height: 10,
                  background: "var(--mantine-color-yellow-4)",
                  clipPath: "polygon(50% 100%, 0 0, 100% 0)",
                }}
              />
            </Box>
          )}
        </Box>
      </ScrollArea>
    </Box>
  );
}
