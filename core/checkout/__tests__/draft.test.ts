import { describe, expect, it } from "vitest"
import {
  CHECKOUT_DRAFT_KEY,
  CHECKOUT_NOTES_MAX_LENGTH,
  type CheckoutDraft,
  type CheckoutDraftStore,
  clearCheckoutDraft,
  EMPTY_CHECKOUT_DRAFT,
  narrowCheckoutDraft,
  readCheckoutDraft,
  writeCheckoutDraft
} from "../draft"

/**
 * A map-backed store, the shape both platforms implement.
 * @returns The store plus its backing slot
 */
function fakeStore() {
  const slot = { value: null as string | null }
  const store: CheckoutDraftStore = {
    clear: () => {
      slot.value = null
    },
    read: () => slot.value,
    write: (value) => {
      slot.value = value
    }
  }

  return { slot, store }
}

const FULL: CheckoutDraft = {
  addressId: "addr-1",
  countryCode: "PK",
  mobileNumber: "3001234567",
  notes: "No onions"
}

describe("the key", () => {
  it("is versioned in the cart key's style", () => {
    expect(CHECKOUT_DRAFT_KEY).toBe("fishtownco:checkout:v1")
  })
})

describe("narrowCheckoutDraft", () => {
  it.each([
    ["null", null],
    ["a string", "draft"],
    ["a number", 7],
    ["an array", []]
  ])("degrades %s to the empty draft", (_label, value) => {
    expect(narrowCheckoutDraft(value)).toEqual(EMPTY_CHECKOUT_DRAFT)
  })

  it("keeps every recognised field", () => {
    expect(narrowCheckoutDraft({ ...FULL })).toEqual(FULL)
  })

  it("defaults each absent field independently", () => {
    expect(narrowCheckoutDraft({ mobileNumber: "3001234567" })).toEqual({
      addressId: null,
      countryCode: "PK",
      mobileNumber: "3001234567",
      notes: ""
    })
  })

  it("falls back per wrong-typed field rather than poisoning the draft", () => {
    expect(
      narrowCheckoutDraft({
        addressId: 4,
        countryCode: ["PK"],
        mobileNumber: "3001234567",
        notes: { a: 1 }
      })
    ).toEqual({
      addressId: null,
      countryCode: "PK",
      mobileNumber: "3001234567",
      notes: ""
    })
  })

  it("treats an empty addressId or countryCode as unset", () => {
    const narrowed = narrowCheckoutDraft({ addressId: "", countryCode: "" })

    expect(narrowed.addressId).toBeNull()
    expect(narrowed.countryCode).toBe("PK")
  })

  it("caps an oversized restored note at the shared maximum", () => {
    // The form input's `maxLength` cannot police what an old build or a
    // hand-edited slot persisted; the narrowing is the restore-side gate.
    const narrowed = narrowCheckoutDraft({ notes: "x".repeat(600) })

    expect(narrowed.notes).toHaveLength(CHECKOUT_NOTES_MAX_LENGTH)
  })

  it("ignores fields it does not know", () => {
    expect(
      narrowCheckoutDraft({ ...FULL, orderMethodOverrides: { b: "pickup" } })
    ).toEqual(FULL)
  })
})

describe("read / write / clear over a store", () => {
  it("round-trips a draft", () => {
    const { store } = fakeStore()

    writeCheckoutDraft(store, FULL)

    expect(readCheckoutDraft(store)).toEqual(FULL)
  })

  it("reads the empty draft from an empty slot", () => {
    const { store } = fakeStore()

    expect(readCheckoutDraft(store)).toEqual(EMPTY_CHECKOUT_DRAFT)
  })

  it("degrades corrupt JSON to the empty draft", () => {
    const { slot, store } = fakeStore()

    slot.value = '{"mobileNumber": "300'

    expect(readCheckoutDraft(store)).toEqual(EMPTY_CHECKOUT_DRAFT)
  })

  it("clears the slot", () => {
    const { slot, store } = fakeStore()

    writeCheckoutDraft(store, FULL)
    clearCheckoutDraft(store)

    expect(slot.value).toBeNull()
    expect(readCheckoutDraft(store)).toEqual(EMPTY_CHECKOUT_DRAFT)
  })
})
