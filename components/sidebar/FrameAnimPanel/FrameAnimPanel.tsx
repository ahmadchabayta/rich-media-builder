import {
  Box,
  Stack,
  Text,
  Group,
  Checkbox,
  Select,
  NumberInput,
  SimpleGrid,
} from "@mantine/core";
import { ANIM_IN, ANIM_OUT } from "@src/lib/animPresets";
import type { Frame } from "@src/lib/types";
import { useQuizStore } from "@src/store/quizStore";
import { n, animBoxStyle } from "../utils";

interface Props {
  frame: Frame;
  frameIndex: number;
}

export function FrameAnimPanel({ frame, frameIndex }: Props) {
  const store = useQuizStore();
  const upd = (patch: Partial<Frame>) =>
    store.updateFrameField(frameIndex, patch);
  return (
    <Box p="sm" style={animBoxStyle}>
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="xs" fw={700} tt="uppercase" c="yellow.5">
            Frame Animations
          </Text>
          <Checkbox
            size="xs"
            checked={!!frame.isEndFrame}
            onChange={(e) => upd({ isEndFrame: e.currentTarget.checked })}
            label="End frame"
          />
        </Group>

        <SimpleGrid cols={2} spacing="xs">
          <Select
            label="Enter"
            data={ANIM_IN.map((p) => ({ value: p.v, label: p.l }))}
            value={frame.animEnter?.type || "blsFadeIn"}
            onChange={(val) =>
              upd({
                animEnter: { ...frame.animEnter, type: val ?? "blsFadeIn" },
              })
            }
          />
          <NumberInput
            label="Duration ms"
            value={frame.animEnter?.dur ?? 400}
            min={0}
            onChange={(val) =>
              upd({ animEnter: { ...frame.animEnter, dur: n(val) } })
            }
          />
        </SimpleGrid>

        <SimpleGrid cols={2} spacing="xs">
          <Select
            label="Exit"
            data={ANIM_OUT.map((p) => ({ value: p.v, label: p.l }))}
            value={frame.animExit?.type || "blsFadeOut"}
            onChange={(val) =>
              upd({
                animExit: { ...frame.animExit, type: val ?? "blsFadeOut" },
              })
            }
          />
          <NumberInput
            label="Duration ms"
            value={frame.animExit?.dur ?? 300}
            min={0}
            onChange={(val) =>
              upd({ animExit: { ...frame.animExit, dur: n(val) } })
            }
          />
        </SimpleGrid>

        <NumberInput
          label="Answer stagger (ms)"
          value={frame.answerStagger ?? 80}
          min={0}
          onChange={(val) => upd({ answerStagger: n(val) })}
        />
      </Stack>
    </Box>
  );
}

