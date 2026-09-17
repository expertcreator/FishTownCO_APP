import assert from "node:assert/strict"
import { describe, it } from "vitest"
import {
  formatUnavailableProductActionLabel,
  formatUnavailableProductPreferenceLine,
  isUnavailableProductAction,
  shouldShowUnavailableProductPreference
} from "../unavailable-product-action"

/** Stand-in translator: echoes the key so the mapping itself is what is asserted. */
const t = (key: string) => key

describe("isUnavailableProductAction", () => {
  it("accepts the three shared action values", () => {
    assert.equal(isUnavailableProductAction("remove"), true)
    assert.equal(isUnavailableProductAction("call"), true)
    assert.equal(isUnavailableProductAction("cancel"), true)
  })

  it("rejects anything else, including casing variants", () => {
    for (const value of ["Remove", "", null, undefined, 0, {}, ["remove"]]) {
      assert.equal(isUnavailableProductAction(value), false)
    }
  })
})

describe("formatUnavailableProductActionLabel", () => {
  it("maps each action to its product-detail dropdown key", () => {
    assert.equal(
      formatUnavailableProductActionLabel("call", t),
      "tenant-products-detail.callMeAndConfirm"
    )
    assert.equal(
      formatUnavailableProductActionLabel("remove", t),
      "tenant-products-detail.removeFromOrder"
    )
    assert.equal(
      formatUnavailableProductActionLabel("cancel", t),
      "tenant-products-detail.cancelEntireOrder"
    )
  })

  it("answers null for an unrecognised value rather than a placeholder", () => {
    assert.equal(formatUnavailableProductActionLabel("substitute", t), null)
    assert.equal(formatUnavailableProductActionLabel(undefined, t), null)
  })
})

describe("formatUnavailableProductPreferenceLine", () => {
  it("renders the same text as the detail label today", () => {
    assert.equal(
      formatUnavailableProductPreferenceLine("remove", t),
      "tenant-products-detail.removeFromOrder"
    )
    assert.equal(formatUnavailableProductPreferenceLine(null, t), null)
  })
})

describe("shouldShowUnavailableProductPreference", () => {
  it("shows the preference on an ordinary product line", () => {
    assert.equal(shouldShowUnavailableProductPreference({}), true)
    assert.equal(
      shouldShowUnavailableProductPreference({
        isAddon: false,
        isDeal: false,
        dealId: null
      }),
      true
    )
  })

  it("hides it for add-ons, deals and deal members", () => {
    assert.equal(
      shouldShowUnavailableProductPreference({ isAddon: true }),
      false
    )
    assert.equal(
      shouldShowUnavailableProductPreference({ isDeal: true }),
      false
    )
    assert.equal(
      shouldShowUnavailableProductPreference({ dealId: "d1" }),
      false
    )
  })

  it("treats a whitespace-only deal id as no deal id", () => {
    assert.equal(
      shouldShowUnavailableProductPreference({ dealId: "   " }),
      true
    )
  })
})
