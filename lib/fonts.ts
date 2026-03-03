export interface FontDef {
  family: string;
  source: "system" | "google";
  weights?: string[];
}

/** Curated font list — system fonts load instantly; Google fonts are loaded on demand. */
export const FONT_LIST: FontDef[] = [
  // ── System ──────────────────────────────────────────────────────
  { family: "Arial", source: "system" },
  { family: "Georgia", source: "system" },
  { family: "Impact", source: "system" },
  { family: "Times New Roman", source: "system" },
  { family: "Trebuchet MS", source: "system" },
  { family: "Verdana", source: "system" },
  // ── Sans-serif ───────────────────────────────────────────────────
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
  // ── Serif ────────────────────────────────────────────────────────
  { family: "Merriweather", source: "google" },
  { family: "Playfair Display", source: "google", weights: ["400", "700"] },
  { family: "Lora", source: "google" },
  // ── Display / Bold ───────────────────────────────────────────────
  { family: "Oswald", source: "google", weights: ["400", "700"] },
  { family: "Anton", source: "google" },
  { family: "Bebas Neue", source: "google" },
  { family: "Righteous", source: "google" },
  // ── Handwriting ──────────────────────────────────────────────────
  { family: "Dancing Script", source: "google" },
  { family: "Pacifico", source: "google" },
  { family: "Caveat", source: "google" },
];

const _loaded = new Set<string>();

/** Inject a Google Fonts stylesheet for `family`. Safe to call multiple times. */
export function loadGoogleFont(family: string, weights?: string[]) {
  if (_loaded.has(family)) return;
  if (typeof document === "undefined") return;
  _loaded.add(family);
  const id = `gfont-${family.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const wghts = (weights ?? ["400", "700"]).join(";");
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${wghts}&display=swap`;
  document.head.appendChild(link);
}

/** Ensure a font is loaded (no-op for system fonts). */
export function ensureFont(family: string | undefined) {
  if (!family) return;
  const def = FONT_LIST.find((f) => f.family === family);
  if (def?.source === "google") loadGoogleFont(family, def.weights);
}

/** Select options suitable for Mantine v8 Select/Combobox (grouped format). */
export const FONT_SELECT_DATA = [
  {
    group: "System Fonts",
    items: FONT_LIST.filter((f) => f.source === "system").map((f) => ({
      value: f.family,
      label: f.family,
    })),
  },
  {
    group: "Google Fonts",
    items: FONT_LIST.filter((f) => f.source === "google").map((f) => ({
      value: f.family,
      label: f.family,
    })),
  },
];
