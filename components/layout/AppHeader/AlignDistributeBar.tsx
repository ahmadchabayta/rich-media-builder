import { Group, Tooltip, ActionIcon, Divider } from "@mantine/core";
import {
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconLayoutDistributeHorizontal,
  IconLayoutDistributeVertical,
  IconAlignLeft,
  IconAlignRight,
  IconAlignCenter,
  IconAlignBoxLeftMiddle,
  IconAlignBoxRightMiddle,
  IconAlignBoxCenterMiddle,
} from "@tabler/icons-react";
import { useQuizStore } from "@src/store/quizStore";
import {
  calcCenterH,
  calcCenterV,
  spreadObjsH,
  spreadObjsV,
  alignLeft,
  alignRight,
  alignTop,
  alignBottom,
  alignCenterH,
  alignCenterV,
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

  // ── Multi-select alignment (Photoshop-style) ──────────────────────────
  const handleAlignLeft = () => {
    const frame = getActiveFrame();
    if (!frame || selectedObjectIds.length < 2) return;
    updateFrameField(currentPreviewIndex, {
      objects: alignLeft(frame.objects, selectedObjectIds),
    });
  };

  const handleAlignRight = () => {
    const frame = getActiveFrame();
    if (!frame || selectedObjectIds.length < 2) return;
    updateFrameField(currentPreviewIndex, {
      objects: alignRight(
        frame.objects,
        selectedObjectIds,
        boardContainerRef.current,
      ),
    });
  };

  const handleAlignTop = () => {
    const frame = getActiveFrame();
    if (!frame || selectedObjectIds.length < 2) return;
    updateFrameField(currentPreviewIndex, {
      objects: alignTop(frame.objects, selectedObjectIds),
    });
  };

  const handleAlignBottom = () => {
    const frame = getActiveFrame();
    if (!frame || selectedObjectIds.length < 2) return;
    updateFrameField(currentPreviewIndex, {
      objects: alignBottom(
        frame.objects,
        selectedObjectIds,
        boardContainerRef.current,
      ),
    });
  };

  const handleAlignCenterH = () => {
    const frame = getActiveFrame();
    if (!frame || selectedObjectIds.length < 2) return;
    updateFrameField(currentPreviewIndex, {
      objects: alignCenterH(
        frame.objects,
        selectedObjectIds,
        boardContainerRef.current,
      ),
    });
  };

  const handleAlignCenterV = () => {
    const frame = getActiveFrame();
    if (!frame || selectedObjectIds.length < 2) return;
    updateFrameField(currentPreviewIndex, {
      objects: alignCenterV(
        frame.objects,
        selectedObjectIds,
        boardContainerRef.current,
      ),
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

      {multiCount >= 2 && (
        <>
          <Divider orientation="vertical" mx={2} />
          <Tooltip label="Align left edges" withArrow>
            <ActionIcon
              onClick={handleAlignLeft}
              variant="light"
              color="blue"
              size={26}
            >
              <IconAlignLeft size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Align horizontal centres" withArrow>
            <ActionIcon
              onClick={handleAlignCenterH}
              variant="light"
              color="blue"
              size={26}
            >
              <IconAlignCenter size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Align right edges" withArrow>
            <ActionIcon
              onClick={handleAlignRight}
              variant="light"
              color="blue"
              size={26}
            >
              <IconAlignRight size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Align top edges" withArrow>
            <ActionIcon
              onClick={handleAlignTop}
              variant="light"
              color="blue"
              size={26}
            >
              <IconAlignBoxLeftMiddle
                size={14}
                style={{ transform: "rotate(90deg)" }}
              />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Align vertical centres" withArrow>
            <ActionIcon
              onClick={handleAlignCenterV}
              variant="light"
              color="blue"
              size={26}
            >
              <IconAlignBoxCenterMiddle size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Align bottom edges" withArrow>
            <ActionIcon
              onClick={handleAlignBottom}
              variant="light"
              color="blue"
              size={26}
            >
              <IconAlignBoxRightMiddle
                size={14}
                style={{ transform: "rotate(90deg)" }}
              />
            </ActionIcon>
          </Tooltip>
        </>
      )}

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
