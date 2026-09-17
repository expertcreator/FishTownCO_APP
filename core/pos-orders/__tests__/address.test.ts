import { describe, expect, test } from "bun:test"
import { deliveryAddressToJsonb } from "../address"

describe("deliveryAddressToJsonb", () => {
  test("returns undefined for blank input", () => {
    expect(deliveryAddressToJsonb("")).toBeUndefined()
    expect(deliveryAddressToJsonb("   ")).toBeUndefined()
    expect(deliveryAddressToJsonb(null)).toBeUndefined()
  })

  test("mirrors the trimmed text across locales", () => {
    expect(deliveryAddressToJsonb("  12 High St  ")).toEqual({
      en: "12 High St",
      ar: "12 High St",
      ur: "12 High St"
    })
  })
})
