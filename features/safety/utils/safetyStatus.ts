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
 * Marker centers on the compliance bar, left to right.
 * The five labels sit in equal columns, so 7D is the center of the fourth column.
 */
const COMPLIANCE_STOPS: { days: number; position: number }[] = [
  { days: SAFETY_DUE_SOON_DAYS, position: 0.1 },
  { days: 60, position: 0.3 },
  { days: 30, position: 0.5 },
  { days: 7, position: 0.7 },
  { days: 0, position: 0.9 },
];

/**
 * Progress fill (0–1) for the compliance bar.
 * More than 90 days remaining leaves the bar empty. It reaches 90D at 90 days,
 * 30D at 30 days, 7D at 7 days, and the overdue marker once the date has passed.
 * @param days - Days until due (negative when overdue)
 * @returns Fraction of the bar filled from the left
 */
export function getComplianceProgress(days: number): number {
  if (!Number.isFinite(days) || days > SAFETY_DUE_SOON_DAYS) return 0;
  if (days <= 0) return COMPLIANCE_STOPS[COMPLIANCE_STOPS.length - 1].position;

  for (let index = 0; index < COMPLIANCE_STOPS.length - 1; index += 1) {
    const start = COMPLIANCE_STOPS[index];
    const end = COMPLIANCE_STOPS[index + 1];
    if (days <= start.days && days >= end.days) {
      const span = start.days - end.days;
      const traveled = (start.days - days) / span;
      return start.position + traveled * (end.position - start.position);
    }
  }

  return 0;
}
