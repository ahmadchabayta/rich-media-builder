import { useRef, useState, useEffect } from "react";
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  TextInput,
  NumberInput,
  SimpleGrid,
  Slider,
  Tooltip,
  ActionIcon,
  Divider,
} from "@mantine/core";
import { IconCopy, IconTrash, IconCopyPlus } from "@tabler/icons-react";
import type {
  FrameObject,
  ImageObject,
  AnswerGroupObject,
  ShapeObject,
  DividerObject,
} from "@src/lib/types";
import { useQuizStore } from "@src/store/quizStore";
import {
  createDefaultText,
  createDefaultRect,
  createDefaultCircle,
  createDefaultLine,
  createDefaultAnswers,
  createImageFromFile,
} from "@src/lib/insertHelpers";
import { FrameAnimPanel } from "@src/components/sidebar/FrameAnimPanel";
import { TextObjectFields } from "@src/components/sidebar/TextObjectFields";
import { ImageObjectFields } from "@src/components/sidebar/ImageObjectFields";
import { AnswerGroupFields } from "@src/components/sidebar/AnswerGroupFields";
import { ShapeObjectFields } from "@src/components/sidebar/ShapeObjectFields";
import { DividerObjectFields } from "@src/components/sidebar/DividerObjectFields";
import { FiltersBlendPanel } from "@src/components/sidebar/FiltersBlendPanel";
import { n } from "../utils";
import { ObjectPalette } from "./ObjectPalette";
import { AnimationSection } from "./AnimationSection";

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
      (o) =>
        ({
          ...o,
          ...patch,
        }) as FrameObject,
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !frame) return;
    createImageFromFile(file, frame, (obj) =>
      store.addObject(currentPreviewIndex, obj),
    );
    e.target.value = "";
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
          leftSection={
            <span style={{ fontSize: 12 }}>
              {animMode ? "\u2190" : "\uD83C\uDFAC"}
            </span>
          }
          onClick={store.toggleAnimMode}
          disabled={!frame}
        >
          {animMode ? "Back" : "Animate"}
        </Button>
      </Group>

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

          <Divider label="Add objects" labelPosition="left" mt={4} />
          <ObjectPalette
            disabled={!frame}
            onText={() => {
              if (frame)
                store.addObject(
                  currentPreviewIndex,
                  createDefaultText(frame.objects.length),
                );
            }}
            onImage={() => imageInputRef.current?.click()}
            onRect={() => {
              if (frame)
                store.addObject(currentPreviewIndex, createDefaultRect(frame));
            }}
            onCircle={() => {
              if (frame)
                store.addObject(
                  currentPreviewIndex,
                  createDefaultCircle(frame),
                );
            }}
            onLine={() => {
              if (frame)
                store.addObject(currentPreviewIndex, createDefaultLine(frame));
            }}
            onAnswers={() => {
              if (frame)
                store.addObject(
                  currentPreviewIndex,
                  createDefaultAnswers(frame),
                );
            }}
          />
          <Text size="xs" c="dimmed" fs="italic" pt={2}>
            Click an object on the canvas to select and edit it.
          </Text>
        </Stack>
      )}

      {/* Object selected */}
      {frame && selectedObj && (
        <Stack gap="xs">
          {/* Identity header */}
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap={8} align="center" style={{ flex: 1, minWidth: 0 }}>
              <Badge
                size="sm"
                variant="light"
                radius="sm"
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
              <Tooltip label="Copy to all frames" withArrow>
                <ActionIcon
                  size="sm"
                  variant="default"
                  onClick={() => {
                    if (selectedObjectId)
                      store.copyObjectToAllFrames(
                        currentPreviewIndex,
                        selectedObjectId,
                      );
                  }}
                >
                  <IconCopyPlus size={12} />
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

          {animMode ? (
            <AnimationSection selectedObj={selectedObj} updateObj={updateObj} />
          ) : (
            <>
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
              {/* W / H – shown for all object types that expose these fields */}
              <SimpleGrid cols={2} spacing="xs">
                {(selectedObj.type === "shape" ||
                  selectedObj.type === "image" ||
                  selectedObj.type === "divider" ||
                  selectedObj.type === "answerGroup" ||
                  selectedObj.type === "text") && (
                  <NumberInput
                    label="W"
                    value={(selectedObj as any).w ?? ""}
                    min={1}
                    placeholder={
                      selectedObj.type === "text" ? "auto" : undefined
                    }
                    onChange={(val) => {
                      if (selectedObj.type === "text" && val === "") {
                        updateObj({ w: undefined } as Partial<FrameObject>);
                      } else {
                        updateObj({
                          w: Math.max(1, n(val as number | string, 1)),
                        } as Partial<FrameObject>);
                      }
                    }}
                  />
                )}
                {(selectedObj.type === "shape" ||
                  selectedObj.type === "image") && (
                  <NumberInput
                    label="H"
                    value={(selectedObj as any).h ?? 0}
                    min={1}
                    onChange={(val) =>
                      updateObj({
                        h: Math.max(1, n(val as number | string, 1)),
                      } as Partial<FrameObject>)
                    }
                  />
                )}
              </SimpleGrid>
              <SimpleGrid cols={2} spacing="xs">
                <NumberInput
                  label="Rotation °"
                  value={selectedObj.rotation ?? 0}
                  min={-360}
                  max={360}
                  step={1}
                  onChange={(val) =>
                    updateObj({ rotation: n(val) } as Partial<FrameObject>)
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
                      updateObj({ opacity: val } as Partial<FrameObject>)
                    }
                    label={(v) => `${v}%`}
                    size="xs"
                    marks={[{ value: 0 }, { value: 50 }, { value: 100 }]}
                  />
                </Stack>
              </SimpleGrid>

              <Divider />
              <FiltersBlendPanel obj={selectedObj} updateObj={updateObj} />

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
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}
