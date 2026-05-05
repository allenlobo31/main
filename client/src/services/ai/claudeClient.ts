import apiClient from '../apiClient';
import { AIInsight, WoundAnalysis, SymptomEntry, PatientProfile } from '../../types';
import { aiInsightSchema, woundAnalysisSchema } from '../../utils/validators';

// ─── Fallback values ──────────────────────────────────────────────────────────

const FALLBACK_INSIGHT: AIInsight = {
  generatedAt: new Date().toISOString(),
  painTrend: 'stable',
  flags: [],
  recommendation:
    'Unable to generate AI analysis at this time. Please continue following your care plan.',
  rawAnalysis: '',
};

const FALLBACK_WOUND: WoundAnalysis = {
  healingStage: 'early',
  rednessLevel: 'none',
  swellingVisible: false,
  dischargeSeen: false,
  recommendation:
    'Unable to analyze the image at this time. Please show it to your care team.',
};

// ─── Error logger ─────────────────────────────────────────────────────────────

async function logAIError(params: {
  userId: string;
  functionName: string;
  error: unknown;
}): Promise<void> {
  try {
    await apiClient.post('/errors', {
      userId: params.userId,
      functionName: params.functionName,
      error: String(params.error),
      timestamp: new Date().toISOString(),
    });
  } catch {
    // silent — never let error logging crash the app
  }
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    return await fn();
  }
}

// ─── 1. Symptom Analysis ─────────────────────────────────────────────────────

interface AnalyzeSymptomsRequest {
  symptoms: SymptomEntry[];
  patientContext: Partial<PatientProfile>;
}

export async function analyzeSymptoms(params: {
  userId: string;
  symptoms: SymptomEntry[];
  patientContext: Partial<PatientProfile>;
}): Promise<AIInsight> {
  const { userId, symptoms, patientContext } = params;
  try {
    const result = await withRetry(() =>
      apiClient.post('/ai/analyze-symptoms', { symptoms, patientContext })
    );
    const parsed = aiInsightSchema.safeParse(result.data);
    if (!parsed.success) throw new Error('Invalid AI response shape');
    return {
      ...parsed.data,
      generatedAt: new Date().toISOString(),
      rawAnalysis: parsed.data.rawAnalysis ?? '',
    };
  } catch (error) {
    await logAIError({ userId, functionName: 'analyzeSymptoms', error });
    return FALLBACK_INSIGHT;
  }
}

// ─── 2. Wound Photo Analysis ─────────────────────────────────────────────────

interface WoundAnalysisRequest {
  base64Image: string;
  userId: string;
}

export async function analyzeWoundPhoto(params: {
  userId: string;
  base64Image: string;
}): Promise<WoundAnalysis> {
  const { userId, base64Image } = params;
  try {
    const result = await withRetry(() =>
      apiClient.post('/ai/analyze-wound', { base64Image, userId })
    );
    const parsed = woundAnalysisSchema.safeParse(result.data);
    if (!parsed.success) throw new Error('Invalid wound analysis response');
    return parsed.data;
  } catch (error) {
    await logAIError({ userId, functionName: 'analyzeWoundPhoto', error });
    return FALLBACK_WOUND;
  }
}

// ─── 3. Diary Insight ─────────────────────────────────────────────────────────

interface DiaryInsightRequest {
  entries: Array<{ text: string; mood: string; date: string }>;
  userId: string;
}

export async function generateDiaryInsight(params: {
  userId: string;
  entries: Array<{ text: string; mood: string; date: string }>;
}): Promise<string> {
  const { userId, entries } = params;
  try {
    const result = await withRetry(() =>
      apiClient.post('/ai/diary-insight', { entries, userId })
    );
    return (result.data as { summary: string }).summary ?? '';
  } catch (error) {
    await logAIError({ userId, functionName: 'generateDiaryInsight', error });
    return '';
  }
}

// ─── 4. Consultation Summary ──────────────────────────────────────────────────

interface ConsultationSummaryRequest {
  transcript: string;
  consultationId: string;
  userId: string;
}

export async function generateConsultationSummary(params: {
  userId: string;
  transcript: string;
  consultationId: string;
}): Promise<string> {
  const { userId, transcript, consultationId } = params;
  try {
    const result = await withRetry(() =>
      apiClient.post('/ai/consultation-summary', { transcript, consultationId, userId })
    );
    return (result.data as { summary: string }).summary ?? '';
  } catch (error) {
    await logAIError({ userId, functionName: 'generateConsultationSummary', error });
    return '';
  }
}
