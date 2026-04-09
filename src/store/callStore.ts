import { create } from 'zustand';
import { CallState, Consultation } from '../types';
import {
  db,
  consultationsCol,
  addDoc,
  updateDoc,
  serverTimestamp,
} from '../services/firebase/firestore';
import { doc } from 'firebase/firestore';
import { callGenerateAgoraToken } from '../services/firebase/functions';

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
        const { token, channelName, appId } = await callGenerateAgoraToken({
          patientId,
          expertId,
        });

        // Create consultation doc
        const col = consultationsCol();
        const consultDoc = await addDoc(col as never, {
          patientId,
          expertId,
          startedAt: serverTimestamp(),
          endedAt: null,
          durationSeconds: null,
          agoraChannelName: channelName,
          aiSummary: null,
          recordingUrl: null,
        });

        set({
          agoraToken: token,
          agoraChannelName: channelName,
          agoraAppId: appId,
          callStartTime: Date.now(),
          currentConsultation: {
            id: consultDoc.id,
            patientId,
            expertId,
            startedAt: new (require('firebase/firestore').Timestamp).now(),
            endedAt: null,
            durationSeconds: null,
            agoraChannelName: channelName,
            aiSummary: null,
            recordingUrl: null,
          },
        });
      } catch (error) {
        console.error('[CallStore] initiateCall error:', error);
        set({ callState: 'idle' });
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
        if (state.currentConsultation?.id) {
          const consultRef = doc(db, 'consultations', state.currentConsultation.id);
          await updateDoc(consultRef, {
            endedAt: serverTimestamp(),
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
