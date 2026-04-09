import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcConnection,
} from 'react-native-agora';
import { Platform, PermissionsAndroid } from 'react-native';
import Constants from 'expo-constants';
import { Linking, Alert } from 'react-native';

let engine: IRtcEngine | null = null;

const AGORA_APP_ID: string =
  (Constants.expoConfig?.extra?.agoraAppId as string) ?? '';

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
  engine = createAgoraRtcEngine();
  engine.initialize({
    appId: AGORA_APP_ID,
    channelProfile: ChannelProfileType.ChannelProfileCommunication,
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
    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
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
