import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';
import { AgoraTokenResponse } from '../../types';

const functions = getFunctions(app);

// ─── Typed callable wrappers ──────────────────────────────────────────────────

interface AgoraTokenRequest {
  expertId: string;
  patientId: string;
}

interface SignedUrlRequest {
  filePath: string;
}

interface SignedUrlResponse {
  url: string;
}

interface SignedUploadUrlRequest {
  path: string;
  contentType: string;
}

interface SignedUploadUrlResponse {
  uploadUrl: string;
  path: string;
}

interface SendNotificationRequest {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface SendNotificationResponse {
  success: boolean;
}

export async function callGenerateAgoraToken(
  params: AgoraTokenRequest,
): Promise<AgoraTokenResponse> {
  const fn = httpsCallable<AgoraTokenRequest, AgoraTokenResponse>(
    functions,
    'generateAgoraToken',
  );
  const result = await fn(params);
  return result.data;
}

export async function callGetSignedUrl(filePath: string): Promise<string> {
  const fn = httpsCallable<SignedUrlRequest, SignedUrlResponse>(
    functions,
    'getSignedUrl',
  );
  const result = await fn({ filePath });
  return result.data.url;
}

export async function callGetSignedUploadUrl(params: {
  path: string;
  contentType: string;
}): Promise<SignedUploadUrlResponse> {
  const fn = httpsCallable<SignedUploadUrlRequest, SignedUploadUrlResponse>(
    functions,
    'getSignedUploadUrl',
  );
  const result = await fn(params);
  return result.data;
}

export async function callSendPushNotification(
  params: SendNotificationRequest,
): Promise<boolean> {
  const fn = httpsCallable<SendNotificationRequest, SendNotificationResponse>(
    functions,
    'sendPushNotification',
  );
  const result = await fn(params);
  return result.data.success;
}
