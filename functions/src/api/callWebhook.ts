import '../bootstrap';
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * HTTP webhook endpoint for Agora cloud recording callbacks.
 * Updates consultation document with recording URL when recording stops.
 */
export const callWebhook = functions.https.onRequest(
  {
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const body = req.body as {
      eventType?: number;
      payload?: {
        channelName?: string;
        fileList?: Array<{ fileName?: string; fileUrl?: string }>;
      };
    };

    const channelName = body?.payload?.channelName;
    const fileUrl = body?.payload?.fileList?.[0]?.fileUrl ?? null;

    if (!channelName) {
      res.status(400).json({ error: 'Missing channelName' });
      return;
    }

    try {
      // Find consultation by channelName
      const consultSnap = await db
        .collection('consultations')
        .where('agoraChannelName', '==', channelName)
        .limit(1)
        .get();

      if (!consultSnap.empty) {
        await consultSnap.docs[0]?.ref.update({
          recordingUrl: fileUrl,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[callWebhook] error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);
