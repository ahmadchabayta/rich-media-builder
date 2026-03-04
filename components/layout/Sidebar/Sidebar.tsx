import { ScrollArea, Stack } from "@mantine/core";
import { FrameSizeSection } from "@src/components/sidebar/FrameSizeSection";
import { BgImageSection } from "@src/components/sidebar/BgImageSection";
import { BgFillSection } from "@src/components/sidebar/BgFillSection";
import { FrameListSection } from "@src/components/sidebar/FrameListSection";

export function Sidebar() {
  return (
    <ScrollArea h="100%" type="auto">
      <Stack p="md" gap="lg">
        <FrameSizeSection />
        <BgFillSection />
        <BgImageSection />
        <FrameListSection />
      </Stack>
    </ScrollArea>
  );
}
