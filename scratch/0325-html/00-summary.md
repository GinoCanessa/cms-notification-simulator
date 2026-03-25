# Single-HTML Feasibility Analysis — CMS Notification Simulator

## Project Profile

| Dimension | Value |
|---|---|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 8 |
| Key Library | @xyflow/react 12 (graph visualization) |
| State | Zustand 5 (3 stores) |
| Routing | React Router 7 (2 pages: Overview + Simulator) |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Source | 33 files, ~3,850 LOC, 18 components |
| Bundle | ~489 KB JS + 44 KB CSS (single chunk, no code splitting) |
| Web APIs | localStorage + matchMedia only |
| Network Calls | None — fully client-side |

**Single-file viability: HIGH.** No service workers, web workers, IndexedDB,
dynamic imports, or fetch calls. The app is purely client-side with no backend.

---

## Biggest Challenge: @xyflow/react

React Flow is the single largest dependency (~300 KB of the 489 KB bundle).
It provides:

- Draggable, zoomable graph canvas
- Custom node rendering (5 node types)
- Custom edge rendering (3 edge types with animation)
- MiniMap and Controls widgets
- Connection handling (drag-to-connect edges)
- Hit testing, viewport management

Any option that removes React Flow requires reimplementing this functionality.

---

## Three Options

| | Option A | Option B | Option C |
|---|---|---|---|
| **Approach** | Single-file build plugin | CDN + ESM modules | Vanilla JS rewrite |
| **Framework** | Keep React + all deps | Keep React, load via CDN | No framework |
| **Graph** | Keep React Flow | Keep React Flow via CDN | Custom SVG/Canvas |
| **Build step** | Yes (Vite) | No (runs directly) | No |
| **Offline** | ✅ Fully self-contained | ❌ Needs CDN on first load | ✅ Fully self-contained |
| **File size** | ~600 KB | ~15 KB HTML + CDN | ~80-120 KB |
| **Code changes** | Minimal config only | Moderate restructure | Full rewrite |
| **Effort** | ~1-2 hours | ~16-24 hours | ~80-120 hours |
| **Risk** | Very Low | Medium | High |
| **Maintainability** | Identical to current | Slightly harder | Separate codebase |

---

## Recommendation

**Option A** is the clear winner for an immediate solution — it produces a
self-contained HTML file with zero code changes and minimal risk.

If the goal is truly "no build step, just open the HTML file," **Option B** is
the pragmatic middle ground, trading offline capability for zero build tooling.

**Option C** only makes sense if there's a hard requirement for minimal file
size AND offline use AND the project will diverge from the React codebase.

See individual option files for detailed analysis.
