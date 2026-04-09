import type { IRtcEngine } from 'react-native-agora';
import { Platform, PermissionsAndroid } from 'react-native';
import Constants from 'expo-constants';
import { Linking, Alert } from 'react-native';

let engine: IRtcEngine | null = null;
let cachedAgoraModule: (typeof import('react-native-agora')) | null | undefined;

const AGORA_APP_ID: string =
  (Constants.expoConfig?.extra?.agoraAppId as string) ?? '';

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function getAgoraModule(): typeof import('react-native-agora') | null {
  if (cachedAgoraModule !== undefined) return cachedAgoraModule;

  if (isExpoGo()) {
    cachedAgoraModule = null;
    return cachedAgoraModule;
  }

  try {
    cachedAgoraModule = require('react-native-agora') as typeof import('react-native-agora');
  } catch {
    cachedAgoraModule = null;
  }

  return cachedAgoraModule;
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestCallPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      return (
        granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted' &&
        granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted'
      );
    } catch {
      return false;
    }
  }
  // iOS permissions handled via expo Info.plist entries
  return true;
}

export function showPermissionDeniedAlert(): void {
  Alert.alert(
    'Permissions Required',
    'Camera and microphone access are required for video calls. Please enable them in Settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => Linking.openSettings(),
      },
    ],
  );
}

// ─── Engine Lifecycle ─────────────────────────────────────────────────────────

export async function initAgoraEngine(): Promise<IRtcEngine> {
  if (engine) return engine;

  const agora = getAgoraModule();
  if (!agora) {
    throw new Error(
      'react-native-agora is unavailable. Use a development build instead of Expo Go for video calling.',
    );
  }

  if (!AGORA_APP_ID) {
    throw new Error('Missing AGORA_APP_ID. Add it to your app config extra values.');
  }

  engine = agora.createAgoraRtcEngine();
  engine.initialize({
    appId: AGORA_APP_ID,
    channelProfile: agora.ChannelProfileType.ChannelProfileCommunication,
  });
  engine.enableVideo();
  return engine;
}

export async function destroyAgoraEngine(): Promise<void> {
  if (engine) {
    engine.leaveChannel();
    engine.release();
    engine = null;
  }
}

// ─── Channel Join / Leave ─────────────────────────────────────────────────────

export async function joinChannel(params: {
  token: string;
  channelName: string;
  uid: number;
}): Promise<void> {
  const { token, channelName, uid } = params;
  const rtcEngine = await initAgoraEngine();
  rtcEngine.joinChannel(token, channelName, uid, {
    clientRoleType: getAgoraModule()!.ClientRoleType.ClientRoleBroadcaster,
    publishCameraTrack: true,
    publishMicrophoneTrack: true,
  });
}

export async function leaveChannel(): Promise<void> {
  engine?.leaveChannel();
}

// ─── Controls ─────────────────────────────────────────────────────────────────

export function muteLocalAudio(muted: boolean): void {
  engine?.muteLocalAudioStream(muted);
}

export function muteLocalVideo(muted: boolean): void {
  engine?.muteLocalVideoStream(muted);
}

export function getEngine(): IRtcEngine | null {
  return engine;
}
