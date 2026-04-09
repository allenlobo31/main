import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HerniaCare',
  slug: 'herniacare',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0f0f1a',
  },

  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.herniacare.app',
    infoPlist: {
      NSCameraUsageDescription:
        'HerniaCare uses your camera to capture wound photos for upload and video calls with your expert.',
      NSMicrophoneUsageDescription:
        'HerniaCare uses your microphone for video consultations with your care team.',
      NSPhotoLibraryUsageDescription:
        'HerniaCare accesses your photo library to let you upload medical reports and wound photos.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0f0f1a',
    },
    package: 'com.herniacare.app',
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'RECORD_AUDIO',
      'INTERNET',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#7c6ef7',
        defaultChannel: 'herniacare-default',
      },
    ],

    [
      'expo-image-picker',
      {
        photosPermission:
          'HerniaCare accesses your photo library to upload medical reports.',
        cameraPermission:
          'HerniaCare uses your camera to capture wound photos.',
      },
    ],
    'expo-secure-store',
  ],
  scheme: 'herniacare',
  extra: {
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
    agoraAppId: process.env.AGORA_APP_ID,
    easProjectId: process.env.EAS_PROJECT_ID,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
