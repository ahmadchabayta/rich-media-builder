# BLS Producer → Rich Media Creator → Web Design Suite

> **Evolution Roadmap**
> Last updated: 2026-03-07

---

## Milestone Overview

| Version | Codename             | Key Deliverable                                     | Est. Duration |
| ------- | -------------------- | --------------------------------------------------- | ------------- |
| v1.5    | **UX Polish**        | Phase 0 fixes, styled modals, local project manager | 3 weeks       |
| v2.0    | **Vector Studio**    | Pen tool, node editing, SVG properties              | 8 weeks       |
| v2.5    | **Effects Engine**   | Interactive effects, enhanced interactions          | 10 weeks      |
| v3.0    | **Animation Studio** | Timeline editor, graph editor, property animation   | 12 weeks      |
| v3.5    | **Game Kit**         | Prefab system, 7+ game templates                    | 8 weeks       |
| v4.0    | **Responsive**       | Flex/grid layout, breakpoints, device preview       | 12 weeks      |
| v5.0    | **Web Suite**        | Multi-page, components, design tokens, code export  | 20 weeks      |

---

## Phase 0 — UX Debt (v1.5, ~3 weeks)

Foundation fixes before feature work begins.

| #   | Task                                                        | Effort | Status |
| --- | ----------------------------------------------------------- | ------ | ------ |
| 1   | Styled confirm/alert modal system (`ConfirmDialogProvider`) | 2d     | ⬜     |
| 2   | Fix align-vertical-centres bug in `lib/align.ts`            | 0.5d   | ⬜     |
| 3   | Delete whole translation row from Board                     | 1d     | ⬜     |
| 4   | Local project manager modal (IndexedDB slot picker)         | 3d     | ⬜     |
| 5   | Move answer-group button colours to AppHeader toolbar       | 1d     | ⬜     |
| 6   | Consolidate opacity control into Filters & FX panel         | 1d     | ⬜     |
| 7   | Advanced rolldown for object metadata (id, role, label)     | 1d     | ⬜     |
| 8   | Detachable / dockable right-panel sections (Portal float)   | 5d     | ⬜     |

---

## Phase 1 — Vector & Drawing Engine (v2.0, ~8 weeks)

Transforms the app from a frame composer into a real design tool.

### 1.1 Core Vector Primitives

New `VectorPathObject` type added to the `FrameObject` union:

```
VectorPathObject
  nodes: VectorNode[]       — ordered control points
  closed: boolean
  fill: string
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
  strokeLinecap?: butt | round | square
  strokeLinejoin?: miter | round | bevel
```

Each `VectorNode` holds `{ x, y, handleIn?, handleOut? }` for cubic bézier curves.

### 1.2 Pen Tool

| Feature            | Behaviour                                      |
| ------------------ | ---------------------------------------------- |
| Click              | Place straight-line node                       |
| Click + drag       | Place curve node with symmetric handles        |
| Shift + click      | Constrain to 0° / 45° / 90° from previous node |
| Alt + click handle | Break tangent symmetry                         |
| Click first node   | Close path                                     |
| Escape / Enter     | Finish open path                               |

### 1.3 Node Editing

| Feature            | Behaviour                |
| ------------------ | ------------------------ |
| Double-click path  | Enter node-editing mode  |
| Drag node          | Move control point       |
| Drag handle        | Adjust bézier curve      |
| Click edge         | Insert new node at point |
| Delete / Backspace | Remove selected node     |
| Ctrl+J             | Join two open endpoints  |

### 1.4 SVG Property Panel

New section in Properties when a vector object is selected:

- **Fill**: solid / linear gradient / radial gradient / none
- **Stroke**: colour, width, dash pattern (`solid | dashed | dotted | custom`), cap, join
- **Path effects**: offset path, outline stroke
- **Boolean ops**: union, subtract, intersect, exclude (toolbar buttons)

### 1.5 Shape-to-Vector Conversion

Double-clicking an existing `ShapeObject` converts it to a `VectorPathObject` with editable nodes (rect → 4 corner nodes, circle → 4 nodes with symmetric handles).

### 1.6 Open Questions

| #   | Question                                                                     | Options                                      |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| Q1  | Coordinate system — migrate all objects to transform-matrix, or keep hybrid? | Matrix (future-proof) · Hybrid (simpler now) |
| Q2  | Rendering — inline SVG in React DOM, or Canvas 2D for the design surface?    | SVG (consistent with export) · Canvas (perf) |
| Q3  | Export — vectors export as inline `<svg>` in HTML output?                    | Yes · No (rasterise)                         |
| Q4  | Fill gradients — shared definitions or per-object?                           | Shared (Figma-style) · Per-object            |
| Q5  | Existing `PathObject` — deprecate in favour of `VectorPathObject`?           | Deprecate · Keep both                        |

---

## Phase 2 — Interactive Components & Effects Engine (v2.5, ~10 weeks)

### 2.1 Effect System

New composable `effects: EffectConfig[]` array on every `BaseObject`:

| Effect            | CSS Technique                                               | Export Method               |
| ----------------- | ----------------------------------------------------------- | --------------------------- |
| Liquid distortion | `backdrop-filter: url(#turbulence)` + SVG `<feTurbulence>`  | Inline SVG filter           |
| Particle emitter  | N pseudo-elements with staggered `@keyframes`               | Generated CSS               |
| 3D card tilt      | `perspective() rotateX(var(--tiltX)) rotateY(var(--tiltY))` | JS mousemove + CSS vars     |
| Dynamic shadows   | `drop-shadow(var(--sx) var(--sy) var(--sb) color)`          | CSS vars + JS               |
| Text scramble     | `content` cycling via `@keyframes steps()`                  | Pure CSS                    |
| SVG path draw     | `stroke-dasharray` + `stroke-dashoffset` animation          | CSS animation               |
| Shape morph       | `clip-path: polygon()` transition                           | CSS transition + JS trigger |
| Magnetic hover    | `transform` on pointer proximity                            | JS pointermove              |
| Parallax layer    | `perspective` + `translateZ`                                | CSS + scroll-linked         |

Each effect has:

- `trigger`: `always | hover | click | scroll | viewport-enter`
- `params`: type-specific configuration (intensity, colour, speed, etc.)

### 2.2 Interaction System Overhaul

Replace current simple `HoverEffect` / `ClickEffect` with a full interaction model:

| Trigger      | Actions                                                    |
| ------------ | ---------------------------------------------------------- |
| `hover`      | Play animation · Toggle visibility · Change state variable |
| `click`      | Navigate to frame · Open URL · Play sound · Trigger effect |
| `long-press` | Same as click actions                                      |
| `swipe`      | Navigate forward/back · Dismiss element                    |
| `drag`       | Move element · Snap to target                              |

Actions can target `self` or any other object by ID.

### 2.3 Open Questions

| #   | Question                                                               |
| --- | ---------------------------------------------------------------------- |
| Q6  | Should export JS be inlined or bundled as a separate `bls-runtime.js`? |
| Q7  | Can multiple effects stack on one object simultaneously?               |
| Q8  | Add audio assets to the asset model now?                               |
| Q9  | How far should the state-variable / reactive binding system go?        |
| Q10 | Expose a "performance mode" toggle to disable effects during editing?  |

---

## Phase 3 — Timeline & Animation Studio (v3.0, ~12 weeks)

### 3.1 Timeline Data Model

Replace simple `AnimConfig` with property-level keyframe tracks:

```
TimelineTrack
  objectId: string
  property: "x" | "y" | "opacity" | "rotation" | "scale" | ...
  keyframes: TimelineKeyframe[]

TimelineKeyframe
  time: number        — ms from frame start
  value: number | string
  easing: EasingFunction
```

### 3.2 Timeline UI

Replaces the current `BottomPanel` frame strip.

```
┌──────────────────────────────────────────────────────────┐
│ ▶ ⏸ ⏹ │ 0:00.000    ←──playhead──→         0:05.000    │
├──────────┬───────────────────────────────────────────────┤
│ Object 1 │ ▓▓▓░░░░░▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│   ├ x    │ ◆─────────◆                                   │
│   ├ y    │ ◆───◆────────────◆                             │
│   └ opa  │ ◆──────────────────────────────────◆           │
│ Object 2 │ ░░░░░▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░   │
│   └ x    │      ◆──────────◆                              │
├──────────┴───────────────────────────────────────────────┤
│ Graph Editor (toggle)  ╱╲╱──────╱╲                        │
└──────────────────────────────────────────────────────────┘
```

Features:

- Drag keyframe diamonds to re-time
- Right-click keyframe → change easing curve
- Graph editor for visual bézier easing editing
- Scrub playhead for real-time canvas preview
- Onion-skinning toggle (ghost previous/next keyframe)

### 3.3 Migration Path

| Old Model         | New Model                      | Compatibility                     |
| ----------------- | ------------------------------ | --------------------------------- |
| `animIn` preset   | Auto-generates timeline tracks | Presets still usable as shortcuts |
| `animOut` preset  | Same                           | Same                              |
| `animLoop` preset | Infinite-repeat track          | Same                              |
| `customAnim`      | Direct keyframe import         | 1:1 mapping                       |

User can "Convert to timeline" to unlock full keyframe editing.

### 3.4 Open Questions

| #   | Question                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------- |
| Q11 | Should frames become "scenes" with independent timelines, or one global timeline with scene markers? |
| Q12 | Include a bézier curve editor for easing (like After Effects)?                                       |
| Q13 | Real-time canvas update on playhead scrub?                                                           |
| Q14 | Use Web Animations API in export for more control?                                                   |
| Q15 | Auto-migrate old projects to timeline format on load?                                                |

---

## Phase 4 — Game Templates & Prefabs (v3.5, ~8 weeks)

### 4.1 Prefab System

A prefab is a reusable object tree with built-in interactions and animations:

```
Prefab
  id, name, category, thumbnail
  objects: FrameObject[]
  interactions: InteractionConfig[]
  requiredVariables: VariableDefinition[]
  customCss?: string
  customJs?: string           — sandboxed runtime
```

### 4.2 Game Prefab Catalogue

| Template              | Technique                                | Complexity |
| --------------------- | ---------------------------------------- | ---------- |
| Scratch card reveal   | CSS `mask-image` + pointer tracking      | Medium     |
| Slot machine          | CSS `@keyframes` on 3 reel strips        | Medium     |
| Spin the wheel        | CSS `rotate` + JS random stop angle      | Medium     |
| Before / after slider | CSS `clip-path` + drag handler           | Low        |
| Memory card game      | CSS `rotateY(180deg)` flip + match logic | High       |
| Puzzle assemble       | CSS grid + drag-snap + completion check  | High       |
| Product unboxing      | Sequenced 3D transforms                  | Medium     |
| Story / reels ad      | CSS scroll-snap + parallax               | Medium     |
| Swipe comparison      | range input + `clip-path`                | Low        |
| Maze game             | CSS grid + hover/tap path highlighting   | High       |
| 360 panorama          | CSS perspective + rotate via keyframes   | Medium     |

### 4.3 Prefab Distribution

```
Local (bundled)  ──▶  Sanity CMS (curated)  ◀──  Community (future)
```

### 4.4 Open Questions

| #   | Question                                                                   |
| --- | -------------------------------------------------------------------------- |
| Q16 | Should prefab JS run in an iframe sandbox or inline with a restricted API? |
| Q17 | Should game results feed into the existing tracker system?                 |
| Q18 | Should prefabs expose configurable difficulty parameters?                  |
| Q19 | Can users "break open" a prefab and edit internals?                        |

---

## Phase 5 — Responsive Layout Engine (v4.0, ~12 weeks)

### 5.1 Layout Modes

Add `layoutMode` to frames:

| Mode       | Behaviour                                                    |
| ---------- | ------------------------------------------------------------ |
| `absolute` | Current behaviour — free-positioned objects                  |
| `flex`     | Figma-style auto-layout (direction, gap, padding, alignment) |
| `grid`     | CSS grid with row/column definitions                         |
| `auto`     | AI-suggested layout based on object positions                |

### 5.2 Breakpoints

```
Breakpoint
  maxWidth: number
  overrides: Partial<Frame>     — layout/sizing changes at this width
```

Objects can have per-breakpoint overrides for position, size, visibility, and font size.

### 5.3 Device Preview Bar

Preset viewports for instant preview:

| Category | Sizes                         |
| -------- | ----------------------------- |
| Mobile   | 375×667, 390×844, 414×896     |
| Tablet   | 768×1024, 834×1194            |
| Desktop  | 1280×720, 1440×900, 1920×1080 |

### 5.4 Open Questions

| #   | Question                                                          |
| --- | ----------------------------------------------------------------- |
| Q20 | Is responsive layout needed for ads too, or only web design mode? |
| Q21 | CSS media queries, container queries, or JS resize observer?      |
| Q22 | Can a frame mix absolute and flex/grid children?                  |
| Q23 | Should responsive projects export as multi-file static sites?     |

---

## Phase 6 — Web Design Suite (v5.0, ~20 weeks)

### 6.1 Multi-Page Projects

```
Project
  type: "ad" | "website" | "prototype"
  pages: Page[]
  globalStyles: StyleDefinition[]
  designTokens: TokenSet
  assets: AssetLibrary

Page
  id, name, slug
  frame: Frame                — reuses existing frame as page content
  meta: PageMeta
```

### 6.2 Component System

Reusable component definitions with instances and overrides:

- **Definition**: name, props, template object tree, variants
- **Instance**: references definition by ID, stores per-instance overrides
- **Propagation**: editing a definition updates all instances

### 6.3 Design Tokens

```
TokenSet
  colors:       { primary: "#3b82f6", ... }
  typography:   { heading: { family, size, weight, lineHeight }, ... }
  spacing:      { sm: 4, md: 8, lg: 16, ... }
  borderRadius: { sm: 4, md: 8, full: 9999 }
  shadows:      { sm: "0 1px 2px ...", ... }
  breakpoints:  { mobile: 640, tablet: 1024, desktop: 1440 }
```

Objects reference tokens by name (`$color.primary`), enabling theme switching (dark/light mode, brand variants).

### 6.4 Code Export Targets

| Format                 | Use Case                                         |
| ---------------------- | ------------------------------------------------ |
| Static HTML / CSS / JS | Current ad export, expanded for multi-page sites |
| React + Tailwind       | `.tsx` components                                |
| Vue SFCs               | `.vue` single-file components                    |
| WordPress theme        | PHP templates + CSS                              |
| Figma import / export  | Design file interop                              |

### 6.5 Open Questions

| #   | Question                                                                            |
| --- | ----------------------------------------------------------------------------------- |
| Q24 | Should "ad" and "website" be separate project types from creation?                  |
| Q25 | Should components be global (cross-project) or per-project?                         |
| Q26 | Is real-time multi-user editing on the roadmap? (Would require CRDT sync, e.g. Yjs) |
| Q27 | Should the suite include a "publish to CDN" flow?                                   |
| Q28 | Should third-party plugins be supported? (Requires plugin API + sandbox)            |

---

## Cross-Cutting Concerns

### Performance

| Concern            | Current State                  | Target                                   |
| ------------------ | ------------------------------ | ---------------------------------------- |
| Objects per frame  | ~50 comfortable                | 500+ for complex layouts                 |
| Frames per project | ~20 comfortable                | 100+ pages for web design                |
| Undo history       | Full snapshot clone per action | Structural sharing or JSON patches       |
| Canvas rendering   | React DOM                      | Hybrid DOM + Canvas2D for vector editing |

### Store Architecture

As the data model grows the current single Zustand store with 6 slices will need:

- Possible split into `projectStore`, `uiStore`, `historyStore`
- Derived-state layer (computed selectors) for cross-cutting queries
- Operation-based undo (JSON patches) replacing full-snapshot cloning

### Export Engine Evolution

`exportEngine.ts` currently uses string concatenation. Future needs:

- AST-based DOM tree builder → serialise (maintainability)
- Web Worker for export (avoid main-thread blocking on large projects)
- Multiple output format pipelines (HTML, React, Vue)

### Testing Strategy

| Level     | Scope                                             | Priority    |
| --------- | ------------------------------------------------- | ----------- |
| Unit      | Export engine, alignment math, animation compiler | High        |
| Unit      | Store slices (frame/object CRUD, undo/redo)       | High        |
| Snapshot  | Export HTML output regression tests               | Medium      |
| Component | Sidebar panels, toolbar interactions              | Medium      |
| E2E       | Full create → edit → export flow                  | Low (later) |

### Architecture Decision Record

| #       | Decision                                      | Status                            |
| ------- | --------------------------------------------- | --------------------------------- |
| Q1      | Coordinate system: transform-matrix vs hybrid | 🔴 Needs answer before Phase 1    |
| Q2      | Rendering: SVG DOM vs Canvas 2D               | 🔴 Needs answer before Phase 1    |
| Q3      | Vector export format                          | 🔴 Needs answer before Phase 1    |
| Q4      | Gradient definition sharing                   | 🟡 Can defer to Phase 1 mid-point |
| Q5      | PathObject deprecation                        | 🟡 Can defer to Phase 1 mid-point |
| Q6      | Export JS bundling strategy                   | 🟡 Before Phase 2                 |
| Q7      | Effect stacking                               | 🟡 Before Phase 2                 |
| Q8      | Audio asset model                             | 🟡 Before Phase 2                 |
| Q9      | State variable system depth                   | 🟡 Before Phase 2                 |
| Q10     | Performance mode toggle                       | 🟢 Can decide during Phase 2      |
| Q11     | Frame vs scene timeline model                 | 🔴 Needs answer before Phase 3    |
| Q12–Q15 | Timeline details                              | 🟡 Before Phase 3                 |
| Q16–Q19 | Prefab sandboxing & editing                   | 🟡 Before Phase 4                 |
| Q20–Q23 | Responsive layout scope                       | 🟡 Before Phase 5                 |
| Q24–Q28 | Web suite architecture                        | 🟡 Before Phase 6                 |
| Q29     | Hybrid renderer cutover point                 | 🔴 Needs answer before Phase 1    |
| Q30     | Undo system migration                         | 🟡 Before Phase 3                 |

> 🔴 = blocking, must answer before starting that phase
> 🟡 = important, should answer before mid-point of that phase
> 🟢 = non-blocking, can decide during implementation
