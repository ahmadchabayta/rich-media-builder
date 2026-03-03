import { ScrollArea, Stack } from "@mantine/core";
import { FrameSizeSection } from "./sidebar/FrameSizeSection";
import { BgImageSection } from "./sidebar/BgImageSection";
import { BgFillSection } from "./sidebar/BgFillSection";
import { FrameListSection } from "./sidebar/FrameListSection";

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
