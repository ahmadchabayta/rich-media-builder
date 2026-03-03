import type { QuizData } from "./types";

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

//  Build one object as static HTML (styles  cssRules array)

type AnsIdxRef = { v: number };

function buildObjectHtml(
  o: any,
  frameW: number,
  ansRef: AnsIdxRef,
  fi: number,
  oi: number,
  cssRules: string[],
): string {
  void frameW;
  const animIn = o.animIn || { type: "none" };
  const animOut = o.animOut || { type: "none" };
  const role = o.role || "other";
  const cls = `p${fi}-o${oi}`;

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
    const color = o.textColor ?? "#fff";
    const fs = o.fontSize ?? 16;

    let wrapCss = `position:absolute;left:${o.x ?? 0}px;top:${o.y ?? 0}px;width:${o.w ?? 280}px;`;
    if (o.opacity != null && o.opacity < 100)
      wrapCss += `opacity:${o.opacity / 100};`;
    cssRules.push(`.${cls}{${wrapCss}}`);
    cssRules.push(
      `.${cls} .ans-btn{width:100%;height:${bh}px;background:${rgba};border-radius:${brad}px;` +
        `color:${color};font-size:${fs}px;font-weight:700;` +
        `display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none}`,
    );
    cssRules.push(`.${cls} .ans-btn:not(:last-child){margin-bottom:${gap}px}`);

    const buttons = (o.answers || [])
      .map((ans: { text?: string; src?: string }, ai: number) => {
        const idx = ansRef.v++;
        const inner = ans.src
          ? `<img src="${escAttr(ans.src)}" class="ans-img">`
          : escText(ans.text ?? `Answer ${ai + 1}`);
        return (
          `<div class="ans-btn" data-role="answer" data-ans-idx="${idx}" ` +
          `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}">${inner}</div>`
        );
      })
      .join("");

    return (
      `<div class="${cls}" data-role="other" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}">${buttons}</div>`
    );
  }

  //  shape
  if (o.type === "shape") {
    let rule =
      `position:absolute;left:${o.x ?? 0}px;top:${o.y ?? 0}px;` +
      `width:${o.w}px;height:${o.h}px;background:${o.fill ?? "transparent"};`;
    if (o.shape === "circle") rule += "border-radius:50%;";
    else if (o.radius) rule += `border-radius:${o.radius}px;`;
    const sw = o.strokeWidth ?? 0;
    if (sw > 0 && o.stroke)
      rule += `border:${sw}px solid ${o.stroke};box-sizing:border-box;`;
    if (o.opacity != null && o.opacity < 100)
      rule += `opacity:${o.opacity / 100};`;
    if (o.rotation) rule += `transform:rotate(${o.rotation}deg);`;
    if (o.zIndex != null) rule += `z-index:${o.zIndex};`;
    cssRules.push(`.${cls}{${rule}}`);
    return (
      `<div class="${cls}" data-role="${role}" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}"></div>`
    );
  }

  //  divider
  if (o.type === "divider") {
    const rule =
      `position:absolute;left:${o.x ?? 0}px;top:${o.y ?? 0}px;` +
      `width:${o.w}px;height:1px;` +
      `border-top:${o.thickness ?? 2}px ${o.lineStyle ?? "solid"} ${o.color ?? "#fff"};`;
    cssRules.push(`.${cls}{${rule}}`);
    return (
      `<div class="${cls}" data-role="${role}" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}"></div>`
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
    cssRules.push(`.${cls}{${rule}}`);
    return (
      `<img src="${escAttr(o.src ?? "")}" class="obj obj-img ${cls}" ` +
      `data-role="${role}" ` +
      `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}">`
    );
  }

  //  text
  let rule =
    `position:absolute;left:${o.x ?? 0}px;top:${o.y ?? 0}px;` +
    `color:${o.color ?? "#fff"};font-size:${o.size ?? 22}px;` +
    `font-weight:${o.fontWeight ?? "700"};line-height:${o.lineHeight ?? 1.2};` +
    `white-space:pre;pointer-events:none;`;
  if (o.textAlign) rule += `right:0;text-align:${o.textAlign};`;
  if (o.fontFamily) rule += `font-family:${o.fontFamily};`;
  if (o.letterSpacing) rule += `letter-spacing:${o.letterSpacing}px;`;
  if (o.italic) rule += "font-style:italic;";
  if (o.underline) rule += "text-decoration:underline;";
  if (o.bgEnabled && o.bgColor) {
    rule += `background:${o.bgColor};border-radius:${o.radius ?? 8}px;padding:6px 14px;`;
  }
  if (o.opacity != null && o.opacity < 100)
    rule += `opacity:${o.opacity / 100};`;
  if (o.rotation) rule += `transform:rotate(${o.rotation}deg);`;
  if (o.zIndex != null) rule += `z-index:${o.zIndex};`;
  cssRules.push(`.${cls}{${rule}}`);

  const ansIdx = role === "answer" ? ` data-ans-idx="${ansRef.v++}"` : "";
  const content = escText(o.text ?? "").replace(/\n/g, "<br>");

  return (
    `<div class="obj obj-txt ${cls}" data-role="${role}"${ansIdx} ` +
    `data-anim-in="${dataAttr(animIn)}" data-anim-out="${dataAttr(animOut)}">${content}</div>`
  );
}

//  Internal: build the three distinct parts

function buildParts(
  quizData: QuizData,
  w: number,
  h: number,
): { framesHtml: string; bgHtml: string; css: string; js: string } {
  // Base CSS rules (no per-element styles yet)
  const cssRules: string[] = [
    `*,*::before,*::after{box-sizing:border-box}`,
    `body,html{margin:0;padding:0;width:${w}px;height:${h}px;overflow:hidden;font-family:sans-serif;background:#000}`,
    `#ad{width:100%;height:100%;position:relative;overflow:hidden;cursor:pointer}`,
    `.bg-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}`,
    `.fp{position:absolute;inset:0;overflow:hidden;visibility:hidden;z-index:1;pointer-events:none}`,
    `.fp.active{visibility:visible;z-index:2;pointer-events:auto}`,
    `.fp.exiting{visibility:visible;z-index:3;pointer-events:none}`,
    `.fbase{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}`,
    `.obj{position:absolute}`,
    `.obj-img{object-fit:contain;display:block;pointer-events:none}`,
    `.obj-txt{pointer-events:none}`,
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

  const bgHtml = quizData.bg
    ? `<img src="${escAttr(quizData.bg)}" class="bg-layer">`
    : "";

  const css = cssRules.join("\n");

  // JS: all animation config read from data-attributes; DSP-standard clickTag
  const js = `(function(){
  var panels=Array.from(document.querySelectorAll('.fp'));
  var total=panels.length,cur=0,busy=false;

  function resetAnim(el){el.style.animation='none';void el.offsetWidth}

  function applyEnter(fi){
    var p=panels[fi];if(!p)return;
    var ae=JSON.parse(p.getAttribute('data-anim-enter')||'{"type":"none"}');
    var stagger=Number(p.getAttribute('data-stagger')||0);
    resetAnim(p);p.style.opacity='';
    if(ae.type&&ae.type!=='none')p.style.animation=ae.type+' '+(ae.dur||400)+'ms ease-out both';
    p.querySelectorAll('[data-anim-in]').forEach(function(el){
      var ai=JSON.parse(el.getAttribute('data-anim-in')||'{}');
      if(!ai.type||ai.type==='none'){el.style.opacity='';el.style.animation='none';return;}
      var delay=(ai.delay||0)+(el.getAttribute('data-role')==='answer'?Number(el.getAttribute('data-ans-idx')||0)*stagger:0);
      el.style.opacity='0';el.style.animation='none';
      (function(e,a,d,dl){setTimeout(function(){e.style.opacity='';e.style.animation=a+' '+d+'ms ease-out '+dl+'ms both';},dl);})(el,ai.type,ai.dur||400,delay);
    });
  }

  function applyExit(fi,cb){
    var p=panels[fi];if(!p){cb();return;}
    var ax=JSON.parse(p.getAttribute('data-anim-exit')||'{"type":"none"}');
    var stagger=Number(p.getAttribute('data-stagger')||0);
    var maxDur=0;
    if(ax.type&&ax.type!=='none'){var fd=ax.dur||300;maxDur=fd;resetAnim(p);p.style.animation=ax.type+' '+fd+'ms ease-in both';}
    p.querySelectorAll('[data-anim-out]').forEach(function(el){
      var ao=JSON.parse(el.getAttribute('data-anim-out')||'{}');
      if(!ao.type||ao.type==='none')return;
      var delay=(ao.delay||0)+(el.getAttribute('data-role')==='answer'?Number(el.getAttribute('data-ans-idx')||0)*stagger:0);
      var dur=ao.dur||300;maxDur=Math.max(maxDur,delay+dur);
      el.style.animation=ao.type+' '+dur+'ms ease-in '+delay+'ms both';
    });
    if(maxDur<=0){cb();return;}
    setTimeout(cb,maxDur);
  }

  document.getElementById('ad').addEventListener('click',function(){
    if(busy)return;busy=true;
    if(cur===total-1){
      /* DSP-standard clickTag: DV360/CM360/Xandr inject window.clickTag before ad loads */
      var dest=window.clickTag||'';
      if(!dest){var m=location.search.match(/[?&]clickTag=([^&]*)/);dest=m?decodeURIComponent(m[1]):'';}
      if(!dest)dest='https://www.google.com';
      window.open(dest,'_blank');busy=false;return;
    }
    var ei=cur,ni=cur+1,ep=panels[ei],np=panels[ni];
    ep.classList.remove('active');ep.classList.add('exiting');
    np.classList.add('active');applyEnter(ni);
    applyExit(ei,function(){ep.classList.remove('exiting');resetAnim(ep);ep.style.opacity='';cur=ni;busy=false;});
  });

  panels[0].classList.add('active');
  applyEnter(0);
})();`;

  return { framesHtml, bgHtml, css, js };
}

//  Public API

/** Three separate files: index.html + ad.css + ad.js (zipped by useExport) */
export function generateExportFiles(
  quizData: QuizData,
  defaultW: number,
  defaultH: number,
): ExportFiles {
  const { framesHtml, bgHtml, css, js } = buildParts(
    quizData,
    defaultW,
    defaultH,
  );

  const html =
    `<!DOCTYPE html>\n` +
    `<html lang="en">\n` +
    `<head>\n` +
    `  <meta charset="utf-8">\n` +
    `  <meta name="viewport" content="width=device-width,initial-scale=1">\n` +
    `  <meta name="ad.size" content="width=${defaultW},height=${defaultH}">\n` +
    `  <title>Ad</title>\n` +
    `  <link rel="stylesheet" href="ad.css">\n` +
    `</head>\n` +
    `<body>\n` +
    `  <div id="ad">\n` +
    (bgHtml ? `    ${bgHtml}\n` : ``) +
    (framesHtml ? `    ${framesHtml}\n` : ``) +
    `  </div>\n` +
    `  <script src="ad.js"><` +
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
  const { framesHtml, bgHtml, css, js } = buildParts(
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
