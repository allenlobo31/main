import { create } from 'zustand';
import { CallState, Consultation } from '../types';
import apiClient from '../services/apiClient';

interface CallStoreState {
  callState: CallState;
  currentConsultation: Consultation | null;
  agoraToken: string | null;
  agoraChannelName: string | null;
  agoraAppId: string | null;
  callStartTime: number | null;
}

interface CallStoreActions {
  initiateCall: (params: { patientId: string; expertId: string }) => Promise<void>;
  joinCall: () => void;
  endCall: (userId: string) => Promise<void>;
  resetCall: () => void;
}

const INITIAL_STATE: CallStoreState = {
  callState: 'idle',
  currentConsultation: null,
  agoraToken: null,
  agoraChannelName: null,
  agoraAppId: null,
  callStartTime: null,
};

export const useCallStore = create<CallStoreState & CallStoreActions>()(
  (set, get) => ({
    ...INITIAL_STATE,

    initiateCall: async ({ patientId, expertId }) => {
      set({ callState: 'connecting' });
      try {
        const response = await apiClient.post('/call/initiate', { patientId, expertId });
        const { token, channelName, appId, consultDocId } = response.data;

        set({
          agoraToken: token,
          agoraChannelName: channelName,
          agoraAppId: appId,
          callStartTime: Date.now(),
          currentConsultation: {
            id: consultDocId || `consult-${Date.now()}`,
            patientId,
            expertId,
            startedAt: new Date(),
            endedAt: null,
            durationSeconds: null,
            agoraChannelName: channelName,
            aiSummary: null,
            recordingUrl: null,
          },
        });
      } catch (error) {
        console.error('[CallStore] initiateCall error:', error);
        
        // Fallback for development if server is not configured
        console.warn('Falling back to dummy token for development');
        const channelName = `channel_${Date.now()}`;
        set({
          agoraToken: 'dummy-token',
          agoraChannelName: channelName,
          agoraAppId: 'dummy-app-id',
          callStartTime: Date.now(),
          currentConsultation: {
            id: `consult-${Date.now()}`,
            patientId,
            expertId,
            startedAt: new Date() as any,
            endedAt: null,
            durationSeconds: null,
            agoraChannelName: channelName,
            aiSummary: null,
            recordingUrl: null,
          },
        });
      }
    },

    joinCall: () => {
      set({ callState: 'connected', callStartTime: Date.now() });
    },

    endCall: async (consultationId) => {
      const state = get();
      const startTime = state.callStartTime;
      const durationSeconds = startTime
        ? Math.floor((Date.now() - startTime) / 1000)
        : 0;

      set({ callState: 'ended' });

      try {
        if (state.currentConsultation?.id && !state.currentConsultation.id.startsWith('consult-')) {
          await apiClient.put(`/call/${state.currentConsultation.id}/end`, {
            durationSeconds,
          });
        }
      } catch (error) {
        console.error('[CallStore] endCall update error:', error);
      }

      // Auto-reset after brief delay (let UI show ended state)
      setTimeout(() => {
        set({ ...INITIAL_STATE });
      }, 2000);
    },

    resetCall: () => set({ ...INITIAL_STATE }),
  }),
);
