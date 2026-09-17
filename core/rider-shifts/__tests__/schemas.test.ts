import { describe, expect, test } from "bun:test"
import {
  bookRiderShiftBodySchema,
  cancelRiderShiftBodySchema,
  checkInRiderShiftBodySchema,
  riderNextShiftSchema
} from "../schemas"

describe("bookRiderShiftBodySchema", () => {
  test("accepts a slot id", () => {
    expect(bookRiderShiftBodySchema.parse({ shiftSlotId: "slot-1" })).toEqual({
      shiftSlotId: "slot-1"
    })
  })

  test("accepts join GPS", () => {
    expect(
      bookRiderShiftBodySchema.parse({
        shiftSlotId: "slot-1",
        latitude: 32.16,
        longitude: 74.18
      })
    ).toEqual({
      shiftSlotId: "slot-1",
      latitude: 32.16,
      longitude: 74.18
    })
  })

  test("rejects an empty slot id", () => {
    expect(() => bookRiderShiftBodySchema.parse({ shiftSlotId: "" })).toThrow()
  })
})

describe("riderNextShiftSchema", () => {
  test("keeps extra zone fields", () => {
    const parsed = riderNextShiftSchema.parse({
      bookingId: "b1",
      canCheckIn: true,
      zone: { id: "z1", name: "GT Road", extra: true }
    })
    expect(parsed.bookingId).toBe("b1")
    expect(parsed.canCheckIn).toBe(true)
    expect(parsed.zone).toMatchObject({ id: "z1", extra: true })
  })
})

describe("checkInRiderShiftBodySchema", () => {
  test("requires GPS", () => {
    expect(() =>
      checkInRiderShiftBodySchema.parse({ bookingId: "b1" })
    ).toThrow()
    expect(
      checkInRiderShiftBodySchema.parse({
        bookingId: "b1",
        latitude: 32.16,
        longitude: 74.18
      })
    ).toEqual({
      bookingId: "b1",
      latitude: 32.16,
      longitude: 74.18
    })
  })
})

describe("cancelRiderShiftBodySchema", () => {
  test("rejects an empty reason", () => {
    expect(() =>
      cancelRiderShiftBodySchema.parse({ cancellationReason: "" })
    ).toThrow()
  })
})
