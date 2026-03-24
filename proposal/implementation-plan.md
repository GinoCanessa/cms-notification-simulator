# Implementation Plan

## Phase Overview

| Phase | Name | Description |
|-------|------|-------------|
| 1 | **Foundation** | Project setup, types, stores, basic routing |
| 2 | **Graph Editor** | Interactive graph canvas with all actor types and trust links |
| 3 | **Simulation Engine** | Path computation, routed engine, direct engine |
| 4 | **Event Animation** | Animated notification flows on the graph |
| 5 | **Event Log** | Bottom panel log with filtering and export |
| 6 | **Overview Page** | Educational content and static diagrams |
| 7 | **Polish** | Presets, persistence, accessibility, responsive design |

---

## Phase 1: Foundation

### Deliverables
- Vite + React + TypeScript project initialized
- Tailwind CSS configured with dark mode
- React Router with Overview and Simulator routes
- Core type definitions (`Actor`, `TrustEdge`, `DirectChannel`, `SimulationEvent`, `LogEntry`)
- Zustand stores (GraphStore, SimulationStore, EventLogStore) with basic actions
- Layout shell (TopBar, page containers)
- Light/dark mode toggle

### Tasks
1. Initialize project with `npm create vite@latest` (React + TypeScript)
2. Install dependencies: `react-router-dom`, `zustand`, `tailwindcss`, `@xyflow/react`, `framer-motion`, `lucide-react`
3. Configure Tailwind with dark mode (`class` strategy)
4. Define TypeScript interfaces in `src/types/`
5. Implement Zustand stores in `src/stores/`
6. Build `Layout.tsx` and `TopBar.tsx` with navigation and theme toggle
7. Set up routes: `/` (Overview) and `/simulator` (Simulator)

---

## Phase 2: Graph Editor

### Deliverables
- Interactive graph canvas using React Flow
- Custom node components for all 5 actor types (distinct shapes, colors, icons)
- Custom edge components for trust, direct, and identity links
- Add actor functionality (sidebar buttons + form)
- Remove actor functionality
- Link mode: click two actors to create/remove a trust edge
- Drag to reposition nodes
- Zoom and pan
- Selected actor details panel

### Tasks
1. Build custom node components in `src/components/graph/nodes/`
2. Build custom edge components in `src/components/graph/edges/`
3. Implement `GraphCanvas.tsx` wrapping React Flow with custom types
4. Build `AddActorForm.tsx` — form for creating actors with appropriate fields
5. Build `ActorDetails.tsx` — shows info for selected actor
6. Implement link mode toggle and click-to-link logic
7. Add validation rules (e.g., clients can't link to providers directly, providers link to exactly one network)
8. Wire all interactions to GraphStore

---

## Phase 3: Simulation Engine

### Deliverables
- `PathFinder` module: BFS traversal, reachability, shortest path
- `RoutedEngine`: computes full hop sequence for all event types
- `DirectEngine`: computes discovery flow + direct channel establishment
- Unit tests for all engines with various graph topologies

### Tasks
1. Implement `PathFinder.ts` with BFS-based graph traversal
2. Implement `RoutedEngine.ts`:
   - Encounter update flow
   - New care relationship flow
   - New client registration flow
   - New network peer flow (bilateral fan-out)
   - Loop prevention (visited set)
3. Implement `DirectEngine.ts`:
   - Discovery flow (same as routed)
   - Direct channel establishment step
   - Encounter flow via existing direct channels
   - Fallback to routed when no direct channel exists
4. Write unit tests for edge cases:
   - Disconnected graphs
   - Single-hop topologies
   - Deep chains (many network hops)
   - Fan-out scenarios (many clients/providers)
   - Cycle prevention

---

## Phase 4: Event Animation

### Deliverables
- Animated dot traveling along edges during notification flow
- Node pulse/glow on notification receipt
- Sequential animation with configurable delay per hop
- Parallel animation for fan-out
- Playback controls: speed, pause, step, reset
- Edge highlighting during active flow
- Direct channel appearance animation (in Direct mode)

### Tasks
1. Build `TravelingDot.tsx` — SVG animated element following edge path
2. Build `PulseAnimation.tsx` — node glow/scale animation
3. Integrate animation into edge types (`trust-active`, `direct-active`)
4. Build animation scheduler in `SimulationStore`:
   - Queue of `NotificationHop` items
   - Timer-based playback respecting speed setting
   - Support for parallel hops (fan-out)
5. Build `PlaybackControls.tsx` — speed slider, pause/play, step, reset buttons
6. Implement `TriggerEventForm.tsx` — dropdown to select actor + event type
7. Wire trigger → engine → animation → log pipeline

---

## Phase 5: Event Log

### Deliverables
- Bottom panel with scrollable log
- Each entry shows: timestamp, from, to, message type, channel, hop count
- Filter by event type, actor, channel
- Click a log entry to highlight the corresponding edge
- Clear and export (JSON/CSV) buttons
- Collapsible panel

### Tasks
1. Build `EventLog.tsx` component
2. Implement log entry formatting with actor icons and colors
3. Implement filtering UI and logic
4. Implement click-to-highlight: clicking a log entry triggers the corresponding edge animation
5. Implement export to JSON and CSV
6. Add collapse/expand toggle
7. Add virtual scrolling for performance (if needed)

---

## Phase 6: Overview Page

### Deliverables
- Hero section with title and introduction
- Two approach cards with static diagrams, descriptions, pros/cons
- Comparison table
- Actor types section with icons and descriptions
- "Try it" buttons linking to simulator with pre-configured approach

### Tasks
1. Build `OverviewPage.tsx` layout
2. Build `ApproachCard.tsx` with static SVG/diagram for each approach
3. Build `ComparisonTable.tsx` 
4. Build `ActorTypeSection.tsx` with all 5 actor types
5. Write content for all sections
6. Link "Try it" buttons to `/simulator?approach=routed` and `/simulator?approach=direct`

---

## Phase 7: Polish

### Deliverables
- Preset scenario topologies (Simple, Two Networks, Hub & Spoke, Complex)
- localStorage persistence (auto-save/restore graph)
- URL state for approach and preset
- Export/import graph as JSON
- Responsive design for tablet and mobile
- Accessibility audit and fixes
- `prefers-reduced-motion` support
- Keyboard navigation for graph interactions

### Tasks
1. Define preset topologies in `src/presets/`
2. Build `PresetSelector.tsx` dropdown
3. Implement localStorage auto-save in GraphStore
4. Implement URL state sync for approach and preset
5. Build export/import graph dialog
6. Test and adjust responsive breakpoints
7. Accessibility pass: ARIA labels, keyboard focus, contrast
8. Add `prefers-reduced-motion` media query to disable/reduce animations
9. End-to-end testing of all flows

---

## Dependencies Between Phases

```
Phase 1 (Foundation)
    │
    ├──▶ Phase 2 (Graph Editor) ──▶ Phase 4 (Animation) ──┐
    │                                                       │
    ├──▶ Phase 3 (Simulation Engine) ──────────────────────┤
    │                                                       │
    │                                                       ▼
    │                                            Phase 5 (Event Log)
    │
    └──▶ Phase 6 (Overview Page)
    
    All phases ──▶ Phase 7 (Polish)
```

Phases 2, 3, and 6 can be developed in parallel after Phase 1 is complete. Phase 4 requires both Phases 2 and 3. Phase 5 requires Phase 4. Phase 7 is the final pass.
