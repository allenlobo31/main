import {
  getStorage,
  ref,
  uploadBytesResumable,
  uploadString,
  UploadTask,
  StorageReference,
} from 'firebase/storage';
import { app } from './config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { uint8ToBase64 } from '../../utils/encryption';

const storage = getStorage(app);
const functions = getFunctions(app);

export { storage };

// ─── Upload with progress ─────────────────────────────────────────────────────

export interface UploadResult {
  uploadTask: UploadTask;
  storageRef: StorageReference;
}

export function uploadFile(params: {
  path: string;
  data: Uint8Array | string;
  contentType: string;
}): UploadResult {
  const { path, data, contentType } = params;
  const storageRef = ref(storage, path);
  const payload = typeof data === 'string' ? data : uint8ToBase64(data);
  const uploadTask = uploadString(storageRef, payload, 'base64', { contentType });
  return { uploadTask, storageRef };
}

// ─── Get signed download URL (via Cloud Function for security) ────────────────

interface SignedUrlResponse {
  url: string;
}

export async function getSignedDownloadUrl(filePath: string): Promise<string> {
  const getUrl = httpsCallable<{ filePath: string }, SignedUrlResponse>(
    functions,
    'getSignedUrl',
  );
  const result = await getUrl({ filePath });
  return result.data.url;
}
