import { create } from 'zustand';
import type { NotificationHop } from '../types';

interface SimulationStore {
  approach: 'routed' | 'direct';
  speed: number;
  isPlaying: boolean;
  activeHops: NotificationHop[];
  currentStep: number;
  animatingEdges: Set<string>;
  animatingNodes: Set<string>;
  pendingHops: NotificationHop[];

  setApproach: (approach: 'routed' | 'direct') => void;
  setSpeed: (speed: number) => void;
  setPlaying: (playing: boolean) => void;
  setActiveHops: (hops: NotificationHop[]) => void;
  setCurrentStep: (step: number) => void;
  addAnimatingEdge: (edgeId: string) => void;
  removeAnimatingEdge: (edgeId: string) => void;
  addAnimatingNode: (nodeId: string) => void;
  removeAnimatingNode: (nodeId: string) => void;
  setPendingHops: (hops: NotificationHop[]) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  approach: 'routed',
  speed: 1,
  isPlaying: false,
  activeHops: [],
  currentStep: 0,
  animatingEdges: new Set(),
  animatingNodes: new Set(),
  pendingHops: [],

  setApproach: (approach) => set({ approach }),
  setSpeed: (speed) => set({ speed }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setActiveHops: (hops) => set({ activeHops: hops }),
  setCurrentStep: (step) => set({ currentStep: step }),

  addAnimatingEdge: (edgeId) =>
    set((state) => {
      const next = new Set(state.animatingEdges);
      next.add(edgeId);
      return { animatingEdges: next };
    }),
  removeAnimatingEdge: (edgeId) =>
    set((state) => {
      const next = new Set(state.animatingEdges);
      next.delete(edgeId);
      return { animatingEdges: next };
    }),
  addAnimatingNode: (nodeId) =>
    set((state) => {
      const next = new Set(state.animatingNodes);
      next.add(nodeId);
      return { animatingNodes: next };
    }),
  removeAnimatingNode: (nodeId) =>
    set((state) => {
      const next = new Set(state.animatingNodes);
      next.delete(nodeId);
      return { animatingNodes: next };
    }),
  setPendingHops: (hops) => set({ pendingHops: hops }),

  reset: () =>
    set({
      isPlaying: false,
      activeHops: [],
      currentStep: 0,
      animatingEdges: new Set(),
      animatingNodes: new Set(),
      pendingHops: [],
    }),
}));
