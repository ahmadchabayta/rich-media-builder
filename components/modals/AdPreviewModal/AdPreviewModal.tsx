"use client";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Group,
  Button,
  Text,
  Badge,
  Box,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconRefresh,
  IconDeviceMobile,
  IconMaximize,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import { generateExportHtml } from "@src/lib/exportEngine";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function AdPreviewModal({ opened, onClose }: Props) {
  // Subscribe only to trigger re-runs — actual data read imperatively below
  const _quizData = useQuizStore((s) => s.quizData);
  const _defaultW = useQuizStore((s) => s.defaultW);
  const _defaultH = useQuizStore((s) => s.defaultH);
  const defaultW = _defaultW;
  const defaultH = _defaultH;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  // Use state for blob URL so the iframe src updates atomically (no stale-content flash)
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Rebuild blob whenever store content changes; revoke on close / re-run
  useEffect(() => {
    if (!opened) {
      return;
    }
    // Always read imperatively from the store for the freshest possible data
    const { quizData, defaultW: dw, defaultH: dh } = useQuizStore.getState();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const html = generateExportHtml(quizData, dw, dh);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBlobUrl(url);

    // Cleanup: revoke when effect re-runs or modal closes
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setBlobUrl(undefined);
    };
  }, [opened, _quizData, _defaultW, _defaultH]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Compute scale to fit ad in the modal's preview area
  useEffect(() => {
    if (!opened) return;
    const update = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const scaleW = (width - 32) / defaultW;
      const scaleH = (height - 32) / defaultH;
      setScale(Math.min(scaleW, scaleH, 1));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [opened, defaultW, defaultH]);

  const handleRestart = () => {
    // Re-generate a fresh blob from the latest store state
    const { quizData, defaultW: dw, defaultH: dh } = useQuizStore.getState();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const html = generateExportHtml(quizData, dw, dh);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    setBlobUrl(url);
  };

  const handleOpenFullscreen = () => {
    if (blobUrlRef.current) window.open(blobUrlRef.current, "_blank");
  };

  const totalFrames = _quizData.frames.length;
  const hasContent = totalFrames > 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="auto"
      title={
        <Group gap="sm">
          <IconDeviceMobile size={16} color="var(--mantine-color-blue-4)" />
          <Text fw={700} size="sm">
            Ad Preview
          </Text>
          <Badge size="xs" variant="light" color="blue">
            {defaultW} × {defaultH}
          </Badge>
          <Badge size="xs" variant="light" color="gray">
            {totalFrames} frame{totalFrames !== 1 ? "s" : ""}
          </Badge>
        </Group>
      }
      styles={{
        header: {
          background: "var(--mantine-color-dark-7)",
          borderBottom: "1px solid var(--mantine-color-dark-5)",
          paddingBottom: 10,
        },
        body: {
          background: "#0a0a0a",
          padding: 0,
        },
        content: {
          background: "#0a0a0a",
        },
      }}
      centered
      overlayProps={{ blur: 6, backgroundOpacity: 0.85 }}
    >
      {/* Controls bar */}
      <Group
        px="md"
        py="sm"
        gap="sm"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "var(--mantine-color-dark-8)",
        }}
      >
        <Tooltip label="Restart from frame 1" withArrow>
          <ActionIcon
            variant="light"
            size="sm"
            onClick={handleRestart}
            disabled={!hasContent}
          >
            <IconRefresh size={13} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Open in new tab (full resolution)" withArrow>
          <ActionIcon
            variant="light"
            size="sm"
            onClick={handleOpenFullscreen}
            disabled={!hasContent}
          >
            <IconMaximize size={13} />
          </ActionIcon>
        </Tooltip>

        <Text size="xs" c="dimmed" style={{ marginLeft: 4 }}>
          Click inside the ad to advance frames
        </Text>

        <Box style={{ flex: 1 }} />

        <Button size="xs" variant="subtle" color="dimmed" onClick={onClose}>
          Close
        </Button>
      </Group>

      {/* Preview area */}
      <Box
        ref={containerRef}
        style={{
          width: Math.min(defaultW * 1 + 80, 500),
          height: Math.min(defaultH * 1 + 80, 700),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%)",
          position: "relative",
        }}
      >
        {!hasContent ? (
          <Text c="dimmed" size="sm" ta="center">
            Add frames and objects to preview the ad
          </Text>
        ) : (
          <Box
            style={{
              width: defaultW * scale,
              height: defaultH * scale,
              borderRadius: 4,
              overflow: "hidden",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px rgba(0,0,0,0.8)",
              transform: "translateZ(0)", // GPU layer
            }}
          >
            <iframe
              ref={iframeRef}
              src={blobUrl}
              style={{
                width: defaultW,
                height: defaultH,
                border: "none",
                display: "block",
                transformOrigin: "top left",
                transform: `scale(${scale})`,
              }}
              sandbox="allow-scripts allow-same-origin allow-popups"
              title="Ad Preview"
            />
          </Box>
        )}

        {/* Checkerboard corners for visual context */}
        <Text
          size="9px"
          c="dimmed"
          style={{
            position: "absolute",
            bottom: 8,
            right: 12,
            opacity: 0.3,
            letterSpacing: 1,
          }}
        >
          {defaultW} × {defaultH} px
        </Text>
      </Box>
    </Modal>
  );
}
