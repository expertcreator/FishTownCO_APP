import { describe, expect, it } from "vitest"
import { discountPercent } from "../discount"

describe("discountPercent", () => {
  it("computes the whole-percent markdown", () => {
    expect(discountPercent(450, 900)).toBe(50)
  })

  it("rounds to the nearest whole percent", () => {
    // (999 - 900) / 999 = 9.909...% -> rounds to 10.
    expect(discountPercent(900, 999)).toBe(10)
  })

  it("answers null when there is no comparison price at all", () => {
    expect(discountPercent(450, null)).toBeNull()
  })

  it("answers null when the comparison price equals the real price", () => {
    expect(discountPercent(450, 450)).toBeNull()
  })

  it("answers null when the comparison price is below the real price", () => {
    // Not a markdown — the "was" price would be a price increase.
    expect(discountPercent(900, 450)).toBeNull()
  })

  it("answers null when the comparison price is zero or negative", () => {
    expect(discountPercent(0, 0)).toBeNull()
    expect(discountPercent(-10, -5)).toBeNull()
  })

  it("computes a full markdown to zero", () => {
    expect(discountPercent(0, 500)).toBe(100)
  })
})
