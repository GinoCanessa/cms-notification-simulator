import { create } from 'zustand';
import type { LogEntry, LogFilters } from '../types';

interface EventLogStore {
  entries: LogEntry[];
  filters: LogFilters;
  activeTab: 'log' | 'raw' | 'metrics';
  isCollapsed: boolean;

  addEntry: (entry: LogEntry) => void;
  addEntries: (entries: LogEntry[]) => void;
  clearLog: () => void;
  setFilter: (filters: Partial<LogFilters>) => void;
  setActiveTab: (tab: 'log' | 'raw' | 'metrics') => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useEventLogStore = create<EventLogStore>((set) => ({
  entries: [],
  filters: { eventType: null, actorId: null, channel: null },
  activeTab: 'log',
  isCollapsed: false,

  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),

  addEntries: (entries) =>
    set((state) => ({ entries: [...state.entries, ...entries] })),

  clearLog: () => set({ entries: [] }),

  setFilter: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
}));
