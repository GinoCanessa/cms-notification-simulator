import type { Actor, TrustEdge } from '../types';

export interface Preset {
  id: string;
  name: string;
  actors: Actor[];
  edges: TrustEdge[];
  positions: Record<string, { x: number; y: number }>;
}

export const simplePreset: Preset = {
  id: 'simple',
  name: 'Simple',
  actors: [
    { id: 'idp-1', name: 'CMS IDP', type: 'idp' },
    { id: 'network-a', name: 'Network East', type: 'network' },
    { id: 'provider-1', name: 'Dr. Smith', type: 'provider', networkId: 'network-a' },
    { id: 'client-1', name: 'MyChart', type: 'client-patient', networkId: 'network-a', idpId: 'idp-1' },
  ],
  edges: [
    { id: 'e-p1-na', sourceId: 'provider-1', targetId: 'network-a', edgeType: 'trust' },
    { id: 'e-na-c1', sourceId: 'network-a', targetId: 'client-1', edgeType: 'trust' },
    { id: 'e-c1-idp', sourceId: 'client-1', targetId: 'idp-1', edgeType: 'identity' },
  ],
  positions: {
    'provider-1': { x: 100, y: 250 },
    'network-a': { x: 350, y: 250 },
    'client-1': { x: 600, y: 250 },
    'idp-1': { x: 600, y: 80 },
  },
};

export const twoNetworksPreset: Preset = {
  id: 'two-networks',
  name: 'Two Networks',
  actors: [
    { id: 'idp-1', name: 'CMS IDP', type: 'idp' },
    { id: 'network-a', name: 'Network East', type: 'network' },
    { id: 'network-b', name: 'Network West', type: 'network' },
    { id: 'provider-1', name: 'Dr. Smith', type: 'provider', networkId: 'network-a' },
    { id: 'provider-2', name: 'City Hospital', type: 'provider', networkId: 'network-a' },
    { id: 'client-1', name: 'MyChart', type: 'client-patient', networkId: 'network-b', idpId: 'idp-1' },
    { id: 'client-2', name: 'Payer Portal', type: 'client-delegated', networkId: 'network-b', idpId: 'idp-1' },
  ],
  edges: [
    { id: 'e-p1-na', sourceId: 'provider-1', targetId: 'network-a', edgeType: 'trust' },
    { id: 'e-p2-na', sourceId: 'provider-2', targetId: 'network-a', edgeType: 'trust' },
    { id: 'e-na-nb', sourceId: 'network-a', targetId: 'network-b', edgeType: 'trust' },
    { id: 'e-nb-c1', sourceId: 'network-b', targetId: 'client-1', edgeType: 'trust' },
    { id: 'e-nb-c2', sourceId: 'network-b', targetId: 'client-2', edgeType: 'trust' },
    { id: 'e-c1-idp', sourceId: 'client-1', targetId: 'idp-1', edgeType: 'identity' },
    { id: 'e-c2-idp', sourceId: 'client-2', targetId: 'idp-1', edgeType: 'identity' },
  ],
  positions: {
    'provider-1': { x: 80, y: 150 },
    'provider-2': { x: 80, y: 350 },
    'network-a': { x: 300, y: 250 },
    'network-b': { x: 520, y: 250 },
    'client-1': { x: 740, y: 150 },
    'client-2': { x: 740, y: 350 },
    'idp-1': { x: 740, y: 30 },
  },
};

export const hubAndSpokePreset: Preset = {
  id: 'hub-spoke',
  name: 'Hub & Spoke',
  actors: [
    { id: 'idp-1', name: 'CMS IDP', type: 'idp' },
    { id: 'network-hub', name: 'Central Hub', type: 'network' },
    { id: 'network-n', name: 'Network North', type: 'network' },
    { id: 'network-s', name: 'Network South', type: 'network' },
    { id: 'network-e', name: 'Network East', type: 'network' },
    { id: 'provider-1', name: 'Dr. Smith', type: 'provider', networkId: 'network-n' },
    { id: 'provider-2', name: 'City Hospital', type: 'provider', networkId: 'network-s' },
    { id: 'provider-3', name: 'Regional Clinic', type: 'provider', networkId: 'network-e' },
    { id: 'client-1', name: 'MyChart', type: 'client-patient', networkId: 'network-n', idpId: 'idp-1' },
    { id: 'client-2', name: 'Payer Portal', type: 'client-delegated', networkId: 'network-s', idpId: 'idp-1' },
    { id: 'client-3', name: 'Care App', type: 'client-patient', networkId: 'network-e', idpId: 'idp-1' },
  ],
  edges: [
    { id: 'e-hub-n', sourceId: 'network-hub', targetId: 'network-n', edgeType: 'trust' },
    { id: 'e-hub-s', sourceId: 'network-hub', targetId: 'network-s', edgeType: 'trust' },
    { id: 'e-hub-e', sourceId: 'network-hub', targetId: 'network-e', edgeType: 'trust' },
    { id: 'e-p1-nn', sourceId: 'provider-1', targetId: 'network-n', edgeType: 'trust' },
    { id: 'e-p2-ns', sourceId: 'provider-2', targetId: 'network-s', edgeType: 'trust' },
    { id: 'e-p3-ne', sourceId: 'provider-3', targetId: 'network-e', edgeType: 'trust' },
    { id: 'e-nn-c1', sourceId: 'network-n', targetId: 'client-1', edgeType: 'trust' },
    { id: 'e-ns-c2', sourceId: 'network-s', targetId: 'client-2', edgeType: 'trust' },
    { id: 'e-ne-c3', sourceId: 'network-e', targetId: 'client-3', edgeType: 'trust' },
    { id: 'e-c1-idp', sourceId: 'client-1', targetId: 'idp-1', edgeType: 'identity' },
    { id: 'e-c2-idp', sourceId: 'client-2', targetId: 'idp-1', edgeType: 'identity' },
    { id: 'e-c3-idp', sourceId: 'client-3', targetId: 'idp-1', edgeType: 'identity' },
  ],
  positions: {
    'idp-1': { x: 420, y: 20 },
    'network-hub': { x: 420, y: 250 },
    'network-n': { x: 420, y: 100 },
    'network-s': { x: 220, y: 400 },
    'network-e': { x: 620, y: 400 },
    'provider-1': { x: 240, y: 100 },
    'provider-2': { x: 40, y: 400 },
    'provider-3': { x: 800, y: 400 },
    'client-1': { x: 600, y: 100 },
    'client-2': { x: 220, y: 550 },
    'client-3': { x: 620, y: 550 },
  },
};

export const complexPreset: Preset = {
  id: 'complex',
  name: 'Complex',
  actors: [
    { id: 'idp-1', name: 'CMS IDP Central', type: 'idp' },
    { id: 'idp-2', name: 'State IDP', type: 'idp' },
    { id: 'network-a', name: 'Network Alpha', type: 'network' },
    { id: 'network-b', name: 'Network Beta', type: 'network' },
    { id: 'network-c', name: 'Network Gamma', type: 'network' },
    { id: 'network-d', name: 'Network Delta', type: 'network' },
    { id: 'provider-1', name: 'Dr. Smith', type: 'provider', networkId: 'network-a' },
    { id: 'provider-2', name: 'City Hospital', type: 'provider', networkId: 'network-a' },
    { id: 'provider-3', name: 'Regional Clinic', type: 'provider', networkId: 'network-b' },
    { id: 'provider-4', name: 'ER Center', type: 'provider', networkId: 'network-c' },
    { id: 'provider-5', name: 'Pediatrics', type: 'provider', networkId: 'network-d' },
    { id: 'provider-6', name: 'Cardiology', type: 'provider', networkId: 'network-d' },
    { id: 'client-1', name: 'MyChart', type: 'client-patient', networkId: 'network-a', idpId: 'idp-1' },
    { id: 'client-2', name: 'Payer Portal', type: 'client-delegated', networkId: 'network-b', idpId: 'idp-1' },
    { id: 'client-3', name: 'Care Connect', type: 'client-patient', networkId: 'network-c', idpId: 'idp-2' },
    { id: 'client-4', name: 'Health Link', type: 'client-delegated', networkId: 'network-d', idpId: 'idp-2' },
  ],
  edges: [
    { id: 'e-ab', sourceId: 'network-a', targetId: 'network-b', edgeType: 'trust' },
    { id: 'e-bc', sourceId: 'network-b', targetId: 'network-c', edgeType: 'trust' },
    { id: 'e-cd', sourceId: 'network-c', targetId: 'network-d', edgeType: 'trust' },
    { id: 'e-ad', sourceId: 'network-a', targetId: 'network-d', edgeType: 'trust' },
    { id: 'e-p1-a', sourceId: 'provider-1', targetId: 'network-a', edgeType: 'trust' },
    { id: 'e-p2-a', sourceId: 'provider-2', targetId: 'network-a', edgeType: 'trust' },
    { id: 'e-p3-b', sourceId: 'provider-3', targetId: 'network-b', edgeType: 'trust' },
    { id: 'e-p4-c', sourceId: 'provider-4', targetId: 'network-c', edgeType: 'trust' },
    { id: 'e-p5-d', sourceId: 'provider-5', targetId: 'network-d', edgeType: 'trust' },
    { id: 'e-p6-d', sourceId: 'provider-6', targetId: 'network-d', edgeType: 'trust' },
    { id: 'e-a-c1', sourceId: 'network-a', targetId: 'client-1', edgeType: 'trust' },
    { id: 'e-b-c2', sourceId: 'network-b', targetId: 'client-2', edgeType: 'trust' },
    { id: 'e-c-c3', sourceId: 'network-c', targetId: 'client-3', edgeType: 'trust' },
    { id: 'e-d-c4', sourceId: 'network-d', targetId: 'client-4', edgeType: 'trust' },
    { id: 'e-c1-idp1', sourceId: 'client-1', targetId: 'idp-1', edgeType: 'identity' },
    { id: 'e-c2-idp1', sourceId: 'client-2', targetId: 'idp-1', edgeType: 'identity' },
    { id: 'e-c3-idp2', sourceId: 'client-3', targetId: 'idp-2', edgeType: 'identity' },
    { id: 'e-c4-idp2', sourceId: 'client-4', targetId: 'idp-2', edgeType: 'identity' },
  ],
  positions: {
    'idp-1': { x: 200, y: 20 },
    'idp-2': { x: 680, y: 20 },
    'network-a': { x: 200, y: 250 },
    'network-b': { x: 440, y: 150 },
    'network-c': { x: 680, y: 250 },
    'network-d': { x: 440, y: 400 },
    'provider-1': { x: 30, y: 170 },
    'provider-2': { x: 30, y: 330 },
    'provider-3': { x: 440, y: 30 },
    'provider-4': { x: 850, y: 170 },
    'provider-5': { x: 300, y: 520 },
    'provider-6': { x: 580, y: 520 },
    'client-1': { x: 200, y: 100 },
    'client-2': { x: 580, y: 80 },
    'client-3': { x: 820, y: 330 },
    'client-4': { x: 440, y: 530 },
  },
};

export const allPresets: Preset[] = [
  simplePreset,
  twoNetworksPreset,
  hubAndSpokePreset,
  complexPreset,
];

export function getPresetById(id: string): Preset | undefined {
  return allPresets.find((p) => p.id === id);
}
