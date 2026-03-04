import { SimpleGrid, NumberInput } from "@mantine/core";
import type { ImageObject, FrameObject } from "@src/lib/types";
import { n } from "../utils";

interface Props {
  obj: ImageObject;
  updateObj: (patch: Partial<FrameObject>) => void;
}

export function ImageObjectFields({ obj, updateObj }: Props) {
  return (
    <SimpleGrid cols={2} spacing="xs">
      <NumberInput
        label="Width"
        value={obj.w ?? ""}
        onChange={(val) => updateObj({ w: n(val) })}
      />
      <NumberInput
        label="Height"
        value={obj.h ?? ""}
        onChange={(val) => updateObj({ h: n(val) })}
      />
    </SimpleGrid>
  );
}

