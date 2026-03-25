import { create } from 'zustand';
import type { Actor, TrustEdge, DirectChannel } from '../types';

interface GraphStore {
  actors: Map<string, Actor>;
  edges: Map<string, TrustEdge>;
  directChannels: Map<string, DirectChannel>;
  providerIdpEdges: Map<string, TrustEdge>;
  selectedActorId: string | null;
  linkMode: boolean;
  linkSource: string | null;

  addActor: (actor: Actor) => void;
  removeActor: (id: string) => void;
  updateActor: (id: string, updates: Partial<Actor>) => void;
  selectActor: (id: string | null) => void;

  addEdge: (edge: TrustEdge) => void;
  removeEdge: (id: string) => void;

  addDirectChannel: (channel: DirectChannel) => void;
  removeDirectChannel: (id: string) => void;
  clearDirectChannels: () => void;
  setDirectChannels: (channels: DirectChannel[]) => void;

  setProviderIdpEdges: (edges: TrustEdge[]) => void;
  clearProviderIdpEdges: () => void;

  setLinkMode: (on: boolean) => void;
  setLinkSource: (id: string | null) => void;

  loadPreset: (actors: Actor[], edges: TrustEdge[]) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  actors: new Map(),
  edges: new Map(),
  directChannels: new Map(),
  providerIdpEdges: new Map(),
  selectedActorId: null,
  linkMode: false,
  linkSource: null,

  addActor: (actor) =>
    set((state) => {
      const next = new Map(state.actors);
      next.set(actor.id, actor);
      return { actors: next };
    }),

  removeActor: (id) =>
    set((state) => {
      const nextActors = new Map(state.actors);
      nextActors.delete(id);
      const nextEdges = new Map(state.edges);
      for (const [eid, edge] of nextEdges) {
        if (edge.sourceId === id || edge.targetId === id) nextEdges.delete(eid);
      }
      const nextDC = new Map(state.directChannels);
      for (const [dcid, dc] of nextDC) {
        if (dc.providerId === id || dc.clientId === id) nextDC.delete(dcid);
      }
      return {
        actors: nextActors,
        edges: nextEdges,
        directChannels: nextDC,
        selectedActorId: state.selectedActorId === id ? null : state.selectedActorId,
      };
    }),

  updateActor: (id, updates) =>
    set((state) => {
      const next = new Map(state.actors);
      const existing = next.get(id);
      if (existing) next.set(id, { ...existing, ...updates });
      return { actors: next };
    }),

  selectActor: (id) => set({ selectedActorId: id }),

  addEdge: (edge) =>
    set((state) => {
      const next = new Map(state.edges);
      next.set(edge.id, edge);
      return { edges: next };
    }),

  removeEdge: (id) =>
    set((state) => {
      const next = new Map(state.edges);
      next.delete(id);
      return { edges: next };
    }),

  addDirectChannel: (channel) =>
    set((state) => {
      const next = new Map(state.directChannels);
      next.set(channel.id, channel);
      return { directChannels: next };
    }),

  removeDirectChannel: (id) =>
    set((state) => {
      const next = new Map(state.directChannels);
      next.delete(id);
      return { directChannels: next };
    }),

  clearDirectChannels: () => set({ directChannels: new Map() }),

  setDirectChannels: (channels) =>
    set({
      directChannels: new Map(channels.map((c) => [c.id, c])),
    }),

  setProviderIdpEdges: (edges) =>
    set({
      providerIdpEdges: new Map(edges.map((e) => [e.id, e])),
    }),

  clearProviderIdpEdges: () => set({ providerIdpEdges: new Map() }),

  setLinkMode: (on) => set({ linkMode: on, linkSource: null }),
  setLinkSource: (id) => set({ linkSource: id }),

  loadPreset: (actors, edges) =>
    set({
      actors: new Map(actors.map((a) => [a.id, a])),
      edges: new Map(edges.map((e) => [e.id, e])),
      directChannels: new Map(),
      providerIdpEdges: new Map(),
      selectedActorId: null,
      linkMode: false,
      linkSource: null,
    }),

  clearGraph: () =>
    set({
      actors: new Map(),
      edges: new Map(),
      directChannels: new Map(),
      providerIdpEdges: new Map(),
      selectedActorId: null,
      linkMode: false,
      linkSource: null,
    }),
}));
