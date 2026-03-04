"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell, Box, Center, Loader, Text, Stack } from "@mantine/core";
import { DragContext } from "@src/context/DragContext";
import { useDrag } from "@src/hooks/useDrag";
import { useQuizStore } from "@src/store/quizStore";
import { AppHeader } from "@src/components/layout/AppHeader";
import { Sidebar } from "@src/components/layout/Sidebar";
import { Board } from "@src/components/canvas/Board";
import { RightPanel } from "@src/components/layout/RightPanel";
import { BottomPanel } from "@src/components/layout/BottomPanel";
import { ContextMenu } from "@src/components/canvas/ContextMenu";
import { BoardContextMenu } from "@src/components/canvas/BoardContextMenu";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

// Layout constants — change these to resize any panel
const HEADER_H = 56;
const LEFT_W = 280;
const RIGHT_W = 260;
const BOTTOM_H = 200;

export default function BlsProducer() {
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const dragHandlers = useDrag(boardContainerRef);

  // ── Resizable right panel ────────────────────────────────────────
  const [rightW, setRightW] = useState(RIGHT_W);
  const resizeDrag = useRef({ active: false, startX: 0, startW: 0 });

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeDrag.current = { active: true, startX: e.clientX, startW: rightW };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: MouseEvent) => {
        if (!resizeDrag.current.active) return;
        const delta = resizeDrag.current.startX - ev.clientX;
        const next = Math.min(
          560,
          Math.max(180, resizeDrag.current.startW + delta),
        );
        setRightW(next);
      };
      const onUp = () => {
        resizeDrag.current.active = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [rightW],
  );

  const { ensureAtLeastOneFrame } = useQuizStore.getState();

  // Wait for IndexedDB persist rehydration
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useQuizStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    if (useQuizStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  // Initialize store
  useEffect(() => {
    if (hydrated) ensureAtLeastOneFrame();
  }, [hydrated]);

  // Unsaved-changes guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts(boardContainerRef);

  // Hydration skeleton
  if (!hydrated) {
    return (
      <Center style={{ height: "100vh" }}>
        <Stack align="center" gap="sm">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">
            Loading project…
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <DragContext.Provider value={dragHandlers}>
      <ContextMenu />
      <BoardContextMenu />
      <AppShell
        header={{ height: HEADER_H }}
        navbar={{ width: LEFT_W, breakpoint: 0 }}
        aside={{ width: rightW, breakpoint: 0 }}
        footer={{ height: BOTTOM_H }}
        style={{ height: "100vh", overflow: "hidden" }}
      >
        {/* ─── Top toolbar ─────────────────────────────────────── */}
        <AppShell.Header
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "var(--mantine-color-dark-8)",
          }}
        >
          <AppHeader boardContainerRef={boardContainerRef} />
        </AppShell.Header>

        {/* ─── Left — Sidebar ──────────────────────────────────── */}
        <AppShell.Navbar
          p={0}
          style={{
            overflow: "hidden",
            borderRight: "1px solid var(--mantine-color-dark-4)",
          }}
        >
          <Sidebar />
        </AppShell.Navbar>

        {/* ─── Right — Layers / Properties ─────────────────────── */}
        <AppShell.Aside
          p={0}
          style={{
            overflow: "hidden",
            borderLeft: "1px solid var(--mantine-color-dark-4)",
          }}
        >
          <div
            style={{ position: "relative", height: "100%", overflow: "hidden" }}
          >
            <div
              onMouseDown={handleResizeStart}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                cursor: "col-resize",
                zIndex: 10,
                background: "transparent",
                transition: "background 150ms",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  "var(--mantine-color-blue-6)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  "transparent")
              }
            />
            <RightPanel />
          </div>
        </AppShell.Aside>

        {/* ─── Bottom — Timeline ───────────────────────────────── */}
        <AppShell.Footer
          style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}
        >
          <BottomPanel />
        </AppShell.Footer>

        {/* ─── Center — Canvas ─────────────────────────────────── */}
        <AppShell.Main
          style={{
            padding: 0,
            paddingTop: HEADER_H,
            paddingLeft: LEFT_W,
            paddingRight: rightW,
            paddingBottom: BOTTOM_H,
            overflow: "hidden",
            height: "100vh",
          }}
        >
          <Box
            ref={boardContainerRef}
            style={{
              height: "100%",
              display: "flex",
              overflow: "hidden",
            }}
          >
            <Board />
          </Box>
        </AppShell.Main>
      </AppShell>
    </DragContext.Provider>
  );
}
