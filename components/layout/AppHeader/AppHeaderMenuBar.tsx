import { useRef, useState } from "react";
import {
  Group,
  UnstyledButton,
  Menu,
  Modal,
  Textarea,
  Button,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconDeviceFloppy,
  IconFolderOpen,
  IconPhoto,
  IconTemplate,
  IconCloudUpload,
  IconCloudDownload,
  IconClipboardText,
  IconFilePlus,
  IconPlayerPlay,
  IconCircleCheck,
  IconMagnet,
  IconSparkles,
  IconKeyboard,
  IconDownload,
  IconRuler,
  IconGrid3x3,
  IconTimeline,
  IconLanguage,
} from "@tabler/icons-react";
import { useExport } from "@src/hooks/useExport";
import { useQuizStore, type ProjectSnapshot } from "@src/store/quizStore";
import { useConfirmDialog } from "@src/context/ConfirmDialogContext";

interface AppHeaderMenuBarProps {
  setTemplatesOpen: (v: boolean) => void;
  setSaveCloudOpen: (v: boolean) => void;
  setCloudBrowserOpen: (v: boolean) => void;
  setPreviewOpen: (v: boolean) => void;
  setAiPromptOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  setExportSettingsOpen: (v: boolean) => void;
  setAssetBucketOpen: (v: boolean) => void;
  setTranslationOpen: (v: boolean) => void;
  setLocalProjectsOpen: (v: boolean) => void;
}

const mbLabel = (label: string) => (
  <UnstyledButton
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.background =
        "var(--mantine-color-dark-5)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.background = "";
    }}
    style={{
      padding: "5px 11px",
      borderRadius: 4,
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1,
      userSelect: "none",
      transition: "background 100ms",
    }}
  >
    {label}
  </UnstyledButton>
);

export function AppHeaderMenuBar({
  setTemplatesOpen,
  setSaveCloudOpen,
  setCloudBrowserOpen,
  setPreviewOpen,
  setAiPromptOpen,
  setShortcutsOpen,
  setExportSettingsOpen,
  setAssetBucketOpen,
  setTranslationOpen,
  setLocalProjectsOpen,
}: AppHeaderMenuBarProps) {
  const { confirm } = useConfirmDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteJsonOpen, setPasteJsonOpen] = useState(false);
  const [pasteJsonValue, setPasteJsonValue] = useState("");
  const { exporting } = useExport();

  const cloudProjectId = useQuizStore((s) => s.cloudProjectId);
  const snapEnabled = useQuizStore((s) => s.snapEnabled);
  const setSnapEnabled = useQuizStore((s) => s.setSnapEnabled);
  const showRuler = useQuizStore((s) => s.showRuler);
  const setShowRuler = useQuizStore((s) => s.setShowRuler);
  const showGrid = useQuizStore((s) => s.showGrid);
  const setShowGrid = useQuizStore((s) => s.setShowGrid);
  const showCursorLines = useQuizStore((s) => s.showCursorLines);
  const setShowCursorLines = useQuizStore((s) => s.setShowCursorLines);
  const timelineOpen = useQuizStore((s) => s.timelineOpen);
  const setTimelineOpen = useQuizStore((s) => s.setTimelineOpen);
  const loadProject = useQuizStore((s) => s.loadProject);
  const markSaved = useQuizStore((s) => s.markSaved);

  const handleNewProject = async () => {
    const ok = await confirm({
      title: "Start new project",
      message: "All unsaved changes will be lost.",
      confirmLabel: "Start new",
      confirmColor: "red",
    });
    if (!ok) return;
    const { defaultW, defaultH } = useQuizStore.getState();
    const blank: ProjectSnapshot = {
      version: 1,
      quizData: { bg: null, frames: [] },
      defaultW,
      defaultH,
      currentPreviewIndex: 0,
    };
    loadProject(blank);
    useQuizStore.getState().setCloudProjectId(null);
    notifications.show({
      title: "New project",
      message: "Started a blank project.",
      color: "teal",
      autoClose: 2500,
    });
  };

  const handlePasteJson = () => {
    try {
      const data = JSON.parse(pasteJsonValue) as ProjectSnapshot;
      if (!data.quizData) throw new Error("Missing quizData");
      loadProject(data);
      setPasteJsonOpen(false);
      setPasteJsonValue("");
      notifications.show({
        title: "Project loaded",
        message: "Loaded project from pasted JSON.",
        color: "teal",
        autoClose: 3000,
      });
    } catch {
      notifications.show({
        title: "Invalid JSON",
        message: "Could not parse JSON. Make sure it is a valid BLS project.",
        color: "red",
        autoClose: 5000,
      });
    }
  };

  const handleSave = () => {
    const {
      quizData,
      defaultW: dw,
      defaultH: dh,
      currentPreviewIndex: idx,
    } = useQuizStore.getState();
    const snapshot: ProjectSnapshot = {
      version: 1,
      quizData,
      defaultW: dw,
      defaultH: dh,
      currentPreviewIndex: idx,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bls-project.json";
    a.click();
    URL.revokeObjectURL(url);
    markSaved();
  };

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ProjectSnapshot;
        loadProject(data);
      } catch {
        notifications.show({
          title: "Invalid project file",
          message:
            "Could not read project file. Make sure it is a valid BLS project.",
          color: "red",
          autoClose: 5000,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
        {/* File */}
        <Menu position="bottom-start" shadow="md" offset={2}>
          <Menu.Target>{mbLabel("File")}</Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconFilePlus size={14} />}
              onClick={() => void handleNewProject()}
            >
              New Project
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconDeviceFloppy size={14} />}
              onClick={handleSave}
            >
              Save to File
            </Menu.Item>
            <Menu.Item
              leftSection={<IconFolderOpen size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Open from File
            </Menu.Item>
            <Menu.Item
              leftSection={<IconFolderOpen size={14} />}
              onClick={() => setLocalProjectsOpen(true)}
            >
              Local Projects…
            </Menu.Item>
            <Menu.Item
              leftSection={<IconClipboardText size={14} />}
              onClick={() => setPasteJsonOpen(true)}
            >
              Paste JSON…
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconCloudUpload size={14} />}
              onClick={() => setSaveCloudOpen(true)}
            >
              {cloudProjectId ? "Update Cloud Project" : "Save to Cloud…"}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCloudDownload size={14} />}
              onClick={() => setCloudBrowserOpen(true)}
            >
              Open from Cloud…
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconDownload size={14} color="#4ade80" />}
              onClick={() => setExportSettingsOpen(true)}
              disabled={exporting}
            >
              {exporting ? "Exporting…" : "Export…"}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        {/* Insert */}
        <Menu position="bottom-start" shadow="md" offset={2}>
          <Menu.Target>{mbLabel("Insert")}</Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconTemplate size={14} />}
              onClick={() => setTemplatesOpen(true)}
            >
              Templates…
            </Menu.Item>
            <Menu.Item
              leftSection={<IconPhoto size={14} />}
              onClick={() => setAssetBucketOpen(true)}
            >
              Asset Bucket…
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLanguage size={14} color="#a78bfa" />}
              onClick={() => setTranslationOpen(true)}
            >
              Translations…
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        {/* View */}
        <Menu position="bottom-start" shadow="md" offset={2}>
          <Menu.Target>{mbLabel("View")}</Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={
                <IconMagnet
                  size={14}
                  color={
                    snapEnabled ? "var(--mantine-color-blue-4)" : undefined
                  }
                />
              }
              rightSection={
                snapEnabled ? (
                  <IconCircleCheck
                    size={13}
                    color="var(--mantine-color-blue-4)"
                  />
                ) : null
              }
              onClick={() => setSnapEnabled(!snapEnabled)}
            >
              Snap to Guides
            </Menu.Item>
            <Menu.Item
              leftSection={
                <IconRuler
                  size={14}
                  color={showRuler ? "var(--mantine-color-blue-4)" : undefined}
                />
              }
              rightSection={
                showRuler ? (
                  <IconCircleCheck
                    size={13}
                    color="var(--mantine-color-blue-4)"
                  />
                ) : null
              }
              onClick={() => setShowRuler(!showRuler)}
            >
              Ruler
            </Menu.Item>
            <Menu.Item
              leftSection={
                <IconGrid3x3
                  size={14}
                  color={showGrid ? "var(--mantine-color-blue-4)" : undefined}
                />
              }
              rightSection={
                showGrid ? (
                  <IconCircleCheck
                    size={13}
                    color="var(--mantine-color-blue-4)"
                  />
                ) : null
              }
              onClick={() => setShowGrid(!showGrid)}
            >
              Grid
            </Menu.Item>
            <Menu.Item
              leftSection={
                <IconTimeline
                  size={14}
                  color={
                    showCursorLines ? "var(--mantine-color-blue-4)" : undefined
                  }
                />
              }
              rightSection={
                showCursorLines ? (
                  <IconCircleCheck
                    size={13}
                    color="var(--mantine-color-blue-4)"
                  />
                ) : null
              }
              onClick={() => setShowCursorLines(!showCursorLines)}
            >
              Cursor Lines
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconPlayerPlay size={14} />}
              onClick={() => setPreviewOpen(true)}
            >
              Preview Ad…
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconSparkles size={14} />}
              onClick={() => setAiPromptOpen(true)}
            >
              AI Prompt…
            </Menu.Item>
            <Menu.Item
              leftSection={<IconKeyboard size={14} />}
              onClick={() => setShortcutsOpen(true)}
            >
              Keyboard Shortcuts…
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        {/* Window */}
        <Menu position="bottom-start" shadow="md" offset={2}>
          <Menu.Target>{mbLabel("Window")}</Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={
                <IconTimeline
                  size={14}
                  color={
                    timelineOpen ? "var(--mantine-color-blue-4)" : undefined
                  }
                />
              }
              rightSection={
                timelineOpen ? (
                  <IconCircleCheck
                    size={13}
                    color="var(--mantine-color-blue-4)"
                  />
                ) : null
              }
              onClick={() => setTimelineOpen(!timelineOpen)}
            >
              Timeline
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleLoadFile}
      />

      {/* Paste JSON Modal */}
      <Modal
        opened={pasteJsonOpen}
        onClose={() => setPasteJsonOpen(false)}
        title="Paste Project JSON"
        size="lg"
      >
        <Textarea
          placeholder="Paste your BLS project JSON here…"
          autosize
          minRows={10}
          maxRows={20}
          value={pasteJsonValue}
          onChange={(e) => setPasteJsonValue(e.currentTarget.value)}
          styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setPasteJsonOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePasteJson}
            disabled={!pasteJsonValue.trim()}
            color="blue"
          >
            Load Project
          </Button>
        </Group>
      </Modal>
    </>
  );
}
