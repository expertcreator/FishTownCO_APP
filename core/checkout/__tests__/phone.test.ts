import { describe, expect, it } from "vitest"
import {
  composePakistanE164,
  DEFAULT_CHECKOUT_COUNTRY,
  isPakistanPlaceholderNsn,
  isValidPakistanMobileNsn,
  meetsPakistanCheckoutContactRules,
  PAKISTAN_MOBILE_NSN_PATTERN
} from "../phone"

describe("the NSN pattern", () => {
  it.each([
    ["3001234567", true],
    ["3451234567", true],
    // The matrix's bad-phone row: not `3XXXXXXXXX`.
    ["4001234567", false],
    ["0301234567", false],
    // Wrong length either way.
    ["300123456", false],
    ["30012345678", false],
    // Not digits.
    ["300123456a", false],
    ["", false]
  ])("%s matches: %s", (nsn, matches) => {
    expect(PAKISTAN_MOBILE_NSN_PATTERN.test(nsn)).toBe(matches)
  })
})

describe("isPakistanPlaceholderNsn — mobile's placeholder table", () => {
  it.each([
    // All-zero tail.
    ["3000000000", true],
    // One repeated digit through the tail.
    ["3111111111", true],
    ["3999999999", true],
    // Real-looking numbers are not placeholders.
    ["3001234567", false],
    // A malformed NSN is not a placeholder — the pattern rejects it instead.
    ["4000000000", false],
    ["300000000", false]
  ])("%s -> %s", (nsn, placeholder) => {
    expect(isPakistanPlaceholderNsn(nsn)).toBe(placeholder)
  })
})

describe("isValidPakistanMobileNsn", () => {
  it.each([
    ["3001234567", true],
    ["3459876543", true],
    ["3000000000", false],
    ["3222222222", false],
    ["4001234567", false],
    ["300123456", false]
  ])("%s -> %s", (nsn, valid) => {
    expect(isValidPakistanMobileNsn(nsn)).toBe(valid)
  })
})

describe("meetsPakistanCheckoutContactRules", () => {
  it("applies the mobile rules to PK numbers", () => {
    expect(meetsPakistanCheckoutContactRules("PK", "3001234567")).toBe(true)
    expect(meetsPakistanCheckoutContactRules("PK", "3111111111")).toBe(false)
    expect(meetsPakistanCheckoutContactRules("PK", "4001234567")).toBe(false)
  })

  it("applies them case-insensitively — 'pk' is still Pakistan", () => {
    expect(meetsPakistanCheckoutContactRules("pk", "3111111111")).toBe(false)
    expect(meetsPakistanCheckoutContactRules("pk", "3001234567")).toBe(true)
  })

  it("passes every other country through to the app's general validation", () => {
    // Mobile's rule verbatim: `parsed.country !== "PK"` is not this rule's
    // business — libphonenumber (app-side) judges those.
    expect(meetsPakistanCheckoutContactRules("US", "5551234")).toBe(true)
    expect(meetsPakistanCheckoutContactRules("AE", "3000000000")).toBe(true)
  })

  it("defaults to PK as the checkout country", () => {
    expect(DEFAULT_CHECKOUT_COUNTRY).toBe("PK")
  })
})

describe("composePakistanE164", () => {
  it("prefixes the country calling code", () => {
    expect(composePakistanE164("3001234567")).toBe("+923001234567")
  })
})
