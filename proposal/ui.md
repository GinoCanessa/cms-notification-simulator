# UI Specification — Enterprise Dashboard

> **Selected design:** `proposal/ui/mockup-d-enterprise-dashboard.html`
>
> This document provides implementation-ready detail for every component,
> token, animation, and interaction in the UI. Reference the mockup HTML for
> a live preview.

---

## Table of Contents

1. [Page Structure & Layout](#1-page-structure--layout)
2. [Design Tokens & Theming](#2-design-tokens--theming)
3. [Typography](#3-typography)
4. [Top Bar](#4-top-bar)
5. [Sub-header / Stats Bar](#5-sub-header--stats-bar)
6. [Left Panel — Controls](#6-left-panel--controls)
7. [Center — Graph Canvas](#7-center--graph-canvas)
8. [Right Panel — Actor Detail](#8-right-panel--actor-detail)
9. [Bottom — Event Log](#9-bottom--event-log)
10. [Graph Node Specifications](#10-graph-node-specifications)
11. [Graph Edge Specifications](#11-graph-edge-specifications)
12. [Animations](#12-animations)
13. [Interactions](#13-interactions)
14. [Light / Dark Mode](#14-light--dark-mode)
15. [Responsive Breakpoints](#15-responsive-breakpoints)
16. [Accessibility](#16-accessibility)
17. [Overview Page](#17-overview-page)

---

## 1. Page Structure & Layout

The application is a full-viewport, single-page app with **no scrolling** on the
outer shell. All scroll occurs inside individual panels. The layout stacks
vertically into four horizontal bands, with the middle band split into three
columns.

```
┌────────────────────────────────────────────────────────────────────┐
│  TOP BAR (48 px)                                                    │
├────────────────────────────────────────────────────────────────────┤
│  SUB-HEADER / STATS BAR (36 px)                                     │
├────────────┬──────────────────────────────────┬────────────────────┤
│  LEFT      │                                  │  RIGHT             │
│  PANEL     │       GRAPH CANVAS               │  PANEL             │
│  240 px    │       (flex: 1)                   │  240 px            │
│            │                                  │                    │
│  Controls  │  Interactive SVG graph            │  Actor details     │
│  Actors    │  with dot-grid background         │  Properties        │
│  Events    │                                  │  Connections       │
│  Playback  │                                  │  Actions           │
│            │                                  │                    │
├────────────┴──────────────────────────────────┴────────────────────┤
│  EVENT LOG (200 px, resizable)                                      │
└────────────────────────────────────────────────────────────────────┘
```

**Flex model (outer):** column direction, `height: 100vh`, `overflow: hidden`.

| Band | Height | Flex |
|------|--------|------|
| Top Bar | `48px` | `flex-shrink: 0` |
| Sub-header | `36px` | `flex-shrink: 0` |
| Main (middle) | remaining | `flex: 1; overflow: hidden` |
| Event Log | `200px` default | `flex-shrink: 0` |

**Flex model (main / middle band):** row direction.

| Column | Width | Flex |
|--------|-------|------|
| Left Panel | `240px` | `flex-shrink: 0` |
| Canvas | remaining | `flex: 1` |
| Right Panel | `240px` | `flex-shrink: 0` |

The Event Log has a **drag handle** (or double-click-to-toggle) on its top border allowing the user to resize it between 120 px and 50% of viewport height. A collapse chevron in the toolbar minimises it to toolbar-only (36 px).

---

## 2. Design Tokens & Theming

Theming is driven entirely by CSS custom properties on `:root` (light) and
`.dark` (dark). The application uses Tailwind's `class` strategy for dark mode:
adding/removing the class `dark` on `<html>`.

### Light Mode Tokens (default)

```css
:root {
  /* Surfaces */
  --color-bg:            #F1F5F9;   /* page background */
  --color-surface:       #FFFFFF;   /* panels, cards */
  --color-surface-alt:   #F8FAFC;   /* alternating rows, subtle bg */

  /* Borders */
  --color-border:        #E2E8F0;   /* default border */
  --color-border-strong: #CBD5E1;   /* emphasized borders, idle edges */

  /* Text */
  --color-text:          #0F172A;   /* primary text */
  --color-text-secondary:#475569;   /* section headers, secondary labels */
  --color-text-tertiary: #94A3B8;   /* timestamps, muted labels */

  /* Brand */
  --color-brand:         #0F4C81;   /* top bar, primary buttons */
  --color-brand-light:   #E0F2FE;   /* selected actor highlight */
  --color-brand-dark:    #0C3D66;   /* hover on brand elements */

  /* Semantic Accent Colors (shared in both modes) */
  --color-accent:        #0EA5E9;   /* Client Patient, interactive accent */
  --color-accent-light:  #E0F7FF;
  --color-success:       #059669;   /* CMS Network */
  --color-success-light: #D1FAE5;
  --color-warning:       #D97706;   /* IDP, trust-active flow, encounter */
  --color-warning-light: #FEF3C7;
  --color-danger:        #DC2626;   /* Provider */
  --color-danger-light:  #FEE2E2;
  --color-purple:        #7C3AED;   /* Client Delegated */
  --color-purple-light:  #EDE9FE;
  --color-teal:          #0D9488;   /* Direct channel */
  --color-teal-light:    #CCFBF1;
  --color-orange:        #EA580C;   /* secondary provider accent */
  --color-orange-light:  #FFF7ED;

  /* Canvas */
  --color-canvas-bg:     #F8FAFC;   /* canvas area */
  --color-canvas-dot:    #E2E8F0;   /* dot-grid dots */

  /* Shadows */
  --shadow-sm:  0 1px 2px rgba(0,0,0,.05);
  --shadow-md:  0 4px 6px rgba(0,0,0,.07);
  --shadow-lg:  0 10px 15px rgba(0,0,0,.1);

  /* Radii */
  --radius-sm:  3px;
  --radius-md:  4px;
  --radius-lg:  6px;

  /* Transition */
  --transition-fast: 100ms ease;
  --transition-base: 150ms ease;
}
```

### Dark Mode Tokens

```css
html.dark {
  --color-bg:            #0F172A;
  --color-surface:       #1E293B;
  --color-surface-alt:   #1A2332;

  --color-border:        #334155;
  --color-border-strong: #475569;

  --color-text:          #F1F5F9;
  --color-text-secondary:#94A3B8;
  --color-text-tertiary: #64748B;

  --color-brand:         #1E3A5F;
  --color-brand-light:   #172554;
  --color-brand-dark:    #0F2440;

  --color-accent-light:  rgba(14,165,233,.12);
  --color-success-light: rgba(5,150,105,.12);
  --color-warning-light: rgba(217,119,6,.12);
  --color-danger-light:  rgba(220,38,38,.12);
  --color-purple-light:  rgba(124,58,237,.12);
  --color-teal-light:    rgba(13,148,136,.12);
  --color-orange-light:  rgba(234,88,12,.12);

  --color-canvas-bg:     #131C2E;
  --color-canvas-dot:    #1E293B;

  --shadow-sm:  0 1px 2px rgba(0,0,0,.3);
  --shadow-md:  0 4px 6px rgba(0,0,0,.4);
  --shadow-lg:  0 10px 15px rgba(0,0,0,.5);
}
```

> **Node and edge fill colors** (`--color-accent`, `--color-success`, etc.)
> remain **identical** in both modes. They are already saturated mid-tones that
> read well on both light and dark backgrounds. Only the `*-light` tinted
> backgrounds change to low-opacity overlays in dark mode.

---

## 3. Typography

| Use | Font Stack | Weight | Size | Tracking |
|-----|-----------|--------|------|----------|
| Body / UI | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | 400–700 | — | — |
| Monospace (timestamps, IDs) | `'SF Mono', 'Cascadia Code', 'Fira Code', monospace` | 400–600 | — | — |
| Logo text | body stack | 700 | 14 px | — |
| Nav links | body stack | 500 | 13 px | — |
| Section headers | body stack | 700 | 11 px | `0.05em`, uppercase |
| Actor name (list) | body stack | 600 | 12 px | — |
| Actor subtype (list) | body stack | 400 | 10 px | — |
| Button / chip labels | body stack | 600 | 10–11 px | — |
| Detail property key | body stack | 500 | 12 px | — |
| Detail property value | body stack | 600 | 12 px | — |
| Log table header | body stack | 700 | 10 px | `0.04em`, uppercase |
| Log table cell | body stack | 400 | 11 px | — |
| Log timestamp | mono stack | 400 | 10 px | — |
| Graph node short-ID | body stack | 700 | 10 px | — |
| Graph node label | body stack | 600 | 10 px | — |
| Graph node type | body stack | 400 | 8 px | — |

---

## 4. Top Bar

**Height:** 48 px. **Background:** `var(--color-brand)`.

The top bar always uses the dark-on-brand color scheme regardless of
light/dark mode (white text on navy). In dark mode the brand color shifts
slightly darker (`--color-brand` → `#1E3A5F`) so it remains distinguishable
from the page background.

### Layout (flex row, `align-items: center`)

```
[Logo + Nav]           [Approach Toggle]           [Preset ▾] [Import] [Export] [☀/🌙]
 ← topbar-left          ← topbar-center (flex:1)    ← topbar-right →
```

### Elements

| Element | Component | Spec |
|---------|-----------|------|
| **Logo** | `<div>` with inline SVG icon + text | SVG 22×22, white fill. Text: 14 px / 700 / white. Gap: 10 px. |
| **Nav links** | `<nav>` with `<a>` elements | 13 px / 500. Default: `rgba(255,255,255,.65)`. Hover: `.9`. Active: `#fff` + 2 px bottom border `#fff`. Padding: 12 px 16 px. The nav link bottom border should align with the bottom edge of the top bar. |
| **Approach Toggle** | Segmented control | Background: `rgba(255,255,255,.12)`, `border-radius: 6px`. Buttons: 12 px / 600. Inactive: `rgba(255,255,255,.6)`. Active: `rgba(255,255,255,.2)` bg + `#fff` text. No border between segments. |
| **Preset dropdown** | `<select>` | 12 px, ghost style: 1 px border `rgba(255,255,255,.2)`, bg `rgba(255,255,255,.08)`, text `rgba(255,255,255,.8)`, `border-radius: 4px`. |
| **Import / Export** | Ghost buttons | Same ghost style as preset. Hover: bg `rgba(255,255,255,.1)`. |
| **Theme toggle** | Icon button | Same ghost style. Shows `☀️` in dark mode, `🌙` in light mode. On click toggles `dark` class on `<html>` and persists to `localStorage`. |

---

## 5. Sub-header / Stats Bar

**Height:** 36 px. **Background:** `var(--color-surface)`. **Border-bottom:** 1 px `var(--color-border)`.

### Layout (flex row, space-between)

```
[Breadcrumb text]                                   [stat] [stat] [stat] [stat] [stat]
```

### Breadcrumb

Format: `Simulator > **{Preset Name}** · {Approach} Mode`

- Default text: `var(--color-text-tertiary)`, 12 px.
- `<strong>` segments: `var(--color-text)`.

### Stats Row

Each stat is a small inline badge:

```
[●] 2 Networks   [●] 2 Providers   [●] 2 Clients   [●] 1 IDP   [●] 5 Trust Links
```

| Part | Spec |
|------|------|
| Dot | 8×8 px circle, `border-radius: 50%`, color matches actor type |
| Value | 12 px / 700, `var(--color-text)` |
| Label | 12 px / 400, `var(--color-text-tertiary)` |
| Gap | 6 px within stat, 16 px between stats |

Stats are **live** — they update whenever actors or links are added/removed.

---

## 6. Left Panel — Controls

**Width:** 240 px. **Background:** `var(--color-surface)`. **Border-right:** 1 px `var(--color-border)`. **Overflow-y:** auto (vertical scroll when content exceeds panel height).

The panel is divided into **collapsible sections**, each wrapped in a `<div class="panel-section">` with a `border-bottom`. Sections can be collapsed by clicking the header row.

### 6.1 Section: Actors ({count})

**Header:** `ACTORS (7)` — uppercase, 11 px / 700, `var(--color-text-secondary)`, tracking `0.05em`. Right side: chevron `▾` (rotates to `▸` when collapsed).

**Actor list:** Vertical stack, 2 px gap.

Each **actor item** is a row:

```
[icon 24×24] [name + type]                [✎] [×]
```

| Part | Spec |
|------|------|
| Container | Flex row, `gap: 8px`, `padding: 6px 8px`, `border-radius: 4px`. |
| Icon | 24×24, `border-radius: 4px`, background = actor's semantic color, centered emoji/icon, white. |
| Name | 12 px / 600, `var(--color-text)`. Ellipsis on overflow. |
| Type line | 10 px / 400, `var(--color-text-tertiary)`. Format: `{Type} · {Network Name}` or `{Type}` if no network. |
| Edit / Remove | 20×20 px icon buttons, `opacity: 0` by default, fade in on row hover (`opacity: 1`, transition 150 ms). |
| Hover state | Background: `var(--color-bg)`. |
| Selected state | Background: `var(--color-brand-light)`. Selected state is set by clicking the actor row **or** clicking its node on the canvas — they stay in sync. |

**Add actor chips:** Inline `flex-wrap` row below the list, 4 px gap, 8 px margin-top.

Each chip:
- 10 px / 600, `var(--color-text-tertiary)`.
- Border: 1 px dashed `var(--color-border)`.
- Background: `var(--color-surface-alt)`.
- `border-radius: 4px`, `padding: 3px 8px`.
- Hover: border solid `var(--color-accent)`, text `var(--color-accent)`, bg `var(--color-accent-light)`.
- Clicking a chip opens an **inline form** replacing the chips row: a text input for the actor name and (for client/provider) a dropdown to select the home network. Submit with Enter or a small ✓ button; cancel with Esc or ✕ button.

### 6.2 Section: Trigger Event

**Header:** `TRIGGER EVENT` with chevron.

**Source selector:** `<select>` full-width. Lists all actors that can be an event source. 11 px, 1 px solid border, `border-radius: 4px`, 5 px 6 px padding. Below the select, 8 px margin-bottom.

The available events are context-sensitive based on the selected source actor:

| Source Type | Available Events |
|-------------|-----------------|
| Provider | Encounter Update, New Care Relationship |
| Client App | New Client Registration |
| Network (select two) | New Network Peer |
| Any (appears always) | New Provider Registration |

**Event buttons:** Full-width, stacked, 4 px margin-bottom.

```
[●] Encounter Update
[●] New Care Relationship
─── (thin divider) ───
[●] New Client Registration
[●] New Network Peer
[●] New Provider Registration
```

| Part | Spec |
|------|------|
| Container | `padding: 7px 10px`, `border-radius: 4px`, 1 px solid `var(--color-border)`, bg `var(--color-surface)`. Flex row, `gap: 6px`. |
| Indicator dot | 6×6 px circle, color indicates event category (see table below). |
| Label | 11 px / 600, `var(--color-text)`. |
| Hover | Border: `var(--color-accent)`, bg: `var(--color-accent-light)`. |
| Divider | 1 px top-border `var(--color-border)` with 6 px vertical margin. Separates provider events from global events. |

**Event indicator colors:**

| Event | Color |
|-------|-------|
| Encounter Update | `var(--color-warning)` — amber |
| New Care Relationship | `var(--color-purple)` |
| New Client Registration | `var(--color-accent)` — sky blue |
| New Network Peer | `var(--color-success)` — green |
| New Provider Registration | `var(--color-danger)` — red |

### 6.3 Section: Playback

**Header:** `PLAYBACK` with chevron.

Layout: single flex row.

```
[⏮] [▶/⏸] [⏭]  ═══════○═══════  1.0×
```

| Element | Spec |
|---------|------|
| Skip Back / Step Forward | 24×24 px, `border-radius: 3px`, 1 px border, bg white. Icons: `⏮`, `⏭`. Hover: border `var(--color-accent)`. |
| Play / Pause | Same dimensions. Shows `▶` when stopped, `⏸` when playing. Toggles on click. |
| Speed slider | `<input type="range">`, `min=0.5` `max=5` `step=0.5`, default `1`. Accent color: `var(--color-accent)`. Track height: 4 px. Flex: 1. |
| Speed label | 10 px / 700, `var(--color-accent)`. Displays current multiplier (e.g. `1.0×`, `2.5×`). Min-width 28 px, right-aligned. |

---

## 7. Center — Graph Canvas

The canvas fills all remaining horizontal space. It is the primary visual area.

### Background

- **Color:** `var(--color-canvas-bg)`.
- **Dot grid:** Radial gradient pattern — 1 px dots of `var(--color-canvas-dot)` on a 20×20 px grid. The grid scrolls/scales with canvas pan/zoom.

### React Flow Configuration

The graph is rendered with [React Flow](https://reactflow.dev/) (`@xyflow/react`).

| Setting | Value |
|---------|-------|
| `nodeTypes` | Custom components for each of the 5 actor types |
| `edgeTypes` | Custom components for trust, direct, identity, and active variants |
| `panOnDrag` | `true` |
| `zoomOnScroll` | `true` |
| `zoomOnPinch` | `true` |
| `minZoom` | `0.25` |
| `maxZoom` | `2.5` |
| `defaultViewport` | `{ x: 0, y: 0, zoom: 1 }` |
| `fitView` | `true` on initial load and preset change |
| `snapToGrid` | `true`, 20 px grid (matching dot bg) |
| `connectionMode` | `'loose'` |
| `selectNodesOnDrag` | `false` (we handle selection manually) |

### Canvas Overlays

#### Legend (bottom-left)

Positioned `absolute`, `bottom: 12px`, `left: 12px`.

```
—— Trust Link   ══ Active Flow   - - Direct Channel   ··· Identity Link
```

| Part | Spec |
|------|------|
| Container | `border-radius: 6px`, 1 px border `var(--color-border)`, bg `rgba(255,255,255,.92)` (light) / `rgba(30,41,59,.92)` (dark), `backdrop-filter: blur(4px)`. Padding: 8 px 12 px. Flex row, gap 14 px. |
| Each item | Flex row, gap 4 px. 10 px font, `var(--color-text-secondary)`. |
| Line sample | 20×2 px `<span>`. Solid/dashed/dotted matching edge styles. |

#### Zoom Controls (bottom-right — optional)

If React Flow's built-in controls are insufficient, provide custom buttons:

- `+` (zoom in), `−` (zoom out), `⟳` (fit view).
- Same ghost-button style as playback buttons.
- Stacked vertically, positioned `absolute`, `bottom: 12px`, `right: 12px`.

#### Minimap (top-right — optional)

React Flow's `<MiniMap>` component with:
- `width: 140`, `height: 90`.
- Positioned `absolute`, `top: 12px`, `right: 12px`.
- Semi-transparent bg matching canvas.
- Node colors match actor semantic colors.

---

## 8. Right Panel — Actor Detail

**Width:** 240 px. **Background:** `var(--color-surface)`. **Border-left:** 1 px `var(--color-border)`. **Overflow-y:** auto.

The right panel is **contextual** — its content changes based on the currently selected actor. When no actor is selected, show an empty-state message: *"Click an actor to view details"* in `var(--color-text-tertiary)`, centered.

### Sections (top to bottom)

#### 8.1 Header

- **Actor name:** 14 px / 700, `var(--color-text)`.
- **Type badge:** Inline block below the name. 10 px / 700. Padding: 2 px 8 px. `border-radius: 4px`. Background and text color match the actor's semantic `*-light` / `*` pair (e.g., Network → `--color-success-light` bg, `--color-success` text).
- **Padding:** 12 px. **Border-bottom:** 1 px `var(--color-border)`.

#### 8.2 Properties

Key-value rows, each `display: flex; justify-content: space-between`. Padding: 12 px.

| Row | Key label | Value |
|-----|-----------|-------|
| ID | `ID` | e.g. `network-b` (monospace) |
| Status | `Status` | `● Active` in green (always active in the simulator) |
| Type-specific counts | `Peer count`, `Client count`, `Provider count` | Integer |
| Network (for clients/providers) | `Home Network` | Network name |
| IDP (for clients) | `IDP` | IDP name |

**Key:** 12 px / 500, `var(--color-text-tertiary)`.
**Value:** 12 px / 600, `var(--color-text)`. Right-aligned.
**Row separator:** 1 px `var(--color-bg)` bottom border.

#### 8.3 Connections

- **Sub-header:** `CONNECTIONS` — 11 px / 700, uppercase, `var(--color-text-secondary)`, tracking `0.03em`. Margin-bottom 6 px.
- **Connection items:** Flex rows with:
  - 8×8 px colored square (`border-radius: 2px`), matching the connected actor's semantic color.
  - Actor name, 12 px / 400.
  - Right-aligned role label (`peer`, `client`, `provider`), 10 px, `var(--color-text-tertiary)`.

#### 8.4 Footer (actions)

Padding: 12 px. `border-top: 1px`. Two buttons side by side.

| Button | Style |
|--------|-------|
| **Edit** | Primary: bg `var(--color-brand)`, text white, border `var(--color-brand)`. |
| **Remove** | Danger: bg white, text `var(--color-danger)`, border `var(--color-danger-light)`. Hover bg `var(--color-danger-light)`. |

Both: 11 px / 600, `border-radius: 4px`, padding 6 px, flex: 1.

---

## 9. Bottom — Event Log

**Default height:** 200 px. **Background:** `var(--color-surface)`. **Border-top:** 1 px `var(--color-border)`.

### 9.1 Toolbar

**Height:** 36 px. **Background:** `var(--color-surface-alt)`. **Border-bottom:** 1 px `var(--color-border)`.

```
[Event Log] [Raw Data] [Metrics]                       [Filter ▾] [⤓ Export] [Clear]
```

**Tabs** (left side):
- 11 px / 600, `var(--color-text-tertiary)`.
- Active tab: `var(--color-brand)` text + 2 px bottom border `var(--color-brand)`.
- Padding: 8 px 14 px.

**Tools** (right side):
- Filter `<select>`: 11 px, ghost, `border-radius: 3px`. Options: All Events, Encounter, Care Relationship, Registration.
- Export button: ghost, 11 px. Triggers JSON or CSV download of the current log.
- Clear button: ghost, 11 px. Clears the log after a confirmation tooltip.

### 9.2 Table

Full-width `<table>` with sticky `<thead>`.

| Column | Width | Content | Style |
|--------|-------|---------|-------|
| **Time** | 80 px | Relative timestamp from event trigger, format `MM:SS.mmm` | Monospace, 10 px, `var(--color-text-tertiary)` |
| **Source** | auto | Actor dot + name | Dot: 6×6 px, `border-radius: 2px`, actor color. Name: 11 px / 400. |
| **→** | 20 px | Arrow character | `var(--color-text-tertiary)` |
| **Destination** | auto | Actor dot + name | Same as Source |
| **Message Type** | auto | Pill badge | `border-radius: 3px`, `padding: 2px 6px`, 10 px / 600. Background + text color keyed by event type (see below). |
| **Channel** | 60 px | `trust` or `direct` | 10 px / 600. Trust: `var(--color-warning)`. Direct: `var(--color-teal)`. |
| **Hop** | 50 px | `{current}/{total}` | Monospace, 10 px, `var(--color-text-tertiary)` |

**Header row:** 10 px / 700, uppercase, tracking `0.04em`, `var(--color-text-tertiary)`, bg `var(--color-surface-alt)`, sticky.

**Body rows:**
- Padding: 5 px 12 px per cell.
- Border-bottom: 1 px `var(--color-bg)`.
- Hover: bg `var(--color-surface-alt)`, cursor pointer.
- Click: highlights the corresponding edge on the canvas with a brief flash animation.

**Message type pill colors:**

| Event Category | Pill Background | Pill Text |
|---------------|-----------------|-----------|
| Encounter | `var(--color-warning-light)` | `var(--color-warning)` |
| Care Relationship | `var(--color-purple-light)` | `var(--color-purple)` |
| Client Registration | `var(--color-accent-light)` | `var(--color-accent)` |
| Network Peer | `var(--color-success-light)` | `var(--color-success)` |
| Provider Registration | `var(--color-danger-light)` | `var(--color-danger)` |
| Direct handshake | `var(--color-teal-light)` | `var(--color-teal)` |

### 9.3 Log Tabs

| Tab | Content |
|-----|---------|
| **Event Log** | The notification hop table described above. |
| **Raw Data** | JSON view of the most recent event payload. Monospace, syntax-highlighted. Collapsible tree. |
| **Metrics** | Summary stats for the most recent simulation run: total hops, total time, fan-out factor, number of direct channels established (Direct mode). Simple key-value list. |

---

## 10. Graph Node Specifications

Each actor type renders as a distinct SVG shape. All nodes are custom React Flow node components.

### Common Properties

| Property | Value |
|----------|-------|
| Drag | Enabled (updates position in store) |
| Snap | 20 px grid |
| Selection | Click to select. Updates left-panel highlight and right-panel details. |
| Context menu | Right-click: Edit, Remove, Trigger Event (if applicable). |
| Label positioning | Below the shape, centered. |
| Hover | Slight brightness shift (`filter: brightness(.95)` light / `brightness(1.1)` dark). |

### Per-Type Specs

#### Provider — Diamond

| Property | Value |
|----------|-------|
| Shape | `<polygon>` diamond: `points="0,-22 26,0 0,22 -26,0"` |
| Fill | `var(--color-danger)` — `#DC2626` |
| Inner text | Short ID (e.g. `P1`), 10 px / 700, white, centered |
| Label below | Actor name, 10 px / 600, `var(--color-text)` |
| Sub-label | `Provider`, 8 px / 400, `var(--color-text-tertiary)` |
| Bounding box | ~52×44 px |

#### CMS Network — Circle

| Property | Value |
|----------|-------|
| Shape | `<circle>` with `r="28"` |
| Fill | `var(--color-success)` — `#059669` |
| Inner text | Short ID (e.g. `N-A`), 10 px / 700, white, centered |
| Label below | Actor name, 10 px / 600, y-offset +40 from center |
| Bounding box | 56×56 px |

#### Client App (Patient) — Rounded Rectangle

| Property | Value |
|----------|-------|
| Shape | `<rect>` with `width="64" height="36" rx="6"`, centered at node position |
| Fill | `var(--color-accent)` — `#0EA5E9` |
| Inner text | Short ID (e.g. `CA-1`), 10 px / 700, white, centered |
| Label below | Actor name, 10 px / 600, y-offset +30 |
| Sub-label | `Patient`, 8 px, y-offset +40 |
| Bounding box | 64×36 px |

#### Client App (Delegated) — Rounded Rectangle

| Property | Value |
|----------|-------|
| Shape | Identical to Patient |
| Fill | `var(--color-purple)` — `#7C3AED` |
| Sub-label | `Delegated` |

#### IDP — Hexagon

| Property | Value |
|----------|-------|
| Shape | `<polygon>` hexagon: `points="0,-18 16,-9 16,9 0,18 -16,9 -16,-9"` |
| Fill | `var(--color-warning)` — `#D97706` |
| Inner text | `IDP`, 8 px / 700, white, centered |
| Label below | Actor name, 10 px / 600, y-offset +28 |
| Bounding box | ~32×36 px |

---

## 11. Graph Edge Specifications

Edges connect actor nodes along trust/direct/identity relationships. Each edge type has a custom React Flow edge component.

### Edge Types

| Type Key | Use | Stroke | Width | Dash | Color |
|----------|-----|--------|-------|------|-------|
| `trust` | Idle trust link | Solid | 2 px | none | `var(--color-border-strong)` |
| `trust-active` | Trust link carrying a notification | Solid | 2.5 px | none | `var(--color-warning)` |
| `direct` | Established direct channel (idle) | Dashed | 2 px | `6 4` | `var(--color-teal)` |
| `direct-active` | Direct channel carrying data | Dashed | 2.5 px | `6 4` | `var(--color-teal)`, brighter |
| `identity` | Client ↔ IDP link | Dotted | 1.5 px | `3 3` | `var(--color-warning)`, `opacity: 0.3` |

All edges: `fill: none`, `stroke-linecap: round`.

### Edge Labels

Edges do not carry permanent labels. During an active animation, a small tooltip-like label can briefly appear at the edge midpoint showing the message type (e.g., `encounter-relay`). This label fades after 1 second.

---

## 12. Animations

### 12.1 Traveling Dot

When a notification traverses an edge:

1. A small circle (the **traveling dot**) appears at the source end of the edge.
2. It animates along the edge path to the destination over a duration determined by the playback speed.
3. On arrival, it disappears.

| Property | Value |
|----------|-------|
| Shape | `<circle>` with `r="4"` |
| Fill | Same as the active edge color (warning for trust, teal for direct) |
| Duration | `500ms / playbackSpeed` per hop (default 500 ms at 1×) |
| Easing | `ease-in-out` |
| Implementation | SVG `<animateMotion>` along edge path, or Framer Motion `motion.circle` with `pathLength` |

### 12.2 Node Glow Ring

When a node receives a notification:

1. A ring expands outward from the node and fades.
2. Plays once, duration 800 ms.

| Property | Value |
|----------|-------|
| Shape | `<circle>` concentric with node, `fill: none` |
| Stroke | 2 px, same color as the edge delivering the notification |
| Animation | `r` from node radius to node radius + 18. `opacity` from 0.6 to 0. `ease-out`. |
| Trigger | Starts when the traveling dot reaches this node. |

### 12.3 Fan-out

When a network fans a notification out to multiple downstream edges:

- All downstream traveling dots start **simultaneously** (same timestamp).
- The glow ring plays once on the source node.
- Each destination gets its own glow ring on arrival (may be at different times if edge lengths differ visually, but logically simultaneous — keep durations consistent).

### 12.4 Direct Channel Appearance (Direct Approach)

When a direct channel is established:

1. A dashed edge "draws in" from the provider toward the client using a
   `stroke-dashoffset` animation (line appears to grow from one end).
2. Duration: 400 ms.
3. Once fully drawn, both endpoints pulse briefly.

### 12.5 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- Traveling dots are replaced by instant edge color change (flash to active color for 300 ms, then revert).
- Glow rings are replaced by a brief opacity pulse on the node (0.6 → 1 → 0.6, 300 ms).
- No `<animateMotion>`.

---

## 13. Interactions

### 13.1 Selecting Actors

| Trigger | Result |
|---------|--------|
| Click node on canvas | Node becomes selected. Left-panel row highlights (brand-light bg). Right panel shows details. |
| Click actor row in left panel | Same as above, plus canvas pans/zooms to center the node. |
| Click empty canvas area | Deselects current actor. Right panel shows empty state. |
| Keyboard: Tab / Arrow keys | Cycles through actors in left panel list. |
| Keyboard: Enter on focused actor | Selects it. |

### 13.2 Adding Actors

| Step | UI |
|------|----|
| 1. Click a `+ {Type}` chip | Chip row collapses; an inline form appears in its place. |
| 2. Fill in name + network (if applicable) | Name: text input, auto-focused. Network: dropdown (only if type is client or provider). |
| 3. Submit | Press Enter or click ✓. New actor appears on canvas at a default position (near its home network, or canvas center if network-less). Added to left-panel list. Form collapses back to chips. |
| 4. Cancel | Press Escape or click ✕. Form collapses back to chips, no actor created. |

### 13.3 Removing Actors

| Trigger | Result |
|---------|--------|
| Click ✕ on actor row (hover-revealed) | Confirmation tooltip: "Remove {name}?" with [Remove] [Cancel]. |
| Click "Remove" in right-panel footer | Same confirmation. |
| Right-click node → Remove | Same. |
| Confirm removal | Actor removed from store. Its node and all connected edges disappear from canvas. Left panel and stats bar update. If the removed actor was selected, right panel shows empty state. |

### 13.4 Creating Trust Links

Two modes:

**Mode A — Drag-to-connect (React Flow handles):**
Each node has a connection handle. Dragging from one handle to another creates a trust edge (validated by the rules below).

**Mode B — Click-to-link:**
A link-mode toggle could be added to the left panel. When active, clicking two nodes in sequence creates a link between them.

**Validation rules:**

| From | To | Allowed? | Edge Type |
|------|----|----------|-----------|
| Client | Network | ✅ | trust |
| Provider | Network | ✅ | trust |
| Network | Network | ✅ | trust (peer) |
| Client | IDP | ✅ | identity |
| Provider | Provider | ❌ | — |
| Client | Client | ❌ | — |
| Client | Provider | ❌ | — |
| Provider | IDP | ❌ | — |
| Network | IDP | ❌ | — |

Invalid connections show a brief red flash / tooltip explaining why.

### 13.5 Triggering Events

1. Select a source actor in the "Trigger Event" section dropdown.
2. Click an event button.
3. The simulation engine computes the notification path (see `proposal/event-flows.md`).
4. The playback system begins animating the hops.
5. Each hop is logged to the Event Log table.

### 13.6 Approach Toggle

Clicking the inactive approach button (`Routed` ↔ `Direct`):

1. Switches the simulation engine.
2. If an animation is in progress, it stops and resets.
3. The event log clears (or optionally keeps history with a mode separator).
4. Direct channels are shown/hidden on the canvas.
5. The breadcrumb updates to reflect the new mode.

### 13.7 Preset Loading

Selecting a preset from the dropdown:

1. Replaces the entire graph (after confirmation if the current graph has been modified).
2. Calls `fitView()` to center the new graph.
3. Clears the event log.
4. Updates the breadcrumb and stats bar.

---

## 14. Light / Dark Mode

### Toggle Mechanism

- **Trigger:** The `☀/🌙` button in the top bar's right section.
- **Implementation:** Toggles the CSS class `dark` on the `<html>` element.
- **Persistence:** The user's preference is saved to `localStorage` under key `theme`. On load, the app checks:
  1. `localStorage.getItem('theme')` — if `'dark'`, apply `dark` class.
  2. Else, check `window.matchMedia('(prefers-color-scheme: dark)')` — if matches, apply `dark` class.
  3. Else, use light mode (no `dark` class).

### Icon State

| Mode | Icon shown | Meaning |
|------|-----------|---------|
| Light (default) | 🌙 | "Click to switch to dark" |
| Dark | ☀️ | "Click to switch to light" |

### Transition

Apply `transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease` on `body`, panels, and the canvas to avoid a jarring flash when toggling.

### What Changes

| Element | Light | Dark |
|---------|-------|------|
| Page background | `#F1F5F9` | `#0F172A` |
| Panel backgrounds | `#FFFFFF` | `#1E293B` |
| Canvas background | `#F8FAFC` | `#131C2E` |
| Canvas dots | `#E2E8F0` | `#1E293B` |
| Borders | `#E2E8F0` | `#334155` |
| Primary text | `#0F172A` | `#F1F5F9` |
| Top bar background | `#0F4C81` | `#1E3A5F` |
| Legend / minimap bg | `rgba(255,255,255,.92)` | `rgba(30,41,59,.92)` |
| Table alt-row bg | `#F8FAFC` | `#1A2332` |
| `*-light` badge bgs | Opaque tints (e.g. `#D1FAE5`) | Semi-transparent (e.g. `rgba(5,150,105,.12)`) |
| **Node fill colors** | **No change** | **No change** |
| **Edge stroke colors** | **No change** | **No change** |
| **Animation colors** | **No change** | **No change** |

The accent / semantic colors (danger, success, accent, purple, warning, teal) are **mode-invariant**. This ensures the graph nodes and edges are always visually consistent and recognisable regardless of mode.

---

## 15. Responsive Breakpoints

| Breakpoint | Layout Change |
|-----------|---------------|
| **≥ 1280 px** (desktop) | Full three-column layout as described. All panels visible. |
| **960–1279 px** (small desktop) | Right panel collapses to a slide-over drawer, triggered by selecting an actor. Left panel shrinks to 200 px. |
| **768–959 px** (tablet) | Left panel becomes a slide-over drawer (hamburger toggle in top bar). Right panel is also a drawer. Canvas takes full width. Event log shrinks to 150 px. |
| **< 768 px** (mobile) | Canvas full-screen. Top bar condenses (logo only, hamburger menu for nav). All panels are bottom-sheet overlays. Event log accessible via a tab at the bottom. Approach toggle moves into the hamburger menu. |

Panel drawers slide in from their respective sides with a 200 ms ease transition and a semi-transparent backdrop.

---

## 16. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| **Keyboard navigation** | All interactive elements (buttons, selects, actor list items, table rows) are focusable via Tab. Actor list supports Arrow key navigation. Escape closes any open drawer/form. |
| **Focus indicators** | 2 px `var(--color-accent)` outline with 2 px offset on `:focus-visible`. |
| **ARIA labels** | `role="application"` on canvas container. Each graph node has `aria-label="{Name} ({Type})"`. Edge descriptions via `aria-label` on SVG groups. Log table has proper `<th scope="col">`. |
| **Screen reader announcements** | When an event is triggered: `aria-live="polite"` region announces "Simulating {event type} from {actor}". When animation completes: "Notification delivered to {N} recipients in {hops} hops". |
| **Color independence** | Actor types are distinguished by **shape** (diamond, circle, rectangle, hexagon) in addition to color. Edge types are distinguished by stroke style (solid, dashed, dotted) in addition to color. |
| **Contrast** | All text meets WCAG 2.1 AA minimum contrast (4.5:1 for normal text, 3:1 for large text and UI components) in both light and dark modes. |
| **Reduced motion** | See [§12.5](#125-reduced-motion). All animations respect `prefers-reduced-motion`. |

---

## 17. Overview Page

The Overview page (`/`) is a scrollable content page. It uses the same top bar (with "Overview" as the active nav link) but replaces the three-column layout with a single centered content column.

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  TOP BAR (same as simulator, "Overview" active)                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │  max-width: 960 px, centered, padding: 40px 24px         │      │
│   │                                                          │      │
│   │  HERO                                                    │      │
│   │  Title: "CMS FHIR Subscription Notification Simulator"   │      │
│   │  Subtitle paragraph (2-3 sentences)                      │      │
│   │                                                          │      │
│   │  ┌─────────────────┐  ┌─────────────────┐               │      │
│   │  │  ROUTED CARD    │  │  DIRECT CARD    │               │      │
│   │  │  Static diagram │  │  Static diagram │               │      │
│   │  │  Description    │  │  Description    │               │      │
│   │  │  Pros / Cons    │  │  Pros / Cons    │               │      │
│   │  │  [Try it →]     │  │  [Try it →]     │               │      │
│   │  └─────────────────┘  └─────────────────┘               │      │
│   │                                                          │      │
│   │  COMPARISON TABLE                                        │      │
│   │  (side-by-side Routed vs Direct)                         │      │
│   │                                                          │      │
│   │  ACTOR TYPES                                             │      │
│   │  [Diamond] Provider     [Circle] Network                 │      │
│   │  [Rect] Client Patient  [Rect] Client Delegated          │      │
│   │  [Hex] IDP                                               │      │
│   │                                                          │      │
│   └──────────────────────────────────────────────────────────┘      │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### Approach Cards

Two cards in a 2-column grid (1-column on mobile). Each card:

- **Border:** 1 px `var(--color-border)`, `border-radius: 6px`.
- **Static diagram:** A simplified SVG showing the notification path for that approach. Not interactive — purely illustrative.
- **Description:** 2-3 paragraphs.
- **Pros / Cons:** Two-column list with ✅ and ⚠️ icons.
- **CTA button:** "Try it →". Links to `/simulator?approach=routed` or `/simulator?approach=direct`. Styled as a primary button (brand bg, white text).

### Comparison Table

Standard HTML `<table>` with:

| Aspect | Routed | Direct |
|--------|--------|--------|
| Encounter notification latency | Higher (multi-hop) | Low (direct) |
| Discovery notification latency | Multi-hop | Multi-hop (same) |
| Network load | High (all traffic) | Low (discovery only) |
| Endpoint complexity | Simple | Complex |
| Connection count | O(N + E) | O(P × C) |
| Failure impact | Network failure severs traffic | Only blocks discovery |
| Privacy | Strong (mediated) | Weaker (direct) |

### Actor Types Section

A grid of 5 cards (3 + 2 on desktop, 2 + 2 + 1 on tablet, 1 column on mobile). Each card shows:

- The SVG shape (matching the graph node) at ~48 px scale.
- Actor type name, 14 px / 700.
- One-sentence description.
- Trust relationship summary (e.g., "Connects to exactly one CMS Network").
