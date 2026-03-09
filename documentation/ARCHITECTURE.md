# BLS Producer — Architecture

## Overview

BLS Producer is a **browser-based interactive ad / quiz builder** built on Next.js 16 (App Router). A designer composes multi-frame "presentations" — each frame holds positioned objects (text, images, answer groups, shapes, paths, dividers) — and exports a self-contained HTML file that plays back animations and handles answer interaction.

The app is a single-page editor. The Next.js shell is used only for routing (editor at `/`, embedded Sanity Studio at `/studio`). All editor logic runs entirely on the client.

---

## Tech Stack

| Layer                | Technology                           |
| -------------------- | ------------------------------------ |
| Framework            | Next.js 16 (App Router, Turbopack)   |
| UI library           | Mantine v8                           |
| State management     | Zustand v5 (persisted via IndexedDB) |
| Rich text editing    | TipTap v3                            |
| Drag & drop (layers) | dnd-kit                              |
| CMS / asset source   | Sanity v5 (embedded Studio + API)    |
| Export compression   | fflate                               |
| Persistence          | IndexedDB via idb-keyval             |
| Language             | TypeScript (strict mode)             |

---

## Directory Structure

```
app/
  layout.tsx             — Root layout (Mantine, fonts, global CSS)
  page.tsx               — Main editor shell; mounts BlsProducer layout
  studio/[[...tool]]/    — Embedded Sanity Studio route
  api/
    cloud/               — REST routes: list projects, save, upload images
    proxy-image/         — Server-side image proxy (avoids CORS for exports)

components/
  canvas/                — Canvas rendering layer
  layout/                — Top-level layout regions
  modals/                — Detached modal dialogs
  sidebar/               — Right-panel property editors

context/                 — React contexts (drag, rich editor)
hooks/                   — Custom hooks (drag, export, ruler, sanity cloud)
lib/                     — Pure logic (types, animation, export, fonts, snap)
store/                   — Zustand store (slices + persisted state)
public/                  — Static assets
sanity/                  — Sanity client, schema, schema types
```

---

## Data Model

All editor state is described by `lib/types.ts`.

### `QuizData` (root)

```
QuizData
  bg: string | null          — global background colour
  frames: Frame[]
  customCss?: string
```

### `Frame`

A slide / screen. Contains positioned objects and animation configuration.

Key fields: `id`, `w`, `h`, `src` (bg image URL), `objects`, `bgColor`, `bgGradient`, `bgImage`, `bgImageAnim`, `animEnter`, `animExit`, `enterStagger`, `exitStagger`, `isEndFrame`, `locale`.

### `FrameObject` (union type)

All objects extend `BaseObject`:

| Type                | Extra fields                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextObject`        | `text`, `richText` (TipTap HTML), `size`, `color`, `bgEnabled`, `bgColor`, `radius`, `paddingX/Y`, `paddingTop/Right/Bottom/Left`, typography |
| `ImageObject`       | `src`, `w`, `h`                                                                                                                               |
| `AnswerGroupObject` | `answers[]`, button sizing/styling, per-answer images                                                                                         |
| `ShapeObject`       | `shape` (rect/circle), `w`, `h`, `fill`, per-corner radius                                                                                    |
| `DividerObject`     | `w`, `thickness`, `color`, `lineStyle`                                                                                                        |
| `PathObject`        | `d` (SVG path), `w`, `h`, `stroke`, `fill`                                                                                                    |

`BaseObject` carries shared fields: `id`, `x`, `y`, `role`, animation configs (`animIn`, `animOut`, `animLoop`, `customAnim*`), `hoverEffect`, `clickEffect`, `zIndex`, `opacity`, `rotation`, `hidden`, `locked`, `blendMode`, `cssFilter`.

---

## State Management

`store/quizStore.ts` composes a single Zustand store from six slices.  
The store is persisted to **IndexedDB** (key: `bls-producer-project`) via `idb-keyval`. Re-hydration happens automatically on first mount.

### Slices

| Slice            | Responsibility                                                    |
| ---------------- | ----------------------------------------------------------------- |
| `frameSlice`     | Add / remove / reorder frames, update frame fields, bg settings   |
| `objectSlice`    | Add / remove / update objects within frames, z-order, lock/hide   |
| `selectionSlice` | Single + multi-selection, active frame index, playback mode       |
| `historySlice`   | Undo/redo via snapshot stack (`snapshot()` / `undo()` / `redo()`) |
| `clipboardSlice` | Copy / paste objects                                              |
| `cloudSlice`     | Sanity cloud project metadata, locale list, region list           |

### Persisted keys

`quizData`, `defaultW/H`, `currentPreviewIndex`, `snapEnabled`, `showRuler`, `showGrid`, `zoom`, `defaultTypography`, `cloudProject*`, `exportMeta`, `customCss`, `assets`, `customFonts`.

---

## Layout Regions

```
┌─────────────────────────────────────────────────────┐
│  AppHeader  (toolbar / controls per selection type) │
├─────────┬───────────────────────────┬───────────────┤
│ Sidebar │      Canvas / Board       │  RightPanel   │
│ (left)  │   (RuledCanvas + Board)   │  (5 panels)   │
├─────────┴───────────────────────────┴───────────────┤
│  BottomPanel  (frame timeline strip)                │
└─────────────────────────────────────────────────────┘
```

### AppHeader (`components/layout/AppHeader/`)

Context-sensitive toolbar. When a text or answerGroup object is selected, `TextTypographyBar` appears with font, size, weight, B/I/U, alignment, transform, letter-spacing, line-height, text colour, and background colour (auto-enables `bgEnabled` on pick).

### Sidebar — left (`components/layout/Sidebar/`)

Hosts the frame thumbnail strip and global settings.

### Canvas (`components/canvas/`)

| Component                          | Role                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `RuledCanvas`                      | Ruler overlay (px markers, cursor read-outs)                                                               |
| `Board`                            | Scroll + zoom container, drop target for new objects                                                       |
| `FrameCard`                        | One frame slot (background + `FrameObject` elements)                                                       |
| `FrameObject` (`FrameObjectEl`)    | Per-object renderer + interaction handler                                                                  |
| `FrameObjectRenderers`             | Delegates non-text types: `ImageRender`, `AnswerGroupRender`, `ShapeRender`, `DividerRender`, `PathRender` |
| `InlineTextEditor`                 | TipTap editor mounted in-place when a text object is double-clicked                                        |
| `BoardContextMenu` / `ContextMenu` | Right-click menus                                                                                          |

**Double-click to edit:**

- `text` objects → mounts `InlineTextEditor` (TipTap)
- `answerGroup` objects → each answer button becomes a live `<input>` with immediate store updates

**Animation during playback:** `FrameObjectEl` reads `playback` from the store and synthesises CSS `animation` shorthand via `lib/animCompiler.ts`. Custom `@keyframes` are injected into `<head>` with `useLayoutEffect` to avoid a paint-race.

### RightPanel (`components/layout/RightPanel/`)

Five draggable, collapsible, and detachable panels. State (collapsed, floating, position) is persisted to `localStorage` under key `bls-panel-state-v2`.

| Panel            | Content                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **Layers**       | Object list with visibility/lock toggles, drag-to-reorder (dnd-kit)                                   |
| **Properties**   | Position (X/Y), size (W/H), rotation, type-specific fields                                            |
| **Animation**    | Tabbed In / Out / Loop phase blocks + Interactions (hover/click)                                      |
| **Filters & FX** | CSS filter sliders (brightness, contrast, saturation, blur, etc.), blend mode, smart presets, opacity |
| **Frame**        | Frame-level animation, W/H dimensions                                                                 |

Floating panels use a React `Portal` and can be dragged freely. Docking is restored with the "dock back" button.

### BottomPanel (`components/layout/BottomPanel/`)

Horizontal timeline strip listing frame thumbnails. Supports add, duplicate, delete, reorder, and playback preview trigger.

---

## Drag & Resize System

`hooks/useDrag.ts` — provides `startObjectDrag` and `startObjectResize` via `DragContext`.

- **Drag**: `pointermove` on `window`, updates `x`/`y` in the store via `updateObject`.
- **Resize**: 8 resize handles per selected object (corners + edges). `startObjectResize` maps handle id → delta logic.
- **Snap guides**: `lib/snapGuides.ts` computes snap targets (object edges + centres, frame edges) during drag/resize when snap is enabled.
- **Multi-select**: Ctrl/Cmd+click registers secondary selections; multi-drag moves all selected objects in unison.
- **Ruler**: `hooks/useRuler.ts` feeds cursor position to `RuledCanvas`.

---

## Animation System

### Presets (`lib/animPresets.ts`)

Named preset objects (`ANIM_IN`, `ANIM_OUT`) map to `AnimConfig` records.

### Custom animations (`lib/animCompiler.ts`)

`KeyframeStop[]` arrays are compiled to CSS `@keyframes` strings at render time. Individual stops carry per-step easing (`animation-timing-function` injected into the keyframe).

### Stagger

`enterStagger` / `exitStagger` on each `Frame` define the ms gap between animOrder waves. `FrameObjectEl` computes each object's wave index from its `animOrder` relative to siblings. Stagger is added as `animation-delay`.

### Playback phases

`playback.phase`: `"enter"` → animIn, `"hold"` → animLoop, `"exit"` → animOut. Objects on non-active frames are hidden (`opacity: 0, pointerEvents: none`).

---

## Export Engine (`lib/exportEngine.ts`)

Produces a **self-contained HTML file** (no external runtime dependencies beyond Google Fonts).

Steps:

1. Collect all Google Font families + weights used → `<link>` tags.
2. Compile all animation CSS (`@keyframes` + per-object `animation` rules).
3. Render each frame's objects into inline-styled `<div>` tree.
4. Embed frame transition CSS, answer stagger logic, and a tiny JS runtime for playback.
5. Optionally compress images to base64 and inline them.

The output zip (via `fflate`) contains `index.html` + any un-inlined media.

---

## Sanity Integration

Sanity is used as a **cloud asset/project store**, not as a headless CMS for the editor runtime.

| Path                      | Role                                                              |
| ------------------------- | ----------------------------------------------------------------- |
| `sanity/`                 | Sanity config, client, schema for the Studio                      |
| `lib/sanity/client.ts`    | Query client for reading assets                                   |
| `lib/sanity/queries.ts`   | GROQ queries                                                      |
| `hooks/useSanityCloud.ts` | Fetch/save project data to Sanity                                 |
| `app/api/cloud/`          | Next.js route handlers bridging the client to Sanity mutations    |
| `app/api/proxy-image/`    | Server-side image proxy (strips CORS headers for export inlining) |

---

## Persistence Layers

| Store          | Key                    | Contents                                                    |
| -------------- | ---------------------- | ----------------------------------------------------------- |
| IndexedDB      | `bls-producer-project` | Full `QuizData`, UI preferences, cloud metadata             |
| localStorage   | `bls-panel-state-v2`   | Right-panel collapse/float/position state                   |
| Sanity dataset | project documents      | Saved cloud projects (frames as JSON + Sanity image assets) |

---

## Key Conventions

- **Path alias**: `@src/` maps to the project root (configured in `tsconfig.json`).
- **Strict TypeScript**: `--noEmit` + `eslint --max-warnings=0` enforced in CI via `npm run verify:strict`.
- **Commits**: Conventional Commits enforced via `commitlint` + Husky. `lint-staged` auto-fixes ESLint on staged files.
- **No global CSS classes for canvas objects**: all canvas styling is inline `CSSProperties` to guarantee correct export output.
- **Rich text**: TipTap HTML is stored in `obj.richText` and takes precedence over plain `obj.text` at render and export time.
