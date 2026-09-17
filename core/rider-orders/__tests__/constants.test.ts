import { describe, expect, test } from "bun:test"
import { RIDER_ORDERS_API } from "../constants"

describe("RIDER_ORDERS_API", () => {
  test("encodes the order id on mutation and details paths", () => {
    expect(RIDER_ORDERS_API.action("a/b")).toBe("riders/orders/a%2Fb/action")
    expect(RIDER_ORDERS_API.fail("a/b")).toBe("riders/orders/a%2Fb/fail")
    expect(RIDER_ORDERS_API.details("a/b")).toBe("orders/a%2Fb")
    expect(RIDER_ORDERS_API.estimatedDeliveryTime("a/b")).toBe(
      "orders/a%2Fb/estimated-delivery-time"
    )
  })

  test("keeps list and active paths stable", () => {
    expect(RIDER_ORDERS_API.list).toBe("riders/orders")
    expect(RIDER_ORDERS_API.active).toBe("riders/orders/active")
  })
})
