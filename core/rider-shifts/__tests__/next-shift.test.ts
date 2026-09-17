import { describe, expect, test } from "bun:test"
import { SHIFT_BOOKING_STATUS } from "@/constants"
import {
  extractCheckedInShift,
  findShiftMapContext,
  isNextShiftPayloadEmpty,
  isTerminalShiftBookingStatus
} from "../next-shift"

describe("isNextShiftPayloadEmpty", () => {
  test("treats wrapped empty arrays as empty", () => {
    expect(isNextShiftPayloadEmpty({ success: true, data: [] })).toBe(true)
    expect(isNextShiftPayloadEmpty([])).toBe(true)
    expect(isNextShiftPayloadEmpty(undefined)).toBe(true)
  })

  test("treats a booked row as non-empty", () => {
    expect(
      isNextShiftPayloadEmpty({
        success: true,
        data: [{ bookingId: "b1", status: "BOOKED" }]
      })
    ).toBe(false)
  })
})

describe("findShiftMapContext", () => {
  test("stringifies object zone boundaries", () => {
    const context = findShiftMapContext(
      {
        data: [
          {
            bookingId: "b1",
            zoneId: "z1",
            zone: {
              id: "z1",
              boundaries: { type: "Polygon", coordinates: [] }
            }
          }
        ]
      },
      "b1"
    )
    expect(context).toEqual({
      bookingId: "b1",
      zoneId: "z1",
      boundaries: JSON.stringify({ type: "Polygon", coordinates: [] })
    })
  })
})

describe("extractCheckedInShift", () => {
  test("picks the CHECKED_IN row", () => {
    const context = extractCheckedInShift({
      data: [
        { bookingId: "b1", status: SHIFT_BOOKING_STATUS.BOOKED },
        {
          bookingId: "b2",
          status: SHIFT_BOOKING_STATUS.CHECKED_IN,
          zoneId: "z2"
        }
      ]
    })
    expect(context).toEqual({
      bookingId: "b2",
      zoneId: "z2",
      boundaries: null
    })
  })
})

describe("isTerminalShiftBookingStatus", () => {
  test("flags checkout and completed", () => {
    expect(isTerminalShiftBookingStatus(SHIFT_BOOKING_STATUS.CHECKED_OUT)).toBe(
      true
    )
    expect(isTerminalShiftBookingStatus(SHIFT_BOOKING_STATUS.BOOKED)).toBe(
      false
    )
  })
})
