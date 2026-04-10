import { getFunctions, httpsCallable } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import Constants from 'expo-constants';
import { app } from './config';
import { AgoraTokenResponse } from '../../types';

const extra = Constants.expoConfig?.extra ?? {};
const configuredRegion =
  typeof extra.firebaseFunctionsRegion === 'string' && extra.firebaseFunctionsRegion.trim()
    ? extra.firebaseFunctionsRegion.trim()
    : 'us-central1';
const fallbackRegions = ['us-central1', 'asia-south1', 'europe-west1'].filter(
  (region, index, all) => region !== configuredRegion && all.indexOf(region) === index,
);

function getCallable<TReq, TRes>(region: string, name: string) {
  const regionFns = getFunctions(app, region);
  return httpsCallable<TReq, TRes>(regionFns, name);
}

async function callWithRegionFallback<TReq, TRes>(name: string, payload: TReq): Promise<TRes> {
  const regionsToTry = [configuredRegion, ...fallbackRegions];
  let lastError: unknown = null;

  for (const region of regionsToTry) {
    try {
      const fn = getCallable<TReq, TRes>(region, name);
      const result = await fn(payload);
      if (region !== configuredRegion) {
        console.warn('[functions] callable succeeded in fallback region', {
          name,
          configuredRegion,
          resolvedRegion: region,
        });
      }
      return result.data;
    } catch (error) {
      lastError = error;
      if (!(error instanceof FirebaseError) || error.code !== 'functions/not-found') {
        throw error;
      }
    }
  }

  throw lastError;
}

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

interface UploadEncryptedReportRequest {
  path: string;
  contentType: string;
  dataBase64: string;
}

interface UploadEncryptedReportResponse {
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
  return callWithRegionFallback<AgoraTokenRequest, AgoraTokenResponse>(
    'generateAgoraToken',
    params,
  );
}

export async function callGetSignedUrl(filePath: string): Promise<string> {
  const result = await callWithRegionFallback<SignedUrlRequest, SignedUrlResponse>(
    'getSignedUrl',
    { filePath },
  );
  return result.url;
}

export async function callGetSignedUploadUrl(params: {
  path: string;
  contentType: string;
}): Promise<SignedUploadUrlResponse> {
  return callWithRegionFallback<SignedUploadUrlRequest, SignedUploadUrlResponse>(
    'getSignedUploadUrl',
    params,
  );
}

export async function callUploadEncryptedReport(params: {
  path: string;
  contentType: string;
  dataBase64: string;
}): Promise<UploadEncryptedReportResponse> {
  return callWithRegionFallback<UploadEncryptedReportRequest, UploadEncryptedReportResponse>(
    'uploadEncryptedReport',
    params,
  );
}

export async function callSendPushNotification(
  params: SendNotificationRequest,
): Promise<boolean> {
  const result = await callWithRegionFallback<SendNotificationRequest, SendNotificationResponse>(
    'sendPushNotification',
    params,
  );
  return result.success;
}
