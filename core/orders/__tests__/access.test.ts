import { describe, expect, test } from "bun:test"
import { isMarketplaceOrdersAccessOnly } from "../access"

describe("isMarketplaceOrdersAccessOnly", () => {
  test("treats marketplace and expired-hybrid tenants as live-only", () => {
    expect(isMarketplaceOrdersAccessOnly({ sellOn: "marketplace" })).toBe(true)
    expect(
      isMarketplaceOrdersAccessOnly({
        sellOn: "hybrid",
        subscription: { isActive: false, expireAt: "2099-01-01T00:00:00.000Z" }
      })
    ).toBe(true)
    expect(
      isMarketplaceOrdersAccessOnly({
        sellOn: "hybrid",
        subscription: { isActive: true, expireAt: "2000-01-01T00:00:00.000Z" }
      })
    ).toBe(true)
    expect(
      isMarketplaceOrdersAccessOnly({
        sellOn: "hybrid",
        subscription: { isActive: true, expireAt: "2099-01-01T00:00:00.000Z" }
      })
    ).toBe(false)
    expect(
      isMarketplaceOrdersAccessOnly({
        sellOn: "pos",
        subscription: { isActive: true, expireAt: "2099-01-01T00:00:00.000Z" }
      })
    ).toBe(false)
  })
})
