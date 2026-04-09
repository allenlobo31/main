import { useEffect, useCallback } from 'react';
import { useSymptomStore } from '../store/symptomStore';
import { useAuthStore } from '../store/authStore';
import { SymptomEntry } from '../types';

export function useAIMonitor() {
  const store = useSymptomStore();
  const { user } = useAuthStore();
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    store.fetchEntries(uid, true);
    store.fetchAIInsight(uid);
  }, [uid]);

  const logSymptom = useCallback(
    async (
      entry: Omit<SymptomEntry, 'id' | 'date' | 'aiFlag' | 'aiFlagReason' | 'aiAnalyzedAt'>,
    ) => {
      if (!uid) return null;
      return store.logSymptom(uid, entry);
    },
    [uid],
  );

  const loadMore = useCallback(async () => {
    if (!uid) return;
    await store.fetchEntries(uid, false);
  }, [uid]);

  const refreshInsight = useCallback(async () => {
    if (!uid) return;
    await store.fetchAIInsight(uid);
  }, [uid]);

  const hasFlaggedEntries = store.entries.some((e) => e.aiFlag);
  const latestFlag = store.entries.find((e) => e.aiFlag);

  return {
    entries: store.entries,
    aiInsight: store.latestAIInsight,
    isLoading: store.isLoading,
    hasMore: store.hasMore,
    hasFlaggedEntries,
    latestFlag,
    logSymptom,
    loadMore,
    refreshInsight,
  };
}
