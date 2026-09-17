import { describe, expect, test } from "bun:test"
import {
  isPlatformRiderSaleChannel,
  PLATFORM_RIDER_SALE_CHANNEL
} from "../constants"

describe("platform rider sale channel", () => {
  test("identifies Fishtownco rider settlement keys only", () => {
    expect(PLATFORM_RIDER_SALE_CHANNEL).toBe("platform_rider")
    expect(isPlatformRiderSaleChannel("platform_rider")).toBe(true)
    expect(isPlatformRiderSaleChannel("cash")).toBe(false)
    expect(isPlatformRiderSaleChannel("own_rider")).toBe(false)
  })
})
