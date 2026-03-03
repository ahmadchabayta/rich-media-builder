"use client";

import {
  Group,
  ScrollArea,
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
import { useEffect, useRef, useState } from "react";
import { useQuizStore } from "@src/store/quizStore";
import { AdPreviewModal } from "./AdPreviewModal";

interface FrameTiming {
  enterDur: number;
  holdDur: number;
  exitDur: number;
  total: number;
}

const TRACK_H = 34;
const LABEL_W = 88;
const MIN_FRAME_PX = 60;
const PX_PER_MS = 0.09;
const DEFAULT_HOLD = 1500;

function getTimings(
  frames: ReturnType<typeof useQuizStore.getState>["quizData"]["frames"],
  holdMs: number,
): FrameTiming[] {
  return frames.map((f) => {
    const enterDur = f.animEnter?.dur ?? 400;
    const exitDur = f.animExit?.dur ?? 300;
    return {
      enterDur,
      holdDur: holdMs,
      exitDur,
      total: enterDur + holdMs + exitDur,
    };
  });
}

function msToLabel(ms: number) {
  return ms >= 1000 ? (ms / 1000).toFixed(1) + "s" : ms + "ms";
}

const ENTER_COLOR = "rgba(59,130,246,0.55)";
const HOLD_COLOR = "rgba(255,255,255,0.08)";
const EXIT_COLOR = "rgba(239,68,68,0.45)";
const ACTIVE_BORDER = "var(--mantine-color-blue-4)";
const INACTIVE_BORDER = "var(--mantine-color-dark-4)";
export function BottomPanel() {
  const frames = useQuizStore((s) => s.quizData.frames);
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const setActiveFrame = useQuizStore((s) => s.setActiveFrame);

  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [holdMs, setHoldMs] = useState(DEFAULT_HOLD);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [playheadFraction, setPlayheadFraction] = useState(0);

  const rafRef = useRef<number | null>(null);
  const holdMsRef = useRef(holdMs);
  holdMsRef.current = holdMs;

  const pbRef = useRef<{
    frameIdx: number;
    phase: "enter" | "hold" | "exit";
    phaseStartMs: number;
    pausedElapsed: number;
  } | null>(null);

  const timings = getTimings(frames, holdMs);
  const totalDuration = timings.reduce((a, t) => a + t.total, 0);
  const totalPx = Math.max(
    timings.length * MIN_FRAME_PX,
    totalDuration * PX_PER_MS,
  );

  const frameStartPx = timings.reduce<number[]>((acc, t, i) => {
    acc.push(
      i === 0
        ? 0
        : acc[i - 1] + (timings[i - 1].total / totalDuration) * totalPx,
    );
    return acc;
  }, []);

  function startLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    function loop() {
      const pb = pbRef.current;
      if (!pb) return;
      const { quizData, setActiveFrame: setFrame } = useQuizStore.getState();
      const frm = quizData.frames;
      const tms = getTimings(frm, holdMsRef.current);
      const totalDur = tms.reduce((a, t) => a + t.total, 0);
      if (totalDur === 0) return;
      const now = Date.now();
      const elapsed = now - pb.phaseStartMs;
      const t = tms[pb.frameIdx];
      if (!t) {
        pbRef.current = null;
        rafRef.current = null;
        setPlaying(false);
        setPaused(false);
        setPlayheadFraction(1);
        return;
      }
      const phaseDur =
        pb.phase === "enter"
          ? t.enterDur
          : pb.phase === "hold"
            ? t.holdDur
            : t.exitDur;
      const framesBefore = tms
        .slice(0, pb.frameIdx)
        .reduce((a, x) => a + x.total, 0);
      const phaseOffset =
        pb.phase === "enter"
          ? 0
          : pb.phase === "hold"
            ? t.enterDur
            : t.enterDur + t.holdDur;
      setPlayheadFraction(
        Math.min(
          (framesBefore + phaseOffset + Math.min(elapsed, phaseDur)) / totalDur,
          1,
        ),
      );
      if (elapsed >= phaseDur) {
        if (pb.phase === "enter") {
          pb.phase = "hold";
          pb.phaseStartMs = now;
          setFrame(pb.frameIdx);
        } else if (pb.phase === "hold") {
          pb.phase = "exit";
          pb.phaseStartMs = now;
        } else {
          const next = pb.frameIdx + 1;
          if (next >= frm.length) {
            pbRef.current = null;
            rafRef.current = null;
            setPlaying(false);
            setPaused(false);
            setPlayheadFraction(1);
            return;
          }
          pb.frameIdx = next;
          pb.phase = "enter";
          pb.phaseStartMs = now;
          setFrame(next);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function stop(jumpToStart = true) {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pbRef.current = null;
    setPlaying(false);
    setPaused(false);
    setPlayheadFraction(0);
    if (jumpToStart) useQuizStore.getState().setActiveFrame(0);
  }

  function pause() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pbRef.current) {
      pbRef.current.pausedElapsed = Date.now() - pbRef.current.phaseStartMs;
    }
    setPaused(true);
  }

  function play() {
    const store = useQuizStore.getState();
    const frm = store.quizData.frames;
    if (frm.length === 0) return;
    if (pbRef.current && pbRef.current.pausedElapsed > 0) {
      pbRef.current.phaseStartMs = Date.now() - pbRef.current.pausedElapsed;
      pbRef.current.pausedElapsed = 0;
      setPaused(false);
      startLoop();
      return;
    }
    const startIdx = store.currentPreviewIndex;
    pbRef.current = {
      frameIdx: startIdx,
      phase: "enter",
      phaseStartMs: Date.now(),
      pausedElapsed: 0,
    };
    const tms = getTimings(frm, holdMsRef.current);
    const totalDur = tms.reduce((a, t) => a + t.total, 0);
    const before = tms.slice(0, startIdx).reduce((a, t) => a + t.total, 0);
    setPlayheadFraction(totalDur > 0 ? before / totalDur : 0);
    setPlaying(true);
    setPaused(false);
    startLoop();
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (pbRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pbRef.current = null;
      setPlaying(false);
      setPaused(false);
      setPlayheadFraction(0);
    }
  }, [frames.length]);

  const playheadPx = playheadFraction * totalPx;
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
              disabled={playing}
              onClick={() => stop(true)}
            >
              <IconPlayerSkipBack size={13} />
            </ActionIcon>
          </Tooltip>
          {!playing || paused ? (
            <Tooltip
              label={paused ? "Resume" : "Play from current frame"}
              withArrow
            >
              <ActionIcon
                variant={paused ? "light" : "subtle"}
                color="green"
                size="sm"
                disabled={frames.length === 0}
                onClick={play}
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
                onClick={pause}
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
              disabled={!playing && !paused}
              onClick={() => stop(true)}
            >
              <IconPlayerStop size={13} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Skip to last frame" withArrow>
            <ActionIcon
              variant="subtle"
              size="sm"
              c="dimmed"
              disabled={playing}
              onClick={() => {
                stop(false);
                setActiveFrame(frames.length - 1);
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
              value={holdMs}
              min={0}
              max={10000}
              step={100}
              style={{ width: 72 }}
              styles={{ input: { height: 22, minHeight: 22, fontSize: 11 } }}
              onChange={(v) => typeof v === "number" && setHoldMs(v)}
              disabled={playing}
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
            {msToLabel(totalDuration)} total
          </Badge>
          <Box style={{ flex: 1 }} />
          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
            {currentPreviewIndex + 1} / {frames.length}
          </Text>
          <Divider orientation="vertical" />
          <Tooltip label="Preview ad with animations" withArrow>
            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              disabled={frames.length === 0}
              onClick={() => setPreviewOpen(true)}
            >
              <IconDeviceMobile size={13} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Box
          style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}
        >
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
          <ScrollArea type="auto" style={{ flex: 1 }} scrollbarSize={6}>
            <Box
              style={{
                position: "relative",
                padding: "0 8px",
                minWidth: totalPx + 16,
              }}
            >
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
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
