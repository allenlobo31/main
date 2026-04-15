import { Badge, BadgeId, LevelDefinition } from '../types';

// ─── XP Values ───────────────────────────────────────────────────────────────

export const XP_VALUES = {
  DAILY_CHECKIN: 10,
  SYMPTOM_LOG: 20,
  WOUND_PHOTO: 30,
  DIARY_ENTRY: 15,
  EXPERT_CALL: 50,
  STREAK_BONUS_7: 100,
  REPORT_UPLOAD: 25,
} as const;

// ─── Level Thresholds ─────────────────────────────────────────────────────────

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: 'Beginner', minXP: 0, maxXP: 199 },
  { level: 2, title: 'Aware', minXP: 200, maxXP: 499 },
  { level: 3, title: 'Warrior', minXP: 500, maxXP: 999 },
  { level: 4, title: 'Resilient', minXP: 1000, maxXP: 1999 },
  { level: 5, title: 'Champion', minXP: 2000, maxXP: 3999 },
  { level: 6, title: 'Recovery Hero', minXP: 4000, maxXP: Infinity },
];

export function getLevelForXP(xp: number): LevelDefinition {
  return (
    [...LEVELS].reverse().find((l) => xp >= l.minXP) ?? LEVELS[0]
  );
}

export function getXPProgressInLevel(xp: number): number {
  const level = getLevelForXP(xp);
  if (level.maxXP === Infinity) return 1;
  const range = level.maxXP - level.minXP + 1;
  const earned = xp - level.minXP;
  return Math.min(earned / range, 1);
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export const BADGES: Record<BadgeId, Badge> = {
  first_checkin: {
    id: 'first_checkin',
    label: 'First Check-In',
    description: 'Logged your first symptom report.',
    icon: 'Hospital',
    xpReward: 0,
  },
  streak_3: {
    id: 'streak_3',
    label: '3-Day Streak',
    description: 'Logged symptoms for 3 days in a row.',
    icon: 'Flame',
    xpReward: 30,
  },
  streak_7: {
    id: 'streak_7',
    label: 'Week Streak',
    description: 'Logged symptoms for 7 days in a row.',
    icon: 'Flame',
    xpReward: 100,
  },
  streak_30: {
    id: 'streak_30',
    label: '30-Day Streak',
    description: 'Logged symptoms for 30 days in a row — incredible!',
    icon: 'Zap',
    xpReward: 500,
  },
  photo_uploader: {
    id: 'photo_uploader',
    label: 'Photo Uploader',
    description: 'Uploaded your first wound photo.',
    icon: 'Camera',
    xpReward: 0,
  },
  diary_starter: {
    id: 'diary_starter',
    label: 'Diary Starter',
    description: 'Wrote your first recovery diary entry.',
    icon: 'Book',
    xpReward: 0,
  },
  call_made: {
    id: 'call_made',
    label: 'First Call',
    description: 'Completed your first expert video consultation.',
    icon: 'Phone',
    xpReward: 0,
  },
  week_warrior: {
    id: 'week_warrior',
    label: 'Week Warrior',
    description: 'Completed all daily tasks for a full week.',
    icon: 'Shield',
    xpReward: 150,
  },
  pain_free: {
    id: 'pain_free',
    label: 'Pain-Free Days',
    description: 'Logged pain ≤ 2 for 3 consecutive days.',
    icon: 'Activity',
    xpReward: 75,
  },
  recovery_hero: {
    id: 'recovery_hero',
    label: 'Recovery Hero',
    description: 'Transitioned to the Recovery phase.',
    icon: 'Star',
    xpReward: 200,
  },
};

// ─── Daily Task Definitions ────────────────────────────────────────────────────

export const DAILY_TASKS = [
  {
    id: 'daily_logging',
    label: 'Every day logging',
    xpReward: XP_VALUES.DAILY_CHECKIN,
    icon: 'Bandage',
  },
  {
    id: 'wound_photo',
    label: 'Wound photo upload',
    xpReward: XP_VALUES.WOUND_PHOTO,
    icon: 'Camera',
  },
  {
    id: 'symptoms_logging',
    label: 'Symptoms logging',
    xpReward: XP_VALUES.SYMPTOM_LOG,
    icon: 'BarChart',
  },
  {
    id: 'medication_logged',
    label: 'Medication reminder',
    xpReward: XP_VALUES.DAILY_CHECKIN,
    icon: 'Pill',
  },
] as const;
