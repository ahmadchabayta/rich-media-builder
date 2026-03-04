import { Stack, Text, NumberInput, SimpleGrid } from "@mantine/core";
import { useQuizStore } from "@src/store/quizStore";
import { n } from "../utils";

export function FrameSizeSection() {
  const store = useQuizStore();
  const { defaultW, defaultH } = store;
  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        Default Frame Size
      </Text>
      <SimpleGrid cols={2} spacing="xs">
        <NumberInput
          label="Width"
          placeholder="Width"
          value={defaultW}
          min={100}
          clampBehavior="none"
          onChange={(val) => {
            const v = n(val, 100);
            if (v >= 100) store.setDefaultSize(v, defaultH);
          }}
          onBlur={(e) => {
            const v = Math.max(100, parseInt(e.target.value) || 100);
            store.setDefaultSize(v, defaultH);
          }}
        />
        <NumberInput
          label="Height"
          placeholder="Height"
          value={defaultH}
          min={100}
          clampBehavior="none"
          onChange={(val) => {
            const v = n(val, 100);
            if (v >= 100) store.setDefaultSize(defaultW, v);
          }}
          onBlur={(e) => {
            const v = Math.max(100, parseInt(e.target.value) || 100);
            store.setDefaultSize(defaultW, v);
          }}
        />
      </SimpleGrid>
    </Stack>
  );
}
