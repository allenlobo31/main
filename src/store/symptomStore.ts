import { create } from 'zustand';
import {
  SymptomEntry,
  AIInsight,
  PaginatedResult,
} from '../types';
import {
  db,
  symptomsCol,
  aiInsightDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from '../services/firebase/firestore';
import { todayDateString, isOlderThan } from '../utils/dateHelpers';
import { Timestamp } from 'firebase/firestore';

interface SymptomState {
  entries: SymptomEntry[];
  latestAIInsight: AIInsight | null;
  insightFetchedAt: Timestamp | null;
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
      const isSubmitting = { current: false };
      if (isSubmitting.current) return null;
      isSubmitting.current = true;
      try {
        const col = symptomsCol(userId);
        const docRef = await addDoc(col as never, {
          ...entry,
          date: serverTimestamp(),
          aiFlag: false,
          aiFlagReason: null,
          aiAnalyzedAt: null,
        });
        // Optimistically prepend to local list
        const newEntry: SymptomEntry = {
          id: docRef.id,
          ...entry,
          date: Timestamp.now(),
          aiFlag: false,
          aiFlagReason: null,
          aiAnalyzedAt: null,
        };
        set((s) => ({ entries: [newEntry, ...s.entries] }));
        return docRef.id;
      } catch (error) {
        console.error('[SymptomStore] logSymptom error:', error);
        return null;
      } finally {
        isSubmitting.current = false;
      }
    },

    fetchEntries: async (userId, refresh = false) => {
      const state = get();
      if (state.isLoading) return;
      if (!refresh && !state.hasMore) return;

      set({ isLoading: true });
      try {
        const col = symptomsCol(userId);
        let q = query(col as never, orderBy('date', 'desc'), limit(PAGE_SIZE));

        if (!refresh && state.lastDoc) {
          q = query(
            col as never,
            orderBy('date', 'desc'),
            startAfter(state.lastDoc),
            limit(PAGE_SIZE),
          );
        }

        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SymptomEntry, 'id'>) }));
        const lastVisible = snap.docs[snap.docs.length - 1] ?? null;

        set((s) => ({
          entries: refresh ? items : [...s.entries, ...items],
          hasMore: items.length === PAGE_SIZE,
          lastDoc: lastVisible,
          isLoading: false,
        }));
      } catch (error) {
        console.error('[SymptomStore] fetchEntries error:', error);
        set({ isLoading: false });
      }
    },

    fetchAIInsight: async (userId) => {
      const state = get();
      // Cache for 1 hour
      if (
        state.latestAIInsight &&
        state.insightFetchedAt &&
        !isOlderThan(state.insightFetchedAt, 60)
      ) {
        return;
      }

      try {
        const today = todayDateString();
        const ref = aiInsightDoc(userId, today);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          set({
            latestAIInsight: snap.data() as AIInsight,
            insightFetchedAt: Timestamp.now(),
          });
        }
      } catch (error) {
        console.error('[SymptomStore] fetchAIInsight error:', error);
      }
    },
  }),
);
