import { describe, expect, test } from "bun:test"
import { RIDER_SHIFTS_API } from "../constants"

describe("RIDER_SHIFTS_API", () => {
  test("keeps list paths stable", () => {
    expect(RIDER_SHIFTS_API.nextShift).toBe("rider/next-shift")
    expect(RIDER_SHIFTS_API.availableShifts).toBe("rider/available-shifts")
    expect(RIDER_SHIFTS_API.bookShift).toBe("rider/book-shift")
    expect(RIDER_SHIFTS_API.checkin).toBe("rider/checkin")
  })

  test("encodes booking ids on swap and cancel paths", () => {
    expect(RIDER_SHIFTS_API.swap("a/b")).toBe("rider/shifts/a%2Fb/swap")
    expect(RIDER_SHIFTS_API.cancelBooking("a/b")).toBe("rider/book-shift/a%2Fb")
  })
})
