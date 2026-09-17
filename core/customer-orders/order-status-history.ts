/**
 * Readers for the order-detail status-history timeline. Unlike its siblings in
 * this directory this is a small original module, not a port of anything in
 * `mobile-tenant-app`.
 */

import type { OrderStatusHistoryEntry } from "./types"

const BACKEND_CODE = /^[A-Z][A-Z0-9_]*$/

/**
 * Turns an enum-like backend code into a sentence, leaving prose untouched.
 *
 * Exported because the order-detail cancellation-reason card renders the same
 * codes as the timeline does; a second copy of this regex is one copy too many.
 * Input is not trimmed here — callers pass trimmed strings.
 * @param raw - A backend code or an already-human string
 * @returns The humanized sentence, or `raw` when it is not a backend code
 * @example humanizeBackendCode("TENANT_NOT_AVAILABLE") // -> "Tenant not available"
 */
export function humanizeBackendCode(raw: string): string {
  if (!BACKEND_CODE.test(raw)) {
    return raw
  }
  const words = raw.toLowerCase().replace(/_/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function historySortKey(entry: OrderStatusHistoryEntry): string {
  return String(entry.changedAt || entry.createdAt || 0)
}

/**
 * Orders status-history entries oldest first, without touching the input array.
 *
 * Entries carrying no timestamp at all sort ahead of timestamped ones and keep
 * their payload order between themselves.
 * @param history - Entries as the payload sent them
 * @returns A new ascending array, or `[]` when there is no history
 */
export function sortOrderStatusHistory(
  history: OrderStatusHistoryEntry[] | null | undefined
): OrderStatusHistoryEntry[] {
  if (!history || history.length === 0) {
    return []
  }
  return [...history].sort((a, b) => {
    const left = historySortKey(a)
    const right = historySortKey(b)
    if (left < right) {
      return -1
    }
    return left > right ? 1 : 0
  })
}

/**
 * Names who moved the order into this status.
 *
 * A null `updatedBy` means the backend moved it on its own, so the labels are
 * injected rather than hardcoded: core owns no copy.
 * @param entry - One status-history entry
 * @param systemLabel - Localized label for an automatic transition
 * @param restaurantLabel - Localized label for a staff transition with no name
 * @returns The actor's name, or the matching fallback label
 */
export function orderStatusHistoryActorLabel(
  entry: OrderStatusHistoryEntry,
  systemLabel: string,
  restaurantLabel: string
): string {
  return (
    entry.updatedByUser?.name?.trim() ||
    (entry.updatedBy == null ? systemLabel : restaurantLabel)
  )
}

/**
 * The note worth rendering under a timeline row, or `null` for none.
 *
 * `ORDER_CREATED` and `ORDER_MODIFIED` are dropped rather than humanized: they
 * only restate the status the row already shows.
 * @param notes - The entry's `notes` field
 * @returns The humanized note, or `null` when there is nothing to add
 */
export function orderStatusHistoryNote(
  notes: string | null | undefined
): string | null {
  const trimmed = notes?.trim()
  if (!trimmed || trimmed === "ORDER_CREATED" || trimmed === "ORDER_MODIFIED") {
    return null
  }
  return humanizeBackendCode(trimmed)
}
