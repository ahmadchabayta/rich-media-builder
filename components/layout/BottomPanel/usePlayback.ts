import { useEffect, useRef, useState } from "react";
import { useQuizStore } from "@src/store/quizStore";
import { DEFAULT_HOLD, MIN_FRAME_PX, getTimings } from "./timelineConstants";

export function usePlayback() {
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

  const pbRef = useRef<{
    frameIdx: number;
    phase: "enter" | "hold" | "exit";
    phaseStartMs: number;
    pausedElapsed: number;
  } | null>(null);

  const timings = getTimings(frames, holdMs);
  const totalDuration = timings.reduce((a, t) => a + t.total, 0);
  const totalPx = Math.max(timings.length * MIN_FRAME_PX, totalDuration * 0.09);

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
        useQuizStore.getState().setPlayback(null);
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
          useQuizStore
            .getState()
            .setPlayback({ frameIdx: pb.frameIdx, phase: "hold" });
        } else if (pb.phase === "hold") {
          pb.phase = "exit";
          pb.phaseStartMs = now;
          useQuizStore
            .getState()
            .setPlayback({ frameIdx: pb.frameIdx, phase: "exit" });
        } else {
          const next = pb.frameIdx + 1;
          if (next >= frm.length) {
            pbRef.current = null;
            rafRef.current = null;
            setPlaying(false);
            setPaused(false);
            setPlayheadFraction(1);
            useQuizStore.getState().setPlayback(null);
            return;
          }
          pb.frameIdx = next;
          pb.phase = "enter";
          pb.phaseStartMs = now;
          setFrame(next);
          useQuizStore
            .getState()
            .setPlayback({ frameIdx: next, phase: "enter" });
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
    useQuizStore.getState().setPlayback(null);
    if (jumpToStart) useQuizStore.getState().setActiveFrame(0);
  }

  function pause() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pbRef.current)
      pbRef.current.pausedElapsed = Date.now() - pbRef.current.phaseStartMs;
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
    store.setPlayback({ frameIdx: startIdx, phase: "enter" });
    const tms = getTimings(frm, holdMsRef.current);
    const totalDur = tms.reduce((a, t) => a + t.total, 0);
    const before = tms.slice(0, startIdx).reduce((a, t) => a + t.total, 0);
    setPlayheadFraction(totalDur > 0 ? before / totalDur : 0);
    setPlaying(true);
    setPaused(false);
    startLoop();
  }

  useEffect(() => {
    holdMsRef.current = holdMs;
  }, [holdMs]);
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );
  useEffect(() => {
    if (pbRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pbRef.current = null;
      const timeout = setTimeout(() => {
        setPlaying(false);
        setPaused(false);
        setPlayheadFraction(0);
        useQuizStore.getState().setPlayback(null);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [frames.length]);

  return {
    frames,
    currentPreviewIndex,
    setActiveFrame,
    playing,
    paused,
    holdMs,
    setHoldMs,
    previewOpen,
    setPreviewOpen,
    playheadFraction,
    timings,
    totalDuration,
    totalPx,
    frameStartPx,
    play,
    pause,
    stop,
    playheadPx: playheadFraction * totalPx,
  };
}
