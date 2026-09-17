/**
 * The checkout draft: what the visitor has entered on `/checkout`, persisted
 * per keystroke so a reload, a login round-trip or a killed tab loses
 * nothing. Cleared only when an order is actually placed (`mw-2-7`).
 *
 * Mobile parity: `mobile-tenant-app/features/cart/constants/checkoutStorage.ts`,
 * minus the RN-only breadth — that store keys notes and order-method
 * overrides per branch because the mobile cart spans branches; this cart is
 * single-restaurant by construction, so one `notes` string is the whole map,
 * and the order method is delivery-only until `mw-2-6`.
 *
 * Pure TypeScript. The platform supplies a {@link CheckoutDraftStore} —
 * web: `localStorage` behind `src/features/checkout/storage.ts`; mobile
 * (retrofit): MMKV — and this module owns the key, the shape and the
 * narrowing, so every platform abandons and restores drafts identically.
 * Hand-narrowed, not schema-parsed, for the cart's reason: no validation
 * library may enter the funnel's first-load JS (`cart/storage.ts`).
 */

import { DEFAULT_CHECKOUT_COUNTRY } from "./phone"

/** Versioned storage key so a shape change can abandon old state. */
export const CHECKOUT_DRAFT_KEY = "fishtownco:checkout:v1"

/**
 * Longest note the draft keeps — the form input's own cap, enforced at
 * restore too so an oversized persisted note (an old build, a hand-edited
 * slot) cannot outlive the input's `maxLength`.
 */
export const CHECKOUT_NOTES_MAX_LENGTH = 500

/** What `/checkout` collects ahead of placement. No credential, no money. */
export interface CheckoutDraft {
  /** The contact number's national digits, as typed. Empty until entered. */
  readonly mobileNumber: string
  /** ISO 3166-1 alpha-2 country of the number. Defaults to `PK`. */
  readonly countryCode: string
  /** The note to the restaurant. Empty for none. */
  readonly notes: string
  /** The chosen saved address id, or `null` while none is picked. */
  readonly addressId: string | null
}

/** The empty draft — also what unreadable persisted state degrades to. */
export const EMPTY_CHECKOUT_DRAFT: CheckoutDraft = {
  addressId: null,
  countryCode: DEFAULT_CHECKOUT_COUNTRY,
  mobileNumber: "",
  notes: ""
}

/**
 * The one platform seam: a synchronous string store for the draft's slot.
 * Implementations own their failure posture — a denied `localStorage` or a
 * full MMKV swallows the write, because losing a draft costs a re-type, not
 * the order.
 */
export interface CheckoutDraftStore {
  /** The raw persisted value, or `null` when nothing is stored. */
  read(): string | null
  /** Persists the raw value. */
  write(value: string): void
  /** Removes the persisted value. */
  clear(): void
}

/**
 * Narrows one decoded value to a {@link CheckoutDraft}.
 *
 * Field-by-field, mobile's `readCheckoutDraft` posture: an absent or
 * wrong-typed field falls back to its default rather than poisoning the
 * whole draft, so a shape change strands one answer, not the visit.
 * @param value - The parsed JSON
 * @returns The narrowed draft; unrecognisable input is the empty draft
 * @example narrowCheckoutDraft({ mobileNumber: "3001234567" }).countryCode // -> "PK"
 */
export function narrowCheckoutDraft(value: unknown): CheckoutDraft {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return EMPTY_CHECKOUT_DRAFT
  }

  const record = value as Record<string, unknown>

  return {
    addressId:
      typeof record.addressId === "string" && record.addressId !== ""
        ? record.addressId
        : null,
    countryCode:
      typeof record.countryCode === "string" && record.countryCode !== ""
        ? record.countryCode
        : DEFAULT_CHECKOUT_COUNTRY,
    mobileNumber:
      typeof record.mobileNumber === "string" ? record.mobileNumber : "",
    notes:
      typeof record.notes === "string"
        ? record.notes.slice(0, CHECKOUT_NOTES_MAX_LENGTH)
        : ""
  }
}

/**
 * The persisted draft, or the empty one for a missing, corrupt or
 * unreadable slot.
 * @param store - The platform's draft store
 * @returns The draft
 * @example readCheckoutDraft(store).mobileNumber // -> "" on first visit
 */
export function readCheckoutDraft(store: CheckoutDraftStore): CheckoutDraft {
  const raw = store.read()

  if (raw === null) {
    return EMPTY_CHECKOUT_DRAFT
  }

  try {
    return narrowCheckoutDraft(JSON.parse(raw))
  } catch {
    // Corrupt JSON — a vandalised or truncated slot. The empty draft is the
    // same answer a first visit gets.
    return EMPTY_CHECKOUT_DRAFT
  }
}

/**
 * Persists the draft.
 * @param store - The platform's draft store
 * @param draft - The draft to persist
 * @returns Nothing
 * @example writeCheckoutDraft(store, { ...draft, notes: "No onions" })
 */
export function writeCheckoutDraft(
  store: CheckoutDraftStore,
  draft: CheckoutDraft
): void {
  store.write(JSON.stringify(draft))
}

/**
 * Removes the draft — placement success (`mw-2-7`), and nothing else.
 * @param store - The platform's draft store
 * @returns Nothing
 * @example clearCheckoutDraft(store)
 */
export function clearCheckoutDraft(store: CheckoutDraftStore): void {
  store.clear()
}
