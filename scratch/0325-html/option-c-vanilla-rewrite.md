# Option C: Vanilla JS + Custom SVG Graph (Full Rewrite)

## Approach

Rewrite the entire application as a single self-contained HTML file using
**zero frameworks** — plain JavaScript, hand-written CSS, and a custom SVG-based
interactive graph renderer. This produces the smallest, most portable artifact
but requires rebuilding everything from scratch.

## Architecture

```
┌─ index.html ──────────────────────────────────┐
│                                                │
│  <style>                                       │
│    /* ~3-4 KB: CSS vars, layout, components */ │
│  </style>                                      │
│                                                │
│  <div id="app">                                │
│    <!-- DOM structure built by JS -->          │
│  </div>                                        │
│                                                │
│  <script>                                      │
│    /* ~2-3 KB: State management (pub/sub) */   │
│    /* ~3-4 KB: Engine (routed + direct) */     │
│    /* ~8-12 KB: SVG graph renderer */          │
│    /* ~4-6 KB: UI panels + controls */         │
│    /* ~2-3 KB: Event log + animation */        │
│  </script>                                     │
│                                                │
└────────────────────────────────────────────────┘
```

### Key Reimplementations

#### 1. State Management (replacing Zustand)
A minimal pub/sub store (~50 LOC):
```js
function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();
  return {
    get: () => state,
    set: (partial) => {
      state = { ...state, ...partial };
      listeners.forEach((fn) => fn(state));
    },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
```

#### 2. Graph Visualization (replacing React Flow)
Custom SVG with:
- **Nodes**: SVG `<g>` groups with shape + text, positioned via `transform`
- **Edges**: SVG `<path>` elements using cubic bezier curves
- **Dragging**: `mousedown`/`mousemove`/`mouseup` event handlers on nodes
- **Zoom/Pan**: `wheel` event for zoom, pointer events for pan, using SVG
  `viewBox` manipulation
- **Connection handles**: Small circles on node borders, `mousedown` to start
  a new edge drag
- **MiniMap**: A second smaller SVG mirroring the main viewport
- **Animation**: CSS `@keyframes` for edge glow + `requestAnimationFrame`
  for traveling dots

This is the most complex part. React Flow provides ~300 KB of battle-tested
interaction code. A custom implementation that covers the features actually
used by this app would be ~400-600 LOC of JS + SVG.

#### 3. UI Panels (replacing React components)
DOM construction via template literals + `innerHTML`, or a tiny `h()` helper:
```js
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  });
  children.flat().forEach((c) =>
    el.append(typeof c === 'string' ? document.createTextNode(c) : c)
  );
  return el;
}
```

#### 4. Routing (replacing React Router)
Not needed — combine Overview and Simulator into a single tabbed view, or
show only the Simulator (the Overview page is mostly static explanatory content).

#### 5. Theming (replacing Tailwind)
Keep the existing CSS custom properties (`--color-bg`, etc.) and write
semantic CSS classes. Tailwind's utility classes become explicit CSS rules.
Dark mode via `html.dark` class toggle, same as current.

## What Gets Rebuilt

| Current (React) | Vanilla Replacement | Complexity |
|---|---|---|
| React component tree | DOM manipulation + `innerHTML` | Medium |
| React Flow canvas | Custom SVG + mouse events | **High** |
| React Flow nodes (5 types) | SVG `<g>` templates | Medium |
| React Flow edges (3 types) | SVG `<path>` with bezier math | Medium |
| React Flow MiniMap | Scaled SVG clone | Low-Medium |
| React Flow Controls (zoom) | Buttons + viewBox math | Low |
| Zustand (3 stores) | Pub/sub stores | Low |
| Framer Motion | CSS animations | Low |
| React Router (2 routes) | Tab toggle or remove | Trivial |
| Tailwind CSS | Hand-written CSS | Low |
| Lucide icons | Inline SVG | Trivial |

## Output

A single `index.html` file, estimated **80-120 KB** uncompressed (~25-35 KB
gzipped), containing:
- All styles in a `<style>` block
- All logic in a `<script>` block
- All SVG icons inline
- Zero external dependencies
- Works from `file://`, no server needed, fully offline

## Tradeoffs

### Pros
- **Smallest file size** — 80-120 KB vs 600 KB (Option A) or CDN-dependent (B)
- **Zero dependencies** — nothing can break, no CDN, no npm, no build step
- **Fully offline** — works from a USB drive, email attachment, local filesystem
- **Fast** — no framework overhead, instant load, minimal DOM
- **Human-editable** — a developer can read and modify the source directly
- **Maximum portability** — works in any modern browser, any OS, any context

### Cons
- **Massive effort** — 80-120 hours of development
- **Separate codebase** — the React version and vanilla version would diverge
  immediately; maintaining both is impractical
- **Feature regression risk** — subtle interaction behaviors from React Flow
  (edge routing, node overlap, selection, keyboard shortcuts) would need to
  be reimplemented or dropped
- **Less maintainable** — no type safety, no component boundaries, no ecosystem
  tooling. Future features take longer to add.
- **Testing burden** — must hand-test all interactions that React Flow handled
  automatically (drag, zoom, pan, connect, resize, etc.)
- **SVG performance** — for very large graphs (50+ nodes), a custom SVG
  renderer may need optimization that React Flow handles internally

## Estimated Effort

| Task | Time |
|---|---|
| State management (pub/sub stores) | 4 hours |
| SVG graph renderer (nodes, edges, layout) | 20-30 hours |
| Drag, zoom, pan, connect interactions | 15-20 hours |
| UI panels (controls, actor list, event log) | 10-15 hours |
| Simulation engine (port from TS → JS) | 4-6 hours |
| Animation system | 4-6 hours |
| Theming + dark mode | 2-3 hours |
| Overview page content | 2 hours |
| MiniMap + Controls | 4-6 hours |
| Integration testing | 10-15 hours |
| **Total** | **~80-120 hours** |

## Verdict

**Best option only if ALL of these are true:**
1. The file must be fully self-contained (no CDN, no build)
2. File size matters significantly (e.g., embedding in documents)
3. The React version is being abandoned (no dual maintenance)
4. There's budget for 2-3 weeks of development

Otherwise, this is over-engineering. Option A gives you a self-contained HTML
file in 1 hour. This option gives you a *smaller* self-contained HTML file
in 3 weeks.
