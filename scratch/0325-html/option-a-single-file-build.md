# Option A: Single-File Build Plugin

## Approach

Add [`vite-plugin-singlefile`](https://github.com/nicedoc/vite-plugin-singlefile)
to the Vite build pipeline. This plugin inlines all JS, CSS, and small assets
into a single self-contained HTML file. **No application code changes required.**

## How It Works

1. `npm install -D vite-plugin-singlefile`
2. Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
})
```

3. `npm run build` → produces `dist/index.html` (~600 KB) with everything inlined
4. Open `dist/index.html` directly in a browser — no server needed

### Additional Considerations

- **React Router**: `BrowserRouter` won't work from `file://` protocol because
  it depends on `history.pushState`. Change to `HashRouter` (one-line change
  in `main.tsx`):

```tsx
import { HashRouter } from 'react-router-dom'
// ... instead of BrowserRouter
<HashRouter><App /></HashRouter>
```

- **Favicon**: The `favicon.svg` reference will be inlined as a data URI
  automatically by the plugin.

- **React Flow CSS**: Already imported in `index.css` — will be captured by
  Tailwind/Vite CSS processing and inlined.

## What Changes

| File | Change |
|---|---|
| `vite.config.ts` | Add `viteSingleFile()` plugin |
| `main.tsx` | `BrowserRouter` → `HashRouter` |
| `package.json` | Add `vite-plugin-singlefile` devDep |

**Total: 3 lines of code changed.**

## Output

A single `dist/index.html` file containing:
- All React, React Flow, Zustand, Framer Motion code (inlined `<script>`)
- All Tailwind CSS + custom styles (inlined `<style>`)
- SVG icons as data URIs
- Fully functional offline — no server, no CDN, no network

## Tradeoffs

### Pros
- **Zero risk** — identical runtime behavior to current app
- **Trivial effort** — ~1-2 hours including testing
- **Maintains dev workflow** — `npm run dev` still works normally; the
  single-file output is just an alternative build artifact
- **All features preserved** — React Flow graph, animations, themes, everything
- **Can coexist** — add a `build:single` script alongside the normal build

### Cons
- **~600 KB file size** — large for an HTML file (though ~180 KB gzipped)
- **Still requires a build step** — must run `npm run build` to produce the file
- **Not human-editable** — the inlined JS is minified/bundled; editing requires
  modifying the source and rebuilding
- **Base64 bloat** — any images/fonts would be base64-encoded (currently only
  small SVGs, so minimal impact)

## Estimated Effort

| Task | Time |
|---|---|
| Install plugin, update config | 15 min |
| Switch to HashRouter | 5 min |
| Test single-file output | 30 min |
| **Total** | **~1 hour** |

## Verdict

**Best option if the goal is "give someone one HTML file they can open."**
Zero risk, minimal effort, full feature parity. The only downside is file size
and the continued need for a build step to produce the artifact.
