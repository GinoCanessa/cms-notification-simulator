# Option B: CDN + ESM Modules (No Build Step)

## Approach

Restructure the app as a single HTML file that loads React, React Flow, and
other dependencies from CDN via ES module imports. Application code lives
directly in `<script type="module">` blocks using JSX-less React (or an
in-browser JSX transform). **No build tooling required to run.**

## How It Works

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CMS Notification Simulator</title>
  <style>/* All CSS inlined here — Tailwind output + custom vars */</style>
</head>
<body>
  <div id="root"></div>

  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19",
      "react-dom/client": "https://esm.sh/react-dom@19/client",
      "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
      "@xyflow/react": "https://esm.sh/@xyflow/react@12",
      "zustand": "https://esm.sh/zustand@5",
      "framer-motion": "https://esm.sh/framer-motion@12"
    }
  }
  </script>

  <script type="module">
    import { createElement as h } from 'react';
    import { createRoot } from 'react-dom/client';
    import { ReactFlow, Background, MiniMap, Controls } from '@xyflow/react';
    import { create } from 'zustand';

    // ... all application code using h() instead of JSX ...

    createRoot(document.getElementById('root')).render(h(App));
  </script>
</body>
</html>
```

### Key Transformations

1. **Remove TypeScript** — CDN modules are plain JS. Type annotations are stripped.
2. **Remove JSX** — Use `createElement` / `h()` calls, or use HTM (a 1 KB
   tagged template JSX alternative):
   ```js
   import htm from 'https://esm.sh/htm';
   const html = htm.bind(h);
   // Then: html`<div className="foo">${children}</div>`
   ```
3. **Remove React Router** — Replace with a simple hash-based tab switcher
   (only 2 pages).
4. **Remove Tailwind build step** — Pre-generate the used CSS classes via
   `npx tailwindcss -o styles.css --minify` once, then inline the output.
5. **Replace Lucide icons** — Inline the ~10 SVG icons used directly.
6. **Framer Motion** — Can keep via CDN or replace the few uses with CSS
   transitions.

## What Changes

| Area | Current | New |
|---|---|---|
| Language | TypeScript + JSX | Plain JS + htm or h() |
| Routing | React Router (BrowserRouter) | Hash-based tab toggle (~20 LOC) |
| Styling | Tailwind (build plugin) | Pre-built CSS inline |
| Icons | Lucide React (tree-shaken) | Inline SVG strings |
| State | Zustand (import) | Zustand (CDN import) |
| Graph | @xyflow/react (import) | @xyflow/react (CDN import) |
| Build | `npm run build` | None — open HTML directly |

## Output

A single HTML file (~15-20 KB of application code) that fetches dependencies
from CDN on first load. After browser caching, subsequent loads are instant.

## Tradeoffs

### Pros
- **No build step** — truly "edit and reload"
- **Small application code** — only your code is in the file (~15-20 KB)
- **Modern browser support** — import maps are supported in Chrome 89+,
  Firefox 108+, Safari 16.4+
- **Editable** — you can open the HTML file in a text editor and modify logic
- **Incremental migration** — can convert one component at a time

### Cons
- **Requires internet** — CDN dependencies must be fetched (though they cache)
- **No offline support** — won't work without network on first visit
  (can be mitigated by bundling CDN scripts locally, but that defeats the purpose)
- **JSX-less code is verbose** — `h('div', {className: 'foo'}, children)` vs
  `<div className="foo">{children}</div>`. HTM helps but adds 1 KB.
- **No TypeScript** — lose type safety, IDE support, refactoring tools
- **Tailwind maintenance** — must regenerate CSS when utility classes change
- **CDN reliability** — esm.sh outages would break the app
- **Import map compatibility** — older browsers need a polyfill
- **Moderate effort** — significant restructuring of 33 files into inline code

## Estimated Effort

| Task | Time |
|---|---|
| Set up import map + CDN resolution | 2 hours |
| Convert TSX → JS with htm/h() (18 components) | 8-12 hours |
| Replace React Router with tab switcher | 1 hour |
| Extract and inline Tailwind CSS | 2 hours |
| Replace Lucide icons with inline SVGs | 1 hour |
| Integration testing + debugging | 4-6 hours |
| **Total** | **~16-24 hours** |

## Verdict

**Best option if "no build step" is the primary requirement** and internet
access can be assumed. The app structure remains recognizable (still React,
still React Flow, still Zustand) but lives in a single file. The main cost
is converting JSX to an alternative syntax and losing TypeScript.

Not recommended if offline use is required — in that case, Option A or C
is a better fit.
