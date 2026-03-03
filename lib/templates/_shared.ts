import type { ProjectSnapshot } from "@src/store/quizStore";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "quiz" | "poll" | "brand" | "sport" | "news" | "promo";
  tags: string[];
  /** CSS gradient used in the gallery thumbnail */
  previewGradient: string;
  accentColor: string;
  snapshot: ProjectSnapshot;
}

/** Lightweight non-random IDs for static template data */
export const id = (s: string) => `tpl-${s}`;
