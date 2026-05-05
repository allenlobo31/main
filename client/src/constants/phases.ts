import { Phase } from '../types';
import { differenceInDays } from 'date-fns';

export interface PhaseConfig {
  id: Phase;
  label: string;
  color: string;
  description: string;
  dailyTasks: string[];
}

export const PHASE_CONFIGS: Record<Phase, PhaseConfig> = {
  'pre-op': {
    id: 'pre-op',
    label: 'Pre-Op',
    color: '#5b8dd9',
    description: 'Preparing for your surgery.',
    dailyTasks: [
      'medication_logged',
      'morning_wound_check',
    ],
  },
  'post-op': {
    id: 'post-op',
    label: 'Post-Op',
    color: '#7c6ef7',
    description: 'Recovering in the first two weeks after surgery.',
    dailyTasks: [
      'morning_wound_check',
      'medication_logged',
      'wound_photo',
      'pain_level',
    ],
  },
  recovery: {
    id: 'recovery',
    label: 'Recovery',
    color: '#3a7050',
    description: 'Progressing through full recovery.',
    dailyTasks: [
      'morning_wound_check',
      'pain_level',
    ],
  },
};

/**
 * Determine if a patient should transition from pre-op to post-op.
 * Transition occurs when surgeryDate is set and today >= surgeryDate.
 */
export function shouldTransitionToPostOp(
  surgeryDate: Date | string | null,
): boolean {
  if (!surgeryDate) return false;
  const today = new Date();
  const surgery = surgeryDate instanceof Date ? surgeryDate : new Date(surgeryDate);
  return today >= surgery;
}

/**
 * Determine if a patient should transition from post-op to recovery.
 * Conditions:
 * - At least 14 days since surgeryDate
 * - No AI flags in the last 7 days
 * - At least 10 symptom logs submitted
 */
export function shouldTransitionToRecovery(params: {
  surgeryDate: Date | string | null;
  recentAIFlags: boolean; // true if any flags in last 7 days
  totalSymptomLogs: number;
}): boolean {
  const { surgeryDate, recentAIFlags, totalSymptomLogs } = params;
  if (!surgeryDate) return false;
  const daysSinceSurgery = differenceInDays(
    new Date(),
    surgeryDate instanceof Date ? surgeryDate : new Date(surgeryDate),
  );
  return (
    daysSinceSurgery >= 14 &&
    !recentAIFlags &&
    totalSymptomLogs >= 10
  );
}
