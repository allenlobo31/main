import { Timestamp } from 'firebase/firestore';

// ─── Auth / User ─────────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'doctor';

export type Gender = 'male' | 'female' | 'other';
export type HerniaType = 'inguinal' | 'femoral' | 'umbilical' | 'incisional';
export type OperationStage = 'pre-operation' | 'post-operation';
export type SurgeryStatus = 'not-done' | 'scheduled' | 'completed';
export type SurgeryType = 'open' | 'laparoscopic';

export interface User {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl: string;
  gender?: Gender | null;
  herniaType?: HerniaType | null;
  operationStage?: OperationStage | null;
  surgeryStatus?: SurgeryStatus | null;
  surgeryType?: SurgeryType | null;
  scheduledSurgeryDate?: string | null;
  profileSetupCompleted?: boolean;
  place?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContactNumber?: string;
  createdAt: Timestamp;
  expoPushToken?: string;
}

export interface PatientProfile extends User {
  role: 'patient';
  linkedDoctorId: string | null;
}

export interface DoctorProfile extends User {
  role: 'doctor';
  linkedPatientIds: string[];
}

// ─── Gamification ────────────────────────────────────────────────────────────

export type Phase = 'pre-op' | 'post-op' | 'recovery';

export type BadgeId =
  | 'first_checkin'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'photo_uploader'
  | 'diary_starter'
  | 'call_made'
  | 'week_warrior'
  | 'pain_free'
  | 'recovery_hero';

export interface Badge {
  id: BadgeId;
  label: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  streakDays: number;
  lastCheckIn: Timestamp | null;
  badges: BadgeId[];
  phase: Phase;
  surgeryDate: Timestamp | null;
  tasksCompletedToday: string[];
  lastTaskResetDate?: string;
}

export interface Task {
  id: string;
  label: string;
  xpReward: number;
  completed: boolean;
  icon: string;
}

export interface LevelDefinition {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
}

// ─── Symptoms / AI ───────────────────────────────────────────────────────────

export type SwellingLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type PainTrend = 'improving' | 'stable' | 'worsening';
export type AISeverity = 'normal' | 'watch' | 'urgent';

export interface SymptomEntry {
  id: string;
  date: Timestamp;
  painLevel: number; // 1–10
  swelling: SwellingLevel;
  fever: boolean;
  nausea: boolean;
  woundCondition: string;
  additionalNotes: string;
  aiFlag: boolean;
  aiFlagReason: string | null;
  aiAnalyzedAt: Timestamp | null;
}

export interface AIFlag {
  reason: string;
  severity: AISeverity;
  timestamp: Timestamp;
}

export interface AIInsight {
  generatedAt: Timestamp;
  painTrend: PainTrend;
  flags: string[];
  recommendation: string;
  rawAnalysis: string;
}

export type WoundHealingStage = 'early' | 'mid' | 'late';
export type RednessLevel = 'none' | 'mild' | 'moderate' | 'severe';

export interface WoundAnalysis {
  healingStage: WoundHealingStage;
  rednessLevel: RednessLevel;
  swellingVisible: boolean;
  dischargeSeen: boolean;
  recommendation: string;
}

// ─── Diary ───────────────────────────────────────────────────────────────────

export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface DiaryEntry {
  id: string;
  date: Timestamp;
  text: string;
  mood: MoodType;
  aiSummary: string | null;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export type ReportType = 'scan' | 'discharge' | 'wound_photo' | 'lab' | 'other';

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  fileUrl: string;
  encryptedKey: string;
  uploadedAt: Timestamp;
  accessibleTo: string[];
  aiWoundAnalysis: string | null;
}

// ─── Experts / Consultations ─────────────────────────────────────────────────

export type ExpertRole = 'surgeon' | 'physiotherapist' | 'pain_specialist' | 'nurse';

export interface Expert {
  id: string;
  name: string;
  role: ExpertRole;
  avatarUrl: string;
  agoraUid: number;
  isOnline: boolean;
  lastActive: Timestamp;
  rating: number;
  totalCalls: number;
}

export interface Consultation {
  id: string;
  patientId: string;
  expertId: string;
  startedAt: Timestamp;
  endedAt: Timestamp | null;
  durationSeconds: number | null;
  agoraChannelName: string;
  aiSummary: string | null;
  recordingUrl: string | null;
}

// ─── Call ────────────────────────────────────────────────────────────────────

export type CallState = 'idle' | 'connecting' | 'connected' | 'ended';

export interface AgoraTokenResponse {
  token: string;
  channelName: string;
  appId: string;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface AppTheme {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    primary: string;
    primaryLight: string;
    accent: string;
    success: string;
    successLight: string;
    danger: string;
    dangerLight: string;
    warning: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
  };
  typography: {
    h1: { fontSize: number; fontWeight: '700' };
    h2: { fontSize: number; fontWeight: '600' };
    h3: { fontSize: number; fontWeight: '600' };
    body: { fontSize: number; fontWeight: '400' };
    caption: { fontSize: number; fontWeight: '400' };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'daily_reminder'
  | 'streak_reminder'
  | 'ai_flag'
  | 'call_incoming'
  | 'badge_unlocked';

export interface PushNotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  lastDoc: unknown | null;
}

// ─── Analytics Events ────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  name:
    | 'screen_view'
    | 'symptom_logged'
    | 'xp_earned'
    | 'badge_unlocked'
    | 'call_started'
    | 'call_ended'
    | 'report_uploaded';
  params: {
    userId: string;
    phase: Phase;
    [key: string]: string | number | boolean;
  };
}
