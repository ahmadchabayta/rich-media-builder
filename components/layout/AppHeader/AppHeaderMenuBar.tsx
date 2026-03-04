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
  IconTypography,
  IconPhoto,
  IconSquare,
  IconCircle,
  IconMinus,
  IconLayoutList,
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
} from "@tabler/icons-react";
import { useQuizStore, type ProjectSnapshot } from "@src/store/quizStore";
import type { FrameObject } from "@src/lib/types";
import {
  createDefaultText,
  createDefaultRect,
  createDefaultCircle,
  createDefaultLine,
  createDefaultAnswers,
  createImageFromFile,
} from "@src/lib/insertHelpers";

interface AppHeaderMenuBarProps {
  setTemplatesOpen: (v: boolean) => void;
  setSaveCloudOpen: (v: boolean) => void;
  setCloudBrowserOpen: (v: boolean) => void;
  setPreviewOpen: (v: boolean) => void;
  setAiPromptOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
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
}: AppHeaderMenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pasteJsonOpen, setPasteJsonOpen] = useState(false);
  const [pasteJsonValue, setPasteJsonValue] = useState("");

  const cloudProjectId = useQuizStore((s) => s.cloudProjectId);
  const snapEnabled = useQuizStore((s) => s.snapEnabled);
  const setSnapEnabled = useQuizStore((s) => s.setSnapEnabled);
  const loadProject = useQuizStore((s) => s.loadProject);
  const markSaved = useQuizStore((s) => s.markSaved);
  const getActiveFrame = useQuizStore((s) => s.getActiveFrame);
  const addObject = useQuizStore((s) => s.addObject);
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);

  const handleNewProject = () => {
    if (
      !window.confirm("Start a new project? All unsaved changes will be lost.")
    )
      return;
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

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const frame = getActiveFrame();
    if (!file || !frame) return;
    createImageFromFile(file, frame, (obj) =>
      addObject(currentPreviewIndex, obj),
    );
    e.target.value = "";
  };

  const addInsert = (
    factory: (frame: { w: number; h: number }) => FrameObject,
  ) => {
    const frame = getActiveFrame();
    if (!frame) return;
    addObject(currentPreviewIndex, factory(frame));
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
              onClick={handleNewProject}
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
          </Menu.Dropdown>
        </Menu>

        {/* Insert */}
        <Menu position="bottom-start" shadow="md" offset={2}>
          <Menu.Target>{mbLabel("Insert")}</Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconTypography size={14} color="#60a5fa" />}
              onClick={() => {
                const f = getActiveFrame();
                if (f)
                  addObject(
                    currentPreviewIndex,
                    createDefaultText(f.objects.length),
                  );
              }}
            >
              Text
            </Menu.Item>
            <Menu.Item
              leftSection={<IconPhoto size={14} color="#a78bfa" />}
              onClick={() => imageInputRef.current?.click()}
            >
              Image
            </Menu.Item>
            <Menu.Item
              leftSection={<IconSquare size={14} color="#22d3ee" />}
              onClick={() => addInsert(createDefaultRect)}
            >
              Rectangle
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCircle size={14} color="#f472b6" />}
              onClick={() => addInsert(createDefaultCircle)}
            >
              Circle
            </Menu.Item>
            <Menu.Item
              leftSection={<IconMinus size={14} color="#94a3b8" />}
              onClick={() => addInsert(createDefaultLine)}
            >
              Line
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLayoutList size={14} color="#34d399" />}
              onClick={() => addInsert(createDefaultAnswers)}
            >
              Answer Buttons
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTemplate size={14} />}
              onClick={() => setTemplatesOpen(true)}
            >
              Templates…
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
      </Group>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleLoadFile}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFile}
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
