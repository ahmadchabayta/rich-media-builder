import type { FrameObject as FrameObjectType } from "@src/lib/types";
import { RichTextEditor } from "./RichTextEditor";

interface InlineTextEditorProps {
  obj: FrameObjectType & { type: "text" };
  frameIndex: number;
  opacityVal: number;
  rotate: string | undefined;
  onCommit: (richText: string, plainText: string) => void;
  onCancel: () => void;
}

export function InlineTextEditor({
  obj,
  frameIndex,
  opacityVal,
  rotate,
  onCommit,
  onCancel,
}: InlineTextEditorProps) {
  return (
    <RichTextEditor
      obj={obj}
      frameIndex={frameIndex}
      opacityVal={opacityVal}
      rotate={rotate}
      onCommit={onCommit}
      onCancel={onCancel}
    />
  );
}
