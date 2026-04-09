import { z } from 'zod';

// ─── Auth Validators ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['patient', 'doctor']),
});

// ─── Symptom Log Validator ────────────────────────────────────────────────────

export const symptomLogSchema = z.object({
  painLevel: z
    .number()
    .min(1, 'Pain level must be at least 1.')
    .max(10, 'Pain level cannot exceed 10.'),
  swelling: z.enum(['none', 'mild', 'moderate', 'severe']),
  fever: z.boolean(),
  nausea: z.boolean(),
  woundCondition: z.string().min(1, 'Please describe the wound condition.'),
  additionalNotes: z.string(),
});

// ─── Diary Entry Validator ────────────────────────────────────────────────────

export const diaryEntrySchema = z.object({
  text: z
    .string()
    .min(10, 'Please write at least 10 characters.')
    .max(2000, 'Entry cannot exceed 2000 characters.'),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']),
});

// ─── AI Response Validators (zod schemas for Cloud Function responses) ────────

export const aiInsightSchema = z.object({
  painTrend: z.enum(['improving', 'stable', 'worsening']),
  flags: z.array(z.string()),
  recommendation: z.string(),
  rawAnalysis: z.string().optional().default(''),
});

export const woundAnalysisSchema = z.object({
  healingStage: z.enum(['early', 'mid', 'late']),
  rednessLevel: z.enum(['none', 'mild', 'moderate', 'severe']),
  swellingVisible: z.boolean(),
  dischargeSeen: z.boolean(),
  recommendation: z.string(),
});

// ─── Report Upload Validator ──────────────────────────────────────────────────

export const reportUploadSchema = z.object({
  title: z.string().min(1, 'Please enter a title for the report.'),
  type: z.enum(['scan', 'discharge', 'wound_photo', 'lab', 'other']),
});

// ─── Helper: safe parse with typed result ────────────────────────────────────

export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  return {
    success: false,
    error: firstError?.message ?? 'Validation error.',
  };
}
