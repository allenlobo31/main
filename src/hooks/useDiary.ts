import { useState, useCallback } from 'react';
import {
  db,
  diaryCol,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from '../services/firebase/firestore';
import { DiaryEntry, MoodType } from '../types';
import { useAuthStore } from '../store/authStore';
import { useGamificationStore } from '../store/gamificationStore';
import { XP_VALUES } from '../constants/gamification';

const PAGE_SIZE = 15;

export function useDiary() {
  const { user } = useAuthStore();
  const gamStore = useGamificationStore();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<unknown | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = useCallback(
    async (refresh = false) => {
      if (!user?.uid || isLoading) return;
      if (!refresh && !hasMore) return;

      setIsLoading(true);
      try {
        const col = diaryCol(user.uid);
        let q = query(
          col as never,
          orderBy('date', 'desc'),
          limit(PAGE_SIZE),
        );

        if (!refresh && lastDoc) {
          q = query(
            col as never,
            orderBy('date', 'desc'),
            startAfter(lastDoc),
            limit(PAGE_SIZE),
          );
        }

        const snap = await getDocs(q);
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<DiaryEntry, 'id'>) } as DiaryEntry),
        );
        const last = snap.docs[snap.docs.length - 1] ?? null;

        setEntries((prev) => (refresh ? items : [...prev, ...items]));
        setHasMore(items.length === PAGE_SIZE);
        setLastDoc(last);
      } catch (error) {
        console.error('[useDiary] fetchEntries error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, isLoading, hasMore, lastDoc],
  );

  const addEntry = useCallback(
    async (text: string, mood: MoodType): Promise<boolean> => {
      if (!user?.uid || isSubmitting) return false;
      setIsSubmitting(true);
      try {
        const col = diaryCol(user.uid);
        const docRef = await addDoc(col as never, {
          text,
          mood,
          date: serverTimestamp(),
          aiSummary: null,
        });

        const newEntry: DiaryEntry = {
          id: docRef.id,
          text,
          mood,
          date: Timestamp.now(),
          aiSummary: null,
        };

        setEntries((prev) => [newEntry, ...prev]);

        // Award XP
        await gamStore.addXP(user.uid, XP_VALUES.DIARY_ENTRY);

        return true;
      } catch (error) {
        console.error('[useDiary] addEntry error:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.uid, isSubmitting],
  );

  return {
    entries,
    isLoading,
    hasMore,
    isSubmitting,
    fetchEntries,
    addEntry,
  };
}
