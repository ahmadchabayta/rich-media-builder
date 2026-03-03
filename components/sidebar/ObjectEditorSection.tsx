import { useRef, useState, useEffect } from "react";
import {
  Stack,
  Group,
  Text,
  Box,
  Button,
  Badge,
  Select,
  TextInput,
  NumberInput,
  SimpleGrid,
  Slider,
  Tooltip,
  ActionIcon,
  Divider,
  UnstyledButton,
} from "@mantine/core";
import {
  IconCopy,
  IconTrash,
  IconTypography,
  IconPhoto,
  IconSquare,
  IconCircle,
  IconMinus,
  IconLayoutList,
} from "@tabler/icons-react";
import { ANIM_IN, ANIM_OUT } from "@src/lib/animPresets";
import type {
  FrameObject,
  ImageObject,
  TextObject,
  AnswerGroupObject,
  ShapeObject,
  DividerObject,
  AnimConfig,
} from "@src/lib/types";
import { useQuizStore, makeId } from "@src/store/quizStore";
import { AnimPanel } from "./AnimPanel";
import { FrameAnimPanel } from "./FrameAnimPanel";
import { TextObjectFields } from "./TextObjectFields";
import { ImageObjectFields } from "./ImageObjectFields";
import { AnswerGroupFields } from "./AnswerGroupFields";
import { ShapeObjectFields } from "./ShapeObjectFields";
import { DividerObjectFields } from "./DividerObjectFields";
import { n, animBoxStyle } from "./utils";

interface PaletteProps {
  disabled: boolean;
  onText: () => void;
  onImage: () => void;
  onRect: () => void;
  onCircle: () => void;
  onLine: () => void;
  onAnswers: () => void;
}

const PALETTE_ITEMS = (p: PaletteProps) => [
  {
    icon: <IconTypography size={15} />,
    label: "Text",
    onClick: p.onText,
    color: "#60a5fa",
  },
  {
    icon: <IconPhoto size={15} />,
    label: "Image",
    onClick: p.onImage,
    color: "#a78bfa",
  },
  {
    icon: <IconSquare size={15} />,
    label: "Rect",
    onClick: p.onRect,
    color: "#22d3ee",
  },
  {
    icon: <IconCircle size={15} />,
    label: "Circle",
    onClick: p.onCircle,
    color: "#f472b6",
  },
  {
    icon: <IconMinus size={15} />,
    label: "Line",
    onClick: p.onLine,
    color: "#94a3b8",
  },
  {
    icon: <IconLayoutList size={15} />,
    label: "Answers",
    onClick: p.onAnswers,
    color: "#34d399",
  },
];

function ObjectPalette(props: PaletteProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 5,
      }}
    >
      {PALETTE_ITEMS(props).map(({ icon, label, onClick, color }) => (
        <UnstyledButton
          key={label}
          onClick={onClick}
          disabled={props.disabled}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            padding: "7px 4px",
            borderRadius: 6,
            background: "var(--mantine-color-dark-6)",
            border: "1px solid var(--mantine-color-dark-4)",
            opacity: props.disabled ? 0.4 : 1,
            cursor: props.disabled ? "not-allowed" : "pointer",
            transition: "background 120ms, border-color 120ms",
          }}
          onMouseEnter={(e) => {
            if (!props.disabled) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--mantine-color-dark-5)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--mantine-color-dark-3)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--mantine-color-dark-6)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--mantine-color-dark-4)";
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
      ))}
    </div>
  );
}

export function ObjectEditorSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const store = useQuizStore();
  const { currentPreviewIndex, selectedObjectId, animMode } = store;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const frame = store.getActiveFrame();
  const selectedObj = store.getSelectedObject();

  if (!mounted) return null;

  const updateObj = (patch: Partial<FrameObject>) => {
    if (!selectedObjectId) return;
    store.updateObject(
      currentPreviewIndex,
      selectedObjectId,
      (o) => ({ ...o, ...patch }) as FrameObject,
    );
  };

  const handleAddText = () => {
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
    store.addObject(currentPreviewIndex, obj);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
          label:
            file.name.replace(/\.[^.]+$/, "").slice(0, 24) ||
            "Image " + (frame.objects.length + 1),
          src: f.target!.result as string,
          x: Math.round((frame.w - w) / 2),
          y: Math.round((frame.h - h) / 2),
          w,
          h,
        };
        store.addObject(currentPreviewIndex, obj);
      };
      tmp.src = f.target!.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddAnswers = () => {
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
    store.addObject(currentPreviewIndex, obj);
  };

  const handleAddRect = () => {
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
    store.addObject(currentPreviewIndex, obj);
  };

  const handleAddCircle = () => {
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
    store.addObject(currentPreviewIndex, obj);
  };

  const handleAddDivider = () => {
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
    store.addObject(currentPreviewIndex, obj);
  };

  return (
    <Stack gap="xs" p="md">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />

      {/* Top bar: frame indicator + animate toggle */}
      <Group justify="space-between" align="center">
        <Group gap={6} align="center">
          <Text
            size="xs"
            fw={600}
            c="dimmed"
            tt="uppercase"
            style={{ letterSpacing: "0.06em" }}
          >
            Frame {currentPreviewIndex + 1}
          </Text>
          {frame?.isEndFrame && (
            <Badge size="xs" variant="outline" color="gray" radius="sm">
              End
            </Badge>
          )}
        </Group>
        <Button
          size="xs"
          variant={animMode ? "filled" : "default"}
          color={animMode ? "yellow" : "gray"}
          leftSection={<span style={{ fontSize: 12 }}>🎬</span>}
          onClick={store.toggleAnimMode}
          disabled={!frame}
        >
          Animate
        </Button>
      </Group>

      {/* No frame */}
      {!frame && (
        <Text size="xs" c="dimmed" fs="italic">
          Add a frame to get started.
        </Text>
      )}

      {/* Frame selected, nothing selected on canvas */}
      {frame && !selectedObj && (
        <Stack gap="sm">
          <SimpleGrid cols={2} spacing="xs">
            <NumberInput
              label="Frame W"
              value={frame.w}
              min={50}
              clampBehavior="none"
              onChange={(val) => {
                const v = n(val, 50);
                if (v >= 50)
                  store.updateFrameField(currentPreviewIndex, { w: v });
              }}
              onBlur={(e) => {
                const v = Math.max(50, parseInt(e.target.value) || 50);
                store.updateFrameField(currentPreviewIndex, { w: v });
              }}
            />
            <NumberInput
              label="Frame H"
              value={frame.h}
              min={50}
              clampBehavior="none"
              onChange={(val) => {
                const v = n(val, 50);
                if (v >= 50)
                  store.updateFrameField(currentPreviewIndex, { h: v });
              }}
              onBlur={(e) => {
                const v = Math.max(50, parseInt(e.target.value) || 50);
                store.updateFrameField(currentPreviewIndex, { h: v });
              }}
            />
          </SimpleGrid>

          {animMode && (
            <FrameAnimPanel frame={frame} frameIndex={currentPreviewIndex} />
          )}

          {/* Object palette */}
          <Divider label="Add objects" labelPosition="left" mt={4} />
          <ObjectPalette
            disabled={!frame}
            onText={handleAddText}
            onImage={() => imageInputRef.current?.click()}
            onRect={handleAddRect}
            onCircle={handleAddCircle}
            onLine={handleAddDivider}
            onAnswers={handleAddAnswers}
          />

          <Text size="xs" c="dimmed" fs="italic" pt={2}>
            Click an object on the canvas to select and edit it.
          </Text>
        </Stack>
      )}

      {/* Object selected */}
      {frame && selectedObj && (
        <Stack gap="xs">
          {/* Object identity header */}
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap={8} align="center" style={{ flex: 1, minWidth: 0 }}>
              <Badge
                size="sm"
                variant="light"
                color={
                  selectedObj.type === "text"
                    ? "blue"
                    : selectedObj.type === "image"
                      ? "violet"
                      : selectedObj.type === "shape"
                        ? "cyan"
                        : selectedObj.type === "divider"
                          ? "gray"
                          : "green"
                }
                radius="sm"
              >
                {selectedObj.type === "text"
                  ? "Text"
                  : selectedObj.type === "image"
                    ? "Image"
                    : selectedObj.type === "shape"
                      ? (selectedObj as ShapeObject).shape === "circle"
                        ? "Circle"
                        : "Rect"
                      : selectedObj.type === "divider"
                        ? "Line"
                        : "Answers"}
              </Badge>
              <TextInput
                variant="unstyled"
                placeholder="Object name…"
                value={selectedObj.label || ""}
                onChange={(e) => updateObj({ label: e.target.value })}
                style={{ flex: 1, minWidth: 0 }}
                styles={{
                  input: { fontSize: 13, fontWeight: 600, padding: 0 },
                }}
              />
            </Group>
            <Group gap={4} wrap="nowrap">
              <Tooltip label="Duplicate (Ctrl+D)" withArrow>
                <ActionIcon
                  size="sm"
                  variant="default"
                  onClick={() => {
                    if (selectedObjectId)
                      store.duplicateObject(
                        currentPreviewIndex,
                        selectedObjectId,
                      );
                  }}
                >
                  <IconCopy size={12} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Remove object" withArrow>
                <ActionIcon
                  size="sm"
                  color="red"
                  variant="light"
                  onClick={() => {
                    if (selectedObjectId)
                      store.removeObject(currentPreviewIndex, selectedObjectId);
                  }}
                >
                  <IconTrash size={12} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Position */}
          <SimpleGrid cols={2} spacing="xs">
            <NumberInput
              id="obj-x-input"
              label="X"
              value={selectedObj.x ?? 0}
              onChange={(val) => updateObj({ x: n(val) })}
            />
            <NumberInput
              id="obj-y-input"
              label="Y"
              value={selectedObj.y ?? 0}
              onChange={(val) => updateObj({ y: n(val) })}
            />
          </SimpleGrid>

          {/* Rotation + Opacity */}
          <SimpleGrid cols={2} spacing="xs">
            <NumberInput
              label="Rotation °"
              value={selectedObj.rotation ?? 0}
              min={-360}
              max={360}
              step={1}
              onChange={(val) =>
                updateObj({ rotation: n(val) } as Partial<
                  import("@src/lib/types").FrameObject
                >)
              }
            />
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={600}>
                Opacity
              </Text>
              <Slider
                min={0}
                max={100}
                value={selectedObj.opacity ?? 100}
                onChange={(val) =>
                  updateObj({ opacity: val } as Partial<
                    import("@src/lib/types").FrameObject
                  >)
                }
                label={(v) => `${v}%`}
                size="xs"
                marks={[{ value: 0 }, { value: 50 }, { value: 100 }]}
              />
            </Stack>
          </SimpleGrid>

          {/* Animation (animate mode only) */}
          {animMode && (
            <Box p="sm" style={animBoxStyle}>
              <Stack gap="xs">
                <Text size="xs" fw={700} tt="uppercase" c="yellow.5">
                  Object Animation
                </Text>
                <Select
                  label="Role"
                  data={[
                    { value: "other", label: "Other / Generic" },
                    { value: "question", label: "Question" },
                    { value: "answer", label: "Answer" },
                    { value: "image", label: "Decorative Image" },
                  ]}
                  value={selectedObj.role || "other"}
                  onChange={(val) => updateObj({ role: val ?? "other" })}
                />
                <AnimPanel
                  label="Animate In"
                  list={ANIM_IN}
                  value={selectedObj.animIn}
                  onChange={(cfg: AnimConfig) =>
                    updateObj({ animIn: cfg } as Partial<FrameObject>)
                  }
                />
                <AnimPanel
                  label="Animate Out"
                  list={ANIM_OUT}
                  value={selectedObj.animOut}
                  onChange={(cfg: AnimConfig) =>
                    updateObj({ animOut: cfg } as Partial<FrameObject>)
                  }
                />
              </Stack>
            </Box>
          )}

          {/* Type-specific fields */}
          <Divider />
          {selectedObj.type === "text" && (
            <TextObjectFields obj={selectedObj} updateObj={updateObj} />
          )}
          {selectedObj.type === "image" && (
            <ImageObjectFields
              obj={selectedObj as ImageObject}
              updateObj={updateObj}
            />
          )}
          {selectedObj.type === "answerGroup" && (
            <AnswerGroupFields
              obj={selectedObj as AnswerGroupObject}
              updateObj={updateObj}
            />
          )}
          {selectedObj.type === "shape" && (
            <ShapeObjectFields
              obj={selectedObj as ShapeObject}
              updateObj={(p) => updateObj(p as Partial<FrameObject>)}
            />
          )}
          {selectedObj.type === "divider" && (
            <DividerObjectFields
              obj={selectedObj as DividerObject}
              updateObj={(p) => updateObj(p as Partial<FrameObject>)}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}
