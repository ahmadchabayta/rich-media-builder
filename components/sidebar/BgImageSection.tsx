import { Stack, Text, Button, FileButton } from "@mantine/core";
import { useQuizStore } from "@src/store/quizStore";

export function BgImageSection() {
  const store = useQuizStore();
  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        Background Image
      </Text>
      <FileButton
        onChange={(file) => {
          if (!file) return;
          const r = new FileReader();
          r.onload = (f) => store.setBg(f.target!.result as string);
          r.readAsDataURL(file);
        }}
        accept="image/*"
      >
        {(props) => (
          <Button {...props} variant="default" fullWidth>
            Choose Background Image
          </Button>
        )}
      </FileButton>
    </Stack>
  );
}
