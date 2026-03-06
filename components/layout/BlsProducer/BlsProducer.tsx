"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell, Box, Center, Loader, Text, Stack } from "@mantine/core";
import { DragContext } from "@src/context/DragContext";
import { RichEditorContext } from "@src/context/RichEditorContext";
import type { Editor } from "@tiptap/react";
import { useDrag } from "@src/hooks/useDrag";
import { useExport } from "@src/hooks/useExport";
import { useQuizStore } from "@src/store/quizStore";
import { AppHeader } from "@src/components/layout/AppHeader";
import {
  VerticalToolbar,
  TOOLBAR_W,
} from "@src/components/layout/VerticalToolbar";
import { Board } from "@src/components/canvas/Board";
import { RightPanel } from "@src/components/layout/RightPanel";
import { BottomPanel } from "@src/components/layout/BottomPanel";
import { ContextMenu } from "@src/components/canvas/ContextMenu";
import { BoardContextMenu } from "@src/components/canvas/BoardContextMenu";
import { ConfirmDialogProvider } from "@src/context/ConfirmDialogContext";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { injectCustomFontFace } from "@src/lib/fonts";
import type { TextObject } from "@src/lib/types";

// Layout constants — change these to resize any panel
const HEADER_H = 56;
const RIGHT_W = 260;
const BOTTOM_H = 200;

function BlsProducerContent() {
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const dragHandlers = useDrag(boardContainerRef);
  const { exportQuiz } = useExport();
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [selectionRange, setSelectionRange] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [lastExpandedSelectionRange, setLastExpandedSelectionRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

  // Panel visibility from store
  const timelineOpen = useQuizStore((s) => s.timelineOpen);
  const customFonts = useQuizStore((s) => s.customFonts);
  const ensureAtLeastOneFrame = useQuizStore((s) => s.ensureAtLeastOneFrame);

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
  }, [hydrated, ensureAtLeastOneFrame]);

  // Restore uploaded custom fonts after rehydration
  useEffect(() => {
    if (!hydrated) return;
    customFonts.forEach((cf) => {
      if (cf.src) injectCustomFontFace(cf.family, cf.src);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const applyTextPatch = useCallback(
    (patch: Partial<TextObject>) => {
      if (!activeEditor) return;

      const docSize = activeEditor.state.doc.content.size;
      const selectedRange =
        selectionRange && selectionRange.from !== selectionRange.to
          ? selectionRange
          : lastExpandedSelectionRange;

      const clamp = (v: number) => Math.max(1, Math.min(v, docSize));
      const safeRange = selectedRange
        ? {
            from: clamp(selectedRange.from),
            to: clamp(selectedRange.to),
          }
        : null;

      const patchKeys = Object.keys(patch) as Array<keyof TextObject>;
      if (patchKeys.length === 1 && patch.fontFamily !== undefined) {
        let chain = activeEditor.chain().focus();
        if (safeRange && safeRange.from <= safeRange.to) {
          chain = chain.setTextSelection(safeRange);
        }
        chain = patch.fontFamily
          ? chain.setFontFamily(patch.fontFamily)
          : chain.unsetFontFamily();
        chain.run();
        return;
      }

      let chain = activeEditor.chain().focus();
      if (safeRange && safeRange.from <= safeRange.to) {
        chain = chain.setTextSelection(safeRange);
      }

      const markPatch: Record<string, unknown> = {};
      if (patch.size !== undefined) markPatch.fontSize = patch.size;
      if (patch.fontWeight !== undefined)
        markPatch.fontWeight = patch.fontWeight;
      if (patch.italic !== undefined)
        markPatch.fontStyle = patch.italic ? "italic" : null;
      if (patch.underline !== undefined)
        markPatch.textDecorationLine = patch.underline ? "underline" : null;
      if (patch.letterSpacing !== undefined)
        markPatch.letterSpacing = patch.letterSpacing;
      if (patch.textTransform !== undefined)
        markPatch.textTransform =
          patch.textTransform === "none" ? null : (patch.textTransform ?? null);
      if (patch.color !== undefined) markPatch.color = patch.color;
      if (patch.bgColor !== undefined)
        markPatch.backgroundColor = patch.bgColor;

      if (Object.keys(markPatch).length > 0) {
        const existing = activeEditor.getAttributes("textStyle") as Record<
          string,
          unknown
        >;
        chain = chain.setMark("textStyle", { ...existing, ...markPatch });
      }
      if (patch.textAlign !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chain = (chain as any).setTextAlign(patch.textAlign);
      }
      chain.run();
    },
    [activeEditor, lastExpandedSelectionRange, selectionRange],
  );

  const undoInEditor = useCallback(() => {
    if (!activeEditor) return false;
    return activeEditor.commands.undo();
  }, [activeEditor]);

  const redoInEditor = useCallback(() => {
    if (!activeEditor) return false;
    return activeEditor.commands.redo();
  }, [activeEditor]);

  useKeyboardShortcuts(boardContainerRef, {
    exportQuiz,
    isTextSessionActive: !!activeEditor,
    undoTextSession: undoInEditor,
    redoTextSession: redoInEditor,
  });

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
    <RichEditorContext.Provider
      value={{
        activeEditor,
        setActiveEditor,
        selectionRange,
        setSelectionRange,
        lastExpandedSelectionRange,
        setLastExpandedSelectionRange,
        isSessionActive: !!activeEditor,
        applyTextPatch,
        undoInEditor,
        redoInEditor,
      }}
    >
      <DragContext.Provider value={dragHandlers}>
        <ContextMenu />
        <BoardContextMenu />
        <AppShell
          header={{ height: HEADER_H }}
          navbar={{ width: TOOLBAR_W, breakpoint: 0 }}
          aside={{ width: rightW, breakpoint: 0 }}
          footer={{ height: timelineOpen ? BOTTOM_H : 0 }}
          style={{ height: "100vh", overflow: "hidden" }}
        >
          {/* ─── Top toolbar ─────────────────────────────────────── */}
          <AppShell.Header
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "var(--mantine-color-dark-7)",
            }}
          >
            <AppHeader boardContainerRef={boardContainerRef} />
          </AppShell.Header>

          {/* ─── Left — Vertical Toolbar ─────────────────────────── */}
          <AppShell.Navbar
            p={0}
            style={{
              overflow: "hidden",
              border: "none",
            }}
          >
            <VerticalToolbar />
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
              style={{
                position: "relative",
                height: "100%",
                overflow: "hidden",
              }}
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
          {timelineOpen && (
            <AppShell.Footer
              style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}
            >
              <BottomPanel />
            </AppShell.Footer>
          )}

          {/* ─── Center — Canvas ─────────────────────────────────── */}
          <AppShell.Main
            data-board-workspace="true"
            style={{
              padding: 0,
              paddingTop: HEADER_H,
              paddingLeft: TOOLBAR_W,
              paddingRight: rightW,
              paddingBottom: timelineOpen ? BOTTOM_H : 0,
              overflow: "hidden",
              height: "100vh",
            }}
          >
            <Box
              ref={boardContainerRef}
              data-board-workspace="true"
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
    </RichEditorContext.Provider>
  );
}

export default function BlsProducer() {
  return (
    <ConfirmDialogProvider>
      <BlsProducerContent />
    </ConfirmDialogProvider>
  );
}
