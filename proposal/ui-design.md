# UI Design

## Page Structure

The application consists of two primary views:

1. **Overview Page** — Educational content describing the two notification models.
2. **Simulator Page** — Interactive graph editor and event simulator.

Navigation is via a top bar or sidebar with two entries.

---

## Overview Page

### Purpose
Provide a clear, accessible explanation of the Routed and Direct approaches before the user enters the interactive simulator.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Nav: Overview | Simulator]                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Hero Section                                            │    │
│  │  "CMS FHIR Subscription Notification Simulator"          │    │
│  │  Brief intro paragraph                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │  Routed Approach      │  │  Direct Approach      │            │
│  │                        │  │                        │            │
│  │  [Static diagram]     │  │  [Static diagram]     │            │
│  │                        │  │                        │            │
│  │  Description text      │  │  Description text      │            │
│  │                        │  │                        │            │
│  │  Pros / Cons           │  │  Pros / Cons           │            │
│  │                        │  │                        │            │
│  │  [Try it →]            │  │  [Try it →]            │            │
│  └──────────────────────┘  └──────────────────────────┘            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Comparison Table                                        │    │
│  │  Side-by-side feature comparison                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Actor Types Section                                     │    │
│  │  Icon + description for each actor type                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Content Sections

1. **Hero** — Title, tagline, 2-3 sentence introduction.
2. **Approach Cards** — Two side-by-side cards, each with a static network diagram, explanation, pros/cons, and a "Try it" button linking to the simulator pre-configured with that approach.
3. **Comparison Table** — Latency, complexity, scalability, privacy, failure modes.
4. **Actor Types** — Icon, name, description, trust relationships for each of the 5 actor types.

---

## Simulator Page

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Nav: Overview | Simulator]     [Approach: Routed ◉ | Direct ○]      │
├──────────────────────────────────┬─────────────────────────────────────┤
│                                  │  CONTROLS PANEL (right sidebar)     │
│                                  │                                     │
│  GRAPH CANVAS                    │  ┌──────────────────────────┐      │
│  (interactive network graph)     │  │  Add Actor               │      │
│                                  │  │  [+ Client Patient]      │      │
│                                  │  │  [+ Client Delegated]    │      │
│      ┌───┐        ┌───┐         │  │  [+ IDP]                 │      │
│      │ P1├────────┤N-A│         │  │  [+ Network]             │      │
│      └───┘        └─┬─┘         │  │  [+ Provider]            │      │
│                     │            │  └──────────────────────────┘      │
│              ┌──────┤            │                                     │
│              │      │            │  ┌──────────────────────────┐      │
│           ┌──┴──┐ ┌─┴──┐        │  │  Trust Links             │      │
│           │ N-B │ │CA-1│        │  │  Click two actors to     │      │
│           └──┬──┘ └────┘        │  │  create/remove a link    │      │
│              │                   │  └──────────────────────────┘      │
│           ┌──┴──┐                │                                     │
│           │ P2  │                │  ┌──────────────────────────┐      │
│           └─────┘                │  │  Trigger Event           │      │
│                                  │  │  ──────────────────────  │      │
│                                  │  │  Select Provider: [▼]    │      │
│                                  │  │  [🔔 Encounter Update]  │      │
│                                  │  │  [🤝 New Care Rel.]     │      │
│                                  │  │  ──────────────────────  │      │
│                                  │  │  [📋 New Client Reg.]   │      │
│                                  │  │  [🔗 New Network Peer]  │      │
│                                  │  └──────────────────────────┘      │
│                                  │                                     │
│                                  │  ┌──────────────────────────┐      │
│                                  │  │  Selected Actor Details   │      │
│                                  │  │  Name: Provider-1         │      │
│                                  │  │  Type: Provider            │      │
│                                  │  │  Network: Network-A        │      │
│                                  │  │  [✏️ Edit] [🗑️ Remove]  │      │
│                                  │  └──────────────────────────┘      │
├──────────────────────────────────┴─────────────────────────────────────┤
│  EVENT LOG (bottom panel, collapsible)                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [Filter: All ▼] [Clear]                            [Expand ↑]  │  │
│  │                                                                   │  │
│  │  12:00:00.123  Provider-1 → Network-A    encounter-notification  │  │
│  │  12:00:00.234  Network-A  → Client-1     encounter-notification  │  │
│  │  12:00:00.345  Network-A  → Network-B    encounter-notif-relay   │  │
│  │  12:00:00.456  Network-B  → Client-2     encounter-notification  │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Top Bar
- **Navigation**: Overview / Simulator tabs.
- **Approach Toggle**: Radio buttons or segmented control to switch between Routed and Direct. Switching triggers a re-simulation of any active event to show the difference.

#### 2. Graph Canvas (Main Area)

The centerpiece of the simulator—a force-directed or hierarchical graph rendered on an HTML5 Canvas or SVG.

**Node Rendering:**

| Actor Type | Shape | Color | Icon |
|-----------|-------|-------|------|
| Client App (Patient) | Rounded rectangle | Blue (`#3B82F6`) | 👤 |
| Client App (Delegated) | Rounded rectangle | Indigo (`#6366F1`) | 👥 |
| IDP | Hexagon | Amber (`#F59E0B`) | 🔑 |
| CMS Network | Circle | Green (`#10B981`) | 🌐 |
| Provider | Diamond | Rose (`#F43F5E`) | 🏥 |

**Edge Rendering:**

| Edge Type | Style | Color |
|-----------|-------|-------|
| Trust link (idle) | Solid, thin | Gray (`#9CA3AF`) |
| Trust link (active notification) | Solid, thick, animated pulse | Orange (`#F97316`) |
| Direct channel (idle) | Dashed, thin | Teal (`#14B8A6`) |
| Direct channel (active notification) | Dashed, thick, animated pulse | Cyan (`#06B6D4`) |
| IDP trust (identity only) | Dotted, thin | Amber (`#F59E0B`) |

**Interactions:**
- **Click** a node to select it (shows details in sidebar).
- **Drag** a node to reposition it.
- **Double-click** canvas to add a node (or use sidebar buttons).
- **Right-click** a node for context menu (edit, remove, trigger event).
- **Click two nodes** in "Link Mode" to create/remove a trust edge.
- **Scroll/pinch** to zoom; **drag canvas** to pan.

**Animation:**
When an event is triggered, animated dots travel along the notification path:
- Each hop has a configurable delay (default: 500ms) so the user can see the sequential nature.
- Multiple concurrent paths animate simultaneously (fan-out is visual).
- Nodes briefly "pulse" when they receive a notification.
- In Direct mode, the direct channel establishment is shown as a distinct handshake animation.

#### 3. Controls Panel (Right Sidebar)

**Add Actor Section:**
- Buttons for each actor type.
- Clicking opens a small form: name, and (for Client/Provider) which network to assign.
- New actor appears on the canvas.

**Trust Links Section:**
- Toggle "Link Mode" on/off.
- When on, clicking two actors creates (or removes) a trust link between them.
- Invalid links are rejected with a tooltip (e.g., "Clients cannot link directly to Providers").

**Trigger Event Section:**
- **Provider Events:** Select a provider from a dropdown, then click "Encounter Update" or "New Care Relationship."
- **Client Events:** Select a client, then click "New Client Registration."
- **Network Events:** Select two networks, then click "New Network Peer."
- **Playback Controls:** Speed slider (0.5×–5×), Pause, Step Forward, Reset.

**Selected Actor Details:**
- Shows properties of the currently selected actor.
- Edit and Remove buttons.

#### 4. Event Log (Bottom Panel)

A scrollable, time-ordered list of every notification hop.

**Columns:**
| Column | Description |
|--------|-------------|
| Timestamp | Relative time from event trigger |
| From | Source actor (icon + name) |
| To | Destination actor (icon + name) |
| Message Type | e.g., `encounter-notification`, `direct-channel-handshake` |
| Channel | `trust` or `direct` |
| Hop | Current hop / total hops |

**Features:**
- **Filter** by event type, actor, channel type.
- **Click** a log entry to highlight the corresponding edge on the canvas.
- **Clear** button to reset the log.
- **Export** button to download log as JSON or CSV.
- **Collapsible** — can be minimized to give more space to the canvas.

---

## Responsive Design

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1280px) | Three-column: canvas + sidebar + bottom log |
| Tablet (768–1279px) | Canvas full-width; sidebar collapses to a floating panel; log as an overlay |
| Mobile (<768px) | Canvas full-screen with floating action buttons; sidebar and log accessible via bottom sheet |

---

## Light/Dark Mode

The application supports both modes, toggled via a button in the top bar.

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | White (`#FFFFFF`) | Slate-900 (`#0F172A`) |
| Canvas background | Gray-50 (`#F9FAFB`) | Slate-800 (`#1E293B`) |
| Node labels | Gray-900 | White |
| Edges (idle) | Gray-400 | Gray-600 |
| Panel backgrounds | White | Slate-850 |
| Text | Gray-800 | Gray-200 |

Node and edge accent colors remain consistent across modes for clarity.

---

## Accessibility

- All interactive elements are keyboard-navigable.
- Nodes and edges have ARIA labels.
- Color is never the sole indicator of state—shapes and patterns differentiate actor types.
- Animation can be paused; motion preferences are respected (`prefers-reduced-motion`).
- Event log entries are screen-reader friendly with semantic HTML.
- Minimum contrast ratio of 4.5:1 for text, 3:1 for graphical elements.

---

## Preset Scenarios

The simulator includes preset topologies that users can load:

| Preset | Description |
|--------|-------------|
| **Simple** | 1 IDP, 1 Network, 1 Provider, 1 Client |
| **Two Networks** | 1 IDP, 2 peered Networks, 2 Providers, 2 Clients |
| **Hub & Spoke** | 1 central Network peered with 3 satellite Networks, Providers and Clients distributed |
| **Complex** | 2 IDPs, 4 Networks in a mesh, 6 Providers, 4 Clients |
| **Empty** | Blank canvas |

Presets are accessible from a dropdown in the top bar.
