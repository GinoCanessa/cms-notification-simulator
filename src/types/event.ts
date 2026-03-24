export type EventType =
  | 'encounter-update'
  | 'new-care-relationship'
  | 'new-client-registration'
  | 'new-network-peer'
  | 'new-provider-registration'
  | 'actor-removal';

export interface SimulationEvent {
  id: string;
  type: EventType;
  sourceActorId: string;
  targetActorId?: string; // for network peer events
  timestamp: number;
}

export type MessageType =
  | 'encounter-notification'
  | 'encounter-notification-relay'
  | 'new-care-relationship'
  | 'new-care-relationship-relay'
  | 'client-registration'
  | 'new-subscriber-notification'
  | 'new-subscriber-relay'
  | 'provider-registration'
  | 'new-provider-available'
  | 'new-provider-relay'
  | 'provider-catalog-share'
  | 'new-providers-available'
  | 'new-providers-available-relay'
  | 'direct-channel-handshake'
  | 'direct-channel-confirm'
  | 'provider-removed'
  | 'provider-removed-relay'
  | 'client-removed'
  | 'client-removed-relay'
  | 'close-direct-channel'
  | 'initial-data-bundle';

export interface NotificationHop {
  id: string;
  eventId: string;
  step: number;
  fromId: string;
  toId: string;
  messageType: MessageType;
  channel: 'trust' | 'direct';
  timestamp: number;
  parallelGroup?: number; // hops in the same group animate simultaneously
}
