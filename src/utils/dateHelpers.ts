import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  differenceInDays,
  differenceInCalendarDays,
  startOfDay,
  parseISO,
  isSameDay,
  isValid,
} from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// ─── Timestamp Helpers ────────────────────────────────────────────────────────

export function timestampToDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null;
  return ts.toDate();
}

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function nowTimestamp(): Timestamp {
  return Timestamp.now();
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatDate(ts: Timestamp | null | undefined): string {
  const date = timestampToDate(ts);
  if (!date) return '—';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatDateTime(ts: Timestamp | null | undefined): string {
  const date = timestampToDate(ts);
  if (!date) return '—';
  return format(date, 'MMM d, yyyy · h:mm a');
}

export function formatRelative(ts: Timestamp | null | undefined): string {
  const date = timestampToDate(ts);
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function todayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ─── Streak Logic ─────────────────────────────────────────────────────────────

export type StreakStatus = 'increment' | 'reset' | 'already_checked';

/**
 * Determine what streak action to take based on lastCheckIn.
 * - already_checked: user already checked in today
 * - increment: lastCheckIn was yesterday → increment streak
 * - reset: lastCheckIn was more than 1 day ago → reset streak to 1
 */
export function getStreakStatus(lastCheckIn: Timestamp | null): StreakStatus {
  if (!lastCheckIn) return 'increment';
  const lastDate = startOfDay(lastCheckIn.toDate());
  const today = startOfDay(new Date());
  const diff = differenceInDays(today, lastDate);

  if (diff === 0) return 'already_checked';
  if (diff === 1) return 'increment';
  return 'reset';
}

// ─── Phase Date Helpers ───────────────────────────────────────────────────────

export function daysSinceSurgery(surgeryDate: Timestamp | null): number | null {
  if (!surgeryDate) return null;
  return differenceInDays(new Date(), surgeryDate.toDate());
}

export function isSurgeryToday(surgeryDate: Timestamp | null): boolean {
  if (!surgeryDate) return false;
  return isSameDay(new Date(), surgeryDate.toDate());
}

// ─── General Helpers ──────────────────────────────────────────────────────────

export function parseDateString(dateStr: string): Date {
  return parseISO(dateStr);
}

export function parseISODateOnly(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

export function surgeryCountdownLabel(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const target = parseISODateOnly(dateStr);
  if (!target) return null;

  const today = startOfDay(new Date());
  const surgeryDate = startOfDay(target);
  const days = differenceInCalendarDays(surgeryDate, today);

  if (days > 1) return `${days} days remaining`;
  if (days === 1) return '1 day remaining';
  if (days === 0) return 'Surgery is today';
  return 'Surgery date has passed';
}

export function isOlderThan(ts: Timestamp | null, minutes: number): boolean {
  if (!ts) return true;
  const ageMs = Date.now() - ts.toDate().getTime();
  return ageMs > minutes * 60 * 1000;
}
