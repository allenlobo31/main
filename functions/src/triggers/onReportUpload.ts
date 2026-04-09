import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

const db = admin.firestore();
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Firestore trigger: runs when a new report is uploaded.
 * If type is 'wound_photo', calls Claude vision to analyze the wound.
 * Idempotent: skips if already processed.
 */
export const onReportUpload = functions.firestore.onDocumentCreated(
  {
    document: 'users/{userId}/reports/{reportId}',
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    if (!data || data.type !== 'wound_photo') return;

    // Idempotency
    if (data.aiWoundAnalysis) {
      console.log('[onReportUpload] Already processed.');
      return;
    }

    const { userId, reportId } = event.params;

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
      const claude = new Anthropic({ apiKey });

      // Download file from Storage
      const bucket = admin.storage().bucket();
      const [fileContents] = await bucket.file(data.fileUrl).download();
      const base64Image = fileContents.toString('base64');

      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        system: `You are assisting a surgical care app. Analyze this wound image 
for a hernia repair patient and return JSON with: 
healingStage ('early'|'mid'|'late'), rednessLevel ('none'|'mild'|
'moderate'|'severe'), swellingVisible (boolean), 
dischargeSeen (boolean), recommendation (plain language string). 
Do not diagnose. Recommend professional review if uncertain.`,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
              { type: 'text', text: 'Please analyze this wound photo.' },
            ],
          },
        ],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      const analysisJson = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';

      await snapshot.ref.update({
        aiWoundAnalysis: analysisJson,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('[onReportUpload] error:', error);
      await db.collection('errors').add({
        userId,
        functionName: 'onReportUpload',
        error: String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  },
);
