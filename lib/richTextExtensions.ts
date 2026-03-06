/**
 * Extended TextStyle mark that adds per-span inline CSS attributes on top of
 * the stock @tiptap/extension-text-style (which provides color and fontFamily
 * via their own extensions).
 */
import { TextStyle } from "@tiptap/extension-text-style";

export const ExtendedTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      /** Override font-size per selection */
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const raw = el.style.fontSize;
          return raw ? raw.replace("px", "") : null;
        },
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.fontSize != null
            ? { style: `font-size:${attrs.fontSize}px` }
            : {},
      },

      /** Override font-weight per selection */
      fontWeight: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontWeight || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.fontWeight ? { style: `font-weight:${attrs.fontWeight}` } : {},
      },

      /** Italic per selection */
      fontStyle: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontStyle || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.fontStyle ? { style: `font-style:${attrs.fontStyle}` } : {},
      },

      /** Underline per selection */
      textDecorationLine: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.textDecorationLine || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.textDecorationLine
            ? { style: `text-decoration-line:${attrs.textDecorationLine}` }
            : {},
      },

      /** Letter-spacing per selection */
      letterSpacing: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const raw = el.style.letterSpacing;
          return raw ? raw.replace("px", "") : null;
        },
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.letterSpacing != null
            ? { style: `letter-spacing:${attrs.letterSpacing}px` }
            : {},
      },

      /** Inline background highlight per selection */
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.backgroundColor
            ? { style: `background-color:${attrs.backgroundColor}` }
            : {},
      },

      /** Text transform per selection */
      textTransform: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.textTransform || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.textTransform
            ? { style: `text-transform:${attrs.textTransform}` }
            : {},
      },
    };
  },
});
