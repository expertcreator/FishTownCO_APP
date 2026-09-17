import { describe, expect, test } from "bun:test"
import {
  getAvailableShiftBookingKind,
  pickRunningAvailableShift
} from "../booking-kind"

const start = "2026-09-09T00:00:00.000Z"
const end = "2026-09-09T18:00:00.000Z"

describe("getAvailableShiftBookingKind", () => {
  test("returns future before start", () => {
    expect(
      getAvailableShiftBookingKind(
        start,
        end,
        Date.parse("2026-09-08T12:00:00.000Z")
      )
    ).toBe("future")
  })

  test("returns running when enough time remains", () => {
    expect(
      getAvailableShiftBookingKind(
        start,
        end,
        Date.parse("2026-09-09T08:00:00.000Z")
      )
    ).toBe("running")
  })

  test("returns too_late near the end", () => {
    expect(
      getAvailableShiftBookingKind(
        start,
        end,
        Date.parse("2026-09-09T17:30:00.000Z")
      )
    ).toBe("too_late")
  })
})

describe("pickRunningAvailableShift", () => {
  test("skips future and too_late rows", () => {
    const picked = pickRunningAvailableShift(
      [
        {
          id: "future",
          startTime: "2026-09-10T00:00:00.000Z",
          endTime: "2026-09-10T08:00:00.000Z"
        },
        { id: "running", startTime: start, endTime: end },
        { id: "late", startTime: start, endTime: "2026-09-09T09:00:00.000Z" }
      ],
      Date.parse("2026-09-09T08:00:00.000Z")
    )
    expect(picked?.id).toBe("running")
  })

  test("returns null when none are running", () => {
    expect(
      pickRunningAvailableShift(
        [
          {
            startTime: "2026-09-10T00:00:00.000Z",
            endTime: "2026-09-10T08:00:00.000Z"
          }
        ],
        Date.parse("2026-09-09T08:00:00.000Z")
      )
    ).toBeNull()
  })
})
