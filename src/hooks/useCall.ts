import { useCallback } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { useCallStore } from '../store/callStore';
import { useAuthStore } from '../store/authStore';
import { useGamificationStore } from '../store/gamificationStore';
import {
  requestCallPermissions,
  showPermissionDeniedAlert,
  joinChannel,
  leaveChannel,
  destroyAgoraEngine,
} from '../services/call/agoraService';
import { XP_VALUES } from '../constants/gamification';

export function useCall() {
  const store = useCallStore();
  const { user } = useAuthStore();
  const gamStore = useGamificationStore();

  const startCall = useCallback(
    async (expertId: string) => {
      if (!user?.uid) return;

      if (Constants.appOwnership === 'expo') {
        Alert.alert(
          'Development Build Required',
          'Video calling uses native Agora modules and is not available in Expo Go. Build and run a development client to test calls.',
        );
        return;
      }

      const hasPermissions = await requestCallPermissions();
      if (!hasPermissions) {
        showPermissionDeniedAlert();
        return;
      }

      await store.initiateCall({ patientId: user.uid, expertId });

      // Join Agora channel once token is available
      const state = store;
      if (state.agoraToken && state.agoraChannelName) {
        await joinChannel({
          token: state.agoraToken,
          channelName: state.agoraChannelName,
          uid: 0, // Let Agora auto-assign
        });
        store.joinCall();
      }
    },
    [user?.uid],
  );

  const endCall = useCallback(async () => {
    if (!user?.uid) return;
    await leaveChannel();
    await destroyAgoraEngine();
    const consultId = store.currentConsultation?.id ?? user.uid;
    await store.endCall(consultId);

    // Award XP for completing a call
    await gamStore.addXP(user.uid, XP_VALUES.EXPERT_CALL);
  }, [user?.uid]);

  return {
    callState: store.callState,
    currentConsultation: store.currentConsultation,
    agoraChannelName: store.agoraChannelName,
    agoraToken: store.agoraToken,
    agoraAppId: store.agoraAppId,
    startCall,
    endCall,
    resetCall: store.resetCall,
  };
}
