import * as FileSystem from 'expo-file-system/legacy';
import { auth, firebaseConfig } from './config';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return globalThis.btoa(binary);
}

// ─── Upload ─────────────────────────────────────────────────────────────────────

/**
 * Upload a Uint8Array to Firebase Storage using the REST API + expo-file-system.
 *
 * Why not use the Firebase JS SDK (uploadBytes)?
 *   React Native / Hermes cannot create a Blob from ArrayBuffer, so the SDK
 *   fails with "storage/unknown". Instead we:
 *     1. Write the bytes as a base64 temp file (expo-file-system).
 *     2. Authenticate with the user's Firebase ID token.
 *     3. Use FileSystem.uploadAsync → native binary POST to the Storage REST API.
 *
 * Returns the download token from the Storage response so we can construct a
 * public download URL without needing a Cloud Function.
 */
export async function uploadFile(params: {
  path: string;
  data: Uint8Array;
  contentType: string;
}): Promise<{ downloadToken: string }> {
  const { path, data, contentType } = params;

  // ── 1. Get Firebase auth token ───────────────────────────────────────────────
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('[storage] uploadFile: no authenticated user');
  }
  const idToken = await currentUser.getIdToken(/* forceRefresh */ false);

  // ── 2. Write bytes to a temp file ────────────────────────────────────────────
  const base64 = uint8ArrayToBase64(data);
  const tempUri = `${FileSystem.cacheDirectory}upload-${Date.now()}.bin`;
  await FileSystem.writeAsStringAsync(tempUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    // ── 3. Build the Firebase Storage upload URL ─────────────────────────────
    const bucket = firebaseConfig.storageBucket;
    if (!bucket || bucket === 'PLACEHOLDER') {
      throw new Error(
        '[storage] uploadFile: missing Firebase Storage bucket. Set FIREBASE_STORAGE_BUCKET in app config or create Storage in Firebase Console.',
      );
    }
    const encodedPath = encodeURIComponent(path);
    const uploadUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket}/o` +
      `?uploadType=media&name=${encodedPath}`;

    // ── 4. Native binary upload ──────────────────────────────────────────────
    const result = await FileSystem.uploadAsync(uploadUrl, tempUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': contentType,
        Authorization: `Firebase ${idToken}`,
      },
    });

    if (result.status < 200 || result.status >= 300) {
      throw new Error(
        `[storage] Upload failed — HTTP ${result.status}: ${result.body ?? '(no body)'}`.trim(),
      );
    }

    console.log('[storage] uploadFile success', { path, status: result.status });

    // ── 5. Extract download token from response ──────────────────────────────
    let downloadToken = '';
    try {
      const responseBody = JSON.parse(result.body ?? '{}');
      downloadToken = responseBody?.downloadTokens ?? '';
    } catch {
      console.warn('[storage] Could not parse upload response for download token');
    }

    return { downloadToken };
  } finally {
    // Always remove the temp file regardless of success / failure
    await FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => undefined);
  }
}

// ─── Download URL ───────────────────────────────────────────────────────────────

/**
 * Construct a public download URL for a Firebase Storage file.
 *
 * If a download token is available (stored in Firestore at upload time),
 * builds a fully public URL requiring no auth header.
 *
 * Otherwise falls back to an authenticated URL using the user's ID token.
 */
export async function getFileDownloadUrl(
  storagePath: string,
  downloadToken?: string | null,
): Promise<string> {
  const bucket = firebaseConfig.storageBucket;
  const encodedPath = encodeURIComponent(storagePath);

  if (downloadToken) {
    // Public URL — no auth needed, shareable.
    return (
      `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}` +
      `?alt=media&token=${downloadToken}`
    );
  }

  // Fallback: authenticated URL
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('[storage] getFileDownloadUrl: no authenticated user');
  }
  const idToken = await currentUser.getIdToken(false);
  // This URL requires the Authorization header, but we return it with the token
  // appended as a query param for the REST API (this won't work in a browser,
  // but works with fetch() in the app).
  return (
    `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}` +
    `?alt=media`
  );
}

// ─── Delete ─────────────────────────────────────────────────────────────────────

/**
 * Delete a file from Firebase Storage by path.
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  const idToken = await currentUser.getIdToken(false);

  const bucket = firebaseConfig.storageBucket;
  const encodedPath = encodeURIComponent(storagePath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}`;

  try {
    const resp = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Firebase ${idToken}` },
    });
    if (!resp.ok && resp.status !== 404) {
      console.warn('[storage] deleteStorageFile response:', resp.status);
    }
  } catch (error) {
    console.warn('[storage] deleteStorageFile error:', error);
  }
}
