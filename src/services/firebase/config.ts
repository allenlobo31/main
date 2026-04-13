import Constants from 'expo-constants';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';

// @ts-expect-error — getReactNativePersistence is exported at runtime but not in TS types for web
import { getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// ─── Validate required env vars on app start ─────────────────────────────────

const REQUIRED_KEYS = [
  'firebaseApiKey',
  'firebaseAuthDomain',
  'firebaseProjectId',
  'firebaseStorageBucket',
  'firebaseMessagingSenderId',
  'firebaseAppId',
] as const;

const extra = Constants.expoConfig?.extra ?? {};

function resolveStorageBucket(): string {
  const configuredBucket = typeof extra.firebaseStorageBucket === 'string'
    ? extra.firebaseStorageBucket.trim()
    : '';

  if (configuredBucket && configuredBucket !== 'PLACEHOLDER') {
    if (configuredBucket.startsWith('gs://')) {
      return configuredBucket.slice(5);
    }

    if (configuredBucket.endsWith('.firebasestorage.app')) {
      return configuredBucket.replace(/\.firebasestorage\.app$/, '.appspot.com');
    }

    return configuredBucket;
  }

  const projectId = typeof extra.firebaseProjectId === 'string'
    ? extra.firebaseProjectId.trim()
    : '';

  return projectId ? `${projectId}.appspot.com` : 'PLACEHOLDER';
}

for (const key of REQUIRED_KEYS) {
  if (!extra[key]) {
    console.warn(
      `[HerniaCare] Missing env var: ${key}. Copy .env.template to .env and fill in Firebase credentials.`,
    );
  }
}

export const firebaseConfig = {
  apiKey: (extra.firebaseApiKey as string) ?? 'PLACEHOLDER',
  authDomain: (extra.firebaseAuthDomain as string) ?? 'PLACEHOLDER',
  projectId: (extra.firebaseProjectId as string) ?? 'PLACEHOLDER',
  storageBucket: resolveStorageBucket(),
  messagingSenderId: (extra.firebaseMessagingSenderId as string) ?? 'PLACEHOLDER',
  appId: (extra.firebaseAppId as string) ?? 'PLACEHOLDER',
  measurementId: extra.firebaseMeasurementId as string | undefined,
};

// ─── Initialize Firebase (singleton) ─────────────────────────────────────────

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} else {
  app = getApps()[0]!;
  // After hot-reload the auth instance already exists, just get it.
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // Auth instance already initialized — safe to re-use.
    auth = getAuth(app);
  }
}

export { app, auth };
