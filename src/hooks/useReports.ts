import { useEffect, useState, useCallback } from 'react';
import {
  db,
  reportsCol,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from '../services/firebase/firestore';
import { doc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { Report, ReportType } from '../types';
import { useAuthStore } from '../store/authStore';
import { useGamificationStore } from '../store/gamificationStore';
import { deleteStorageFile, uploadFile, getFileDownloadUrl } from '../services/firebase/storage';
import { subscribeToAuthState } from '../services/firebase/auth';
import { XP_VALUES } from '../constants/gamification';

const PAGE_SIZE = 10;

export function useReports() {
  const { user, isInitialized } = useAuthStore();
  const gamStore = useGamificationStore();
  const [authUid, setAuthUid] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<unknown | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    setReports([]);
    setHasMore(true);
    setLastDoc(null);
  }, [user?.uid]);

  useEffect(() => subscribeToAuthState((fbUser) => setAuthUid(fbUser?.uid ?? null)), []);

  useEffect(() => {
    if (!isInitialized || !user?.uid) return;
    if (authUid !== user.uid) return;

    void fetchReports(true);
  }, [isInitialized, user?.uid, authUid]);

  const fetchReports = useCallback(
    async (refresh = false) => {
      if (!user?.uid || isLoading) return;
      if (authUid !== user.uid) return;
      if (!refresh && !hasMore) return;

      setIsLoading(true);
      try {
        const col = reportsCol(user.uid);
        let q = query(col as never, orderBy('uploadedAt', 'desc'), limit(PAGE_SIZE));
        if (!refresh && lastDoc) {
          q = query(
            col as never,
            orderBy('uploadedAt', 'desc'),
            startAfter(lastDoc),
            limit(PAGE_SIZE),
          );
        }

        const snap = await getDocs(q);
        const items = snap.docs.map((d) => {
          const data = d.data() as Record<string, any>;
          return { id: d.id, ...data } as Report;
        });
        const last = snap.docs[snap.docs.length - 1] ?? null;

        setReports((prev) => (refresh ? items : [...prev, ...items]));
        setHasMore(items.length === PAGE_SIZE);
        setLastDoc(last);
      } catch (error) {
        console.error('[useReports] fetchReports error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.uid, authUid, isLoading, hasMore, lastDoc],
  );

  const uploadReport = useCallback(
    async (params: {
      title: string;
      type: ReportType;
      fileData: Uint8Array;
      filename: string;
      contentType: string;
    }): Promise<string | null> => {
      const uid = user?.uid?.trim();
      if (!uid) {
        console.error('[useReports] uploadReport aborted: missing authenticated uid');
        return null;
      }

      const title = params.title?.trim();
      const filename = params.filename?.trim();
      const contentType = params.contentType?.trim();
      if (!title || !filename || !contentType || !(params.fileData instanceof Uint8Array) || params.fileData.length === 0) {
        console.error('[useReports] uploadReport aborted: invalid params');
        return null;
      }

      setUploadProgress(0);
      try {
        const reportId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const safeFilename = filename.replace(/[\\/]/g, '_');
        const path = `reports/${uid}/${reportId}/${safeFilename}`;

        setUploadProgress(20);

        // Upload directly to Storage using the wrapper that handles React Native binary POST
        const { downloadToken } = await uploadFile({
          path,
          contentType,
          data: params.fileData,
        });

        setUploadProgress(80);

        // Create Firestore document
        const reportDocRef = doc(db, 'users', uid, 'reports', reportId);
        await setDoc(reportDocRef as never, {
          id: reportId,
          title,
          type: params.type,
          fileUrl: path,
          downloadToken,
          encryptedKey: '',
          uploadedAt: serverTimestamp(),
          accessibleTo: [uid],
          aiWoundAnalysis: null,
        });

        setUploadProgress(100);

        // Award XP
        await gamStore.addXP(uid, XP_VALUES.REPORT_UPLOAD);

        setUploadProgress(null);
        // Refresh list
        await fetchReports(true);
        return reportId;
      } catch (error) {
        if (error instanceof FirebaseError) {
          console.error('[useReports] uploadReport firebase error:', {
            code: error.code,
            message: error.message,
          });
        } else {
          console.error('[useReports] uploadReport error:', error);
        }
        setUploadProgress(null);
        return null;
      }
    },
    [user?.uid, fetchReports, gamStore],
  );

  const getDownloadUrl = useCallback(
    async (report: Report & { downloadToken?: string }): Promise<string> => {
      return getFileDownloadUrl(report.fileUrl, report.downloadToken);
    },
    [],
  );

  const deleteReport = useCallback(
    async (reportId: string) => {
      if (!user?.uid) return;
      try {
        // Find the report to get the storage path
        const report = reports.find((r) => r.id === reportId);
        if (report?.fileUrl) {
          await deleteStorageFile(report.fileUrl);
        }

        const ref = doc(db, 'users', user.uid, 'reports', reportId);
        await deleteDoc(ref);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } catch (error) {
        console.error('[useReports] deleteReport error:', error);
      }
    },
    [user?.uid, reports],
  );

  return {
    reports,
    isLoading,
    hasMore,
    uploadProgress,
    fetchReports,
    uploadReport,
    getDownloadUrl,
    deleteReport,
  };
}
