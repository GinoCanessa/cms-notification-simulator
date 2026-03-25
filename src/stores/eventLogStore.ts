import { create } from 'zustand';
import type { LogEntry, LogFilters, TrackedEvent } from '../types';

export type LogTab = 'events' | 'messages' | 'raw' | 'metrics';

interface EventLogStore {
  events: TrackedEvent[];
  entries: LogEntry[];
  filters: LogFilters;
  activeTab: LogTab;
  isCollapsed: boolean;
  selectedEntryId: string | null;

  addEvent: (event: TrackedEvent) => void;
  addEntry: (entry: LogEntry) => void;
  addEntries: (entries: LogEntry[]) => void;
  clearEvents: () => void;
  clearMessages: () => void;
  clearAll: () => void;
  setFilter: (filters: Partial<LogFilters>) => void;
  setActiveTab: (tab: LogTab) => void;
  setCollapsed: (collapsed: boolean) => void;
  selectEntry: (id: string | null) => void;
}

export const useEventLogStore = create<EventLogStore>((set) => ({
  events: [],
  entries: [],
  filters: { eventType: null, actorId: null, channel: null },
  activeTab: 'events',
  isCollapsed: false,
  selectedEntryId: null,

  addEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),

  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),

  addEntries: (entries) =>
    set((state) => ({ entries: [...state.entries, ...entries] })),

  clearEvents: () => set({ events: [] }),
  clearMessages: () => set({ entries: [], selectedEntryId: null }),
  clearAll: () => set({ events: [], entries: [], selectedEntryId: null }),

  setFilter: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  selectEntry: (id) => set({ selectedEntryId: id }),
}));
