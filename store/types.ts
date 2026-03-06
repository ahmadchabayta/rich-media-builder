import type {
  Frame,
  FrameObject,
  QuizData,
  DefaultTypography,
} from "@src/lib/types";

// ─── Custom Fonts ────────────────────────────────────────────────────────────

export interface CustomFontEntry {
  id: string;
  family: string;
  src: string; // data-URL for uploaded fonts; "" for URL-loaded Google fonts
  addedAt: number;
}

// ─── Asset Bucket ─────────────────────────────────────────────────────────────

export interface AssetItem {
  id: string;
  name: string;
  src: string; // data URL or object URL
  addedAt: number; // timestamp
}

// ─── Export metadata ───────────────────────────────────────────────────────────

export interface ExportCountry {
  code: string; // e.g. "ksa", "uae"
  languages: string[]; // e.g. ["en", "ar"]
}

export interface ExportTrackerMeta {
  enabled: boolean;
  endpoint: string;
}

export interface ExportMeta {
  clientName: string; // e.g. "chuck-e-cheese"
  adName: string; // e.g. "summer-promo"
  adKind: string; // e.g. "bls"
  countries: ExportCountry[];
  tracker: ExportTrackerMeta;
}

// ─── Shared utilities ──────────────────────────────────────────────────────────

export function makeId() {
  return String(Date.now() + Math.random());
}

export function makeDefaultFrame(defaultW: number, defaultH: number): Frame {
  return {
    id: makeId(),
    src: null,
    objects: [],
    w: defaultW,
    h: defaultH,
    isDefault: true,
    isEndFrame: false,
    animEnter: { type: "blsFadeIn", dur: 400 },
    animExit: { type: "blsFadeOut", dur: 300 },
    answerStagger: 80,
    enterStagger: 0,
    exitStagger: 0,
  };
}

// ─── Serialisable snapshot written to disk / cloud ────────────────────────────

export interface ProjectSnapshot {
  version: number;
  quizData: QuizData;
  defaultW: number;
  defaultH: number;
  currentPreviewIndex: number;
}

// ─── Full store state & actions ───────────────────────────────────────────────

export interface QuizState {
  // ── Frame data ──────────────────────────────────────────────────────────────
  quizData: QuizData;
  currentPreviewIndex: number;
  defaultW: number;
  defaultH: number;

  setBg: (bg: string | null) => void;
  addFrame: (frame: Frame) => void;
  removeFrame: (index: number) => void;
  reorderFrame: (from: number, to: number) => void;
  updateFrameField: (index: number, updates: Partial<Frame>) => void;
  setActiveFrame: (index: number) => void;
  commitFrameSize: (frameIndex: number, w: number, h: number) => void;
  ensureAtLeastOneFrame: () => void;
  createDefaultFrame: () => Frame;
  setDefaultSize: (w: number, h: number) => void;
  duplicateFrame: (frameIndex: number) => void;

  // ── Object mutations ────────────────────────────────────────────────────────
  addObject: (frameIndex: number, obj: FrameObject) => void;
  removeObject: (frameIndex: number, objId: string) => void;
  updateObject: (
    frameIndex: number,
    objId: string,
    updater: (obj: FrameObject) => FrameObject,
  ) => void;
  duplicateObject: (frameIndex: number, objId: string) => void;
  copyObjectToAllFrames: (frameIndex: number, objId: string) => void;
  commitObjectPosition: (
    frameIndex: number,
    objId: string,
    x: number,
    y: number,
  ) => void;
  commitObjectResize: (
    frameIndex: number,
    objId: string,
    updates: Partial<FrameObject>,
  ) => void;
  reorderObjectZ: (
    frameIndex: number,
    objId: string,
    dir: "front" | "back" | "forward" | "backward",
  ) => void;
  moveObjectToIndex: (
    frameIndex: number,
    fromIndex: number,
    toIndex: number,
  ) => void;
  nudgeObject: (
    frameIndex: number,
    objId: string,
    dx: number,
    dy: number,
  ) => void;
  toggleObjectVisibility: (frameIndex: number, objId: string) => void;
  toggleObjectLock: (frameIndex: number, objId: string) => void;

  // ── Selection / UI ──────────────────────────────────────────────────────────
  selectedObjectId: string | null;
  selectedObjectIds: string[];
  animMode: boolean;
  snapEnabled: boolean;
  showRuler: boolean;
  showGrid: boolean;
  timelineOpen: boolean;
  zoom: number;
  showCursorLines: boolean;

  getActiveFrame: () => Frame | null;
  getSelectedObject: () => FrameObject | null;
  setSelectedObject: (id: string | null) => void;
  toggleObjectSelection: (id: string) => void;
  toggleAnimMode: () => void;
  setSnapEnabled: (v: boolean) => void;
  setShowRuler: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
  setTimelineOpen: (v: boolean) => void;
  setZoom: (v: number) => void;
  setShowCursorLines: (v: boolean) => void;
  penMode: boolean;
  setPenMode: (v: boolean) => void;
  defaultTypography: DefaultTypography;
  setDefaultTypography: (patch: Partial<DefaultTypography>) => void;

  // ── History ─────────────────────────────────────────────────────────────────
  pastSnapshots: QuizData[];
  futureSnapshots: QuizData[];
  isDirty: boolean;

  snapshot: () => void;
  undo: () => void;
  redo: () => void;

  // ── Clipboard ───────────────────────────────────────────────────────────────
  clipboard: FrameObject | null;

  copyObject: (frameIndex: number, objId: string) => void;
  pasteObject: (frameIndex: number) => void;

  // ── Playback (transient – not persisted) ──────────────────────────────────
  playback: { frameIdx: number; phase: "enter" | "hold" | "exit" } | null;
  setPlayback: (
    pb: { frameIdx: number; phase: "enter" | "hold" | "exit" } | null,
  ) => void;

  // ── Cloud / persistence ─────────────────────────────────────────────────────
  cloudProjectId: string | null;
  cloudProjectTitle: string | null;
  cloudProjectClient: string | null;
  cloudProjectLocales: string[];
  cloudProjectRegions: string[];
  lastSavedAt: number | null;

  setCloudProjectId: (id: string | null) => void;
  setCloudProjectTitle: (title: string | null) => void;
  setCloudProjectClient: (client: string | null) => void;
  setCloudProjectLocales: (locales: string[]) => void;
  setCloudProjectRegions: (regions: string[]) => void;
  markSaved: () => void;
  loadProject: (data: ProjectSnapshot) => void;

  // ── Export metadata ─────────────────────────────────────────────────────────
  exportMeta: ExportMeta;
  setExportMeta: (meta: Partial<ExportMeta>) => void;

  // ── Custom CSS ──────────────────────────────────────────────────────────────
  customCss: string;
  setCustomCss: (css: string) => void;

  // ── Asset bucket ────────────────────────────────────────────────────────────
  assets: AssetItem[];
  addAsset: (item: AssetItem) => void;
  removeAsset: (id: string) => void;

  // ── Custom fonts ─────────────────────────────────────────────────────────────
  customFonts: CustomFontEntry[];
  addCustomFont: (entry: CustomFontEntry) => void;
  removeCustomFont: (id: string) => void;

  // ── Translations ─────────────────────────────────────────────────────────
  setTranslation: (locale: string, objId: string, text: string) => void;
  removeTranslationLocale: (locale: string) => void;
  duplicateFramesAsLocale: (locale: string) => void;
}

// ─── Slice helper types ───────────────────────────────────────────────────────

export type SliceSet = (
  partial: Partial<QuizState> | ((s: QuizState) => Partial<QuizState>),
) => void;
export type SliceGet = () => QuizState;
