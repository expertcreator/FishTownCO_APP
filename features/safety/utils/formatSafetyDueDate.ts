/**
 * Formats a Date as `dd/mm/yyyy` to match the prototype placeholders.
 * @param date - Date to format
 * @returns Display date string
 */
export function formatSafetyDueDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

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

/**
 * Formats a Date as `14 Oct 2025` to match the Safety inventory prototype.
 * @param date - Date to format
 * @returns Display date string
 */
export function formatSafetyDueDateLong(date: Date): string {
  const day = date.getDate();
  const month = MONTH_SHORT[date.getMonth()] ?? "";
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Parses a `dd/mm/yyyy` (or ISO) string into a Date when possible.
 * @param value - Stored due date string
 * @returns Parsed Date, or null
 */
export function parseSafetyDueDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = Number(dmy[3]);
    const date = new Date(year, month, day, 12, 0, 0);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) {
    return new Date(iso);
  }

  const long = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(trimmed);
  if (long) {
    const day = Number(long[1]);
    const monthIndex = MONTH_SHORT.findIndex(
      (m) => m.toLowerCase() === long[2].toLowerCase()
    );
    const year = Number(long[3]);
    if (monthIndex >= 0) {
      const date = new Date(year, monthIndex, day, 12, 0, 0);
      if (
        date.getFullYear() === year &&
        date.getMonth() === monthIndex &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  return null;
}
