import { describe, expect, test } from "bun:test";
import {
  buildMilestoneBody,
  buildOverviewBody,
  collectMilestoneReminders,
  countAttention,
  daysUntilDueInLondon,
  londonDateKey,
  londonDateParts,
  parseDueDate,
  reminderItemsFromUserCollections,
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

  test("reminds only on day 90, 60, 30, and 7", () => {
    const dueIn = (days: number) => {
      const today = londonDateParts(NOW);
      const date = new Date(
        Date.UTC(today.year, today.month - 1, today.day + days, 12)
      );
      const day = String(date.getUTCDate()).padStart(2, "0");
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      return `${day}/${month}/${date.getUTCFullYear()}`;
    };
    const hits = collectMilestoneReminders(
      reminderItemsFromUserCollections({
        safety: [
          { name: "Fire extinguisher", dueDate: dueIn(90) },
          { name: "Life raft", nextDueDate: dueIn(45) },
        ],
        wallet: [{ title: "Insurance", expiryDate: dueIn(7) }],
        crew: [
          {
            name: "Ada Lowe",
            certificates: [{ title: "ENG1 Medical", expires: dueIn(30) }],
          },
        ],
      }),
      NOW
    );
    expect(hits).toEqual([
      { name: "Fire extinguisher", days: 90 },
      { name: "Insurance", days: 7 },
      { name: "ENG1 Medical (Ada Lowe)", days: 30 },
    ]);
    expect(buildMilestoneBody(hits)).toBe(
      "Fire extinguisher is due in 90 days. ENG1 Medical (Ada Lowe) is due in 30 days. Insurance is due in 7 days."
    );
    expect(buildMilestoneBody([])).toBeNull();
    expect(buildMilestoneBody([{ name: "Insurance", days: 7 }])).toBe(
      "Insurance is due in 7 days."
    );
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
