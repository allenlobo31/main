import { File, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';

export async function uploadFile(params: {
  uploadUrl: string;
  data: Uint8Array;
  contentType: string;
  filename: string;
}): Promise<void> {
  const { uploadUrl, data, contentType, filename } = params;
  const tempFile = new File(Paths.cache, `report-${Date.now()}-${filename}`);
  tempFile.create();
  tempFile.write(data);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: tempFile,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
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
