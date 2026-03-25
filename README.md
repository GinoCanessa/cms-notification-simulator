# CMS Notification Simulator

An interactive simulator for visualizing FHIR Subscription notification delivery across a federated healthcare network. It models how notifications flow between providers, CMS networks, client applications, and identity providers using two approaches: **Routed** (hop-by-hop through trust relationships) and **Direct** (point-to-point channels established after discovery).

## Features

- **Interactive graph canvas** — drag, connect, and inspect actors (providers, networks, clients, IDPs) on a React Flow–powered canvas
- **Routed vs Direct simulation** — compare notification delivery strategies side-by-side with animated message hops
- **Preset topologies** — load built-in network layouts (simple, two-network, hub-and-spoke, complex) or build your own
- **Event log & metrics** — filterable event log with JSON/CSV export and delivery statistics
- **Import / Export** — save and load graph topologies as JSON
- **Dark mode** — toggle between light and dark themes

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Graph Visualization | @xyflow/react |
| State Management | Zustand |
| Routing | React Router DOM 7 |
| Icons | Lucide React |
| Animation | Framer Motion |
| Linting | ESLint with typescript-eslint |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (included with Node.js)

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

This starts the Vite dev server with hot module replacement. Open the URL shown in the terminal (typically [http://localhost:5173](http://localhost:5173)).

### Build for production

```bash
npm run build
```

Compiles TypeScript and produces an optimized bundle in the `dist/` directory.

### Preview the production build

```bash
npm run preview
```

Serves the contents of `dist/` locally so you can verify the production build.

### Lint

```bash
npm run lint
```

Runs ESLint across the project.

## Project Structure

```
src/
├── components/
│   ├── graph/
│   │   ├── edges/         # Custom React Flow edge types (Trust, Direct, Identity)
│   │   └── nodes/         # Custom React Flow node types (Provider, Network, Client, IDP)
│   ├── layout/            # Layout shell, top bar, sub-header
│   ├── overview/          # Landing / educational page
│   └── simulator/         # Simulator page, controls, graph canvas, event log, actor details
├── engine/
│   ├── DirectEngine.ts    # Direct-channel notification routing logic
│   ├── PathFinder.ts      # BFS/graph traversal utilities
│   └── RoutedEngine.ts    # Routed notification routing logic
├── presets/               # Built-in network topology presets
├── stores/                # Zustand stores (graph, simulation, event log)
├── types/                 # TypeScript type definitions (actors, edges, events, logs)
└── utils/                 # Export utilities (JSON, CSV)
proposal/                  # Design documents and specifications
```

## Usage

1. Open the app and explore the **Overview** page to learn about routed vs direct notification approaches.
2. Navigate to the **Simulator** page — a default two-network topology is loaded automatically.
3. Use the **Controls Panel** to trigger events, switch between Routed and Direct modes, adjust playback speed, or run a comparison loop.
4. Click any actor on the graph to view its details and connections.
5. Use the **Event Log** at the bottom to inspect message flows, filter by type, or export logs.
