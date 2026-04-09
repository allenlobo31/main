import '../bootstrap';
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

const db = admin.firestore();

const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

async function getClaudeClient(): Promise<Anthropic> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? functions.params.defineSecret('ANTHROPIC_API_KEY').value();
  return new Anthropic({ apiKey });
}

/**
 * Firestore trigger: runs when a new symptom entry is created.
 * Analyzes symptoms with Claude and writes back aiFlag, aiFlagReason, aiAnalyzedAt.
 * Idempotent: skips if processedAt already set.
 */
export const onSymptomLog = functions.firestore.onDocumentCreated(
  {
    document: 'users/{userId}/symptoms/{entryId}',
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    if (!data) return;

    // Idempotency check
    if (data.aiAnalyzedAt) {
      console.log('[onSymptomLog] Already processed, skipping.');
      return;
    }

    const { userId } = event.params;

    try {
      // Fetch last 7 symptoms for context
      const recent = await db
        .collection(`users/${userId}/symptoms`)
        .orderBy('date', 'desc')
        .limit(7)
        .get();

      const symptomsContext = recent.docs.map((d) => d.data());

      const claude = await getClaudeClient();

      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        system: `You are a clinical AI assistant monitoring post-operative hernia 
recovery patients. Analyze the symptom history and return a JSON 
object with fields: painTrend, flags (array of red flag strings), 
recommendation (1-2 sentences plain language for patient), 
severity ('normal'|'watch'|'urgent'). Be conservative — flag 
anything that could indicate infection, recurrence, or complications.`,
        messages: [
          {
            role: 'user',
            content: `Latest symptom: ${JSON.stringify(data)}\nHistory: ${JSON.stringify(symptomsContext)}`,
          },
        ],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');

      const isUrgent = parsed.severity === 'urgent' || (parsed.flags?.length ?? 0) > 0;

      await snapshot.ref.update({
        aiFlag: isUrgent,
        aiFlagReason: isUrgent ? (parsed.flags?.[0] ?? 'AI detected a concern') : null,
        aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Store daily insight
      const today = new Date().toISOString().slice(0, 10);
      await db.doc(`aiInsights/${userId}/daily/${today}`).set(
        {
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          painTrend: parsed.painTrend ?? 'stable',
          flags: parsed.flags ?? [],
          recommendation: parsed.recommendation ?? '',
          rawAnalysis: text,
        },
        { merge: true },
      );

      // Send push notification if flagged
      if (isUrgent) {
        const userDoc = await db.doc(`users/${userId}`).get();
        const pushToken = userDoc.data()?.expoPushToken;
        if (pushToken) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: pushToken,
              title: '⚠️ AI Health Alert',
              body: 'Your AI monitor flagged a concern. Tap to review.',
              data: { type: 'ai_flag', screen: '/(patient)/ai-monitor' },
            }),
          });
        }
      }
    } catch (error) {
      console.error('[onSymptomLog] error:', error);
      await db.collection('errors').add({
        userId,
        functionName: 'onSymptomLog',
        error: String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  },
);
