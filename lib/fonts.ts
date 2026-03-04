export interface FontDef {
  family: string;
  source: "system" | "google";
  weights?: string[];
}

/** System fonts that are always available without loading – used for export filtering. */
export const SYSTEM_FONTS = new Set<string>([
  "Arial",
  "Georgia",
  "Impact",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Helvetica",
  "Courier New",
  "Comic Sans MS",
  "Tahoma",
]);

/**
 * Legacy curated list – kept for back-compat.
 * New code should use SYSTEM_FONTS + googleFontsList.ts.
 */
export const FONT_LIST: FontDef[] = [
  // ── System ──────────────────────────────────────────────────────
  { family: "Arial", source: "system" },
  { family: "Georgia", source: "system" },
  { family: "Impact", source: "system" },
  { family: "Times New Roman", source: "system" },
  { family: "Trebuchet MS", source: "system" },
  { family: "Verdana", source: "system" },
  // ── Google ───────────────────────────────────────────────────────
  { family: "Inter", source: "google", weights: ["400", "700", "900"] },
  { family: "Roboto", source: "google", weights: ["400", "700", "900"] },
  { family: "Open Sans", source: "google" },
  { family: "Lato", source: "google" },
  { family: "Montserrat", source: "google", weights: ["400", "700", "900"] },
  { family: "Poppins", source: "google", weights: ["400", "600", "700"] },
  { family: "Nunito", source: "google" },
  { family: "Raleway", source: "google" },
  { family: "Ubuntu", source: "google" },
  { family: "PT Sans", source: "google" },
  { family: "Merriweather", source: "google" },
  { family: "Playfair Display", source: "google", weights: ["400", "700"] },
  { family: "Lora", source: "google" },
  { family: "Oswald", source: "google", weights: ["400", "700"] },
  { family: "Anton", source: "google" },
  { family: "Bebas Neue", source: "google" },
  { family: "Righteous", source: "google" },
  { family: "Dancing Script", source: "google" },
  { family: "Pacifico", source: "google" },
  { family: "Caveat", source: "google" },
];

// ── Loading helpers ──────────────────────────────────────────────────────────

const _loaded = new Set<string>();
const _previewLoaded = new Set<string>();

/**
 * Load the full Google Font for use on canvas / export.
 * `weights` defaults to ["400","700","900"] when not supplied.
 */
export function loadGoogleFont(family: string, weights?: string[]) {
  if (_loaded.has(family)) return;
  if (typeof document === "undefined") return;
  _loaded.add(family);
  const id = `gfont-${family.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const wghts = (weights ?? ["400", "700", "900"]).join(";");
  const enc = encodeURIComponent(family).replace(/%20/g, "+");
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${enc}:wght@${wghts}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Load a tiny subset of a Google Font — just enough characters to display the
 * font name in the picker dropdown (Latin A–Z a–z + digits + space).
 * This is ~3-5 KB vs ~50-120 KB for the full font.
 */
const PREVIEW_CHARS = encodeURIComponent(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ",
);
export function loadGoogleFontPreview(family: string) {
  if (_previewLoaded.has(family)) return;
  if (typeof document === "undefined") return;
  _previewLoaded.add(family);
  const id = `gfont-preview-${family.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const enc = encodeURIComponent(family).replace(/%20/g, "+");
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${enc}&text=${PREVIEW_CHARS}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Ensure a font family is fully loaded.
 * Works for ANY font: system fonts are a no-op, everything else is treated as
 * a Google Font. Curated fonts in FONT_LIST use their declared weight list.
 */
export function ensureFont(family: string | undefined) {
  if (!family) return;
  if (SYSTEM_FONTS.has(family)) return;
  const def = FONT_LIST.find((f) => f.family === family);
  // Use declared weights if available, otherwise load 400/700/900 (covers most display use-cases)
  loadGoogleFont(family, def?.weights);
}

// ── Legacy select data (used nowhere new, kept for back-compat) ────────────

/** @deprecated Use FontFamilySelect component instead. */
export const FONT_SELECT_DATA = [
  {
    group: "System Fonts",
    items: [...SYSTEM_FONTS].sort().map((f) => ({ value: f, label: f })),
  },
  {
    group: "Google Fonts",
    items: FONT_LIST.filter((f) => f.source === "google").map((f) => ({
      value: f.family,
      label: f.family,
    })),
  },
];
