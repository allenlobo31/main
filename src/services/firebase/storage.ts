import * as FileSystem from 'expo-file-system/legacy';
import { callGetSignedUploadUrl } from './functions';

export async function uploadFile(params: {
  path: string;
  data: Uint8Array;
  contentType: string;
}): Promise<void> {
  const { path, data, contentType } = params;

  const { uploadUrl } = await callGetSignedUploadUrl({ path, contentType });

  const tempFileUri = `${FileSystem.cacheDirectory}report-${Date.now()}.bin`;
  const base64 = uint8ArrayToBase64(data);
  await FileSystem.writeAsStringAsync(tempFileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    const response = await FileSystem.uploadAsync(uploadUrl, tempFileUri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Storage upload failed: ${response.status} ${response.body ?? ''}`.trim(),
      );
    }
  } finally {
    await FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(() => undefined);
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }

  return globalThis.btoa(binary);
}
