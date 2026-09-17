import { describe, expect, test } from "bun:test";
import {
  formatDisplayClock,
  formatDisplayTime,
  formatDisplayTimeRange,
} from "../dateTime";

describe("formatDisplayTime", () => {
  test("formats morning time as 12-hour AM", () => {
    expect(formatDisplayTime(new Date(2026, 0, 1, 9, 0))).toBe("9:00 AM");
  });

  test("formats evening time as 12-hour PM", () => {
    expect(formatDisplayTime(new Date(2026, 0, 1, 19, 0))).toBe("7:00 PM");
  });

  test("formats midnight as 12:00 AM", () => {
    expect(formatDisplayTime(new Date(2026, 0, 1, 0, 0))).toBe("12:00 AM");
  });

  test("formats noon as 12:00 PM", () => {
    expect(formatDisplayTime(new Date(2026, 0, 1, 12, 0))).toBe("12:00 PM");
  });

  test("never emits 24-hour hours", () => {
    expect(formatDisplayTime(new Date(2026, 0, 1, 13, 5))).toBe("1:05 PM");
    expect(formatDisplayTime(new Date(2026, 0, 1, 23, 59))).toBe("11:59 PM");
    expect(formatDisplayTime(new Date(2026, 0, 1, 0, 0))).toMatch(/AM$/);
  });

  test("returns a placeholder for invalid input", () => {
    expect(formatDisplayTime(null)).toBe("—");
    expect(formatDisplayTime("not-a-date")).toBe("—");
  });
});

describe("formatDisplayClock", () => {
  test("formats hour and minute without constructing a Date", () => {
    expect(formatDisplayClock(14, 30)).toBe("2:30 PM");
    expect(formatDisplayClock(0, 0)).toBe("12:00 AM");
    expect(formatDisplayClock(12, 0)).toBe("12:00 PM");
  });
});

describe("formatDisplayTimeRange", () => {
  test("joins start and end with an en-dash by default", () => {
    expect(
      formatDisplayTimeRange(
        new Date(2026, 0, 1, 9, 0),
        new Date(2026, 0, 1, 19, 0)
      )
    ).toBe("9:00 AM – 7:00 PM");
  });

  test("uses a custom separator when provided", () => {
    expect(
      formatDisplayTimeRange(
        new Date(2026, 0, 1, 9, 0),
        new Date(2026, 0, 1, 19, 0),
        "to"
      )
    ).toBe("9:00 AM to 7:00 PM");
  });
});
