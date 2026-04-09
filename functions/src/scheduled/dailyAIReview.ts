import '../bootstrap';
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

const db = admin.firestore();
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Scheduled function: runs daily at 8am UTC.
 * Aggregates last 24h symptoms for every patient and generates AI insights.
 */
export const dailyAIReview = functions.scheduler.onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'UTC',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
      const claude = new Anthropic({ apiKey });

      // Find all patients (role = patient)
      const usersSnap = await db
        .collection('users')
        .where('role', '==', 'patient')
        .get();

      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;

        // Check if insight already generated today (idempotency)
        const existingInsight = await db
          .doc(`aiInsights/${userId}/daily/${today}`)
          .get();
        if (existingInsight.exists && existingInsight.data()?.processedAt) {
          continue;
        }

        // Get symptoms from the last 24h
        const symptomsSnap = await db
          .collection(`users/${userId}/symptoms`)
          .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(yesterday)))
          .orderBy('date', 'desc')
          .limit(10)
          .get();

        if (symptomsSnap.empty) continue;

        const symptoms = symptomsSnap.docs.map((d) => d.data());

        try {
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
                content: `Daily review for patient ${userId}. Symptoms: ${JSON.stringify(symptoms)}`,
              },
            ],
          });

          const text =
            response.content[0]?.type === 'text' ? response.content[0].text : '{}';
          const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');

          await db.doc(`aiInsights/${userId}/daily/${today}`).set({
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            painTrend: parsed.painTrend ?? 'stable',
            flags: parsed.flags ?? [],
            recommendation: parsed.recommendation ?? '',
            rawAnalysis: text,
          });

          // Send notification if urgent
          if (parsed.severity === 'urgent' || (parsed.flags?.length ?? 0) > 0) {
            const pushToken = userDoc.data()?.expoPushToken;
            if (pushToken) {
              await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: pushToken,
                  title: '⚠️ Daily AI Review',
                  body: 'Your AI monitor flagged a concern. Tap to review.',
                  data: { type: 'ai_flag', screen: '/(patient)/ai-monitor' },
                }),
              });
            }
          }
        } catch (innerError) {
          console.error(`[dailyAIReview] Error for user ${userId}:`, innerError);
        }
      }
    } catch (error) {
      console.error('[dailyAIReview] Fatal error:', error);
    }
  },
);
