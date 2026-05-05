import { create } from 'zustand';
import {
  SymptomEntry,
  AIInsight,
} from '../types';
import { getSymptoms, submitSymptom } from '../services/dataService';
import { todayDateString } from '../utils/dateHelpers';

interface SymptomState {
  entries: SymptomEntry[];
  latestAIInsight: AIInsight | null;
  insightFetchedAt: string | Date | null;
  isLoading: boolean;
  hasMore: boolean;
  lastDoc: unknown | null;
}

interface SymptomActions {
  logSymptom: (
    userId: string,
    entry: Omit<SymptomEntry, 'id' | 'date' | 'aiFlag' | 'aiFlagReason' | 'aiAnalyzedAt'>,
  ) => Promise<string | null>;
  fetchEntries: (userId: string, refresh?: boolean) => Promise<void>;
  fetchAIInsight: (userId: string) => Promise<void>;
  setLoading: (v: boolean) => void;
}

const PAGE_SIZE = 20;

export const useSymptomStore = create<SymptomState & SymptomActions>()(
  (set, get) => ({
    entries: [],
    latestAIInsight: null,
    insightFetchedAt: null,
    isLoading: false,
    hasMore: true,
    lastDoc: null,

    setLoading: (v) => set({ isLoading: v }),

    logSymptom: async (userId, entry) => {
      try {
        const result = await submitSymptom(entry);
        // Optimistically prepend to local list
        set((s) => ({ entries: [result, ...s.entries] }));
        return result.id || 'new-id';
      } catch (error) {
        console.error('[SymptomStore] logSymptom error:', error);
        return null;
      }
    },

    fetchEntries: async (userId, refresh = false) => {
      const state = get();
      if (state.isLoading) return;

      set({ isLoading: true });
      try {
        const items = await getSymptoms();
        set(() => ({
          entries: items,
          hasMore: false,
          isLoading: false,
        }));
      } catch (error) {
        console.error('[SymptomStore] fetchEntries error:', error);
        set({ isLoading: false });
      }
    },

    fetchAIInsight: async (userId) => {
      // Mocked for now since backend doesn't have AI insight storage yet
      return;
    },
  }),
);
