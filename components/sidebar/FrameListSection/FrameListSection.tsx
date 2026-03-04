import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  Box,
  ActionIcon,
  FileButton,
} from "@mantine/core";
import { IconX, IconCopy } from "@tabler/icons-react";
import { useQuizStore, makeId } from "@src/store/quizStore";

export function FrameListSection() {
  const store = useQuizStore();
  const { quizData, currentPreviewIndex, defaultW, defaultH } = store;

  const handleFrameFiles = (files: File[]) => {
    if (!files.length) return;
    if (quizData.frames.length === 1 && quizData.frames[0].isDefault) {
      store.removeFrame(0);
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (f) => {
        store.addFrame({
          id: makeId(),
          src: f.target!.result as string,
          objects: [],
          w: defaultW,
          h: defaultH,
          isDefault: false,
          isEndFrame: false,
          animEnter: { type: "blsFadeIn", dur: 400 },
          animExit: { type: "blsFadeOut", dur: 300 },
          answerStagger: 80,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddBlankFrame = () => {
    store.addFrame({
      id: makeId(),
      src: null,
      objects: [],
      w: defaultW,
      h: defaultH,
      isDefault: false,
      isEndFrame: false,
      animEnter: { type: "blsFadeIn", dur: 400 },
      animExit: { type: "blsFadeOut", dur: 300 },
      answerStagger: 80,
    });
  };

  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        Sequence Frames
      </Text>
      <Text size="xs" c="dimmed" fs="italic">
        Upload images in order: Q1, Q2, Q3, then Final Frame.
      </Text>
      <FileButton onChange={handleFrameFiles} accept="image/*" multiple>
        {(props) => (
          <Button {...props} variant="default" fullWidth>
            Upload Frame Images
          </Button>
        )}
      </FileButton>

      <Stack gap={4} mt={4}>
        {quizData.frames.map((f, i) => (
          <Paper
            key={f.id}
            withBorder
            p="xs"
            radius="sm"
            onClick={() => store.setActiveFrame(i)}
            style={{
              borderColor:
                i === currentPreviewIndex
                  ? "var(--mantine-color-blue-5)"
                  : undefined,
              cursor: "pointer",
            }}
          >
            <Group gap="xs" wrap="nowrap">
              {f.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.src}
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 4,
                    flexShrink: 0,
                    pointerEvents: "none",
                    display: "block",
                  }}
                  alt=""
                />
              ) : (
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--mantine-color-dark-5)",
                  }}
                >
                  <Text size="xs" c="dimmed">
                    {i + 1}
                  </Text>
                </Box>
              )}
              <Text
                size="xs"
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Frame {i + 1}{" "}
                <Text span size="xs" c="dimmed">
                  {f.w}×{f.h}
                </Text>
              </Text>
              <ActionIcon
                color="blue"
                size="sm"
                variant="subtle"
                title="Duplicate frame"
                onClick={(e) => {
                  e.stopPropagation();
                  store.duplicateFrame(i);
                }}
              >
                <IconCopy size={12} />
              </ActionIcon>
              <ActionIcon
                color="red"
                size="sm"
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  store.removeFrame(i);
                }}
              >
                <IconX size={12} />
              </ActionIcon>
            </Group>
          </Paper>
        ))}
      </Stack>

      <Button
        onClick={handleAddBlankFrame}
        variant="default"
        style={{ borderStyle: "dashed" }}
        fullWidth
        mt={4}
      >
        + Add Blank Frame
      </Button>
    </Stack>
  );
}
