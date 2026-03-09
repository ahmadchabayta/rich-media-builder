import { useState } from "react";
import {
  Stack,
  NumberInput,
  SimpleGrid,
  SegmentedControl,
  ActionIcon,
  Tooltip,
  Group,
  Text,
} from "@mantine/core";
import { IconBorderAll, IconSpacingHorizontal } from "@tabler/icons-react";
import type { TextObject, FrameObject } from "@src/lib/types";
import { n } from "../utils";

interface Props {
  obj: TextObject;
  updateObj: (patch: Partial<FrameObject>) => void;
}

export function TextObjectFields({ obj, updateObj }: Props) {
  const [advanced, setAdvanced] = useState(false);

  return (
    <Stack gap="xs">
      {/* Corner radius */}
      <NumberInput
        label="Corner radius"
        placeholder="px"
        min={0}
        value={obj.radius ?? 8}
        onChange={(val) => updateObj({ radius: Math.max(0, n(val)) })}
      />

      {/* Padding */}
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed" fw={600}>
          Padding
        </Text>
        <Tooltip
          label={advanced ? "Symmetric H/V" : "Per-side T/R/B/L"}
          withArrow
        >
          <ActionIcon
            size={18}
            variant={advanced ? "filled" : "subtle"}
            color="gray"
            onClick={() => setAdvanced((a) => !a)}
          >
            {advanced ? (
              <IconSpacingHorizontal size={12} />
            ) : (
              <IconBorderAll size={12} />
            )}
          </ActionIcon>
        </Tooltip>
      </Group>

      {advanced ? (
        <SimpleGrid cols={4} spacing="xs">
          <NumberInput
            label="T"
            placeholder="px"
            value={obj.paddingTop ?? obj.paddingY ?? 0}
            min={0}
            onChange={(val) =>
              updateObj({
                paddingTop: Math.max(0, n(val as number | string)),
              } as Partial<FrameObject>)
            }
          />
          <NumberInput
            label="R"
            placeholder="px"
            value={obj.paddingRight ?? obj.paddingX ?? 0}
            min={0}
            onChange={(val) =>
              updateObj({
                paddingRight: Math.max(0, n(val as number | string)),
              } as Partial<FrameObject>)
            }
          />
          <NumberInput
            label="B"
            placeholder="px"
            value={obj.paddingBottom ?? obj.paddingY ?? 0}
            min={0}
            onChange={(val) =>
              updateObj({
                paddingBottom: Math.max(0, n(val as number | string)),
              } as Partial<FrameObject>)
            }
          />
          <NumberInput
            label="L"
            placeholder="px"
            value={obj.paddingLeft ?? obj.paddingX ?? 0}
            min={0}
            onChange={(val) =>
              updateObj({
                paddingLeft: Math.max(0, n(val as number | string)),
              } as Partial<FrameObject>)
            }
          />
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={2} spacing="xs">
          <NumberInput
            label="H (←→)"
            placeholder="px"
            value={obj.paddingX ?? 0}
            min={0}
            onChange={(val) =>
              updateObj({
                paddingX: Math.max(0, n(val as number | string)),
              } as Partial<FrameObject>)
            }
          />
          <NumberInput
            label="V (↑↓)"
            placeholder="px"
            value={obj.paddingY ?? 0}
            min={0}
            onChange={(val) =>
              updateObj({
                paddingY: Math.max(0, n(val as number | string)),
              } as Partial<FrameObject>)
            }
          />
        </SimpleGrid>
      )}

      {/* Text direction */}
      <SegmentedControl
        size="xs"
        fullWidth
        value={obj.direction ?? "ltr"}
        onChange={(v) => updateObj({ direction: v as "ltr" | "rtl" })}
        data={[
          { value: "ltr", label: "LTR" },
          { value: "rtl", label: "RTL" },
        ]}
      />
    </Stack>
  );
}
