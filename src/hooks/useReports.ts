import { useState, useCallback } from 'react';
import {
  db,
  reportsCol,
  getDoc,
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
import { uploadFile } from '../services/firebase/storage';
import { callGetSignedUrl } from '../services/firebase/functions';
import {
  generateEncryptionKey,
  encryptData,
} from '../utils/encryption';
import { XP_VALUES } from '../constants/gamification';

const PAGE_SIZE = 10;

export function useReports() {
  const { user } = useAuthStore();
  const gamStore = useGamificationStore();

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<unknown | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchReports = useCallback(
    async (refresh = false) => {
      if (!user?.uid || isLoading) return;
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
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) } as Report));
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
    [user?.uid, isLoading, hasMore, lastDoc],
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
        console.error('[useReports] uploadReport aborted: missing authenticated uid', {
          hasUser: Boolean(user),
          uid: user?.uid ?? null,
        });
        return null;
      }

      const title = params.title?.trim();
      const filename = params.filename?.trim();
      const contentType = params.contentType?.trim();
      if (!title || !filename || !contentType || !(params.fileData instanceof Uint8Array) || params.fileData.length === 0) {
        console.error('[useReports] uploadReport aborted: invalid params', {
          title,
          filename,
          contentType,
          fileDataLength: params.fileData?.length,
        });
        return null;
      }

      setUploadProgress(0);
      try {
        // Generate and encrypt
        const key = await generateEncryptionKey();
        const encryptedBytes = await encryptData(params.fileData, key);

        const reportId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const safeFilename = filename.replace(/[\\/]/g, '_');
        const path = `reports/${uid}/${reportId}/${safeFilename}`;

        console.log('[useReports] uploadReport start', {
          uid,
          reportId,
          path,
          contentType,
          bytes: encryptedBytes.length,
        });

        await uploadFile({
          path,
          data: encryptedBytes,
          contentType,
        });

        setUploadProgress(100);

        const fileUrl = path;

        // Create Firestore doc with deterministic ID to match storage path segment.
        const reportDocRef = doc(db, 'users', uid, 'reports', reportId);
        await setDoc(reportDocRef as never, {
          id: reportId,
          title,
          type: params.type,
          fileUrl,
          encryptedKey: key,
          uploadedAt: serverTimestamp(),
          accessibleTo: [uid],
          aiWoundAnalysis: null,
        });

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
            uid,
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

  const getSignedUrl = useCallback(async (filePath: string) => {
    return callGetSignedUrl(filePath);
  }, []);

  const deleteReport = useCallback(
    async (reportId: string) => {
      if (!user?.uid) return;
      try {
        const ref = doc(db, 'users', user.uid, 'reports', reportId);
        await deleteDoc(ref);
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } catch (error) {
        console.error('[useReports] deleteReport error:', error);
      }
    },
    [user?.uid],
  );

  return {
    reports,
    isLoading,
    hasMore,
    uploadProgress,
    fetchReports,
    uploadReport,
    getSignedUrl,
    deleteReport,
  };
}
