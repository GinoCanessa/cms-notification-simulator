export type ActorType = 'client-patient' | 'client-delegated' | 'idp' | 'network' | 'provider';

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
  networkId?: string;
  idpId?: string;
}

export const ACTOR_TYPE_LABELS: Record<ActorType, string> = {
  'client-patient': 'Client (Patient)',
  'client-delegated': 'Client (Delegated)',
  'idp': 'Identity Platform',
  'network': 'CMS Network',
  'provider': 'Provider',
};

export const ACTOR_TYPE_COLORS: Record<ActorType, { main: string; light: string }> = {
  'client-patient': { main: 'var(--color-accent)', light: 'var(--color-accent-light)' },
  'client-delegated': { main: 'var(--color-purple)', light: 'var(--color-purple-light)' },
  'idp': { main: 'var(--color-warning)', light: 'var(--color-warning-light)' },
  'network': { main: 'var(--color-success)', light: 'var(--color-success-light)' },
  'provider': { main: 'var(--color-danger)', light: 'var(--color-danger-light)' },
};

export const ACTOR_TYPE_ICONS: Record<ActorType, string> = {
  'client-patient': '👤',
  'client-delegated': '👥',
  'idp': '🔑',
  'network': '🌐',
  'provider': '🏥',
};
