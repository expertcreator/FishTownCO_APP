import type { StatusTone } from "@/features/common/data/demo";

/** Days before due date that count as "Due soon" (prototype 90-day horizon). */
export const SAFETY_DUE_SOON_DAYS = 90;

/**
 * Returns calendar-day difference from today to the due date (negative = past).
 * @param dueDate - Due date
 * @param now - Reference "now" (defaults to current time)
 * @returns Whole days until due (negative when overdue)
 */
export function daysUntilDue(dueDate: Date, now: Date = new Date()): number {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const dueDay = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate()
  );
  const diffMs = dueDay.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Resolves overdue / due-soon / ok tone from a due date.
 * @param dueDate - Item next-due date
 * @param now - Reference "now"
 * @returns Status tone used by pills and filters
 */
export function getSafetyTone(
  dueDate: Date,
  now: Date = new Date()
): StatusTone {
  const days = daysUntilDue(dueDate, now);
  if (days < 0) return "overdue";
  if (days <= SAFETY_DUE_SOON_DAYS) return "due";
  return "ok";
}

/**
 * Builds the short status label shown on Safety cards (Overdue / Due soon / OK).
 * @param tone - Computed status tone
 * @returns Prototype status label
 */
export function getSafetyStatusLabel(tone: StatusTone): string {
  switch (tone) {
    case "overdue":
      return "Overdue";
    case "due":
      return "Due soon";
    default:
      return "OK";
  }
}

/**
 * Builds the compliance-timeline status text (e.g. "1 Day Expired").
 * @param days - Days until due (negative when overdue)
 * @returns Short status text for the timeline header
 */
export function getComplianceTimelineLabel(days: number): string {
  if (days < 0) {
    const expired = Math.abs(days);
    return expired === 1 ? "1 Day Expired" : `${expired} Days Expired`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "1 Day Remaining";
  return `${days} Days Remaining`;
}

/**
 * Progress fill (0–1) for the compliance bar based on days until due.
 * @param days - Days until due (negative when overdue)
 * @returns Fraction of the bar filled in teal before the danger zone
 */
export function getComplianceProgress(days: number): number {
  if (days < 0) return 0.85;
  if (days >= SAFETY_DUE_SOON_DAYS) return 1;
  return Math.max(0.15, days / SAFETY_DUE_SOON_DAYS);
}
