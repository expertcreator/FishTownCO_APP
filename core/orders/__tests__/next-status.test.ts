import { describe, expect, test } from "bun:test"
import { getPrimaryNextPosStatus } from "../next-status"

describe("getPrimaryNextPosStatus", () => {
  test("skips cancel and returns the next kitchen status", () => {
    expect(getPrimaryNextPosStatus("confirmed", false, null)).toBe("preparing")
  })

  test("does not advance pending marketplace tickets to start-preparing", () => {
    expect(
      getPrimaryNextPosStatus("pending", true, "platform_rider")
    ).toBeNull()
    expect(getPrimaryNextPosStatus("pending", false, null)).toBe("preparing")
  })
})
