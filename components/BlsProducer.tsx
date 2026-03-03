"use client";

import { useEffect, useRef } from "react";
import { AppShell, Box } from "@mantine/core";
import { DragContext } from "@src/context/DragContext";
import { useDrag } from "@src/hooks/useDrag";
import { useQuizStore } from "@src/store/quizStore";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import { Board } from "./Board";
import { RightPanel } from "./RightPanel";
import { BottomPanel } from "./BottomPanel";
import { ContextMenu } from "./canvas/ContextMenu";

// Layout constants — change these to resize any panel
const HEADER_H = 44;
const LEFT_W = 280;
const RIGHT_W = 260;
const BOTTOM_H = 200;

export default function BlsProducer() {
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const dragHandlers = useDrag(boardContainerRef);
  const {
    ensureAtLeastOneFrame,
    removeObject,
    getActiveFrame,
    selectedObjectId,
  } = useQuizStore.getState();

  // Initialize store
  useEffect(() => {
    ensureAtLeastOneFrame();
  }, []);

  // Keyboard shortcuts: Delete/Backspace to remove object, Shift for cursor hints
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useQuizStore.getState().undo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        useQuizStore.getState().redo();
        return;
      }
      // Duplicate selected object
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        const state = useQuizStore.getState();
        if (state.selectedObjectId)
          state.duplicateObject(
            state.currentPreviewIndex,
            state.selectedObjectId,
          );
        return;
      }
      if (e.key === "Shift") {
        boardContainerRef.current
          ?.querySelectorAll<HTMLElement>("[data-obj-id]")
          .forEach((el) => {
            el.style.cursor = "se-resize";
          });
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        const state = useQuizStore.getState();
        const frame = state.getActiveFrame();
        const sel = state.selectedObjectId;
        if (!frame || !sel) return;
        state.removeObject(state.currentPreviewIndex, sel);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        boardContainerRef.current
          ?.querySelectorAll<HTMLElement>("[data-obj-id]")
          .forEach((el) => {
            el.style.cursor = "grab";
          });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <DragContext.Provider value={dragHandlers}>
      <ContextMenu />
      <AppShell
        header={{ height: HEADER_H }}
        navbar={{ width: LEFT_W, breakpoint: 0 }}
        aside={{ width: RIGHT_W, breakpoint: 0 }}
        footer={{ height: BOTTOM_H }}
        style={{ height: "100vh", overflow: "hidden" }}
      >
        {/* ─── Top toolbar ─────────────────────────────────────── */}
        <AppShell.Header
          style={{ borderBottom: "1px solid var(--mantine-color-dark-4)" }}
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
          <RightPanel />
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
            paddingRight: RIGHT_W,
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
