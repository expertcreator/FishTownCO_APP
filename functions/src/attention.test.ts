import { describe, expect, test } from "bun:test";
import {
  buildOverviewBody,
  countAttention,
  daysUntilDueInLondon,
  londonDateKey,
  parseDueDate,
} from "./attention";

/** 08:00 in London on 15 Oct 2026 (BST, UTC+1). */
const NOW = new Date("2026-10-15T07:00:00.000Z");

describe("overview attention", () => {
  test("uses the London calendar day", () => {
    expect(londonDateKey(NOW)).toBe("2026-10-15");
  });

  test("treats yesterday as overdue and a date past 90 days as still ahead", () => {
    const yesterday = parseDueDate("14/10/2026");
    const dueSoon = parseDueDate("15 Jan 2027");
    expect(yesterday).not.toBeNull();
    expect(dueSoon).not.toBeNull();
    if (!yesterday || !dueSoon) return;
    expect(daysUntilDueInLondon(yesterday, NOW)).toBe(-1);
    expect(daysUntilDueInLondon(dueSoon, NOW)).toBe(92);
  });

  test("counts safety and wallet dates the same way Home does", () => {
    const counts = countAttention(
      [
        { dueDateIso: "2026-10-14T12:00:00.000Z" },
        { nextDueDate: "20/10/2026" },
        { expiryDate: "15/01/2027" },
        { name: "no date" },
      ],
      NOW
    );
    expect(counts).toEqual({ overdue: 1, due: 1 });
  });

  test("writes one digest line", () => {
    expect(buildOverviewBody({ overdue: 1, due: 1 })).toBe(
      "2 items need attention: 1 overdue, 1 due soon"
    );
    expect(buildOverviewBody({ overdue: 1, due: 0 })).toBe(
      "1 item needs attention: 1 overdue"
    );
    expect(buildOverviewBody({ overdue: 0, due: 0 })).toBeNull();
  });
});
