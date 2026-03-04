import { Group, Tooltip, ActionIcon, Divider } from "@mantine/core";
import {
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconLayoutDistributeHorizontal,
  IconLayoutDistributeVertical,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import {
  calcCenterH,
  calcCenterV,
  spreadObjsH,
  spreadObjsV,
} from "@src/lib/align";

interface AlignDistributeBarProps {
  boardContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function AlignDistributeBar({
  boardContainerRef,
}: AlignDistributeBarProps) {
  const currentPreviewIndex = useQuizStore((s) => s.currentPreviewIndex);
  const getActiveFrame = useQuizStore((s) => s.getActiveFrame);
  const getSelectedObject = useQuizStore((s) => s.getSelectedObject);
  const selectedObjectIds = useQuizStore((s) => s.selectedObjectIds);
  const updateObject = useQuizStore((s) => s.updateObject);
  const updateFrameField = useQuizStore((s) => s.updateFrameField);

  const handleCenterH = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const ids = selectedObjectIds.length >= 1 ? selectedObjectIds : null;
    const targets = ids
      ? frame.objects.filter((o) => ids.includes(o.id))
      : [getSelectedObject()].filter(Boolean);
    targets.forEach((obj) => {
      if (!obj) return;
      const x = calcCenterH(frame, obj, boardContainerRef.current);
      updateObject(currentPreviewIndex, obj.id, (o) => ({ ...o, x }));
    });
  };

  const handleCenterV = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const ids = selectedObjectIds.length >= 1 ? selectedObjectIds : null;
    const targets = ids
      ? frame.objects.filter((o) => ids.includes(o.id))
      : [getSelectedObject()].filter(Boolean);
    targets.forEach((obj) => {
      if (!obj) return;
      const y = calcCenterV(frame, obj, boardContainerRef.current);
      updateObject(currentPreviewIndex, obj.id, (o) => ({ ...o, y }));
    });
  };

  const handleSpreadH = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const ids = selectedObjectIds.length >= 2 ? selectedObjectIds : undefined;
    updateFrameField(currentPreviewIndex, {
      objects: spreadObjsH(frame.objects, boardContainerRef.current, ids),
    });
  };

  const handleSpreadV = () => {
    const frame = getActiveFrame();
    if (!frame) return;
    const ids = selectedObjectIds.length >= 2 ? selectedObjectIds : undefined;
    updateFrameField(currentPreviewIndex, {
      objects: spreadObjsV(frame.objects, boardContainerRef.current, ids),
    });
  };

  if (selectedObjectIds.length === 0) return null;

  const multiCount = selectedObjectIds.length;

  return (
    <Group gap={3} wrap="nowrap">
      <Tooltip label="Center horizontally in frame" withArrow>
        <ActionIcon onClick={handleCenterH} variant="default" size={26}>
          <IconArrowsHorizontal size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Center vertically in frame" withArrow>
        <ActionIcon onClick={handleCenterV} variant="default" size={26}>
          <IconArrowsVertical size={14} />
        </ActionIcon>
      </Tooltip>
      <Divider orientation="vertical" mx={2} />
      <Tooltip
        label={
          multiCount >= 2
            ? `Distribute ${multiCount} objects horizontally`
            : "Distribute all horizontally"
        }
        withArrow
      >
        <ActionIcon
          onClick={handleSpreadH}
          variant={multiCount >= 2 ? "light" : "default"}
          color={multiCount >= 2 ? "blue" : "gray"}
          size={26}
        >
          <IconLayoutDistributeHorizontal size={14} />
        </ActionIcon>
      </Tooltip>
      <Tooltip
        label={
          multiCount >= 2
            ? `Distribute ${multiCount} objects vertically`
            : "Distribute all vertically"
        }
        withArrow
      >
        <ActionIcon
          onClick={handleSpreadV}
          variant={multiCount >= 2 ? "light" : "default"}
          color={multiCount >= 2 ? "blue" : "gray"}
          size={26}
        >
          <IconLayoutDistributeVertical size={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
