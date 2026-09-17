import { describe, expect, it } from "vitest"
import { minimumOrderGate } from "../minimum-order"

describe("minimumOrderGate", () => {
  it("names the gap below the minimum — THE MATRIX ROW", () => {
    expect(minimumOrderGate(500, 300, 1)).toEqual({
      shortfall: 200,
      status: "below"
    })
  })

  it("is met at the minimum exactly and above it", () => {
    expect(minimumOrderGate(500, 500, 1).status).toBe("met")
    expect(minimumOrderGate(500, 501, 1).status).toBe("met")
  })

  it("blocks nothing and quotes nothing without a captured minimum", () => {
    // NOT `below` with a zero shortfall: "no minimum was captured" and "you are
    // Rs 0 short" are different facts, and only one of them may be rendered.
    expect(minimumOrderGate(null, 300, 1)).toEqual({
      shortfall: 0,
      status: "unresolved"
    })
    expect(minimumOrderGate(undefined, 300, 1).status).toBe("unresolved")
    expect(minimumOrderGate(Number.NaN, 300, 1).status).toBe("unresolved")
  })

  it("is unresolved for a non-finite subtotal, never a NaN shortfall", () => {
    // `below` with `shortfall: NaN` renders as "Rs NaN" in the cart note.
    expect(minimumOrderGate(500, Number.NaN, 1)).toEqual({
      shortfall: 0,
      status: "unresolved"
    })
  })

  it("is met for an empty cart and for a branch that publishes no floor", () => {
    expect(minimumOrderGate(500, 0, 0).status).toBe("met")
    expect(minimumOrderGate(0, 0, 1).status).toBe("met")
    expect(minimumOrderGate(-1, 0, 1).status).toBe("met")
  })

  it("reports a zero shortfall for every status but `below`", () => {
    expect(minimumOrderGate(500, 500, 1).shortfall).toBe(0)
    expect(minimumOrderGate(500, 0, 0).shortfall).toBe(0)
  })
})
