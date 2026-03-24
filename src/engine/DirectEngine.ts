import type { SimulationEvent, NotificationHop, DirectChannel } from '../types';
import type { GraphState } from './PathFinder';
import { computeRoutedFlow } from './RoutedEngine';
import { findReachableClients, findReachableProviders } from './PathFinder';

let hopCounter = 1000;

function makeDirectHop(
  eventId: string,
  step: number,
  fromId: string,
  toId: string,
  messageType: 'direct-channel-handshake' | 'direct-channel-confirm' | 'encounter-notification',
  timestamp: number,
  parallelGroup?: number,
): NotificationHop {
  return {
    id: `dhop-${++hopCounter}`,
    eventId,
    step,
    fromId,
    toId,
    messageType,
    channel: 'direct',
    timestamp,
    parallelGroup,
  };
}

export function computeDirectFlow(
  event: SimulationEvent,
  graph: GraphState,
  existingChannels: DirectChannel[],
): NotificationHop[] {
  hopCounter = 1000;

  switch (event.type) {
    case 'encounter-update': {
      // If direct channels exist, use them
      const providerChannels = existingChannels.filter(
        (c) => c.providerId === event.sourceActorId,
      );
      if (providerChannels.length > 0) {
        let step = 1;
        let ts = 0;
        const parallelGroup = 1;
        return providerChannels.map((ch) =>
          makeDirectHop(event.id, step++, ch.providerId, ch.clientId, 'encounter-notification', ts, parallelGroup),
        );
      }
      // Fall back to routed
      return computeRoutedFlow(event, graph);
    }

    case 'new-care-relationship': {
      // Discovery flows through trust graph (same as routed)
      const routedHops = computeRoutedFlow(event, graph);
      // Client receives notification and requests a direct channel from the provider
      const paths = findReachableClients(event.sourceActorId, graph);
      let step = routedHops.length > 0 ? routedHops[routedHops.length - 1].step + 1 : 1;
      let ts = routedHops.length > 0 ? routedHops[routedHops.length - 1].timestamp + 500 : 0;
      const handshakeGroup = step;

      for (const path of paths) {
        const clientId = path.actorIds[path.actorIds.length - 1];
        routedHops.push(makeDirectHop(event.id, step, clientId, event.sourceActorId, 'direct-channel-handshake', ts, handshakeGroup));
        step++;
        ts += 300;
      }
      return routedHops;
    }

    case 'new-client-registration': {
      const routedHops = computeRoutedFlow(event, graph);
      const paths = findReachableProviders(event.sourceActorId, graph);
      let step = routedHops.length > 0 ? routedHops[routedHops.length - 1].step + 1 : 1;
      let ts = routedHops.length > 0 ? routedHops[routedHops.length - 1].timestamp + 500 : 0;
      const handshakeGroup = step;

      for (const path of paths) {
        const providerId = path.actorIds[path.actorIds.length - 1];
        routedHops.push(makeDirectHop(event.id, step, providerId, event.sourceActorId, 'direct-channel-handshake', ts, handshakeGroup));
        step++;
        ts += 300;
        routedHops.push(makeDirectHop(event.id, step, event.sourceActorId, providerId, 'direct-channel-confirm', ts, handshakeGroup + 50));
        step++;
        ts += 300;
      }
      return routedHops;
    }

    case 'new-provider-registration': {
      const routedHops = computeRoutedFlow(event, graph);
      // Client receives notification and requests a direct channel from the provider
      const paths = findReachableClients(event.sourceActorId, graph);
      let step = routedHops.length > 0 ? routedHops[routedHops.length - 1].step + 1 : 1;
      let ts = routedHops.length > 0 ? routedHops[routedHops.length - 1].timestamp + 500 : 0;
      const handshakeGroup = step;

      for (const path of paths) {
        const clientId = path.actorIds[path.actorIds.length - 1];
        routedHops.push(makeDirectHop(event.id, step, clientId, event.sourceActorId, 'direct-channel-handshake', ts, handshakeGroup));
        step++;
        ts += 300;
      }
      return routedHops;
    }

    case 'new-network-peer': {
      // Same as routed, then establish direct channels
      const routedHops = computeRoutedFlow(event, graph);
      // After discovery, clients establish direct channels with newly discovered providers
      // This is complex — simplified version: find all providers on one side and clients on the other
      if (!event.targetActorId) return routedHops;

      // We'll add handshake hops for illustration
      return routedHops;
    }

    case 'actor-removal': {
      const routedHops = computeRoutedFlow(event, graph);
      // Add close-direct-channel hops for existing channels
      const relevantChannels = existingChannels.filter(
        (c) => c.providerId === event.sourceActorId || c.clientId === event.sourceActorId,
      );
      let step = routedHops.length > 0 ? routedHops[routedHops.length - 1].step + 1 : 1;
      let ts = routedHops.length > 0 ? routedHops[routedHops.length - 1].timestamp + 500 : 0;

      for (const ch of relevantChannels) {
        const otherId = ch.providerId === event.sourceActorId ? ch.clientId : ch.providerId;
        routedHops.push({
          id: `dhop-${++hopCounter}`,
          eventId: event.id,
          step: step++,
          fromId: otherId,
          toId: otherId,
          messageType: 'close-direct-channel',
          channel: 'direct',
          timestamp: ts,
        });
        ts += 200;
      }
      return routedHops;
    }

    default:
      return computeRoutedFlow(event, graph);
  }
}

export function getNewDirectChannels(
  event: SimulationEvent,
  graph: GraphState,
): DirectChannel[] {
  const sourceActor = graph.actors.get(event.sourceActorId);
  if (!sourceActor) return [];

  const channels: DirectChannel[] = [];
  const now = Date.now();

  if (event.type === 'new-care-relationship' || event.type === 'new-provider-registration') {
    if (sourceActor.type !== 'provider') return [];
    const paths = findReachableClients(event.sourceActorId, graph);
    for (const path of paths) {
      const clientId = path.actorIds[path.actorIds.length - 1];
      channels.push({
        id: `dc-${event.sourceActorId}-${clientId}`,
        providerId: event.sourceActorId,
        clientId,
        establishedAt: now,
      });
    }
  }

  if (event.type === 'new-client-registration') {
    if (sourceActor.type !== 'client-patient' && sourceActor.type !== 'client-delegated') return [];
    const paths = findReachableProviders(event.sourceActorId, graph);
    for (const path of paths) {
      const providerId = path.actorIds[path.actorIds.length - 1];
      channels.push({
        id: `dc-${providerId}-${event.sourceActorId}`,
        providerId,
        clientId: event.sourceActorId,
        establishedAt: now,
      });
    }
  }

  return channels;
}
