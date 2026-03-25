import { create } from 'zustand';
import type { LogEntry, LogFilters, TrackedEvent } from '../types';

export type LogTab = 'events' | 'messages' | 'raw' | 'metrics';

interface EventLogStore {
  events: TrackedEvent[];
  entries: LogEntry[];
  filters: LogFilters;
  activeTab: LogTab;
  isCollapsed: boolean;

  addEvent: (event: TrackedEvent) => void;
  addEntry: (entry: LogEntry) => void;
  addEntries: (entries: LogEntry[]) => void;
  clearEvents: () => void;
  clearMessages: () => void;
  clearAll: () => void;
  setFilter: (filters: Partial<LogFilters>) => void;
  setActiveTab: (tab: LogTab) => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useEventLogStore = create<EventLogStore>((set) => ({
  events: [],
  entries: [],
  filters: { eventType: null, actorId: null, channel: null },
  activeTab: 'events',
  isCollapsed: false,

  addEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),

  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),

  addEntries: (entries) =>
    set((state) => ({ entries: [...state.entries, ...entries] })),

  clearEvents: () => set({ events: [] }),
  clearMessages: () => set({ entries: [] }),
  clearAll: () => set({ events: [], entries: [] }),

  setFilter: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
}));
