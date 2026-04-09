import '../bootstrap';
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

const db = admin.firestore();
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Firestore trigger: runs when a new diary entry is created.
 * Summarizes recent diary entries and writes aiSummary back.
 */
export const onDiaryEntry = functions.firestore.onDocumentCreated(
  {
    document: 'users/{userId}/diary/{entryId}',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    if (!data) return;

    // Idempotency
    if (data.aiSummary !== null && data.aiSummary !== undefined) return;

    const { userId } = event.params;

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
      const claude = new Anthropic({ apiKey });

      // Fetch last 5 diary entries for context
      const recentDiary = await db
        .collection(`users/${userId}/diary`)
        .orderBy('date', 'desc')
        .limit(5)
        .get();

      const entries = recentDiary.docs.map((d) => ({
        text: d.data().text,
        mood: d.data().mood,
        date: d.data().date?.toDate?.()?.toISOString() ?? '',
      }));

      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Summarize the recurring themes in these recovery diary entries in 2-3 plain-language sentences. Be warm and supportive.
Entries: ${JSON.stringify(entries)}`,
          },
        ],
      });

      const summary =
        response.content[0]?.type === 'text' ? response.content[0].text : null;

      await snapshot.ref.update({ aiSummary: summary });
    } catch (error) {
      console.error('[onDiaryEntry] error:', error);
      await db.collection('errors').add({
        userId,
        functionName: 'onDiaryEntry',
        error: String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  },
);
