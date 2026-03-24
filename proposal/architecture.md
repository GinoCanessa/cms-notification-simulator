# Technical Architecture

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | React 18+ with TypeScript | Per project preferences; strong ecosystem for interactive UIs |
| **Build Tool** | Vite | Fast dev server, excellent TypeScript support |
| **Graph Rendering** | React Flow (reactflow) | Purpose-built for interactive node/edge graphs in React; supports custom nodes, edges, animations, and minimap |
| **State Management** | Zustand | Lightweight, TypeScript-friendly, works well with React Flow |
| **Styling** | Tailwind CSS | Utility-first, responsive, dark mode support built-in |
| **Animation** | Framer Motion + CSS animations | Smooth notification pulse animations on graph edges |
| **Routing** | React Router v6 | Standard routing for Overview/Simulator pages |
| **Testing** | Vitest + React Testing Library | Fast unit/integration testing |
| **Icons** | Lucide React | Clean, consistent iconography |

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          React Application                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Routing Layer (React Router)                                  │  │
│  │  /            → Overview Page                                  │  │
│  │  /simulator   → Simulator Page                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  UI Layer                                                      │  │
│  │  ┌──────────┐ ┌────────────┐ ┌─────────┐ ┌──────────────┐    │  │
│  │  │ TopBar   │ │ GraphCanvas│ │Controls │ │  EventLog    │    │  │
│  │  └──────────┘ └────────────┘ └─────────┘ └──────────────┘    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  State Layer (Zustand Stores)                                  │  │
│  │  ┌─────────────┐ ┌────────────────┐ ┌──────────────────┐     │  │
│  │  │ GraphStore  │ │ SimulationStore│ │ EventLogStore    │     │  │
│  │  │ (actors,    │ │ (approach,     │ │ (log entries,    │     │  │
│  │  │  edges,     │ │  animation     │ │  filters)        │     │  │
│  │  │  positions) │ │  state, speed) │ │                  │     │  │
│  │  └─────────────┘ └────────────────┘ └──────────────────┘     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Simulation Engine                                             │  │
│  │  ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐     │  │
│  │  │ PathFinder    │ │RoutedEngine  │ │ DirectEngine     │     │  │
│  │  │ (BFS, graph   │ │(relay logic, │ │(discovery +      │     │  │
│  │  │  traversal)   │ │ fan-out)     │ │ direct channels) │     │  │
│  │  └───────────────┘ └──────────────┘ └──────────────────┘     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Modules

### GraphStore (Zustand)

Manages the network topology:

```typescript
interface GraphStore {
  // Actors
  actors: Map<string, Actor>;
  addActor: (actor: Actor) => void;
  removeActor: (id: string) => void;
  updateActor: (id: string, updates: Partial<Actor>) => void;

  // Trust Links
  edges: Map<string, TrustEdge>;
  addEdge: (edge: TrustEdge) => void;
  removeEdge: (id: string) => void;

  // Direct Channels (Direct Approach)
  directChannels: Map<string, DirectChannel>;
  addDirectChannel: (channel: DirectChannel) => void;
  removeDirectChannel: (id: string) => void;

  // Presets
  loadPreset: (presetId: string) => void;
  clearGraph: () => void;
}
```

### SimulationStore (Zustand)

Manages simulation state:

```typescript
interface SimulationStore {
  approach: 'routed' | 'direct';
  setApproach: (approach: 'routed' | 'direct') => void;

  // Animation
  speed: number;
  isPlaying: boolean;
  activeAnimations: Animation[];
  
  // Event triggering
  triggerEvent: (event: SimulationEvent) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stepForward: () => void;
}
```

### Simulation Engine

The core logic that computes notification paths and schedules animations.

#### PathFinder

```typescript
class PathFinder {
  // Find all reachable clients from a provider (BFS through networks)
  findReachableClients(providerId: string, graph: GraphState): Path[];
  
  // Find all reachable providers from a client (BFS through networks)
  findReachableProviders(clientId: string, graph: GraphState): Path[];
  
  // Find shortest path between two actors
  shortestPath(fromId: string, toId: string, graph: GraphState): Path | null;
  
  // Get all peered networks reachable from a network
  getReachableNetworks(networkId: string, graph: GraphState): string[];
}
```

#### RoutedEngine

```typescript
class RoutedEngine {
  // Generate the full sequence of notification hops for an event
  computeNotificationFlow(event: SimulationEvent, graph: GraphState): NotificationHop[];
}
```

#### DirectEngine

```typescript
class DirectEngine {
  // Generate discovery + channel establishment flow
  computeNotificationFlow(
    event: SimulationEvent, 
    graph: GraphState,
    existingChannels: DirectChannel[]
  ): NotificationHop[];
}
```

### EventLogStore (Zustand)

```typescript
interface EventLogStore {
  entries: LogEntry[];
  filters: LogFilters;
  addEntry: (entry: LogEntry) => void;
  clearLog: () => void;
  setFilter: (filters: Partial<LogFilters>) => void;
  exportLog: (format: 'json' | 'csv') => void;
}
```

---

## React Flow Integration

React Flow is the graph rendering library. We use it with:

### Custom Node Types

Each actor type gets a custom React Flow node component:

```typescript
const nodeTypes = {
  'client-patient': ClientPatientNode,
  'client-delegated': ClientDelegatedNode,
  'idp': IdpNode,
  'network': NetworkNode,
  'provider': ProviderNode,
};
```

Each custom node renders the appropriate shape (rectangle, hexagon, circle, diamond) with icon, label, and pulse animation support.

### Custom Edge Types

```typescript
const edgeTypes = {
  'trust': TrustEdge,          // Solid line
  'trust-active': ActiveTrustEdge,  // Animated pulse
  'direct': DirectEdge,        // Dashed line
  'direct-active': ActiveDirectEdge, // Animated dashed pulse
  'identity': IdentityEdge,    // Dotted line
};
```

### Animation Strategy

When a notification flows along an edge:

1. The edge type changes from `trust` to `trust-active`.
2. An SVG `<circle>` element animates along the edge path using `<animateMotion>` or Framer Motion.
3. The destination node plays a brief "pulse" animation (scale up + glow).
4. After the animation completes, the edge reverts to `trust`.
5. The next hop begins (with a configurable delay).

For fan-out, multiple edges animate simultaneously.

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx
│   │   └── Layout.tsx
│   ├── overview/
│   │   ├── OverviewPage.tsx
│   │   ├── ApproachCard.tsx
│   │   ├── ComparisonTable.tsx
│   │   └── ActorTypeSection.tsx
│   ├── simulator/
│   │   ├── SimulatorPage.tsx
│   │   ├── GraphCanvas.tsx
│   │   ├── ControlsPanel.tsx
│   │   ├── EventLog.tsx
│   │   ├── AddActorForm.tsx
│   │   ├── TriggerEventForm.tsx
│   │   ├── ActorDetails.tsx
│   │   └── PlaybackControls.tsx
│   ├── graph/
│   │   ├── nodes/
│   │   │   ├── ClientPatientNode.tsx
│   │   │   ├── ClientDelegatedNode.tsx
│   │   │   ├── IdpNode.tsx
│   │   │   ├── NetworkNode.tsx
│   │   │   └── ProviderNode.tsx
│   │   ├── edges/
│   │   │   ├── TrustEdge.tsx
│   │   │   ├── DirectEdge.tsx
│   │   │   ├── IdentityEdge.tsx
│   │   │   └── AnimatedEdge.tsx
│   │   └── animations/
│   │       ├── PulseAnimation.tsx
│   │       └── TravelingDot.tsx
│   └── shared/
│       ├── ThemeToggle.tsx
│       └── PresetSelector.tsx
├── engine/
│   ├── PathFinder.ts
│   ├── RoutedEngine.ts
│   ├── DirectEngine.ts
│   └── types.ts
├── stores/
│   ├── graphStore.ts
│   ├── simulationStore.ts
│   └── eventLogStore.ts
├── presets/
│   ├── simple.ts
│   ├── twoNetworks.ts
│   ├── hubAndSpoke.ts
│   └── complex.ts
├── types/
│   ├── actor.ts
│   ├── edge.ts
│   ├── event.ts
│   └── log.ts
├── utils/
│   ├── graphUtils.ts
│   └── exportUtils.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Data Persistence

The simulator is **client-side only** — no backend is required. State can optionally be persisted to:

- **localStorage** — Auto-save the current graph topology and settings.
- **URL state** — Encode the selected preset and approach in the URL for sharing.
- **Export/Import** — Users can export the full graph state as JSON and re-import it later.

---

## Performance Considerations

- **React Flow** handles rendering optimization internally (viewport culling, node memoization).
- **Animation scheduling** uses `requestAnimationFrame` for smooth 60fps animations.
- **Large graphs** (50+ nodes): Use React Flow's minimap and viewport controls. The simulation engine uses BFS (O(V+E)) which is efficient for graphs of this scale.
- **Event log** uses virtual scrolling (e.g., `react-virtual`) if the list exceeds 100 entries.
