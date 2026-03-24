import type { SimulationEvent, NotificationHop, MessageType } from '../types';
import {
  type GraphState,
  getClientsOnNetwork,
  getProvidersOnNetwork,
  getPeerNetworks,
} from './PathFinder';

let hopCounter = 0;

function makeHop(
  eventId: string,
  step: number,
  fromId: string,
  toId: string,
  messageType: MessageType,
  channel: 'trust' | 'direct',
  timestamp: number,
  parallelGroup?: number,
): NotificationHop {
  return {
    id: `hop-${++hopCounter}`,
    eventId,
    step,
    fromId,
    toId,
    messageType,
    channel,
    timestamp,
    parallelGroup,
  };
}

function fanOutFromNetwork(
  networkId: string,
  graph: GraphState,
  eventId: string,
  visited: Set<string>,
  step: { value: number },
  timestamp: { value: number },
  clientMsg: MessageType,
  relayMsg: MessageType,
  providerMsg?: MessageType,
): NotificationHop[] {
  const hops: NotificationHop[] = [];
  const parallelGroup = step.value;

  // Deliver to local clients
  const clients = getClientsOnNetwork(networkId, graph);
  for (const client of clients) {
    if (!visited.has(client.id)) {
      hops.push(makeHop(eventId, step.value, networkId, client.id, clientMsg, 'trust', timestamp.value, parallelGroup));
    }
  }

  // Deliver to local providers if applicable
  if (providerMsg) {
    const providers = getProvidersOnNetwork(networkId, graph);
    for (const provider of providers) {
      if (!visited.has(provider.id)) {
        hops.push(makeHop(eventId, step.value, networkId, provider.id, providerMsg, 'trust', timestamp.value, parallelGroup));
      }
    }
  }

  step.value++;
  timestamp.value += 500;

  // Relay to peer networks
  const peers = getPeerNetworks(networkId, graph);
  for (const peer of peers) {
    if (!visited.has(peer.id)) {
      visited.add(peer.id);
      hops.push(makeHop(eventId, step.value, networkId, peer.id, relayMsg, 'trust', timestamp.value, parallelGroup + 100));
      step.value++;
      timestamp.value += 500;
      hops.push(...fanOutFromNetwork(peer.id, graph, eventId, visited, step, timestamp, clientMsg, relayMsg, providerMsg));
    }
  }

  return hops;
}

export function computeRoutedFlow(event: SimulationEvent, graph: GraphState): NotificationHop[] {
  hopCounter = 0;
  const hops: NotificationHop[] = [];
  const step = { value: 1 };
  const timestamp = { value: 0 };

  const sourceActor = graph.actors.get(event.sourceActorId);
  if (!sourceActor) return [];

  switch (event.type) {
    case 'encounter-update':
    case 'new-care-relationship': {
      if (sourceActor.type !== 'provider') return [];
      const networkEdge = findProviderNetwork(event.sourceActorId, graph);
      if (!networkEdge) return [];

      const msgType: MessageType = event.type === 'encounter-update' ? 'encounter-notification' : 'new-care-relationship';
      const relayType: MessageType = event.type === 'encounter-update' ? 'encounter-notification-relay' : 'new-care-relationship-relay';

      hops.push(makeHop(event.id, step.value, event.sourceActorId, networkEdge, msgType, 'trust', timestamp.value));
      step.value++;
      timestamp.value += 500;

      const visited = new Set<string>([event.sourceActorId, networkEdge]);
      hops.push(...fanOutFromNetwork(networkEdge, graph, event.id, visited, step, timestamp, msgType, relayType));
      break;
    }

    case 'new-client-registration': {
      if (sourceActor.type !== 'client-patient' && sourceActor.type !== 'client-delegated') return [];
      const networkId = findClientNetwork(event.sourceActorId, graph);
      if (!networkId) return [];

      hops.push(makeHop(event.id, step.value, event.sourceActorId, networkId, 'client-registration', 'trust', timestamp.value));
      step.value++;
      timestamp.value += 500;

      const visited = new Set<string>([event.sourceActorId, networkId]);
      hops.push(...fanOutFromNetwork(networkId, graph, event.id, visited, step, timestamp, 'new-subscriber-notification', 'new-subscriber-relay', 'new-subscriber-notification'));
      break;
    }

    case 'new-provider-registration': {
      if (sourceActor.type !== 'provider') return [];
      const networkId = findProviderNetwork(event.sourceActorId, graph);
      if (!networkId) return [];

      hops.push(makeHop(event.id, step.value, event.sourceActorId, networkId, 'provider-registration', 'trust', timestamp.value));
      step.value++;
      timestamp.value += 500;

      const visited = new Set<string>([event.sourceActorId, networkId]);
      hops.push(...fanOutFromNetwork(networkId, graph, event.id, visited, step, timestamp, 'new-provider-available', 'new-provider-relay'));
      break;
    }

    case 'new-network-peer': {
      if (!event.targetActorId) return [];
      const networkA = event.sourceActorId;
      const networkB = event.targetActorId;

      // Phase A: Network-A shares with Network-B's ecosystem
      hops.push(makeHop(event.id, step.value, networkA, networkB, 'provider-catalog-share', 'trust', timestamp.value));
      step.value++;
      timestamp.value += 500;

      const visitedA = new Set<string>([networkA, networkB]);
      hops.push(...fanOutFromNetwork(networkB, graph, event.id, visitedA, step, timestamp, 'new-providers-available', 'new-providers-available-relay'));

      // Phase B: Network-B shares with Network-A's ecosystem
      hops.push(makeHop(event.id, step.value, networkB, networkA, 'provider-catalog-share', 'trust', timestamp.value));
      step.value++;
      timestamp.value += 500;

      const visitedB = new Set<string>([networkA, networkB]);
      hops.push(...fanOutFromNetwork(networkA, graph, event.id, visitedB, step, timestamp, 'new-providers-available', 'new-providers-available-relay'));
      break;
    }

    case 'actor-removal': {
      // Simplified: fan out removal notifications
      if (sourceActor.type === 'provider') {
        const networkId = findProviderNetwork(event.sourceActorId, graph);
        if (!networkId) return [];
        const visited = new Set<string>([event.sourceActorId, networkId]);
        hops.push(...fanOutFromNetwork(networkId, graph, event.id, visited, step, timestamp, 'provider-removed', 'provider-removed-relay'));
      } else if (sourceActor.type === 'client-patient' || sourceActor.type === 'client-delegated') {
        const networkId = findClientNetwork(event.sourceActorId, graph);
        if (!networkId) return [];
        const visited = new Set<string>([event.sourceActorId, networkId]);
        hops.push(...fanOutFromNetwork(networkId, graph, event.id, visited, step, timestamp, 'client-removed', 'client-removed-relay'));
      }
      break;
    }
  }

  return hops;
}

function findProviderNetwork(providerId: string, graph: GraphState): string | null {
  for (const edge of graph.edges.values()) {
    if (edge.edgeType === 'identity') continue;
    if (edge.sourceId === providerId) {
      const target = graph.actors.get(edge.targetId);
      if (target?.type === 'network') return edge.targetId;
    }
    if (edge.targetId === providerId) {
      const source = graph.actors.get(edge.sourceId);
      if (source?.type === 'network') return edge.sourceId;
    }
  }
  return null;
}

function findClientNetwork(clientId: string, graph: GraphState): string | null {
  for (const edge of graph.edges.values()) {
    if (edge.edgeType === 'identity') continue;
    if (edge.sourceId === clientId) {
      const target = graph.actors.get(edge.targetId);
      if (target?.type === 'network') return edge.targetId;
    }
    if (edge.targetId === clientId) {
      const source = graph.actors.get(edge.sourceId);
      if (source?.type === 'network') return edge.sourceId;
    }
  }
  return null;
}

export { findProviderNetwork, findClientNetwork };
