export type EdgeType = 'trust' | 'trust-active' | 'direct' | 'direct-active' | 'identity';

export interface TrustEdge {
  id: string;
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
}

export interface DirectChannel {
  id: string;
  providerId: string;
  clientId: string;
  establishedAt: number;
}
