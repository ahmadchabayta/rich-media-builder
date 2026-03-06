/* eslint-disable @typescript-eslint/no-explicit-any */
import type { QuizData, CustomAnim } from "./types";
import { compileKeyframesCSS } from "./animCompiler";
import { SYSTEM_FONTS } from "./fonts";

/**
 * Collect Google Font <link> tags for every font used in the document.
 * Weights are derived from the actual fontWeight values on text objects so
 * arbitrary (non-curated) fonts still get a correct URL.
 */
function collectGoogleFontLinks(quizData: QuizData): string {
  // family → Set of numeric weight strings actually used in the document
  const needed = new Map<string, Set<string>>();

  for (const frame of quizData.frames) {
    for (const obj of frame.objects) {
      if (obj.type === "text") {
        const family = (obj as any).fontFamily as string | undefined;
        if (family && !SYSTEM_FONTS.has(family)) {
          if (!needed.has(family)) needed.set(family, new Set());
          const fw = (obj as any).fontWeight as string | undefined;
          if (fw) needed.get(family)!.add(String(fw));
        }
        // Scan richText HTML for inline font-family spans
        const richText = (obj as any).richText as string | undefined;
        if (richText) {
          const matches = richText.matchAll(/font-family:\s*'?([^;'"]+)'?/gi);
          for (const m of matches) {
            const f = m[1].trim();
            if (f && !SYSTEM_FONTS.has(f)) {
              if (!needed.has(f)) needed.set(f, new Set());
            }
          }
          const weightMatches = richText.matchAll(/font-weight:\s*(\d+)/gi);
          for (const m of weightMatches) {
            // Associate weight with nearest font (heuristic: use obj's fontFamily if any)
            if (family && !SYSTEM_FONTS.has(family)) {
              needed.get(family)?.add(m[1]);
            }
          }
        }
      } else if (obj.type === "answerGroup") {
        const family = (obj as any).fontFamily as string | undefined;
        if (!family) continue;
        if (SYSTEM_FONTS.has(family)) continue;
        if (!needed.has(family)) needed.set(family, new Set());
        const fw = (obj as any).fontWeight as string | undefined;
        if (fw) needed.get(family)!.add(String(fw));
      }
    }
  }

  if (needed.size === 0) return "";

  const lines: string[] = [
    `  <link rel="preconnect" href="https://fonts.googleapis.com">`,
    `  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
  ];
  for (const [family, weightSet] of needed) {
    const encoded = encodeURIComponent(family).replace(/%20/g, "+");
    // Always include 400 & 700 as a safety baseline, plus whatever is explicitly used
    const allWeights = [...new Set([...weightSet, "400", "700"])].sort(
      (a, b) => parseInt(a) - parseInt(b),
    );
    const axis = `:wght@${allWeights.join(";")}`;
    lines.push(
      `  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encoded}${axis}&display=swap">`,
    );
  }
  return lines.join("\n");
}

export interface ExportFiles {
  html: string;
  css: string;
  js: string;
}

//  HTML escaping

function escText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function dataAttr(obj: unknown): string {
  return escAttr(JSON.stringify(obj));
}

/** Normalize answer text into a tracking-friendly slug */
function normalizeAnswerSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

//  Build one object as static HTML (styles  cssRules array)

type AnsIdxRef = { v: number };

/** Build extra data attributes for loop/hover/click */
function customAnimToLoopCfg(ca: CustomAnim): Record<string, unknown> {
  return {
    type: ca.name,
    dur: ca.dur,
    delay: ca.delay || 0,
    easing: ca.easing || "ease-in-out",
    iterationCount: "infinite",
    direction: ca.direction || "alternate",
    fillMode: ca.fillMode || "both",
  };
}

function extraDataAttrs(o: any): string {
  let s = "";
  if (o.id) s += ` data-obj-id="${escAttr(o.id)}"`;
  const loop = o.customAnimLoop
    ? customAnimToLoopCfg(o.customAnimLoop)
    : o.animLoop;
  if (loop?.type && loop.type !== "none")
    s += ` data-anim-loop="${dataAttr(loop)}"`;
  if (o.hoverEffect?.type && o.hoverEffect.type !== "none")
    s += ` data-hover="${escAttr(o.hoverEffect.type)}"`;
  if (o.clickEffect?.type && o.clickEffect.type !== "none")
    s += ` data-click="${escAttr(o.clickEffect.type)}"`;
  return s;
}

/** Map hover type → CSS declaration block for :hover pseudo-class */
const HOVER_CSS_MAP: Record<string, string> = {
  lift: "transform:translateY(-4px);box-shadow:0 6px 16px rgba(0,0,0,.25);",
  grow: "transform:scale(1.08);",
  shrink: "transform:scale(0.94);",
  glow: "box-shadow:0 0 16px 4px rgba(255,255,255,.5);",
  dim: "opacity:0.55;",
  brighten: "filter:brightness(1.25);",
  tilt: "transform:rotate(3deg);",
  underline: "text-decoration:underline;text-underline-offset:4px;",
};

/** Emit hover/click CSS rules for an object class */
function emitInteractionCss(
  o: any,
  cls: string,
  cssRules: string[],
  isAnswerGroup = false,
): void {
  // For answerGroup, target individual .ans-btn children, not the wrapper
  const sel = isAnswerGroup ? `.${cls} .ans-btn` : `.${cls}`;
  const hType = o.hoverEffect?.type;
  if (hType && hType !== "none" && HOVER_CSS_MAP[hType]) {
    cssRules.push(`${sel}{transition:all .25s ease}`);
    cssRules.push(`${sel}:hover{${HOVER_CSS_MAP[hType]}}`);
  }
  const cType = o.clickEffect?.type;
  if (cType && cType !== "none") {
    cssRules.push(`${sel}:active{animation:${cType} .35s ease}`);
  }
  // non-answerGroup interactive elements need pointer-events:auto + cursor:pointer
  if (
    !isAnswerGroup &&
    ((hType && hType !== "none") || (cType && cType !== "none"))
  ) {
    cssRules.push(`.${cls}{pointer-events:auto;cursor:pointer}`);
  }
}

function buildObjectHtml(
  o: any,
  frameW: number,
  ansRef: AnsIdxRef,
  fi: number,
  oi: number,
  cssRules: string[],
): string {
  void frameW;
  let animIn: any = o.animIn || { type: "none" };
  let animOut: any = o.animOut || { type: "none" };
  const role = o.role || "other";
  const cls = `p${fi}-o${oi}`;

  // Compile custom animation @keyframes and override preset configs
  if (o.customAnimIn) {
    const ca: CustomAnim = o.customAnimIn;
    cssRules.push(compileKeyframesCSS(ca));
    animIn = {
      type: ca.name,
      dur: ca.dur,
      delay: ca.delay || 0,
      easing: ca.easing || "ease",
      iterationCount: ca.iterationCount || 1,
      direction: ca.direction || "normal",
      fillMode: ca.fillMode || "both",
    };
  }
  if (o.customAnimOut) {
    const ca: CustomAnim = o.customAnimOut;
    cssRules.push(compileKeyframesCSS(ca));
    animOut = {
      type: ca.name,
      dur: ca.dur,
      delay: ca.delay || 0,
      easing: ca.easing || "ease",
      iterationCount: ca.iterationCount || 1,
      direction: ca.direction || "normal",
      fillMode: ca.fillMode || "both",
    };
  }
  if (o.customAnimLoop) {
    cssRules.push(compileKeyframesCSS(o.customAnimLoop));
  }

  //  answerGroup
  if (o.type === "answerGroup") {
    const bgHex = o.btnBgColor || "#ffffff";
    const r = parseInt(bgHex.slice(1, 3), 16) || 255;
    const g = parseInt(bgHex.slice(3, 5), 16) || 255;
    const b = parseInt(bgHex.slice(5, 7), 16) || 255;
    const a = (o.btnBgOpacity ?? 18) / 100;
    const rgba = `rgba(${r},${g},${b},${a})`;
    const gap = o.btnGap ?? 10;
    const bh = o.btnHeight ?? 44;
    const brad = o.btnRadius ?? 24;
    const pTop = o.btnPaddingTop ?? 0;
    const pRight = o.btnPaddingRight ?? 14;
    const pBottom = o.btnPaddingBottom ?? 0;
    const pLeft = o.btnPaddingLeft ?? 14;
    const color = o.textColor ?? "#fff";
    const fs = o.fontSize ?? 16;

    let wrapCss = `position:absolute;left:${o.x ?? 0}px;top:${o.y ?? 0}px;width:${o.w ?? 280}px;`;
    if (o.opacity != null && o.opacity < 100)
      wrapCss += `opacity:${o.opacity / 100};`;
    if (o.blendMode) wrapCss += `mix-blend-mode:${o.blendMode};`;
    cssRules.push(`.${cls}{${wrapCss}}`);

    let btnCss =
      `width:100%;height:${bh}px;background:${rgba};border-radius:${brad}px;` +
      `color:${color};font-size:${fs}px;font-weight:${o.fontWeight ?? "700"};` +
      `display:flex;align-items:center;justify-content:center;` +
      `padding:${pTop}px ${pRight}px ${pBottom}px ${pLeft}px;overflow:hidden;` +
      `pointer-events:auto;cursor:pointer;position:relative`;
    if (o.fontFamily) btnCss += `;font-family:'${o.fontFamily}',sans-serif`;
    if (o.italic) btnCss += `;font-style:italic`;
    if (o.underline) btnCss += `;text-decoration:underline`;
    if (o.textAlign && o.textAlign !== "center")
      btnCss += `;justify-content:${o.textAlign === "left" ? "flex-start" : "flex-end"};text-align:${o.textAlign}`;
    if (o.letterSpacing) btnCss += `;letter-spacing:${o.letterSpacing}px`;
    if (o.lineHeight) btnCss += `;line-height:${o.lineHeight}`;
    if (o.direction === "rtl") btnCss += `;direction:rtl`;
    cssRules.push(`.${cls} .ans-btn{${btnCss}}`);
    cssRules.push(`.${cls} .ans-btn:not(:last-child){margin-bottom:${gap}px}`);

    // Per-button hover/click data attrs
    const hoverAttr =
      o.hoverEffect?.type && o.hoverEffect.type !== "none"
        ? ` data-hover="${escAttr(o.hoverEffect.type)}"`
        : "";
    const clickAttr =
      o.clickEffect?.type && o.clickEffect.type !== "none"
        ? ` data-click="${escAttr(o.clickEffect.type)}"`
        : "";

    const buttons = (o.answers || [])
      .map(
        (
          ans: {
            id?: string;
            text?: string;
            src?: string;
            dataAnswer?: string;
          },
          ai: number,
        ) => {
          const idx = ansRef.v++;
          const answerText = ans.text ?? `Answer ${ai + 1}`;
          const manualDataAnswer = (ans.dataAnswer ?? "").trim();
          const slug = normalizeAnswerSlug(manualDataAnswer || answerText);
          const inner = ans.src
            ? `<img src="${escAttr(ans.src)}" class="ans-img">`
            : escText(answerText);
          return (
            `<div class="ans-btn" data-role="answer" data-ans-idx="${idx}" ` +
            `data-answer="${escAttr(slug)}" data-frame-idx="${fi}"` +
            `${hoverAttr}${clickAttr} ` +
            `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}">${inner}</div>`
          );
        },
      )
      .join("");

    emitInteractionCss(o, cls, cssRules, true);

    // Wrapper: only keep data-anim-loop if present (hover/click now live on buttons)
    let wrapExtra = "";
    const wrapLoop = o.customAnimLoop
      ? customAnimToLoopCfg(o.customAnimLoop)
      : o.animLoop;
    if (wrapLoop?.type && wrapLoop.type !== "none")
      wrapExtra += ` data-anim-loop="${dataAttr(wrapLoop)}"`;

    return (
      `<div class="${cls}" data-role="other" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}"${wrapExtra}>${buttons}</div>`
    );
  }

  //  shape
  if (o.type === "shape") {
    const shapeW = Number.isFinite(o.w) ? o.w : 80;
    const shapeH = Number.isFinite(o.h) ? o.h : 80;
    const shapeFill = o.fill ?? "#3b82f6";
    let rule =
      `position:absolute;left:${o.x ?? 0}px;top:${o.y ?? 0}px;` +
      `width:${shapeW}px;height:${shapeH}px;background:${shapeFill};`;
    if (o.shape === "circle") rule += "border-radius:50%;";
    else {
      const hasIndividual =
        o.radiusTopLeft != null ||
        o.radiusTopRight != null ||
        o.radiusBottomRight != null ||
        o.radiusBottomLeft != null;
      if (hasIndividual) {
        rule += `border-radius:${o.radiusTopLeft ?? o.radius ?? 0}px ${o.radiusTopRight ?? o.radius ?? 0}px ${o.radiusBottomRight ?? o.radius ?? 0}px ${o.radiusBottomLeft ?? o.radius ?? 0}px;`;
      } else if (o.radius) {
        rule += `border-radius:${o.radius}px;`;
      }
    }
    const sw = o.strokeWidth ?? 0;
    if (sw > 0 && o.stroke)
      rule += `border:${sw}px solid ${o.stroke};box-sizing:border-box;`;
    if (o.opacity != null && o.opacity < 100)
      rule += `opacity:${o.opacity / 100};`;
    if (o.rotation) rule += `transform:rotate(${o.rotation}deg);`;
    if (o.zIndex != null) rule += `z-index:${o.zIndex};`;
    if (o.blendMode) rule += `mix-blend-mode:${o.blendMode};`;
    cssRules.push(`.${cls}{${rule}}`);
    emitInteractionCss(o, cls, cssRules);
    return (
      `<div class="${cls}" data-role="${role}" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}"${extraDataAttrs(o)}></div>`
    );
  }

  //  divider
  if (o.type === "divider") {
    const dt = o.thickness ?? 2;
    const ls = o.lineStyle ?? "solid";
    const dc = o.color ?? "#fff";
    let rule =
      `position:absolute;left:${o.x ?? 0}px;top:${o.y ?? 0}px;` +
      `width:${o.w}px;height:${dt}px;`;
    if (ls === "solid") {
      rule += `background:${dc};`;
    } else {
      rule += `border-top:${dt}px ${ls} ${dc};background:transparent;`;
    }
    if (o.opacity != null && o.opacity < 100)
      rule += `opacity:${o.opacity / 100};`;
    if (o.rotation) rule += `transform:rotate(${o.rotation}deg);`;
    if (o.zIndex != null) rule += `z-index:${o.zIndex};`;
    if (o.blendMode) rule += `mix-blend-mode:${o.blendMode};`;
    cssRules.push(`.${cls}{${rule}}`);
    emitInteractionCss(o, cls, cssRules);
    return (
      `<div class="${cls}" data-role="${role}" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}"${extraDataAttrs(o)}></div>`
    );
  }

  //  path (pen tool)
  if (o.type === "path") {
    const px = o.x ?? 0;
    const py = o.y ?? 0;
    const pw = o.w ?? 100;
    const ph = o.h ?? 100;
    let rule =
      `position:absolute;left:${px}px;top:${py}px;` +
      `width:${pw}px;height:${ph}px;overflow:visible;pointer-events:none;`;
    if (o.opacity != null && o.opacity < 100)
      rule += `opacity:${o.opacity / 100};`;
    if (o.rotation) rule += `transform:rotate(${o.rotation}deg);`;
    if (o.zIndex != null) rule += `z-index:${o.zIndex};`;
    if (o.blendMode) rule += `mix-blend-mode:${o.blendMode};`;
    cssRules.push(`.${cls}{${rule}}`);
    emitInteractionCss(o, cls, cssRules);
    const stroke = escAttr(o.stroke ?? "#ffffff");
    const sw = o.strokeWidth ?? 2;
    const fill = escAttr(o.fill ?? "none");
    return (
      `<svg class="${cls}" data-role="${role}" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}"${extraDataAttrs(o)}>` +
      `<path d="${escAttr(o.d ?? "")}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}" ` +
      `stroke-linejoin="round" stroke-linecap="round"/>` +
      `</svg>`
    );
  }

  //  image
  if (o.type === "image") {
    let rule =
      `position:absolute;left:${o.x ?? 0}px;top:${o.y ?? 0}px;` +
      `width:${o.w}px;height:${o.h}px;object-fit:contain;display:block;pointer-events:none;`;
    if (o.opacity != null && o.opacity < 100)
      rule += `opacity:${o.opacity / 100};`;
    if (o.rotation) rule += `transform:rotate(${o.rotation}deg);`;
    if (o.zIndex != null) rule += `z-index:${o.zIndex};`;
    if (o.blendMode) rule += `mix-blend-mode:${o.blendMode};`;
    cssRules.push(`.${cls}{${rule}}`);
    emitInteractionCss(o, cls, cssRules);
    return (
      `<img src="${escAttr(o.src ?? "")}" class="obj obj-img ${cls}" ` +
      `data-role="${role}" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}"${extraDataAttrs(o)}>`
    );
  }

  //  text
  const px = o.paddingX ?? (o.bgEnabled ? 14 : 0);
  const py = o.paddingY ?? (o.bgEnabled ? 6 : 0);
  const hasRichText = !!o.richText;
  let rule =
    `position:absolute;` +
    `left:${o.x ?? 0}px;` +
    `top:${o.y ?? 0}px;` +
    (o.w != null ? `width:${o.w}px;` : `width:max-content;`) +
    `color:${o.color ?? "#fff"};font-size:${o.size ?? 22}px;` +
    `font-weight:${o.fontWeight ?? "700"};line-height:${o.lineHeight ?? 1.2};` +
    (hasRichText ? `white-space:normal;` : `white-space:pre-wrap;`) +
    `pointer-events:none;`;
  if (o.textAlign) rule += `text-align:${o.textAlign};`;
  if (o.direction === "rtl") rule += `direction:rtl;`;
  if (o.fontFamily) rule += `font-family:'${o.fontFamily}',sans-serif;`;
  if (o.letterSpacing) rule += `letter-spacing:${o.letterSpacing}px;`;
  if (o.italic) rule += "font-style:italic;";
  if (o.underline) rule += "text-decoration:underline;";
  if (o.bgEnabled && o.bgColor) {
    rule += `background:${o.bgColor};border-radius:${o.radius ?? 8}px;padding:${py}px ${px}px;`;
  } else {
    rule += `text-shadow:0 1px 2px rgba(0,0,0,.6);`;
    if (px || py) rule += `padding:${py}px ${px}px;`;
  }
  if (o.opacity != null && o.opacity < 100)
    rule += `opacity:${o.opacity / 100};`;
  if (o.rotation) rule += `transform:rotate(${o.rotation}deg);`;
  if (o.zIndex != null) rule += `z-index:${o.zIndex};`;
  if (o.blendMode) rule += `mix-blend-mode:${o.blendMode};`;
  cssRules.push(`.${cls}{${rule}}`);
  emitInteractionCss(o, cls, cssRules);

  const ansIdx = role === "answer" ? ` data-ans-idx="${ansRef.v++}"` : "";
  // Use richText HTML directly when available; otherwise escape plain text
  const content = o.richText
    ? o.richText
    : escText(o.text ?? "").replace(/\n/g, "<br>");

  return (
    `<div class="obj obj-txt ${cls}" data-role="${role}"${ansIdx} ` +
    `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}"${extraDataAttrs(o)}>${content}</div>`
  );
}

//  Internal: build the three distinct parts

function buildParts(
  quizData: QuizData,
  w: number,
  h: number,
  trackerMeta?: {
    creativeName: string;
    countryCode: string;
    language: string;
    endpoint: string;
  },
): {
  framesHtml: string;
  bgHtml: string;
  css: string;
  js: string;
  googleFontLinks: string;
} {
  // Base CSS rules (no per-element styles yet)
  const cssRules: string[] = [
    `*,*::before,*::after{box-sizing:border-box}`,
    `body,html{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden;font-family:sans-serif;background:#000}`,
    `#ad{width:100%;height:100%;position:relative;overflow:hidden;cursor:default}`,
    `.bg-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}`,
    `.bg-global{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}`,
    `.fp{position:absolute;inset:0;overflow:hidden;visibility:hidden;z-index:1;pointer-events:none}`,
    `.fp.active{visibility:visible;z-index:2;pointer-events:auto}`,
    `.fp.exiting{visibility:visible;z-index:3;pointer-events:none}`,
    `.fbase{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}`,
    `.obj{position:absolute}`,
    `.obj-img{object-fit:contain;display:block;pointer-events:none}`,
    `.obj-txt{pointer-events:none}`,
    `.obj-txt p{margin:0;padding:0}`,
    `.ans-img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}`,
    `@keyframes blsFadeIn{from{opacity:0}to{opacity:1}}`,
    `@keyframes blsFadeOut{from{opacity:1}to{opacity:0}}`,
    `@keyframes blsSlideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`,
    `@keyframes blsSlideDown{from{transform:translateY(-40px);opacity:0}to{transform:translateY(0);opacity:1}}`,
    `@keyframes blsSlideLeft{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`,
    `@keyframes blsSlideRight{from{transform:translateX(-40px);opacity:0}to{transform:translateX(0);opacity:1}}`,
    `@keyframes blsZoomIn{from{transform:scale(.65);opacity:0}to{transform:scale(1);opacity:1}}`,
    `@keyframes blsPopIn{0%{transform:scale(.5);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}`,
    `@keyframes blsSlideUpOut{from{transform:translateY(0);opacity:1}to{transform:translateY(-40px);opacity:0}}`,
    `@keyframes blsSlideDownOut{from{transform:translateY(0);opacity:1}to{transform:translateY(40px);opacity:0}}`,
    `@keyframes blsSlideLeftOut{from{transform:translateX(0);opacity:1}to{transform:translateX(-40px);opacity:0}}`,
    `@keyframes blsSlideRightOut{from{transform:translateX(0);opacity:1}to{transform:translateX(40px);opacity:0}}`,
    `@keyframes blsZoomOut{from{transform:scale(1);opacity:1}to{transform:scale(.65);opacity:0}}`,
    // Premium enter
    `@keyframes blsGravityFall{0%{transform:translateY(-140px) scaleY(1.1);opacity:0}55%{transform:translateY(12px) scaleY(0.94);opacity:1}75%{transform:translateY(-7px) scaleY(1.03)}90%{transform:translateY(3px) scaleY(0.99)}100%{transform:translateY(0) scaleY(1);opacity:1}}`,
    `@keyframes blsElasticPop{0%{transform:scale(0);opacity:0}50%{transform:scale(1.3);opacity:1}65%{transform:scale(0.85)}80%{transform:scale(1.12)}90%{transform:scale(0.96)}100%{transform:scale(1);opacity:1}}`,
    `@keyframes blsFlickerIn{0%,9%,11%,14%,19%,28%{opacity:0}10%,13%,16%,22%,31%{opacity:0.7}40%,55%,70%,85%,100%{opacity:1}47%,62%,77%{opacity:0.2}}`,
    `@keyframes blsGlitchIn{0%{clip-path:inset(35% 0 55% 0);transform:translateX(-10px);opacity:0}18%{clip-path:inset(65% 0 5% 0);transform:translateX(10px);opacity:0.4}36%{clip-path:inset(5% 0 60% 0);transform:translateX(-6px);opacity:0.6}54%{clip-path:inset(25% 0 35% 0);transform:translateX(6px);opacity:0.8}72%{clip-path:inset(0% 0 0% 0);transform:translateX(-2px);opacity:0.95}100%{clip-path:inset(0% 0 0% 0);transform:translateX(0);opacity:1}}`,
    `@keyframes blsBlurIn{from{filter:blur(28px);opacity:0;transform:scale(1.06)}to{filter:blur(0);opacity:1;transform:scale(1)}}`,
    `@keyframes blsSwingIn{0%{transform-origin:top center;transform:rotateZ(-65deg);opacity:0}40%{transform-origin:top center;transform:rotateZ(22deg);opacity:1}65%{transform-origin:top center;transform:rotateZ(-12deg)}82%{transform-origin:top center;transform:rotateZ(6deg)}92%{transform-origin:top center;transform:rotateZ(-3deg)}100%{transform-origin:top center;transform:rotateZ(0deg);opacity:1}}`,
    `@keyframes blsLightSpeedIn{0%{transform:translateX(-110%) skewX(-28deg);opacity:0}60%{transform:translateX(6%) skewX(8deg);opacity:1}80%{transform:translateX(-2%) skewX(-4deg)}100%{transform:translateX(0) skewX(0deg);opacity:1}}`,
    `@keyframes blsFlipIn{0%{transform:perspective(700px) rotateX(-90deg);opacity:0}55%{transform:perspective(700px) rotateX(18deg);opacity:1}78%{transform:perspective(700px) rotateX(-9deg)}92%{transform:perspective(700px) rotateX(4deg)}100%{transform:perspective(700px) rotateX(0deg);opacity:1}}`,
    `@keyframes blsSpinScaleIn{from{transform:rotate(-200deg) scale(0);opacity:0}60%{transform:rotate(15deg) scale(1.08);opacity:1}100%{transform:rotate(0deg) scale(1);opacity:1}}`,
    `@keyframes blsRollIn{from{transform:translateX(-120%) rotate(-130deg);opacity:0}to{transform:translateX(0) rotate(0deg);opacity:1}}`,
    // Premium exit
    `@keyframes blsGravityFallOut{0%{transform:translateY(0) scaleY(1);opacity:1}20%{transform:translateY(-18px) scaleY(1.06)}100%{transform:translateY(180px) scaleY(0.75);opacity:0}}`,
    `@keyframes blsFlickerOut{0%,15%,30%{opacity:1}8%,22%{opacity:0.15}45%,65%,85%{opacity:0}55%,75%{opacity:0.35}100%{opacity:0}}`,
    `@keyframes blsGlitchOut{0%{clip-path:inset(0);transform:translateX(0);opacity:1}20%{clip-path:inset(15% 0 32% 0);transform:translateX(8px);opacity:0.85}40%{clip-path:inset(55% 0 0% 0);transform:translateX(-10px);opacity:0.55}60%{clip-path:inset(20% 0 70% 0);transform:translateX(12px);opacity:0.3}80%{clip-path:inset(0);transform:translateX(-5px);opacity:0.1}100%{clip-path:inset(0);transform:translateX(0);opacity:0}}`,
    `@keyframes blsBlurOut{from{filter:blur(0);opacity:1;transform:scale(1)}to{filter:blur(28px);opacity:0;transform:scale(1.06)}}`,
    `@keyframes blsLightSpeedOut{0%{transform:translateX(0) skewX(0deg);opacity:1}100%{transform:translateX(130%) skewX(28deg);opacity:0}}`,
    `@keyframes blsFlipOut{0%{transform:perspective(700px) rotateX(0deg);opacity:1}100%{transform:perspective(700px) rotateX(90deg);opacity:0}}`,
    `@keyframes blsSpinScaleOut{from{transform:rotate(0deg) scale(1);opacity:1}to{transform:rotate(200deg) scale(0);opacity:0}}`,
    `@keyframes blsRollOut{from{transform:translateX(0) rotate(0deg);opacity:1}to{transform:translateX(130%) rotate(130deg);opacity:0}}`,
    // Background image animations
    `@keyframes blsBgZoomIn{from{transform:scale(1.15)}to{transform:scale(1)}}`,
    `@keyframes blsBgZoomOut{from{transform:scale(1)}to{transform:scale(1.15)}}`,
    `@keyframes blsBgKenBurns{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.12) translate(-3%,-2%)}}`,
    `@keyframes blsBgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`,
    `@keyframes blsBgFadeIn{from{opacity:0}to{opacity:1}}`,

    // ── Loop / Decoration keyframes ────────────────────────
    `@keyframes blsFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`,
    `@keyframes blsPulseLoop{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}`,
    `@keyframes blsBounceLoop{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}60%{transform:translateY(-4px)}}`,
    `@keyframes blsShake{0%,100%{transform:translateX(0)}12%{transform:translateX(-6px)}25%{transform:translateX(6px)}37%{transform:translateX(-4px)}50%{transform:translateX(4px)}62%{transform:translateX(-2px)}75%{transform:translateX(2px)}}`,
    `@keyframes blsSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`,
    `@keyframes blsSwing{0%,100%{transform:rotate(0deg)}25%{transform:rotate(12deg)}75%{transform:rotate(-12deg)}}`,
    `@keyframes blsRubberBand{0%,100%{transform:scaleX(1) scaleY(1)}30%{transform:scaleX(1.2) scaleY(0.8)}40%{transform:scaleX(0.85) scaleY(1.15)}50%{transform:scaleX(1.1) scaleY(0.9)}65%{transform:scaleX(0.96) scaleY(1.04)}75%{transform:scaleX(1.03) scaleY(0.97)}}`,
    `@keyframes blsWobble{0%,100%{transform:translateX(0) rotate(0)}15%{transform:translateX(-10px) rotate(-4deg)}30%{transform:translateX(8px) rotate(3deg)}45%{transform:translateX(-6px) rotate(-2deg)}60%{transform:translateX(4px) rotate(1deg)}75%{transform:translateX(-2px) rotate(-0.5deg)}}`,
    `@keyframes blsHeartbeat{0%,100%{transform:scale(1)}14%{transform:scale(1.15)}28%{transform:scale(1)}42%{transform:scale(1.12)}56%{transform:scale(1)}}`,
    `@keyframes blsJello{0%,100%{transform:skewX(0) skewY(0)}22%{transform:skewX(-10deg) skewY(-3deg)}33%{transform:skewX(7deg) skewY(2deg)}44%{transform:skewX(-4deg) skewY(-1.5deg)}55%{transform:skewX(2deg) skewY(0.8deg)}66%{transform:skewX(-1deg) skewY(-0.4deg)}}`,
    `@keyframes blsBreathing{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:0.85}}`,
    `@keyframes blsPerspectiveIn{0%{transform:perspective(800px) rotateY(-90deg);opacity:0}60%{transform:perspective(800px) rotateY(12deg);opacity:1}80%{transform:perspective(800px) rotateY(-6deg)}100%{transform:perspective(800px) rotateY(0deg);opacity:1}}`,
    `@keyframes blsPerspectiveTilt{0%,100%{transform:perspective(600px) rotateX(3deg) rotateY(2deg)}50%{transform:perspective(600px) rotateX(-3deg) rotateY(-2deg)}}`,

    // ── Click / Active keyframes ───────────────────────────
    `@keyframes clickPulse{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}`,
    `@keyframes clickBounce{0%{transform:translateY(0)}30%{transform:translateY(-8px)}50%{transform:translateY(0)}70%{transform:translateY(-4px)}100%{transform:translateY(0)}}`,
    `@keyframes clickShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}`,
    `@keyframes clickPop{0%{transform:scale(1)}40%{transform:scale(0.9)}70%{transform:scale(1.1)}100%{transform:scale(1)}}`,
    `@keyframes clickRipple{0%{box-shadow:0 0 0 0 rgba(255,255,255,0.4)}100%{box-shadow:0 0 0 18px rgba(255,255,255,0)}}`,
    `@keyframes clickJelly{0%,100%{transform:scale(1,1)}30%{transform:scale(1.15,0.85)}40%{transform:scale(0.9,1.1)}50%{transform:scale(1.05,0.95)}65%{transform:scale(0.98,1.02)}80%{transform:scale(1.01,0.99)}}`,
  ];

  // Per-frame background CSS
  quizData.frames.forEach((f, fi) => {
    let bg = "";
    if (f.bgGradient?.stops) {
      bg = `linear-gradient(${f.bgGradient.angle}deg,${f.bgGradient.stops[0]},${f.bgGradient.stops[1]})`;
    } else if (f.bgColor) {
      bg = f.bgColor;
    }
    if (bg) cssRules.push(`#p${fi}{background:${bg}}`);
  });

  // Frames HTML  no inline styles
  const framesHtml = quizData.frames
    .map((f, fi) => {
      const animEnter = f.animEnter || { type: "blsFadeIn", dur: 400 };
      const animExit = f.animExit || { type: "blsFadeOut", dur: 300 };
      const stagger = f.answerStagger ?? 80;

      let inner = "";
      // Per-frame background image (falls back to legacy global quizData.bg)
      const bgSrc = f.bgImage ?? quizData.bg;
      if (bgSrc) {
        const anim = f.bgImageAnim;
        const bgFit = f.bgImageSize ?? "cover";
        const bgPosX = f.bgImagePosX ?? 50;
        const bgPosY = f.bgImagePosY ?? 50;
        let inlineStyle = `object-fit:${bgFit};object-position:${bgPosX}% ${bgPosY}%`;
        if (anim?.type && anim.type !== "none") {
          inlineStyle += `;animation:${anim.type} ${anim.dur}ms ease-in-out infinite alternate`;
        }
        inner += `<img src="${escAttr(bgSrc)}" class="bg-global" style="${inlineStyle}" alt="">`;
      }
      if (f.src) inner += `<img src="${escAttr(f.src)}" class="fbase">`;

      const ansRef: AnsIdxRef = { v: 0 };
      f.objects.forEach((o, oi) => {
        inner += buildObjectHtml(o, f.w ?? w, ansRef, fi, oi, cssRules);
      });

      return (
        `<div id="p${fi}" class="fp" ` +
        `data-anim-enter="${dataAttr(animEnter)}" ` +
        `data-anim-exit="${dataAttr(animExit)}" ` +
        `data-stagger="${stagger}">${inner}</div>`
      );
    })
    .join("\n    ");

  // bgHtml is now empty — global bg is rendered inside each frame panel instead
  const bgHtml = "";

  // Append user-provided custom CSS
  if (quizData.customCss) cssRules.push(quizData.customCss);

  const css = cssRules.join("\n");

  // Embed translations map into JS if any exist
  const translationsMap = quizData.translations ?? {};
  const hasTranslations = Object.keys(translationsMap).length > 0;
  const translationsBlock = hasTranslations
    ? `var __BLS_TRANS__=${JSON.stringify(translationsMap)};
  function applyTranslations(){
    var lang=(window.__BLS_LANG__||(new URLSearchParams(location.search)).get('lang')||'').toLowerCase();
    if(!lang||!__BLS_TRANS__[lang])return;
    var map=__BLS_TRANS__[lang];
    document.querySelectorAll('[data-obj-id]').forEach(function(el){
      var id=el.getAttribute('data-obj-id');
      if(map[id]!=null)el.innerHTML=map[id].replace(/\\n/g,'<br>');
    });
  }
  applyTranslations();
`
    : "";

  // JS: all animation config read from data-attributes
  const trackerBlock = trackerMeta
    ? `
  var LN="${trackerMeta.language}";
  var CC="${trackerMeta.countryCode}";
  var CN="${trackerMeta.creativeName}";
  var TRACKER_ENDPOINT="${trackerMeta.endpoint}";
  var script=document.currentScript;
  var BID_ID=(script&&script.getAttribute("bid_id"))||"";
  function tracker(answer){
    var url=TRACKER_ENDPOINT+"?event="+encodeURIComponent(answer)+"&ln="+encodeURIComponent(LN)+"&cc="+encodeURIComponent(CC)+"&creativename="+encodeURIComponent(CN)+"&bid_id="+BID_ID;
    fetch(url,{method:"GET",mode:"cors"}).catch(function(e){console.log("Tracking error:",e)});
  }
`
    : "";

  const trackerCall = trackerMeta ? "tracker(slug);" : "";

  const js = `(function(){
  var panels=Array.from(document.querySelectorAll('.fp'));
  var total=panels.length,cur=0,busy=false;
  var answers=[];window.__blsAnswers=answers;
${trackerBlock}${translationsBlock}

  function resetAnim(el){el.style.animation='none';void el.offsetWidth}

  function buildAnimStr(cfg,delay){
    if(!cfg.type||cfg.type==='none')return '';
    var d=(cfg.delay||0)+(delay||0);
    var iter=cfg.iterationCount||1;
    if(iter==='infinite'||iter===0)iter='infinite';
    var dir=cfg.direction||'normal';
    var ease=cfg.easing||'ease-out';
    var fill=cfg.fillMode||'both';
    return cfg.type+' '+(cfg.dur||400)+'ms '+ease+' '+d+'ms '+iter+' '+dir+' '+fill;
  }

  function advanceFrame(){
    if(busy)return;
    if(cur===total-1)return;
    busy=true;
    var ei=cur,ni=cur+1,ep=panels[ei],np=panels[ni];
    ep.classList.remove('active');ep.classList.add('exiting');
    np.classList.add('active');applyEnter(ni);
    applyExit(ei,function(){ep.classList.remove('exiting');resetAnim(ep);ep.style.opacity='';cur=ni;busy=false;});
  }

  function applyLoopAnims(fi){
    var p=panels[fi];if(!p)return;
    p.querySelectorAll('[data-anim-loop]').forEach(function(el){
      var lp=JSON.parse(el.getAttribute('data-anim-loop')||'{}');
      if(!lp.type||lp.type==='none')return;
      var delay=lp.delay||0;
      var ease=lp.easing||'ease-in-out';
      var iter=lp.iterationCount||'infinite';
      var dir=lp.direction||'alternate';
      var fill=lp.fillMode||'both';
      setTimeout(function(){
        el.style.animation=lp.type+' '+(lp.dur||1000)+'ms '+ease+' '+delay+'ms '+iter+' '+dir+' '+fill;
      },delay);
    });
  }

  function applyClickHandlers(fi){
    var p=panels[fi];if(!p)return;
    // Non-answer elements with data-click
    p.querySelectorAll('[data-click]:not(.ans-btn)').forEach(function(el){
      el.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        var ct=el.getAttribute('data-click');
        if(!ct||ct==='none')return;
        el.style.animation='none';void el.offsetWidth;
        el.style.animation=ct+' .35s ease';
        el.addEventListener('animationend',function h(){el.style.animation='';el.removeEventListener('animationend',h);},{once:true});
      });
    });
    // Answer buttons — per-button click anim + record answer + advance frame
    p.querySelectorAll('.ans-btn[data-role="answer"]').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        var slug=btn.getAttribute('data-answer')||'';
        var frameIdx=Number(btn.getAttribute('data-frame-idx')||0);
        var ansIdx=Number(btn.getAttribute('data-ans-idx')||0);
        answers.push({frame:frameIdx,answer:slug,index:ansIdx,timestamp:Date.now()});
        ${trackerCall}
        var ct=btn.getAttribute('data-click');
        if(ct&&ct!=='none'){
          btn.style.animation='none';void btn.offsetWidth;
          btn.style.animation=ct+' .35s ease';
          btn.addEventListener('animationend',function h(){btn.style.animation='';btn.removeEventListener('animationend',h);advanceFrame();},{once:true});
        }else{
          advanceFrame();
        }
      });
    });
  }

  function applyEnter(fi){
    var p=panels[fi];if(!p)return;
    var ae=JSON.parse(p.getAttribute('data-anim-enter')||'{"type":"none"}');
    var stagger=Number(p.getAttribute('data-stagger')||0);
    resetAnim(p);p.style.opacity='';
    if(ae.type&&ae.type!=='none')p.style.animation=buildAnimStr(ae,0);
    p.querySelectorAll('[data-anim-in]').forEach(function(el){
      var ai=JSON.parse(el.getAttribute('data-anim-in')||'{}');
      if(!ai.type||ai.type==='none'){el.style.opacity='';el.style.animation='none';return;}
      var extra=(el.getAttribute('data-role')==='answer'?Number(el.getAttribute('data-ans-idx')||0)*stagger:0);
      var delay=(ai.delay||0)+extra;
      el.style.opacity='0';el.style.animation='none';
      (function(e,a,dl){setTimeout(function(){e.style.opacity='';e.style.animation=buildAnimStr(a,extra);if(e.getAttribute('data-hover')||e.getAttribute('data-click')){e.addEventListener('animationend',function h(){e.style.animation='';e.removeEventListener('animationend',h);},{once:true});}},dl);})(el,ai,delay);
    });
    applyLoopAnims(fi);
    applyClickHandlers(fi);
  }

  function applyExit(fi,cb){
    var p=panels[fi];if(!p){cb();return;}
    var ax=JSON.parse(p.getAttribute('data-anim-exit')||'{"type":"none"}');
    var stagger=Number(p.getAttribute('data-stagger')||0);
    var maxDur=0;
    if(ax.type&&ax.type!=='none'){var fd=ax.dur||300;maxDur=fd;resetAnim(p);p.style.animation=buildAnimStr(ax,0);}
    p.querySelectorAll('[data-anim-out]').forEach(function(el){
      var ao=JSON.parse(el.getAttribute('data-anim-out')||'{}');
      if(!ao.type||ao.type==='none')return;
      var extra=(el.getAttribute('data-role')==='answer'?Number(el.getAttribute('data-ans-idx')||0)*stagger:0);
      var delay=(ao.delay||0)+extra;
      var dur=ao.dur||300;maxDur=Math.max(maxDur,delay+dur);
      el.style.animation=buildAnimStr(ao,extra);
    });
    if(maxDur<=0){cb();return;}
    setTimeout(cb,maxDur);
  }

  document.getElementById('ad').addEventListener('click',function(e){
    e.preventDefault();
    e.stopPropagation();
    advanceFrame();
  });

  panels[0].classList.add('active');
  applyEnter(0);
})();`;

  const googleFontLinks = collectGoogleFontLinks(quizData);
  return { framesHtml, bgHtml, css, js, googleFontLinks };
}

//  Public API

/** Three separate files: index.html + ad.css + ad.js (zipped by useExport) */
export function generateExportFiles(
  quizData: QuizData,
  defaultW: number,
  defaultH: number,
  trackerMeta?: {
    creativeName: string;
    countryCode: string;
    language: string;
    endpoint: string;
  },
): ExportFiles {
  const { framesHtml, bgHtml, css, js, googleFontLinks } = buildParts(
    quizData,
    defaultW,
    defaultH,
    trackerMeta,
  );

  const html =
    `<!DOCTYPE html>\n` +
    `<html lang="en">\n` +
    `<head>\n` +
    `  <meta charset="utf-8">\n` +
    `  <meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    `  <meta name="ad.size" content="width=${defaultW},height=${defaultH}">\n` +
    `  <title>Ad</title>\n` +
    (googleFontLinks ? `${googleFontLinks}\n` : ``) +
    `  <link rel="stylesheet" href="ad.css">\n` +
    `</head>\n` +
    `<body>\n` +
    `  <div id="ad">\n` +
    (bgHtml ? `    ${bgHtml}\n` : ``) +
    (framesHtml ? `    ${framesHtml}\n` : ``) +
    `  </div>\n` +
    `  <script src="ad.js" bid_id="\${ME_BID_ID}"><` +
    `/script>\n` +
    `</body>\n` +
    `</html>`;

  return { html, css, js };
}

/** Single self-contained HTML  used by AdPreviewModal iframe */
export function generateExportHtml(
  quizData: QuizData,
  defaultW: number,
  defaultH: number,
): string {
  const { framesHtml, bgHtml, css, js, googleFontLinks } = buildParts(
    quizData,
    defaultW,
    defaultH,
  );
  const safeJs = js.replace(/<\/script/gi, "<\\/script");

  return (
    `<!DOCTYPE html>\n` +
    `<html lang="en">\n` +
    `<head>\n` +
    `  <meta charset="utf-8">\n` +
    `  <meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    `  <meta name="ad.size" content="width=${defaultW},height=${defaultH}">\n` +
    `  <title>Ad</title>\n` +
    (googleFontLinks ? `${googleFontLinks}\n` : ``) +
    `  <style>\n${css}\n  </style>\n` +
    `</head>\n` +
    `<body>\n` +
    `  <div id="ad">\n` +
    (bgHtml ? `    ${bgHtml}\n` : ``) +
    (framesHtml ? `    ${framesHtml}\n` : ``) +
    `  </div>\n` +
    `  <script>\n${safeJs}\n  <` +
    `/script>\n` +
    `</body>\n` +
    `</html>`
  );
}
