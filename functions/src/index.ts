import { onCall, HttpsError } from 'firebase-functions/v2/https';

import './bootstrap';
import { callWebhook } from './api/callWebhook';
import { onDiaryEntry } from './triggers/onDiaryEntry';
import { onReportUpload } from './triggers/onReportUpload';
import { onSymptomLog } from './triggers/onSymptomLog';
import { dailyAIReview } from './scheduled/dailyAIReview';

import * as admin from 'firebase-admin';

export { callWebhook, onDiaryEntry, onReportUpload, onSymptomLog, dailyAIReview };

export const uploadEncryptedReport = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const path = String(request.data?.path ?? '');
    const contentType = String(request.data?.contentType ?? 'application/octet-stream');
    const dataBase64 = String(request.data?.dataBase64 ?? '');

    if (!path.startsWith(`reports/${uid}/`) || !path.includes('/')) {
      throw new HttpsError('invalid-argument', 'Invalid upload path.');
    }

    if (!dataBase64) {
      throw new HttpsError('invalid-argument', 'Missing upload data.');
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    const bucket = admin.storage().bucket();

    await bucket.file(path).save(buffer, {
      resumable: false,
      metadata: { contentType },
    });

    return { path };
  },
);

export const getSignedUploadUrl = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const path = String(request.data?.path ?? '');
    const contentType = String(request.data?.contentType ?? 'application/octet-stream');

    if (!path.startsWith(`reports/${uid}/`) || !path.includes('/')) {
      throw new HttpsError('invalid-argument', 'Invalid upload path.');
    }

    const bucket = admin.storage().bucket();
    const [uploadUrl] = await bucket.file(path).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    return { uploadUrl, path };
  },
);