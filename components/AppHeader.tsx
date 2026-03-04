import { useRef, useState } from "react";
import {
  Group,
  Title,
  ActionIcon,
  Button,
  Divider,
  Text,
  Tooltip,
  Switch,
  Popover,
  UnstyledButton,
  Box,
} from "@mantine/core";
import {
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconLayoutDistributeHorizontal,
  IconLayoutDistributeVertical,
  IconDownload,
  IconDeviceFloppy,
  IconFolderOpen,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconMagnet,
  IconTypography,
  IconPhoto,
  IconSquare,
  IconCircle,
  IconMinus,
  IconLayoutList,
  IconPlus,
  IconTemplate,
  IconCloudUpload,
  IconCloudDownload,
} from "@tabler/icons-react";
import { SaveToCloudModal } from "@src/components/SaveToCloudModal";
import { CloudProjectsModal } from "@src/components/CloudProjectsModal";
import {
  useQuizStore,
  type ProjectSnapshot,
  makeId,
} from "@src/store/quizStore";
import { useExport } from "@src/hooks/useExport";
import {
  calcCenterH,
  calcCenterV,
  spreadObjsH,
  spreadObjsV,
} from "@src/lib/align";
import type {
  TextObject,
  ImageObject,
  AnswerGroupObject,
  ShapeObject,
  DividerObject,
} from "@src/lib/types";
import { TemplateGallery } from "@src/components/TemplateGallery";

interface Props {
  boardContainerRef: React.RefObject<HTMLDivElement | null>;
}

function InsertTile({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "9px 4px",
        borderRadius: 8,
        background: "var(--mantine-color-dark-6)",
        border: "1px solid var(--mantine-color-dark-4)",
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "var(--mantine-color-dark-5)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "var(--mantine-color-dark-6)";
      }}
    >
      <Box style={{ color, lineHeight: 1 }}>{icon}</Box>
      <Text
        size="10px"
        c="dimmed"
        style={{ lineHeight: 1, userSelect: "none" }}
      >
        {label}
      </Text>
    </UnstyledButton>
  );
}

export function AppHeader({ boardContainerRef }: Props) {
  const { exportQuiz, exporting } = useExport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [insertOpen, setInsertOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saveCloudOpen, setSaveCloudOpen] = useState(false);
  const [cloudBrowserOpen, setCloudBrowserOpen] = useState(false);

  const cloudProjectId = useQuizStore((s) => s.cloudProjectId);

  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const getActiveFrame = useQuizStore((s) => s.getActiveFrame);
  const getSelectedObject = useQuizStore((s) => s.getSelectedObject);
  const selectedObjectIds = useQuizStore((s) => s.selectedObjectIds);
  const updateObject = useQuizStore((s) => s.updateObject);
  const updateFrameField = useQuizStore((s) => s.updateFrameField);
  const loadProject = useQuizStore((s) => s.loadProject);
  const addObject = useQuizStore((s) => s.addObject);
  const undo = useQuizStore((s) => s.undo);
  const redo = useQuizStore((s) => s.redo);
  const canUndo = useQuizStore((s) => s.pastSnapshots.length > 0);
  const canRedo = useQuizStore((s) => s.futureSnapshots.length > 0);
  const snapEnabled = useQuizStore((s) => s.snapEnabled);
  const setSnapEnabled = useQuizStore((s) => s.setSnapEnabled);

  /** Download current project as a .json file. */
  const handleSave = () => {
    const {
      quizData,
      defaultW,
      defaultH,
      currentPreviewIndex: idx,
    } = useQuizStore.getState();
    const snapshot: ProjectSnapshot = {
      version: 1,
      quizData,
      defaultW,
      defaultH,
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
  };

  /** Read a .json file and restore project state. */
  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ProjectSnapshot;
        loadProject(data);
      } catch {
        alert(
          "Could not read project file. Make sure it is a valid BLS project.",
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ─── Align & Distribute ──────────────────────────────────────────
  const handleCenterH = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const ids = selectedObjectIds.length >= 1 ? selectedObjectIds : null;
    const targets = ids
      ? frame.objects.filter((o) => ids.includes(o.id))
      : [getSelectedObject()].filter(Boolean);
    targets.forEach((obj) => {
      if (!obj) return;
      const x = calcCenterH(frame, obj, boardContainerRef.current);
      updateObject(currentPreviewIndex, obj.id, (o) => ({ ...o, x }));
    });
  };

  const handleCenterV = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const ids = selectedObjectIds.length >= 1 ? selectedObjectIds : null;
    const targets = ids
      ? frame.objects.filter((o) => ids.includes(o.id))
      : [getSelectedObject()].filter(Boolean);
    targets.forEach((obj) => {
      if (!obj) return;
      const y = calcCenterV(frame, obj, boardContainerRef.current);
      updateObject(currentPreviewIndex, obj.id, (o) => ({ ...o, y }));
    });
  };

  const handleSpreadH = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const ids = selectedObjectIds.length >= 2 ? selectedObjectIds : undefined;
    updateFrameField(currentPreviewIndex, {
      objects: spreadObjsH(frame.objects, boardContainerRef.current, ids),
    });
  };

  const handleSpreadV = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const ids = selectedObjectIds.length >= 2 ? selectedObjectIds : undefined;
    updateFrameField(currentPreviewIndex, {
      objects: spreadObjsV(frame.objects, boardContainerRef.current, ids),
    });
  };

  // ─── Insert object helpers ───────────────────────────────────────
  const close = () => setInsertOpen(false);

  const handleAddText = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const count = frame.objects.length + 1;
    const obj: TextObject = {
      id: makeId(),
      type: "text",
      label: "Text " + count,
      text: "Edit me",
      x: 20,
      y: 20 + (count - 1) * 40,
      size: 22,
      color: "#ffffff",
    };
    addObject(currentPreviewIndex, obj);
    close();
  };

  const handleAddRect = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const obj: ShapeObject = {
      id: makeId(),
      type: "shape",
      shape: "rect",
      label: "Rectangle",
      x: Math.round(frame.w * 0.2),
      y: Math.round(frame.h * 0.2),
      w: Math.round(frame.w * 0.5),
      h: 60,
      fill: "rgba(59,130,246,0.7)",
      radius: 8,
    };
    addObject(currentPreviewIndex, obj);
    close();
  };

  const handleAddCircle = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const size = Math.round(Math.min(frame.w, frame.h) * 0.25);
    const obj: ShapeObject = {
      id: makeId(),
      type: "shape",
      shape: "circle",
      label: "Circle",
      x: Math.round((frame.w - size) / 2),
      y: Math.round((frame.h - size) / 2),
      w: size,
      h: size,
      fill: "rgba(236,72,153,0.7)",
    };
    addObject(currentPreviewIndex, obj);
    close();
  };

  const handleAddLine = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const obj: DividerObject = {
      id: makeId(),
      type: "divider",
      label: "Line",
      x: Math.round(frame.w * 0.1),
      y: Math.round(frame.h * 0.5),
      w: Math.round(frame.w * 0.8),
      thickness: 2,
      color: "rgba(255,255,255,0.4)",
      lineStyle: "solid",
    };
    addObject(currentPreviewIndex, obj);
    close();
  };

  const handleAddAnswers = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const obj: AnswerGroupObject = {
      id: makeId(),
      type: "answerGroup",
      label: "Answers",
      x: Math.round(frame.w * 0.07),
      y: Math.round(frame.h * 0.55),
      w: Math.round(frame.w * 0.86),
      answers: [
        { id: makeId(), text: "Answer 1" },
        { id: makeId(), text: "Answer 2" },
        { id: makeId(), text: "Answer 3" },
      ],
      btnHeight: 44,
      btnGap: 10,
      btnBgColor: "#ffffff",
      btnBgOpacity: 18,
      btnRadius: 24,
      textColor: "#ffffff",
      fontSize: 16,
      role: "answer",
      animIn: { type: "blsSlideUp", dur: 400, delay: 0 },
      animOut: { type: "blsFadeOut", dur: 300, delay: 0 },
    };
    addObject(currentPreviewIndex, obj);
    close();
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const frame = getActiveFrame();
    if (!file || !frame) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const tmp = new Image();
      tmp.onload = () => {
        const scale = Math.min(1, (frame.w * 0.7) / tmp.naturalWidth);
        const w = Math.round(tmp.naturalWidth * scale);
        const h = Math.round(tmp.naturalHeight * scale);
        const obj: ImageObject = {
          id: makeId(),
          type: "image",
          label: file.name.replace(/\.[^.]+$/, "").slice(0, 24) || "Image",
          src: f.target!.result as string,
          x: Math.round((frame.w - w) / 2),
          y: Math.round((frame.h - h) / 2),
          w,
          h,
        };
        addObject(currentPreviewIndex, obj);
      };
      tmp.src = f.target!.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    close();
  };

  const handleAddImage = () => {
    imageInputRef.current?.click();
  };

  const multiCount = selectedObjectIds.length;

  return (
    <Group h="100%" px="md" gap="sm" wrap="nowrap">
      <Title order={5} style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
        Interactive BLS Producer
      </Title>

      <Divider orientation="vertical" />

      {/* ── Templates button ── */}
      <Button
        size="xs"
        variant="light"
        color="violet"
        leftSection={<IconTemplate size={13} />}
        onClick={() => setTemplatesOpen(true)}
        style={{ flexShrink: 0 }}
      >
        Templates
      </Button>

      {/* ── Insert dropdown ── */}
      <Popover
        opened={insertOpen}
        onChange={setInsertOpen}
        position="bottom-start"
        offset={6}
        shadow="lg"
        withArrow
      >
        <Popover.Target>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={13} />}
            onClick={() => setInsertOpen((o) => !o)}
            style={{ flexShrink: 0 }}
          >
            Insert
          </Button>
        </Popover.Target>
        <Popover.Dropdown p="xs" style={{ minWidth: 200 }}>
          <Text
            size="xs"
            c="dimmed"
            fw={700}
            tt="uppercase"
            mb={6}
            style={{ letterSpacing: "0.07em" }}
          >
            Add object
          </Text>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
            }}
          >
            <InsertTile
              icon={<IconTypography size={16} />}
              label="Text"
              color="#60a5fa"
              onClick={handleAddText}
            />
            <InsertTile
              icon={<IconPhoto size={16} />}
              label="Image"
              color="#a78bfa"
              onClick={handleAddImage}
            />
            <InsertTile
              icon={<IconSquare size={16} />}
              label="Rect"
              color="#22d3ee"
              onClick={handleAddRect}
            />
            <InsertTile
              icon={<IconCircle size={16} />}
              label="Circle"
              color="#f472b6"
              onClick={handleAddCircle}
            />
            <InsertTile
              icon={<IconMinus size={16} />}
              label="Line"
              color="#94a3b8"
              onClick={handleAddLine}
            />
            <InsertTile
              icon={<IconLayoutList size={16} />}
              label="Answers"
              color="#34d399"
              onClick={handleAddAnswers}
            />
          </div>
        </Popover.Dropdown>
      </Popover>

      <Divider orientation="vertical" />

      {/* ── Align & Distribute ── */}
      <Group gap={4} wrap="nowrap">
        <Text
          size="xs"
          c="dimmed"
          fw={700}
          tt="uppercase"
          style={{ letterSpacing: "0.08em", flexShrink: 0 }}
        >
          Align{" "}
          {multiCount >= 2 ? (
            <Text span size="xs" c="blue">
              ({multiCount})
            </Text>
          ) : (
            ""
          )}
        </Text>
        <Tooltip label="Center horizontally in frame" withArrow>
          <ActionIcon onClick={handleCenterH} variant="default">
            <IconArrowsHorizontal size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Center vertically in frame" withArrow>
          <ActionIcon onClick={handleCenterV} variant="default">
            <IconArrowsVertical size={14} />
          </ActionIcon>
        </Tooltip>
        <Divider orientation="vertical" />
        <Tooltip
          label={
            multiCount >= 2
              ? `Distribute ${multiCount} selected horizontally`
              : "Distribute all horizontally (Ctrl+click to multi-select)"
          }
          withArrow
        >
          <ActionIcon
            onClick={handleSpreadH}
            variant="default"
            color={multiCount >= 2 ? "blue" : "gray"}
          >
            <IconLayoutDistributeHorizontal size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          label={
            multiCount >= 2
              ? `Distribute ${multiCount} selected vertically`
              : "Distribute all vertically (Ctrl+click to multi-select)"
          }
          withArrow
        >
          <ActionIcon
            onClick={handleSpreadV}
            variant="default"
            color={multiCount >= 2 ? "blue" : "gray"}
          >
            <IconLayoutDistributeVertical size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <div style={{ flex: 1 }} />

      {/* Undo / Redo */}
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

      {/* Snap toggle */}
      <Tooltip
        label="Snap objects to alignment guides while dragging"
        withArrow
      >
        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          <IconMagnet
            size={14}
            color={
              snapEnabled
                ? "var(--mantine-color-blue-4)"
                : "var(--mantine-color-dimmed)"
            }
          />
          <Text
            size="xs"
            c={snapEnabled ? "blue" : "dimmed"}
            fw={600}
            style={{ whiteSpace: "nowrap" }}
          >
            Snap
          </Text>
          <Switch
            size="xs"
            checked={snapEnabled}
            onChange={(e) => setSnapEnabled(e.currentTarget.checked)}
          />
        </Group>
      </Tooltip>

      <Divider orientation="vertical" />
      <Tooltip label="Save project to file" withArrow>
        <Button
          onClick={handleSave}
          variant="default"
          size="sm"
          leftSection={<IconDeviceFloppy size={14} />}
          style={{ flexShrink: 0 }}
        >
          Save
        </Button>
      </Tooltip>
      <Tooltip label="Load project from file" withArrow>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="default"
          size="sm"
          leftSection={<IconFolderOpen size={14} />}
          style={{ flexShrink: 0 }}
        >
          Load
        </Button>
      </Tooltip>

      <Divider orientation="vertical" />

      <Tooltip
        label={cloudProjectId ? "Update cloud project" : "Save to Sanity cloud"}
        withArrow
      >
        <Button
          onClick={() => setSaveCloudOpen(true)}
          variant="light"
          color="blue"
          size="sm"
          leftSection={<IconCloudUpload size={14} />}
          style={{ flexShrink: 0 }}
        >
          {cloudProjectId ? "Update" : "Cloud Save"}
        </Button>
      </Tooltip>
      <Tooltip label="Open a project from cloud" withArrow>
        <Button
          onClick={() => setCloudBrowserOpen(true)}
          variant="light"
          color="cyan"
          size="sm"
          leftSection={<IconCloudDownload size={14} />}
          style={{ flexShrink: 0 }}
        >
          Cloud Open
        </Button>
      </Tooltip>

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

      <Button
        onClick={exportQuiz}
        loading={exporting}
        disabled={exporting}
        color="green"
        size="sm"
        leftSection={<IconDownload size={14} />}
        style={{ flexShrink: 0 }}
      >
        {exporting ? "Exporting…" : "Export Quiz Ad"}
      </Button>

      {/* Templates modal */}
      <TemplateGallery
        opened={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />

      {/* Cloud modals */}
      <SaveToCloudModal
        opened={saveCloudOpen}
        onClose={() => setSaveCloudOpen(false)}
      />
      <CloudProjectsModal
        opened={cloudBrowserOpen}
        onClose={() => setCloudBrowserOpen(false)}
      />
    </Group>
  );
}
