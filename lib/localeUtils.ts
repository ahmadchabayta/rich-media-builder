/**
 * Pure locale-translation utilities shared by the export pipeline and
 * the in-editor locale preview.
 */
import type { Frame, TextObject, AnswerGroupObject, QuizData } from "./types";

// ─── Shared constants ──────────────────────────────────────────────────────

export const RTL_LOCALES = new Set(["ar", "he", "fa", "ur", "yi", "dv"]);

/** Latin → Eastern-Arabic digit map (for AR, FA, UR locales) */
export const EASTERN_DIGITS = [
  "٠",
  "١",
  "٢",
  "٣",
  "٤",
  "٥",
  "٦",
  "٧",
  "٨",
  "٩",
];
export const EASTERN_DIGIT_LOCALES = new Set(["ar", "fa", "ur"]);

export function toEasternDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => EASTERN_DIGITS[+d]);
}

// ─── Export-time translation ───────────────────────────────────────────────

/**
 * Deep-clone a QuizData and apply locale translations to every frame:
 *  - Text replacement from the `translations` map
 *  - RTL direction for RTL locales
 *  - Latin → Eastern-Arabic digit conversion for AR / FA / UR
 *
 * Only non-locale (original) frames are kept; UI-preview locale duplicates
 * are stripped out.
 *
 * Used at export time to produce per-language HTML bundles.
 */
export function applyLocaleToQuizData(
  quizData: QuizData,
  locale: string,
): QuizData {
  const clone: QuizData = JSON.parse(JSON.stringify(quizData));
  const localeMap = clone.translations?.[locale] ?? {};
  const isRtl = RTL_LOCALES.has(locale.toLowerCase());
  const useEastern = EASTERN_DIGIT_LOCALES.has(locale.toLowerCase());

  // Strip UI-preview locale duplicates — keep only originals
  clone.frames = clone.frames.filter((f) => !f.locale);

  for (const frame of clone.frames) {
    localizeFrame(frame, localeMap, isRtl, useEastern, locale);
  }

  return clone;
}

// ─── Internal helpers ──────────────────────────────────────────────────────

/** Mutate a single (already-cloned) frame: translate text, set RTL, convert digits. */
function localizeFrame(
  frame: Frame,
  localeMap: Record<string, string>,
  isRtl: boolean,
  useEastern: boolean,
  locale: string,
): void {
  for (const obj of frame.objects) {
    if (obj.type === "text") {
      const t = obj as TextObject;
      const origText = t.text ?? "";
      let translated: string | undefined = localeMap[obj.id];

      // Reject corrupt translation: original is numeric but translation has no digits
      if (
        translated &&
        /^\d[\d\s/.,:]*$/.test(origText.trim()) &&
        !/[\d\u0660-\u0669]/.test(translated)
      ) {
        translated = undefined;
      }

      if (translated) t.text = translated;

      // Latin digits → Eastern Arabic for AR / FA / UR
      if (useEastern && t.text) {
        t.text = toEasternDigits(t.text);
      }

      if (isRtl) {
        t.direction = "rtl";
        if (t.textAlign === "left" || t.textAlign == null) {
          t.textAlign = "right";
        }
      }
    } else if (obj.type === "answerGroup") {
      const ag = obj as AnswerGroupObject;
      ag.answers = ag.answers.map((ans) => {
        let translated: string | undefined = localeMap[ans.id];
        const origAnsText = ans.text ?? "";

        // Reject corrupt translation
        if (
          translated &&
          /^\d[\d\s/.,:]*$/.test(origAnsText.trim()) &&
          !/[\d\u0660-\u0669]/.test(translated)
        ) {
          translated = undefined;
        }

        // Eastern-Arabic digit conversion
        if (useEastern && (translated ?? ans.text)) {
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
  }
}
