import type {
  Frame,
  FrameObject,
  TextObject,
  AnswerGroupObject,
} from "@src/lib/types";
import type { SliceSet, SliceGet } from "../types";
import { makeId, makeDefaultFrame } from "../types";
import {
  RTL_LOCALES,
  EASTERN_DIGIT_LOCALES,
  toEasternDigits,
} from "@src/lib/localeUtils";

function applyLocaleToFrame(
  src: Frame,
  localeMap: Record<string, string>,
  isRtl: boolean,
  locale: string,
): Frame {
  const objects: FrameObject[] = src.objects.map((obj) => {
    const clone: FrameObject = JSON.parse(JSON.stringify(obj));
    clone.id = makeId();
    if (clone.type === "text") {
      const t = clone as TextObject;
      let translated: string | undefined = localeMap[obj.id];
      // Reject corrupt translation: original is numeric but translation has no digits
      const origText = (obj as TextObject).text ?? "";
      if (
        translated &&
        /^\d[\d\s/.,:]*$/.test(origText.trim()) &&
        !/[\d\u0660-\u0669]/.test(translated)
      ) {
        translated = undefined;
      }
      if (translated) t.text = translated;
      // Auto-convert Latin digits → Eastern Arabic for AR/FA/UR
      if (EASTERN_DIGIT_LOCALES.has(locale) && t.text) {
        t.text = toEasternDigits(t.text);
      }
      if (isRtl) {
        t.direction = "rtl";
        if (t.textAlign === "left" || t.textAlign == null) {
          t.textAlign = "right";
        }
      }
    } else if (clone.type === "answerGroup") {
      const ag = clone as AnswerGroupObject;
      ag.answers = ag.answers.map((ans, i) => {
        const originalAns = (obj as AnswerGroupObject).answers[i];
        let translated = originalAns ? localeMap[originalAns.id] : undefined;
        // Reject corrupt translation: original is numeric but translation has no digits
        const origAnsText = originalAns?.text ?? "";
        if (
          translated &&
          /^\d[\d\s/.,:]*$/.test(origAnsText.trim()) &&
          !/[\d\u0660-\u0669]/.test(translated)
        ) {
          translated = undefined;
        }
        // Auto-convert Latin digits → Eastern Arabic for AR/FA/UR
        if (EASTERN_DIGIT_LOCALES.has(locale) && (translated ?? ans.text)) {
          const txt = translated ?? ans.text ?? "";
          const converted = toEasternDigits(txt);
          if (converted !== txt) translated = converted;
        }
        return translated ? { ...ans, text: translated } : ans;
      });
      if (isRtl) {
        ag.direction = "rtl";
        if (ag.textAlign === "left" || ag.textAlign == null) {
          ag.textAlign = "right";
        }
      }
    }
    return clone;
  });
  return { ...JSON.parse(JSON.stringify(src)), id: makeId(), locale, objects };
}

export const frameSlice = (set: SliceSet, get: SliceGet) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  quizData: { bg: null, frames: [] as Frame[] },
  currentPreviewIndex: 0,
  defaultW: 320,
  defaultH: 480,

  // ── Actions ──────────────────────────────────────────────────────────────────

  createDefaultFrame: (): Frame => {
    const { defaultW, defaultH } = get();
    return makeDefaultFrame(defaultW, defaultH);
  },

  setBg: (bg: string | null) =>
    set((s) => ({ quizData: { ...s.quizData, bg } })),

  addFrame: (frame: Frame) => {
    get().snapshot();
    set((s) => ({
      quizData: { ...s.quizData, frames: [...s.quizData.frames, frame] },
      currentPreviewIndex: s.quizData.frames.length,
      selectedObjectId: null,
    }));
  },

  removeFrame: (index: number) => {
    get().snapshot();
    set((s) => {
      let frames = s.quizData.frames.filter((_, i) => i !== index);
      if (frames.length === 0)
        frames = [makeDefaultFrame(s.defaultW, s.defaultH)];
      const newIndex = Math.max(
        0,
        Math.min(s.currentPreviewIndex, frames.length - 1),
      );
      return {
        quizData: { ...s.quizData, frames },
        currentPreviewIndex: newIndex,
        selectedObjectId: null,
      };
    });
  },

  reorderFrame: (from: number, to: number) =>
    set((s) => {
      const frames = [...s.quizData.frames];
      const [moved] = frames.splice(from, 1);
      frames.splice(to, 0, moved);
      let idx = s.currentPreviewIndex;
      if (idx === from) idx = to;
      else if (idx > from && idx <= to) idx--;
      else if (idx < from && idx >= to) idx++;
      return { quizData: { ...s.quizData, frames }, currentPreviewIndex: idx };
    }),

  updateFrameField: (index: number, updates: Partial<Frame>) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) =>
        i === index ? { ...f, ...updates } : f,
      );
      return { quizData: { ...s.quizData, frames } };
    });
  },

  setActiveFrame: (index: number) =>
    set((s) => ({
      currentPreviewIndex: Math.max(
        0,
        Math.min(index, s.quizData.frames.length - 1),
      ),
      selectedObjectId: null,
      selectedObjectIds: [],
    })),

  commitFrameSize: (frameIndex: number, w: number, h: number) => {
    get().snapshot();
    set((s) => {
      const frames = s.quizData.frames.map((f, i) =>
        i === frameIndex ? { ...f, w, h } : f,
      );
      return { quizData: { ...s.quizData, frames } };
    });
  },

  ensureAtLeastOneFrame: () => {
    const { quizData, defaultW, defaultH } = get();
    if (quizData.frames.length > 0) return;
    set((s) => ({
      quizData: {
        ...s.quizData,
        frames: [makeDefaultFrame(defaultW, defaultH)],
      },
      currentPreviewIndex: 0,
      selectedObjectId: null,
    }));
  },

  setDefaultSize: (w: number, h: number) => set({ defaultW: w, defaultH: h }),

  duplicateFrame: (frameIndex: number) => {
    get().snapshot();
    set((s) => {
      const src = s.quizData.frames[frameIndex];
      if (!src) return s;
      const clone: Frame = {
        ...JSON.parse(JSON.stringify(src)),
        id: makeId(),
        objects: src.objects.map((o) => ({
          ...JSON.parse(JSON.stringify(o)),
          id: makeId(),
        })),
      };
      const frames = [...s.quizData.frames];
      frames.splice(frameIndex + 1, 0, clone);
      return {
        quizData: { ...s.quizData, frames },
        currentPreviewIndex: frameIndex + 1,
        selectedObjectId: null,
      };
    });
  },

  // ── Translations ─────────────────────────────────────────────────────────────

  setTranslation: (locale: string, objId: string, text: string) =>
    set((s) => {
      const prev = s.quizData.translations ?? {};
      const localeMap = { ...(prev[locale] ?? {}) };
      if (text === "") {
        delete localeMap[objId];
      } else {
        localeMap[objId] = text;
      }
      return {
        quizData: {
          ...s.quizData,
          translations: { ...prev, [locale]: localeMap },
        },
      };
    }),

  removeTranslationLocale: (locale: string) => {
    get().snapshot();
    set((s) => {
      const prev = { ...(s.quizData.translations ?? {}) };
      delete prev[locale];

      let frames = s.quizData.frames.filter((f) => f.locale !== locale);
      if (frames.length === 0) {
        frames = [makeDefaultFrame(s.defaultW, s.defaultH)];
      }

      const currentPreviewIndex = Math.max(
        0,
        Math.min(s.currentPreviewIndex, frames.length - 1),
      );

      return {
        quizData: { ...s.quizData, translations: prev, frames },
        currentPreviewIndex,
        selectedObjectId: null,
        selectedObjectIds: [],
      };
    });
  },

  duplicateFramesAsLocale: (locale: string) => {
    get().snapshot();
    set((s) => {
      const localeMap = s.quizData.translations?.[locale] ?? {};
      const isRtl = RTL_LOCALES.has(locale.toLowerCase());
      // Keep only non-locale originals + frames for OTHER locales
      const kept = s.quizData.frames.filter(
        (f) => !f.locale || f.locale !== locale,
      );
      const originals = s.quizData.frames.filter((f) => !f.locale);
      const cloned = originals.map((f) =>
        applyLocaleToFrame(f, localeMap, isRtl, locale),
      );
      const frames = [...kept, ...cloned];
      return {
        quizData: { ...s.quizData, frames },
        currentPreviewIndex: kept.length,
        selectedObjectId: null,
        selectedObjectIds: [],
      };
    });
  },
});
