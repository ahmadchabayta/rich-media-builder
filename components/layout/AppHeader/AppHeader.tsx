import { useEffect, useState } from "react";
import {
  Group,
  Title,
  ActionIcon,
  Button,
  Divider,
  Text,
  Tooltip,
  Badge,
} from "@mantine/core";
import {
  IconDownload,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import { useExport } from "@src/hooks/useExport";
import type { FrameObject, TextObject } from "@src/lib/types";
import { SaveToCloudModal } from "@src/components/modals/SaveToCloudModal";
import { CloudProjectsModal } from "@src/components/modals/CloudProjectsModal";
import { TemplateGallery } from "@src/components/modals/TemplateGallery";
import { KeyboardShortcutsModal } from "@src/components/modals/KeyboardShortcutsModal";
import { AiPromptModal } from "@src/components/modals/AiPromptModal";
import { AdPreviewModal } from "@src/components/modals/AdPreviewModal";
import { TextTypographyBar } from "./TextTypographyBar";
import { AppHeaderMenuBar } from "./AppHeaderMenuBar";
import { AlignDistributeBar } from "./AlignDistributeBar";

function formatAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

interface Props {
  boardContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function AppHeader({ boardContainerRef }: Props) {
  const { exportQuiz, exporting } = useExport();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saveCloudOpen, setSaveCloudOpen] = useState(false);
  const [cloudBrowserOpen, setCloudBrowserOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [timeAgoLabel, setTimeAgoLabel] = useState("");

  const cloudProjectTitle = useQuizStore((s) => s.cloudProjectTitle);
  const isDirty = useQuizStore((s) => s.isDirty);
  const lastSavedAt = useQuizStore((s) => s.lastSavedAt);
  const defaultW = useQuizStore((s) => s.defaultW);
  const defaultH = useQuizStore((s) => s.defaultH);
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const getSelectedObject = useQuizStore((s) => s.getSelectedObject);
  const updateObject = useQuizStore((s) => s.updateObject);
  const undo = useQuizStore((s) => s.undo);
  const redo = useQuizStore((s) => s.redo);
  const canUndo = useQuizStore((s) => s.pastSnapshots.length > 0);
  const canRedo = useQuizStore((s) => s.futureSnapshots.length > 0);

  // Refresh relative-time label every 30s
  useEffect(() => {
    const refresh = () => {
      if (lastSavedAt) setTimeAgoLabel(formatAgo(lastSavedAt));
    };
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        padding: "0 10px",
        gap: 0,
        overflow: "hidden",
      }}
    >
      {/* ── BRAND ── */}
      <Group gap={6} wrap="nowrap" style={{ paddingRight: 10, flexShrink: 0 }}>
        <Title order={5} style={{ whiteSpace: "nowrap", lineHeight: 1 }}>
          {cloudProjectTitle ?? "BLS Producer"}
        </Title>
        <Badge
          size="xs"
          variant="outline"
          color="dark"
          radius="sm"
          style={{ flexShrink: 0 }}
        >
          {defaultW}×{defaultH}
        </Badge>
      </Group>

      <Divider orientation="vertical" mx={4} />

      {/* ── MENUBAR ── */}
      <AppHeaderMenuBar
        setTemplatesOpen={setTemplatesOpen}
        setSaveCloudOpen={setSaveCloudOpen}
        setCloudBrowserOpen={setCloudBrowserOpen}
        setPreviewOpen={setPreviewOpen}
        setAiPromptOpen={setAiPromptOpen}
        setShortcutsOpen={setShortcutsOpen}
      />

      <Divider orientation="vertical" mx={8} />

      {/* ── CENTER: typography + align ── */}
      <Group
        gap={8}
        wrap="nowrap"
        style={{ flex: 1, justifyContent: "center", minWidth: 0 }}
      >
        {(() => {
          const sel = getSelectedObject();
          if (sel?.type !== "text") return null;
          const textObj = sel as TextObject;
          return (
            <>
              <TextTypographyBar
                obj={textObj}
                onChange={(patch) =>
                  updateObject(
                    currentPreviewIndex,
                    textObj.id,
                    (o) => ({ ...o, ...patch }) as FrameObject,
                  )
                }
              />
              <Divider orientation="vertical" />
            </>
          );
        })()}
        <AlignDistributeBar boardContainerRef={boardContainerRef} />
      </Group>

      {/* ── RIGHT ── */}
      <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
        {(lastSavedAt !== null || isDirty) && (
          <Tooltip
            label={
              isDirty ? "You have unsaved changes" : `Saved ${timeAgoLabel}`
            }
            withArrow
          >
            <Group
              gap={4}
              wrap="nowrap"
              style={{ flexShrink: 0, cursor: "default" }}
            >
              {isDirty ? (
                <IconAlertCircle
                  size={13}
                  color="var(--mantine-color-yellow-4)"
                />
              ) : (
                <IconCircleCheck
                  size={13}
                  color="var(--mantine-color-teal-4)"
                />
              )}
              <Text
                size="xs"
                c={isDirty ? "yellow" : "teal"}
                style={{ whiteSpace: "nowrap" }}
              >
                {isDirty ? "Unsaved" : timeAgoLabel || "Saved"}
              </Text>
            </Group>
          </Tooltip>
        )}

        <Tooltip label="Undo (Ctrl+Z)" withArrow>
          <ActionIcon
            variant="default"
            size="sm"
            disabled={!canUndo}
            onClick={undo}
          >
            <IconArrowBackUp size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Redo (Ctrl+Y)" withArrow>
          <ActionIcon
            variant="default"
            size="sm"
            disabled={!canRedo}
            onClick={redo}
          >
            <IconArrowForwardUp size={14} />
          </ActionIcon>
        </Tooltip>

        <Divider orientation="vertical" />

        <Button
          onClick={exportQuiz}
          loading={exporting}
          disabled={exporting}
          color="green"
          size="sm"
          leftSection={<IconDownload size={14} />}
          style={{ flexShrink: 0 }}
        >
          {exporting ? "Exporting…" : "Export"}
        </Button>
      </Group>

      {/* ── Modals ── */}
      <TemplateGallery
        opened={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />
      <SaveToCloudModal
        opened={saveCloudOpen}
        onClose={() => setSaveCloudOpen(false)}
      />
      <CloudProjectsModal
        opened={cloudBrowserOpen}
        onClose={() => setCloudBrowserOpen(false)}
      />
      <KeyboardShortcutsModal
        opened={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      <AiPromptModal
        opened={aiPromptOpen}
        onClose={() => setAiPromptOpen(false)}
      />
      <AdPreviewModal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
