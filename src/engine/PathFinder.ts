import type { Actor, TrustEdge } from '../types';

export interface GraphState {
  actors: Map<string, Actor>;
  edges: Map<string, TrustEdge>;
}

export interface Path {
  actorIds: string[];
  edgeIds: string[];
}

function getRoutingEdges(edges: Map<string, TrustEdge>): TrustEdge[] {
  return Array.from(edges.values()).filter((e) => e.edgeType !== 'identity');
}

function getNeighbors(actorId: string, edges: TrustEdge[]): { neighborId: string; edgeId: string }[] {
  const result: { neighborId: string; edgeId: string }[] = [];
  for (const edge of edges) {
    if (edge.sourceId === actorId) result.push({ neighborId: edge.targetId, edgeId: edge.id });
    else if (edge.targetId === actorId) result.push({ neighborId: edge.sourceId, edgeId: edge.id });
  }
  return result;
}

export function findReachableClients(providerId: string, graph: GraphState): Path[] {
  const routingEdges = getRoutingEdges(graph.edges);
  const provider = graph.actors.get(providerId);
  if (!provider || provider.type !== 'provider') return [];

  const paths: Path[] = [];
  const visited = new Set<string>();

  function bfs(startId: string): void {
    const queue: { actorId: string; path: string[]; edgePath: string[] }[] = [];
    queue.push({ actorId: startId, path: [startId], edgePath: [] });
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const actor = graph.actors.get(current.actorId);
      if (!actor) continue;

      if (
        (actor.type === 'client-patient' || actor.type === 'client-delegated') &&
        current.actorId !== providerId
      ) {
        paths.push({ actorIds: current.path, edgeIds: current.edgePath });
        continue; // don't traverse past clients
      }

      for (const { neighborId, edgeId } of getNeighbors(current.actorId, routingEdges)) {
        if (!visited.has(neighborId)) {
          const neighbor = graph.actors.get(neighborId);
          if (!neighbor) continue;
          // Only traverse through networks, or reach clients
          if (
            neighbor.type === 'network' ||
            neighbor.type === 'client-patient' ||
            neighbor.type === 'client-delegated'
          ) {
            visited.add(neighborId);
            queue.push({
              actorId: neighborId,
              path: [...current.path, neighborId],
              edgePath: [...current.edgePath, edgeId],
            });
          }
        }
      }
    }
  }

  bfs(providerId);
  return paths;
}

export function findReachableProviders(clientId: string, graph: GraphState): Path[] {
  const routingEdges = getRoutingEdges(graph.edges);
  const client = graph.actors.get(clientId);
  if (!client || (client.type !== 'client-patient' && client.type !== 'client-delegated')) return [];

  const paths: Path[] = [];
  const visited = new Set<string>();

  function bfs(startId: string): void {
    const queue: { actorId: string; path: string[]; edgePath: string[] }[] = [];
    queue.push({ actorId: startId, path: [startId], edgePath: [] });
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const actor = graph.actors.get(current.actorId);
      if (!actor) continue;

      if (actor.type === 'provider' && current.actorId !== clientId) {
        paths.push({ actorIds: current.path, edgeIds: current.edgePath });
        continue;
      }

      for (const { neighborId, edgeId } of getNeighbors(current.actorId, routingEdges)) {
        if (!visited.has(neighborId)) {
          const neighbor = graph.actors.get(neighborId);
          if (!neighbor) continue;
          if (neighbor.type === 'network' || neighbor.type === 'provider') {
            visited.add(neighborId);
            queue.push({
              actorId: neighborId,
              path: [...current.path, neighborId],
              edgePath: [...current.edgePath, edgeId],
            });
          }
        }
      }
    }
  }

  bfs(clientId);
  return paths;
}

export function shortestPath(fromId: string, toId: string, graph: GraphState): Path | null {
  const routingEdges = getRoutingEdges(graph.edges);
  const visited = new Set<string>();
  const queue: { actorId: string; path: string[]; edgePath: string[] }[] = [];
  queue.push({ actorId: fromId, path: [fromId], edgePath: [] });
  visited.add(fromId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.actorId === toId) {
      return { actorIds: current.path, edgeIds: current.edgePath };
    }

    for (const { neighborId, edgeId } of getNeighbors(current.actorId, routingEdges)) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({
          actorId: neighborId,
          path: [...current.path, neighborId],
          edgePath: [...current.edgePath, edgeId],
        });
      }
    }
  }

  return null;
}

export function getReachableNetworks(networkId: string, graph: GraphState): string[] {
  const routingEdges = getRoutingEdges(graph.edges);
  const visited = new Set<string>();
  const result: string[] = [];
  const queue: string[] = [networkId];
  visited.add(networkId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const { neighborId } of getNeighbors(current, routingEdges)) {
      const neighbor = graph.actors.get(neighborId);
      if (neighbor && neighbor.type === 'network' && !visited.has(neighborId)) {
        visited.add(neighborId);
        result.push(neighborId);
        queue.push(neighborId);
      }
    }
  }

  return result;
}

export function getActorsOnNetwork(
  networkId: string,
  graph: GraphState,
  type?: 'provider' | 'client-patient' | 'client-delegated'
): Actor[] {
  const routingEdges = getRoutingEdges(graph.edges);
  const result: Actor[] = [];
  for (const { neighborId } of getNeighbors(networkId, routingEdges)) {
    const actor = graph.actors.get(neighborId);
    if (!actor) continue;
    if (type) {
      if (actor.type === type) result.push(actor);
    } else if (actor.type !== 'network') {
      result.push(actor);
    }
  }
  return result;
}

export function getClientsOnNetwork(networkId: string, graph: GraphState): Actor[] {
  const routingEdges = getRoutingEdges(graph.edges);
  const result: Actor[] = [];
  for (const { neighborId } of getNeighbors(networkId, routingEdges)) {
    const actor = graph.actors.get(neighborId);
    if (actor && (actor.type === 'client-patient' || actor.type === 'client-delegated')) {
      result.push(actor);
    }
  }
  return result;
}

export function getProvidersOnNetwork(networkId: string, graph: GraphState): Actor[] {
  const routingEdges = getRoutingEdges(graph.edges);
  const result: Actor[] = [];
  for (const { neighborId } of getNeighbors(networkId, routingEdges)) {
    const actor = graph.actors.get(neighborId);
    if (actor && actor.type === 'provider') {
      result.push(actor);
    }
  }
  return result;
}

export function getPeerNetworks(networkId: string, graph: GraphState): Actor[] {
  const routingEdges = getRoutingEdges(graph.edges);
  const result: Actor[] = [];
  for (const { neighborId } of getNeighbors(networkId, routingEdges)) {
    const actor = graph.actors.get(neighborId);
    if (actor && actor.type === 'network') {
      result.push(actor);
    }
  }
  return result;
}

export function findEdgeBetween(
  actorA: string,
  actorB: string,
  edges: Map<string, TrustEdge>
): TrustEdge | undefined {
  for (const edge of edges.values()) {
    if (
      (edge.sourceId === actorA && edge.targetId === actorB) ||
      (edge.sourceId === actorB && edge.targetId === actorA)
    ) {
      return edge;
    }
  }
  return undefined;
}
