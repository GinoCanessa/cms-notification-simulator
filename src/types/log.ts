import type { EventType, MessageType } from './event';

export interface TrackedEvent {
  id: string;
  eventType: EventType;
  sourceActorId: string;
  sourceActorName: string;
  targetActorId?: string;
  targetActorName?: string;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  eventId: string;
  timestamp: number;
  eventType: string;
  approach: 'routed' | 'direct';
  step: number;
  from: { id: string; type: string; name: string };
  to: { id: string; type: string; name: string };
  channel: 'trust' | 'direct';
  messageType: MessageType;
  hopCount: number;
  totalHops: number;
}

export interface LogFilters {
  eventType: string | null;
  actorId: string | null;
  channel: 'trust' | 'direct' | null;
}
