import { useState, useCallback } from 'react';
import { DiaryEntry, MoodType } from '../types';
import { useAuthStore } from '../store/authStore';
import { submitDiary, getDiary, deleteDiary } from '../services/dataService';

export function useDiary() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const data = await getDiary();
      setEntries(data);
    } catch (error) {
      console.error('[useDiary] fetchEntries error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  const addEntry = useCallback(
    async (text: string, mood: MoodType): Promise<boolean> => {
      if (!user?.uid || isSubmitting) return false;
      setIsSubmitting(true);
      try {
        await submitDiary({ content: text, mood });
        await fetchEntries();
        return true;
      } catch (error) {
        console.error('[useDiary] addEntry error:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.uid, isSubmitting, fetchEntries],
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.uid) return false;
      try {
        await deleteDiary(id);
        await fetchEntries();
        return true;
      } catch (error) {
        console.error('[useDiary] deleteEntry error:', error);
        return false;
      }
    },
    [user?.uid, fetchEntries],
  );

  return {
    entries,
    isLoading,
    isSubmitting,
    fetchEntries,
    addEntry,
    deleteEntry,
    hasMore: false,
  };
}