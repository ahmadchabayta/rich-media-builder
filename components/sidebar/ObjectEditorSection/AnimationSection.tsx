import {
  Stack,
  Text,
  Select,
  Divider,
  NumberInput,
  Group,
} from "@mantine/core";
import { ANIM_IN, ANIM_OUT } from "@src/lib/animPresets";
import type {
  FrameObject,
  AnimConfig,
  LoopAnimConfig,
  HoverEffect,
  ClickEffect,
} from "@src/lib/types";
import { HoverEffectPanel } from "@src/components/sidebar/HoverEffectPanel";
import { ClickEffectPanel } from "@src/components/sidebar/ClickEffectPanel";
import { AnimPhaseBlock } from "./AnimPhaseBlock";

export function AnimationSection({
  selectedObj,
  updateObj,
}: {
  selectedObj: FrameObject;
  updateObj: (patch: Partial<FrameObject>) => void;
}) {
  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="yellow.5">
        Object Animation
      </Text>
      <Group gap={8} align="flex-end">
        <Select
          label="Role"
          style={{ flex: 1 }}
          data={[
            { value: "other", label: "Other / Generic" },
            { value: "question", label: "Question" },
            { value: "answer", label: "Answer" },
            { value: "image", label: "Decorative Image" },
          ]}
          value={selectedObj.role || "other"}
          onChange={(val) => updateObj({ role: val ?? "other" })}
        />
        <NumberInput
          label="Anim order"
          description="Wave 0 = first in / last out"
          style={{ width: 90 }}
          value={selectedObj.animOrder ?? 0}
          min={0}
          step={1}
          onChange={(val) =>
            updateObj({
              animOrder: typeof val === "number" ? val : 0,
            } as Partial<FrameObject>)
          }
        />
      </Group>

      <AnimPhaseBlock
        label="Animate In"
        phase="in"
        presetList={ANIM_IN}
        presetValue={selectedObj.animIn}
        customValue={selectedObj.customAnimIn}
        onPresetChange={(cfg) =>
          updateObj({ animIn: cfg as AnimConfig } as Partial<FrameObject>)
        }
        onCustomChange={(anim) =>
          updateObj({ customAnimIn: anim } as Partial<FrameObject>)
        }
      />

      <AnimPhaseBlock
        label="Animate Out"
        phase="out"
        presetList={ANIM_OUT}
        presetValue={selectedObj.animOut}
        customValue={selectedObj.customAnimOut}
        onPresetChange={(cfg) =>
          updateObj({ animOut: cfg as AnimConfig } as Partial<FrameObject>)
        }
        onCustomChange={(anim) =>
          updateObj({ customAnimOut: anim } as Partial<FrameObject>)
        }
      />

      <Divider my={4} />

      <AnimPhaseBlock
        label="Loop / Decoration"
        phase="loop"
        presetValue={selectedObj.animLoop}
        customValue={selectedObj.customAnimLoop}
        onPresetChange={(cfg) =>
          updateObj({
            animLoop: (cfg ?? undefined) as LoopAnimConfig | undefined,
          } as Partial<FrameObject>)
        }
        onCustomChange={(anim) =>
          updateObj({ customAnimLoop: anim } as Partial<FrameObject>)
        }
      />

      <Divider my={4} />
      <HoverEffectPanel
        value={selectedObj.hoverEffect}
        onChange={(eff: HoverEffect | undefined) =>
          updateObj({ hoverEffect: eff ?? undefined } as Partial<FrameObject>)
        }
      />
      <ClickEffectPanel
        value={selectedObj.clickEffect}
        onChange={(eff: ClickEffect | undefined) =>
          updateObj({ clickEffect: eff ?? undefined } as Partial<FrameObject>)
        }
      />
    </Stack>
  );
}
