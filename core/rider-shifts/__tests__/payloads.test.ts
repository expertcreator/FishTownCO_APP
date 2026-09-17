import { describe, expect, test } from "bun:test"
import {
  buildAvailableShiftsSearchParams,
  buildBookRiderShiftBody,
  readBookedShiftId,
  unwrapBookRiderShiftResponse
} from "../payloads"

describe("buildAvailableShiftsSearchParams", () => {
  test("stringifies GPS and paging", () => {
    expect(
      buildAvailableShiftsSearchParams({
        date: "2026-09-09",
        latitude: 32.16,
        longitude: 74.18,
        radiusKm: 30,
        lang: "en",
        page: 1,
        zoneId: "z1"
      })
    ).toEqual({
      date: "2026-09-09",
      latitude: "32.16",
      longitude: "74.18",
      radiusKm: "30",
      page: "1",
      limit: "20",
      lang: "en",
      zoneId: "z1"
    })
  })
})

describe("buildBookRiderShiftBody", () => {
  test("omits missing GPS", () => {
    expect(buildBookRiderShiftBody({ shiftSlotId: "s1" })).toEqual({
      shiftSlotId: "s1"
    })
  })
})

describe("unwrapBookRiderShiftResponse", () => {
  test("keeps envelope success on the inner booking", () => {
    expect(
      unwrapBookRiderShiftResponse({
        success: true,
        message: "ok",
        data: { bookingId: "b1", status: "BOOKED" }
      })
    ).toEqual({
      success: true,
      message: "ok",
      bookingId: "b1",
      status: "BOOKED"
    })
  })

  test("returns the body when unwrapped", () => {
    expect(
      unwrapBookRiderShiftResponse({ success: true, bookingId: "b1" })
    ).toEqual({ success: true, bookingId: "b1" })
  })
})

describe("readBookedShiftId", () => {
  test("requires a booking id", () => {
    expect(readBookedShiftId({ success: true })).toBeNull()
    expect(readBookedShiftId({ bookingId: "b1" })).toBe("b1")
  })
})
