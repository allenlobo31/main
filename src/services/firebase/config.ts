import Constants from 'expo-constants';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

for (const key of REQUIRED_KEYS) {
  if (!extra[key]) {
    console.warn(
      `[HerniaCare] Missing env var: ${key}. Copy .env.template to .env and fill in Firebase credentials.`,
    );
  }
}

const firebaseConfig = {
  apiKey: (extra.firebaseApiKey as string) ?? 'PLACEHOLDER',
  authDomain: (extra.firebaseAuthDomain as string) ?? 'PLACEHOLDER',
  projectId: (extra.firebaseProjectId as string) ?? 'PLACEHOLDER',
  storageBucket: (extra.firebaseStorageBucket as string) ?? 'PLACEHOLDER',
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
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApps()[0]!;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

export { app, auth, firebaseConfig };
