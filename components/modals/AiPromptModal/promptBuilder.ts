/* ─── Constants & prompt-builder for AiPromptModal ─────────────────── */

export const SIZE_PRESETS: Record<string, { w: number; h: number }> = {
  "320×480 (Mobile Portrait)": { w: 320, h: 480 },
  "300×250 (Medium Rectangle)": { w: 300, h: 250 },
  "728×90 (Leaderboard)": { w: 728, h: 90 },
  "160×600 (Wide Skyscraper)": { w: 160, h: 600 },
  "970×250 (Billboard)": { w: 970, h: 250 },
  "300×600 (Half Page)": { w: 300, h: 600 },
  "320×50 (Mobile Banner)": { w: 320, h: 50 },
  Custom: { w: 0, h: 0 },
};

export const AD_TYPES = [
  "Quiz / Trivia",
  "Product Showcase",
  "Poll / Survey",
  "Story / Carousel",
  "Game / Interactive",
  "Lead Generation",
  "Brand Awareness",
];

export const STYLE_MOODS = [
  "Bold & Vibrant",
  "Minimal & Clean",
  "Playful & Fun",
  "Corporate & Professional",
  "Luxury & Elegant",
  "Dark & Edgy",
  "Warm & Friendly",
];

export const ANIM_PRESETS = [
  "blsFadeIn",
  "blsSlideUp",
  "blsSlideDown",
  "blsSlideLeft",
  "blsSlideRight",
  "blsZoomIn",
  "blsZoomOut",
  "blsBounceIn",
  "blsFlipX",
  "blsFlipY",
  "blsRotateIn",
];

/* ─── Prompt builder ─────────────────────────────────────────────── */

export interface PromptInputs {
  brandName: string;
  adGoal: string;
  adType: string;
  w: number;
  h: number;
  frameCount: number;
  answersPerFrame: number;
  headline: string;
  styleMood: string;
  brandColors: string;
  fontPref: string;
  extraNotes: string;
}

export function buildPrompt(p: PromptInputs): string {
  const lines: string[] = [];

  lines.push(
    `You are a creative ad designer. Generate a complete JSON project file for an interactive rich-media ad authoring tool.`,
  );
  lines.push(``);
  lines.push(`## Ad Brief`);
  if (p.brandName) lines.push(`- **Brand / Advertiser:** ${p.brandName}`);
  if (p.adGoal) lines.push(`- **Goal / Campaign Objective:** ${p.adGoal}`);
  lines.push(`- **Ad Type:** ${p.adType}`);
  lines.push(`- **Canvas Size:** ${p.w}×${p.h} px`);
  lines.push(
    `- **Number of frames:** ${p.frameCount} (last frame is the end/results frame)`,
  );
  if (p.adType === "Quiz / Trivia" || p.adType === "Poll / Survey")
    lines.push(`- **Answers per question frame:** ${p.answersPerFrame}`);
  if (p.headline) lines.push(`- **Headline / Hook:** "${p.headline}"`);
  lines.push(`- **Visual Style / Mood:** ${p.styleMood}`);
  if (p.brandColors) lines.push(`- **Brand Colors:** ${p.brandColors}`);
  if (p.fontPref)
    lines.push(`- **Preferred Font(s):** ${p.fontPref} (Google Fonts)`);
  if (p.extraNotes) lines.push(`- **Additional Notes:** ${p.extraNotes}`);

  lines.push(``);
  lines.push(`## JSON Schema`);
  lines.push(
    `Return a single JSON object matching this TypeScript interface exactly:`,
  );
  lines.push("```ts");
  lines.push(`interface ProjectSnapshot {
  version: 1;
  defaultW: ${p.w};
  defaultH: ${p.h};
  currentPreviewIndex: 0;
  quizData: {
    bg: string | null;         // global bg color hex or null
    frames: Frame[];           // exactly ${p.frameCount} frames
  };
}`);
  lines.push(``);
  lines.push(`interface Frame {
  id: string;                  // unique string, e.g. "frame_1"
  src: null;                   // always null (no base64)
  objects: FrameObject[];
  w: ${p.w};
  h: ${p.h};
  isDefault: false;
  isEndFrame: boolean;         // true ONLY for the last frame
  animEnter: { type: string; dur: number };   // e.g. { type: "blsFadeIn", dur: 400 }
  animExit: { type: string; dur: number };    // e.g. { type: "blsFadeOut", dur: 300 }
  answerStagger: number;       // ms delay between answer animations, e.g. 80
  bgColor?: string;            // hex, e.g. "#1a1b2e"
  bgGradient?: { angle: number; stops: [string, string] } | null;
}`);
  lines.push(``);
  lines.push(`// Object types that can appear in a frame's objects[]:

interface TextObject {
  type: "text";
  id: string;                  // unique, e.g. "txt_1_heading"
  label: string;               // human label, e.g. "Heading"
  x: number; y: number;        // pixel position from top-left
  text: string;
  size: number;                // font size in px
  color: string;               // hex
  fontWeight?: string;         // "400" | "700" | "900"
  fontFamily?: string;         // Google Font name, e.g. "Poppins"
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;         // e.g. 1.3
  letterSpacing?: number;      // px
  bgEnabled?: boolean;
  bgColor?: string;            // pill bg hex
  radius?: number;             // pill border-radius
  opacity?: number;            // 0–100
  italic?: boolean;
  underline?: boolean;
}

interface ImageObject {
  type: "image";
  id: string;
  label: string;
  x: number; y: number;
  src: "https://placehold.co/{w}x{h}/png"; // PLACEHOLDER URL, use placehold.co
  w: number; h: number;
}

interface AnswerGroupObject {
  type: "answerGroup";
  id: string;
  label: string;               // e.g. "Answers Q1"
  x: number; y: number;
  w: number;                   // total width of buttons
  answers: { id: string; text: string }[];  // ${p.answersPerFrame} answers
  btnHeight: number;           // px per button
  btnGap: number;              // spacing between buttons
  btnBgColor: string;          // hex
  btnBgOpacity: number;        // 0–100
  btnRadius: number;           // border-radius
  textColor: string;           // hex
  fontSize: number;
}

interface ShapeObject {
  type: "shape";
  id: string;
  label: string;
  x: number; y: number;
  shape: "rect" | "circle";
  w: number; h: number;
  fill: string;                // hex
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
}

interface DividerObject {
  type: "divider";
  id: string;
  label: string;
  x: number; y: number;
  w: number;
  thickness: number;
  color: string;
  lineStyle?: "solid" | "dashed" | "dotted";
}`);
  lines.push("```");

  lines.push(``);
  lines.push(`## Available Animation Types`);
  lines.push(`Use these for animEnter.type / animExit.type:`);
  lines.push(ANIM_PRESETS.map((a) => `\`${a}\``).join(", "));

  lines.push(``);
  lines.push(`## Rules`);
  lines.push(
    `1. Return ONLY valid JSON. No markdown fences, no explanation — just the raw JSON object.`,
  );
  lines.push(`2. Every \`id\` field must be a unique string.`);
  lines.push(
    `3. For images, use \`https://placehold.co/{WIDTH}x{HEIGHT}/png\` as placeholder URLs. NEVER use base64.`,
  );
  lines.push(
    `4. All coordinates (x, y) must keep objects within the ${p.w}×${p.h} canvas bounds.`,
  );
  lines.push(
    `5. Write creative, on-brand text for headings, questions, and answers. Make it engaging.`,
  );
  lines.push(
    `6. Use varied enter/exit animations across frames for visual interest.`,
  );
  lines.push(
    `7. The last frame (isEndFrame: true) should be a results/summary frame.`,
  );
  lines.push(
    `8. Set appropriate bgColor or bgGradient per frame. Use the brand colors provided.`,
  );
  lines.push(
    `9. Place objects with sensible vertical spacing — don't let them overlap unless intentional.`,
  );
  lines.push(`10. set version to 1.`);

  return lines.join("\n");
}
