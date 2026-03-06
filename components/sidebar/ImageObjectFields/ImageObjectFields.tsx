import type { ImageObject, FrameObject } from "@src/lib/types";

interface Props {
  obj: ImageObject;
  updateObj: (patch: Partial<FrameObject>) => void;
}

/** W/H is now handled by ObjectEditorSection. This component is a placeholder for future image-specific fields. */
export function ImageObjectFields(_props: Props) {
  void _props;
  return null;
}
