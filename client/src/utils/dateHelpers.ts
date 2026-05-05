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

// ─── Timestamp Helpers (Mocking Firebase for backward compatibility) ──────────

export function timestampToDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function dateToTimestamp(date: Date): string {
  return date.toISOString();
}

export function nowTimestamp(): string {
  return new Date().toISOString();
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatDate(dateInput: string | Date | null | undefined): string {
  const date = timestampToDate(dateInput);
  if (!date) return '—';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  const date = timestampToDate(dateInput);
  if (!date) return '—';
  return format(date, 'MMM d, yyyy · h:mm a');
}

export function formatRelative(ts: Date | string | null | undefined): string {
  const date = timestampToDate(ts ?? new Date());
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
export function getStreakStatus(lastCheckIn: Date | string | null): StreakStatus {
  if (!lastCheckIn) return 'increment';
  const lastDate = startOfDay(toDate(lastCheckIn));
  const today = startOfDay(new Date());
  const diff = differenceInDays(today, lastDate);

  if (diff === 0) return 'already_checked';
  if (diff === 1) return 'increment';
  return 'reset';
}

// ─── Phase Date Helpers ───────────────────────────────────────────────────────

export function daysSinceSurgery(surgeryDate: Date | string | null): number | null {
  if (!surgeryDate) return null;
  return differenceInDays(new Date(), toDate(surgeryDate));
}

export function isSurgeryToday(surgeryDate: Date | string | null): boolean {
  if (!surgeryDate) return false;
  return isSameDay(new Date(), toDate(surgeryDate));
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

export function surgeryCountdownLabel(dateStr: string | Date | null | undefined): string | null {
  if (!dateStr) return null;
  const target = timestampToDate(dateStr);
  if (!target) return null;

  const today = startOfDay(new Date());
  const surgeryDate = startOfDay(target);
  const days = differenceInCalendarDays(surgeryDate, today);

  if (days > 1) return `${days} days remaining`;
  if (days === 1) return '1 day remaining';
  if (days === 0) return 'Surgery is today';
  return 'Surgery date has passed';
}

export function isOlderThan(ts: Date | string | null, minutes: number): boolean {
  if (!ts) return true;
  const ageMs = Date.now() - toDate(ts).getTime();
  return ageMs > minutes * 60 * 1000;
}

// Patch all .toDate() usages to handle string or Date
function toDate(val: string | Date | null | undefined): Date {
  if (!val) return new Date(0);
  if (typeof val === 'string') return new Date(val);
  if (val instanceof Date) return val;
  // fallback
  return new Date(val as any);
}
