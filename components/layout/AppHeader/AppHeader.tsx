import { useEffect, useMemo, useState } from "react";
import {
  Group,
  Title,
  ActionIcon,
  Divider,
  Text,
  Tooltip,
  Badge,
  Popover,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import type {
  FrameObject,
  TextObject,
  AnswerGroupObject,
  DefaultTypography,
} from "@src/lib/types";
import { SaveToCloudModal } from "@src/components/modals/SaveToCloudModal";
import { CloudProjectsModal } from "@src/components/modals/CloudProjectsModal";
import { TemplateGallery } from "@src/components/modals/TemplateGallery";
import { KeyboardShortcutsModal } from "@src/components/modals/KeyboardShortcutsModal";
import { AiPromptModal } from "@src/components/modals/AiPromptModal";
import { AdPreviewModal } from "@src/components/modals/AdPreviewModal";
import { ExportSettingsModal } from "@src/components/modals/ExportSettingsModal";
import { AssetBucketModal } from "@src/components/modals/AssetBucketModal";
import { TranslationModal } from "@src/components/modals/TranslationModal";
import { LocalProjectsModal } from "@src/components/modals/LocalProjectsModal";
import { TextTypographyBar } from "./TextTypographyBar";
import { AppHeaderMenuBar } from "./AppHeaderMenuBar";
import { AlignDistributeBar } from "./AlignDistributeBar";
import { FrameSizeSection } from "@src/components/sidebar/FrameSizeSection";
import { useExport } from "@src/hooks/useExport";
import { useRichEditorContext } from "@src/context/RichEditorContext";

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
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saveCloudOpen, setSaveCloudOpen] = useState(false);
  const [cloudBrowserOpen, setCloudBrowserOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportSettingsOpen, setExportSettingsOpen] = useState(false);
  const [assetBucketOpen, setAssetBucketOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [localProjectsOpen, setLocalProjectsOpen] = useState(false);
  const [timeAgoLabel, setTimeAgoLabel] = useState("");
  const { exportQuiz } = useExport();
  const { isSessionActive, undoInEditor, redoInEditor } =
    useRichEditorContext();

  const cloudProjectTitle = useQuizStore((s) => s.cloudProjectTitle);
  const isDirty = useQuizStore((s) => s.isDirty);
  const lastSavedAt = useQuizStore((s) => s.lastSavedAt);
  const defaultW = useQuizStore((s) => s.defaultW);
  const defaultH = useQuizStore((s) => s.defaultH);
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const selectedObjectId = useQuizStore((s) => s.selectedObjectId);
  const selectedObjectIds = useQuizStore((s) => s.selectedObjectIds);
  const frames = useQuizStore((s) => s.quizData.frames);
  const updateObject = useQuizStore((s) => s.updateObject);
  const defaultTypography = useQuizStore((s) => s.defaultTypography);
  const setDefaultTypography = useQuizStore((s) => s.setDefaultTypography);
  const undoStore = useQuizStore((s) => s.undo);
  const redoStore = useQuizStore((s) => s.redo);
  const canUndo = useQuizStore((s) => s.pastSnapshots.length > 0);
  const canRedo = useQuizStore((s) => s.futureSnapshots.length > 0);

  const undo = () => {
    if (isSessionActive) {
      undoInEditor();
      return;
    }
    undoStore();
  };

  const redo = () => {
    if (isSessionActive) {
      redoInEditor();
      return;
    }
    redoStore();
  };

  const selectedObject = useMemo(() => {
    const frame = frames[currentPreviewIndex];
    if (!frame || !selectedObjectId) return null;
    return frame.objects.find((o) => o.id === selectedObjectId) ?? null;
  }, [frames, currentPreviewIndex, selectedObjectId]);

  const selectedObjects = useMemo(() => {
    const frame = frames[currentPreviewIndex];
    if (!frame || selectedObjectIds.length === 0) return [] as FrameObject[];
    const idSet = new Set(selectedObjectIds);
    return frame.objects.filter((o) => idSet.has(o.id));
  }, [frames, currentPreviewIndex, selectedObjectIds]);

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
        <Popover width={200} position="bottom-start" shadow="md" withArrow>
          <Popover.Target>
            <Tooltip label="Canvas size" withArrow>
              <UnstyledButton style={{ display: "inline-flex" }}>
                <Badge
                  size="xs"
                  variant="outline"
                  color="dark"
                  radius="sm"
                  style={{ flexShrink: 0, cursor: "pointer" }}
                >
                  {defaultW}×{defaultH}
                </Badge>
              </UnstyledButton>
            </Tooltip>
          </Popover.Target>
          <Popover.Dropdown p="sm">
            <FrameSizeSection />
          </Popover.Dropdown>
        </Popover>
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
        setExportSettingsOpen={setExportSettingsOpen}
        setAssetBucketOpen={setAssetBucketOpen}
        setTranslationOpen={setTranslationOpen}
        setLocalProjectsOpen={setLocalProjectsOpen}
      />

      <Divider orientation="vertical" mx={8} />

      {/* ── CENTER: typography + align ── */}
      <Group
        gap={8}
        wrap="nowrap"
        style={{ flex: 1, justifyContent: "center", minWidth: 0 }}
      >
        {(() => {
          const sel = selectedObject;
          if (sel?.type === "text") {
            const textObj = sel as TextObject;
            return (
              <>
                <TextTypographyBar
                  obj={textObj}
                  onChange={(patch) => {
                    const targets = selectedObjects.filter(
                      (o) => o.type === "text",
                    );
                    const ids =
                      targets.length > 0
                        ? targets.map((o) => o.id)
                        : [textObj.id];
                    ids.forEach((id) => {
                      updateObject(
                        currentPreviewIndex,
                        id,
                        (o) => ({ ...o, ...patch }) as FrameObject,
                      );
                    });
                  }}
                />
                <Divider orientation="vertical" />
              </>
            );
          }
          if (sel?.type === "answerGroup") {
            const ag = sel as AnswerGroupObject;
            // Bridge AnswerGroupObject fields → TextObject shape
            const virtual = {
              ...ag,
              type: "text" as const,
              size: ag.fontSize ?? 16,
              color: ag.textColor ?? "#ffffff",
              bgColor: ag.btnBgColor ?? "#000000",
            } as unknown as TextObject;
            return (
              <>
                <TextTypographyBar
                  obj={virtual}
                  onChange={(patch) => {
                    const mapped: Partial<AnswerGroupObject> = {};
                    if (patch.fontFamily !== undefined)
                      mapped.fontFamily = patch.fontFamily;
                    if (patch.fontWeight !== undefined)
                      mapped.fontWeight = patch.fontWeight;
                    if (patch.italic !== undefined)
                      mapped.italic = patch.italic;
                    if (patch.underline !== undefined)
                      mapped.underline = patch.underline;
                    if (patch.textAlign !== undefined)
                      mapped.textAlign = patch.textAlign;
                    if (patch.letterSpacing !== undefined)
                      mapped.letterSpacing = patch.letterSpacing;
                    if (patch.lineHeight !== undefined)
                      mapped.lineHeight = patch.lineHeight;
                    if (patch.size !== undefined) mapped.fontSize = patch.size;
                    if (patch.color !== undefined)
                      mapped.textColor = patch.color;
                    if (patch.bgColor !== undefined)
                      mapped.btnBgColor = patch.bgColor;
                    if (patch.textTransform !== undefined)
                      mapped.textTransform = patch.textTransform;

                    const targets = selectedObjects.filter(
                      (o) => o.type === "answerGroup",
                    );
                    const ids =
                      targets.length > 0 ? targets.map((o) => o.id) : [ag.id];
                    ids.forEach((id) => {
                      updateObject(
                        currentPreviewIndex,
                        id,
                        (o) => ({ ...o, ...mapped }) as FrameObject,
                      );
                    });
                  }}
                />
                <Divider orientation="vertical" />
              </>
            );
          }
          // ── Default typography (no text/answerGroup selected) ──
          const defaultVirtual: TextObject = {
            id: "__defaults__",
            label: "Default",
            x: 0,
            y: 0,
            type: "text",
            text: "",
            ...defaultTypography,
          };
          return (
            <>
              <Text
                size="xs"
                c="dimmed"
                fw={500}
                style={{
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  flexShrink: 0,
                  marginRight: 4,
                }}
              >
                Default
              </Text>
              <TextTypographyBar
                obj={defaultVirtual}
                onChange={(patch) =>
                  setDefaultTypography(patch as Partial<DefaultTypography>)
                }
                showBgColor={false}
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
            disabled={!isSessionActive && !canUndo}
            onClick={undo}
          >
            <IconArrowBackUp size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Redo (Ctrl+Y)" withArrow>
          <ActionIcon
            variant="default"
            size="sm"
            disabled={!isSessionActive && !canRedo}
            onClick={redo}
          >
            <IconArrowForwardUp size={14} />
          </ActionIcon>
        </Tooltip>
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
      <ExportSettingsModal
        opened={exportSettingsOpen}
        onClose={() => setExportSettingsOpen(false)}
        onExport={exportQuiz}
      />
      <AssetBucketModal
        opened={assetBucketOpen}
        onClose={() => setAssetBucketOpen(false)}
        onUseAsset={(asset) => {
          // Insert as image object into the active frame
          const { currentPreviewIndex, addObject, getActiveFrame } =
            useQuizStore.getState();
          const frame = getActiveFrame();
          if (!frame) return;
          addObject(currentPreviewIndex, {
            id: String(Date.now() + Math.random()),
            type: "image",
            label: asset.name,
            src: asset.src,
            x: 0,
            y: 0,
            w: frame.w,
            h: frame.h,
          });
        }}
      />
      <TranslationModal
        opened={translationOpen}
        onClose={() => setTranslationOpen(false)}
      />
      <LocalProjectsModal
        opened={localProjectsOpen}
        onClose={() => setLocalProjectsOpen(false)}
      />
    </div>
  );
}
