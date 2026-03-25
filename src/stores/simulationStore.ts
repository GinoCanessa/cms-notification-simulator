import { create } from 'zustand';
import type { EventType, NotificationHop } from '../types';

interface CompareState {
  active: boolean;
  eventType: EventType | null;
  sourceId: string;
  targetId?: string;
  currentApproach: 'routed' | 'direct';
}

interface SimulationStore {
  approach: 'routed' | 'direct';
  speed: number;
  isPlaying: boolean;
  activeHops: NotificationHop[];
  currentStep: number;
  animatingEdges: Map<string, 'forward' | 'reverse'>;
  animatingNodes: Set<string>;
  pendingHops: NotificationHop[];
  compare: CompareState;
  messageCounts: Map<string, { sent: number; received: number }>;

  setApproach: (approach: 'routed' | 'direct') => void;
  setSpeed: (speed: number) => void;
  setPlaying: (playing: boolean) => void;
  setActiveHops: (hops: NotificationHop[]) => void;
  setCurrentStep: (step: number) => void;
  addAnimatingEdge: (edgeId: string, direction: 'forward' | 'reverse') => void;
  removeAnimatingEdge: (edgeId: string) => void;
  addAnimatingNode: (nodeId: string) => void;
  removeAnimatingNode: (nodeId: string) => void;
  setPendingHops: (hops: NotificationHop[]) => void;
  setCompare: (compare: Partial<CompareState>) => void;
  incrementMessageCounts: (senderIds: string[], receiverIds: string[]) => void;
  resetMessageCounts: () => void;
  reset: () => void;
}

const initialCompare: CompareState = {
  active: false,
  eventType: null,
  sourceId: '',
  targetId: undefined,
  currentApproach: 'routed',
};

export const useSimulationStore = create<SimulationStore>((set) => ({
  approach: 'routed',
  speed: 1,
  isPlaying: false,
  activeHops: [],
  currentStep: 0,
  animatingEdges: new Map(),
  animatingNodes: new Set(),
  pendingHops: [],
  compare: { ...initialCompare },
  messageCounts: new Map(),

  setApproach: (approach) => set({ approach }),
  setSpeed: (speed) => set({ speed }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setActiveHops: (hops) => set({ activeHops: hops }),
  setCurrentStep: (step) => set({ currentStep: step }),

  addAnimatingEdge: (edgeId, direction) =>
    set((state) => {
      const next = new Map(state.animatingEdges);
      next.set(edgeId, direction);
      return { animatingEdges: next };
    }),
  removeAnimatingEdge: (edgeId) =>
    set((state) => {
      const next = new Map(state.animatingEdges);
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
  setCompare: (partial) =>
    set((state) => ({ compare: { ...state.compare, ...partial } })),

  incrementMessageCounts: (senderIds, receiverIds) =>
    set((state) => {
      const next = new Map(state.messageCounts);
      for (const id of senderIds) {
        const prev = next.get(id) ?? { sent: 0, received: 0 };
        next.set(id, { ...prev, sent: prev.sent + 1 });
      }
      for (const id of receiverIds) {
        const prev = next.get(id) ?? { sent: 0, received: 0 };
        next.set(id, { ...prev, received: prev.received + 1 });
      }
      return { messageCounts: next };
    }),

  resetMessageCounts: () => set({ messageCounts: new Map() }),

  reset: () =>
    set({
      isPlaying: false,
      activeHops: [],
      currentStep: 0,
      animatingEdges: new Map(),
      animatingNodes: new Set(),
      pendingHops: [],
      compare: { ...initialCompare },
      messageCounts: new Map(),
    }),
}));
