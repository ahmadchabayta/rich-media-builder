import {
  Stack,
  Text,
  Button,
  FileButton,
  Select,
  Slider,
  Group,
  ActionIcon,
  Box,
  NumberInput,
  SimpleGrid,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import type { BgImageAnimType } from "@src/lib/types";

const ANIM_OPTIONS: { value: BgImageAnimType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "blsBgZoomIn", label: "Slow Zoom In" },
  { value: "blsBgZoomOut", label: "Slow Zoom Out" },
  { value: "blsBgKenBurns", label: "Ken Burns (pan + zoom)" },
  { value: "blsBgPulse", label: "Pulse" },
  { value: "blsBgFadeIn", label: "Fade In" },
];

export function BgImageSection() {
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const frame = useQuizStore(
    (s) => s.quizData.frames[s.currentPreviewIndex] ?? null,
  );
  const globalBg = useQuizStore((s) => s.quizData.bg);
  const setBg = useQuizStore((s) => s.setBg);
  const updateFrameField = useQuizStore((s) => s.updateFrameField);

  if (!frame) return null;

  // Effective bg: per-frame takes priority, falls back to legacy global
  const effectiveBg = frame.bgImage ?? globalBg ?? null;
  const isPerFrame = !!frame.bgImage;
  const animType: BgImageAnimType = frame.bgImageAnim?.type ?? "none";
  const animDur: number = frame.bgImageAnim?.dur ?? 8000;
  const bgSize = frame.bgImageSize ?? "cover";
  const bgPosX = frame.bgImagePosX ?? 50;
  const bgPosY = frame.bgImagePosY ?? 50;

  function setImage(src: string) {
    updateFrameField(currentPreviewIndex, {
      bgImage: src,
      bgImageAnim: frame!.bgImageAnim ?? { type: "none", dur: 8000 },
    });
  }

  function removeImage() {
    if (isPerFrame) {
      updateFrameField(currentPreviewIndex, {
        bgImage: null,
        bgImageAnim: null,
      });
    } else {
      // Legacy global bg — clear it
      setBg(null);
    }
  }

  function setAnimType(val: string | null) {
    const type = (val ?? "none") as BgImageAnimType;
    updateFrameField(currentPreviewIndex, {
      bgImageAnim: { type, dur: animDur },
    });
  }

  function setAnimDur(val: number) {
    updateFrameField(currentPreviewIndex, {
      bgImageAnim: { type: animType, dur: val },
    });
  }

  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        Background Image
      </Text>

      {effectiveBg ? (
        <Box pos="relative">
          <img
            src={effectiveBg}
            alt="bg"
            style={{
              width: "100%",
              height: 80,
              objectFit: "cover",
              borderRadius: 6,
              display: "block",
            }}
          />
          <ActionIcon
            size={18}
            color="red"
            variant="filled"
            radius="xl"
            style={{ position: "absolute", top: 4, right: 4 }}
            onClick={removeImage}
            title="Remove background image"
          >
            <IconX size={10} />
          </ActionIcon>
        </Box>
      ) : null}

      <Group gap="xs">
        <FileButton
          onChange={(file) => {
            if (!file) return;
            const r = new FileReader();
            r.onload = (e) => setImage(e.target!.result as string);
            r.readAsDataURL(file);
          }}
          accept="image/*"
        >
          {(props) => (
            <Button {...props} variant="default" style={{ flex: 1 }}>
              {effectiveBg ? "Replace Image" : "Choose Image"}
            </Button>
          )}
        </FileButton>
      </Group>

      {isPerFrame && effectiveBg && (
        <>
          <Select
            label="Size"
            size="xs"
            value={bgSize}
            onChange={(v) =>
              updateFrameField(currentPreviewIndex, {
                bgImageSize: (v ?? "cover") as "cover" | "contain" | "auto",
              })
            }
            data={[
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
              { value: "auto", label: "Auto (original)" },
            ]}
          />

          <SimpleGrid cols={2} spacing="xs">
            <NumberInput
              label="Pos X %"
              size="xs"
              value={bgPosX}
              min={0}
              max={100}
              step={1}
              onChange={(v) =>
                updateFrameField(currentPreviewIndex, {
                  bgImagePosX: typeof v === "number" ? v : 50,
                })
              }
            />
            <NumberInput
              label="Pos Y %"
              size="xs"
              value={bgPosY}
              min={0}
              max={100}
              step={1}
              onChange={(v) =>
                updateFrameField(currentPreviewIndex, {
                  bgImagePosY: typeof v === "number" ? v : 50,
                })
              }
            />
          </SimpleGrid>

          <Select
            label="Animation"
            size="xs"
            value={animType}
            onChange={setAnimType}
            data={ANIM_OPTIONS}
          />

          {animType !== "none" && (
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                Duration: {(animDur / 1000).toFixed(1)}s
              </Text>
              <Slider
                min={2000}
                max={14000}
                step={500}
                value={animDur}
                onChange={setAnimDur}
                size="xs"
              />
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
