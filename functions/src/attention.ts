/** Days before the due date that Home treats as "Due soon". */
export const DUE_SOON_DAYS = 90;

const LONDON = "Europe/London";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type AttentionTone = "ok" | "due" | "overdue";

export type AttentionCounts = {
  due: number;
  overdue: number;
};

/**
 * Calendar date in Europe/London, used so the 08:00 reminder matches UK days.
 * @param date - Instant to convert
 * @returns Year, month (1–12), and day in London
 */
export function londonDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

/**
 * London calendar day as `YYYY-MM-DD`.
 * @param date - Instant to convert
 * @returns Date key stored on the user after a reminder run
 */
export function londonDateKey(date: Date): string {
  const { year, month, day } = londonDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Parses the same due strings the app stores: `dd/mm/yyyy`, `14 Oct 2026`, or ISO.
 * Day-month-year values are noon UTC so the London calendar day stays stable.
 * @param value - Raw Firestore date field
 * @returns Parsed date, or null when the value is empty or invalid
 */
export function parseDueDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (isFirestoreTimestamp(value)) {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dmy) {
    return utcNoon(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  }

  const long = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(trimmed);
  if (long) {
    const monthIndex = MONTH_SHORT.findIndex(
      (month) => month.toLowerCase() === long[2].toLowerCase()
    );
    if (monthIndex >= 0) {
      return utcNoon(Number(long[3]), monthIndex + 1, Number(long[1]));
    }
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed);
}

/**
 * Whole London calendar days from today until the due date. Negative when overdue.
 * @param dueDate - Item due or expiry date
 * @param now - Reference instant
 * @returns Day difference
 */
export function daysUntilDueInLondon(dueDate: Date, now: Date): number {
  const today = londonDateParts(now);
  const due = londonDateParts(dueDate);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day);
  const dueUtc = Date.UTC(due.year, due.month - 1, due.day);
  return Math.round((dueUtc - todayUtc) / 86_400_000);
}

/**
 * Same overdue / due-soon / ok split Home uses.
 * @param dueDate - Item due or expiry date
 * @param now - Reference instant
 * @returns Status tone
 */
export function toneForDueDate(dueDate: Date, now: Date): AttentionTone {
  const days = daysUntilDueInLondon(dueDate, now);
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due";
  return "ok";
}

/**
 * Reads the first present due field, matching safety then wallet documents.
 * @param data - Firestore document data
 * @returns Parsed due date, or null when the item has no date
 */
export function readItemDueDate(data: Record<string, unknown>): Date | null {
  const raw =
    data.dueDateIso ??
    data.nextDueDate ??
    data.dueDate ??
    data.expiryDateIso ??
    data.expiryDate ??
    data.expires;
  return parseDueDate(raw);
}

/**
 * Counts safety items and wallet documents that Home would show as overdue or due soon.
 * @param items - Firestore field maps
 * @param now - Reference instant
 * @returns Attention counts
 */
export function countAttention(
  items: Record<string, unknown>[],
  now: Date
): AttentionCounts {
  const counts: AttentionCounts = { due: 0, overdue: 0 };
  for (const item of items) {
    const dueDate = readItemDueDate(item);
    if (!dueDate) continue;
    const tone = toneForDueDate(dueDate, now);
    if (tone === "overdue") counts.overdue += 1;
    if (tone === "due") counts.due += 1;
  }
  return counts;
}

/**
 * Builds the single overview notification body.
 * @param counts - Overdue and due-soon totals
 * @returns Body text, or null when there is nothing to remind about
 */
export function buildOverviewBody(counts: AttentionCounts): string | null {
  const total = counts.overdue + counts.due;
  if (total <= 0) return null;

  const parts: string[] = [];
  if (counts.overdue > 0) {
    parts.push(
      counts.overdue === 1 ? "1 overdue" : `${counts.overdue} overdue`
    );
  }
  if (counts.due > 0) {
    parts.push(counts.due === 1 ? "1 due soon" : `${counts.due} due soon`);
  }

  const lead =
    total === 1 ? "1 item needs attention" : `${total} items need attention`;
  return `${lead}: ${parts.join(", ")}`;
}

/**
 * True for a Firestore Timestamp-like value from the Admin SDK.
 * @param value - Unknown field value
 * @returns Whether the value can produce a Date
 */
function isFirestoreTimestamp(
  value: unknown
): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  );
}

/**
 * Builds a UTC noon instant for a calendar day, or null when that day does not exist.
 * @param year - Full year
 * @param month - Month from 1 to 12
 * @param day - Day of month
 * @returns Date at 12:00 UTC, or null
 */
function utcNoon(year: number, month: number, day: number): Date | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}
