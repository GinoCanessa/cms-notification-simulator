import type { SimulationEvent, NotificationHop, MessageType, DirectChannel } from '../types';
import type { GraphState } from './PathFinder';
import { computeRoutedFlow } from './RoutedEngine';
import { findReachableClients, findReachableProviders, findClientIdp } from './PathFinder';

let hopCounter = 1000;

function makeDirectHop(
  eventId: string,
  step: number,
  fromId: string,
  toId: string,
  messageType: MessageType,
  timestamp: number,
  parallelGroup?: number,
  channel: 'trust' | 'direct' = 'direct',
): NotificationHop {
  return {
    id: `dhop-${++hopCounter}`,
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

/** Collect unique IDP IDs for a set of clients */
function getUniqueIdps(clientIds: string[], graph: GraphState): string[] {
  const seen = new Set<string>();
  for (const clientId of clientIds) {
    const idpId = findClientIdp(clientId, graph);
    if (idpId) seen.add(idpId);
  }
  return Array.from(seen);
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
        const ts = 0;
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
      const paths = findReachableClients(event.sourceActorId, graph);
      let step = routedHops.length > 0 ? routedHops[routedHops.length - 1].step + 1 : 1;
      let ts = routedHops.length > 0 ? routedHops[routedHops.length - 1].timestamp + 500 : 0;

      // Phase 1: Clients send handshake to provider
      const handshakeGroup = step;
      const clientIds: string[] = [];
      for (const path of paths) {
        const clientId = path.actorIds[path.actorIds.length - 1];
        clientIds.push(clientId);
        routedHops.push(makeDirectHop(event.id, step, clientId, event.sourceActorId, 'direct-channel-handshake', ts, handshakeGroup));
      }
      step++;
      ts += 500;

      // Phase 2: Provider verifies identity with each unique IDP
      const idpIds = getUniqueIdps(clientIds, graph);
      if (idpIds.length > 0) {
        const verifyGroup = step;
        for (const idpId of idpIds) {
          routedHops.push(makeDirectHop(event.id, step, event.sourceActorId, idpId, 'idp-identity-verification', ts, verifyGroup, 'trust'));
        }
        step++;
        ts += 500;
        const confirmIdpGroup = step;
        for (const idpId of idpIds) {
          routedHops.push(makeDirectHop(event.id, step, idpId, event.sourceActorId, 'idp-identity-confirmed', ts, confirmIdpGroup, 'trust'));
        }
        step++;
        ts += 500;
      }

      // Phase 3: Provider confirms direct channel to all clients
      const confirmGroup = step;
      for (const clientId of clientIds) {
        routedHops.push(makeDirectHop(event.id, step, event.sourceActorId, clientId, 'direct-channel-confirm', ts, confirmGroup));
      }
      return routedHops;
    }

    case 'new-client-registration':{
      const routedHops = computeRoutedFlow(event, graph);
      const paths = findReachableProviders(event.sourceActorId, graph);
      let step = routedHops.length > 0 ? routedHops[routedHops.length - 1].step + 1 : 1;
      let ts = routedHops.length > 0 ? routedHops[routedHops.length - 1].timestamp + 500 : 0;

      // Phase 1: Providers verify identity of new client with its IDP
      const idpIds = getUniqueIdps([event.sourceActorId], graph);
      const providerIds: string[] = [];
      for (const path of paths) {
        providerIds.push(path.actorIds[path.actorIds.length - 1]);
      }
      if (idpIds.length > 0 && providerIds.length > 0) {
        const verifyGroup = step;
        for (const providerId of providerIds) {
          for (const idpId of idpIds) {
            routedHops.push(makeDirectHop(event.id, step, providerId, idpId, 'idp-identity-verification', ts, verifyGroup, 'trust'));
          }
        }
        step++;
        ts += 500;
        const confirmIdpGroup = step;
        for (const providerId of providerIds) {
          for (const idpId of idpIds) {
            routedHops.push(makeDirectHop(event.id, step, idpId, providerId, 'idp-identity-confirmed', ts, confirmIdpGroup, 'trust'));
          }
        }
        step++;
        ts += 500;
      }

      // Phase 2: Providers send handshake to client
      const handshakeGroup = step;
      for (const providerId of providerIds) {
        routedHops.push(makeDirectHop(event.id, step, providerId, event.sourceActorId, 'direct-channel-handshake', ts, handshakeGroup));
      }
      step++;
      ts += 500;

      // Phase 3: Client confirms to all providers
      const confirmGroup = step;
      for (const providerId of providerIds) {
        routedHops.push(makeDirectHop(event.id, step, event.sourceActorId, providerId, 'direct-channel-confirm', ts, confirmGroup));
      }
      return routedHops;
    }

    case 'new-provider-registration': {
      const routedHops = computeRoutedFlow(event, graph);
      const paths = findReachableClients(event.sourceActorId, graph);
      let step = routedHops.length > 0 ? routedHops[routedHops.length - 1].step + 1 : 1;
      let ts = routedHops.length > 0 ? routedHops[routedHops.length - 1].timestamp + 500 : 0;

      // Phase 1: Clients send handshake to new provider
      const handshakeGroup = step;
      const clientIds: string[] = [];
      for (const path of paths) {
        const clientId = path.actorIds[path.actorIds.length - 1];
        clientIds.push(clientId);
        routedHops.push(makeDirectHop(event.id, step, clientId, event.sourceActorId, 'direct-channel-handshake', ts, handshakeGroup));
      }
      step++;
      ts += 500;

      // Phase 2: Provider verifies identity with each unique IDP
      const idpIds = getUniqueIdps(clientIds, graph);
      if (idpIds.length > 0) {
        const verifyGroup = step;
        for (const idpId of idpIds) {
          routedHops.push(makeDirectHop(event.id, step, event.sourceActorId, idpId, 'idp-identity-verification', ts, verifyGroup, 'trust'));
        }
        step++;
        ts += 500;
        const confirmIdpGroup = step;
        for (const idpId of idpIds) {
          routedHops.push(makeDirectHop(event.id, step, idpId, event.sourceActorId, 'idp-identity-confirmed', ts, confirmIdpGroup, 'trust'));
        }
        step++;
        ts += 500;
      }

      // Phase 3: Provider confirms direct channel to all clients
      const confirmGroup = step;
      for (const clientId of clientIds) {
        routedHops.push(makeDirectHop(event.id, step, event.sourceActorId, clientId, 'direct-channel-confirm', ts, confirmGroup));
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
