// biome-ignore-all lint/style/useConsistentTypeDefinitions: verbatim copy from mobile-tenant-app (mw-4-3) — rewriting these to `interface` is an UNSAFE fix that breaks the token-equivalence AC, and interfaces get no implicit index signature. Suppressed in-file so it travels to every app that mounts core.
/**
 * "Modified after POS update" detection for a customer order (`mw-4-3`, copied
 * verbatim from `mobile-tenant-app`'s `features/orders/utils/orderModified.ts`).
 *
 * Three independent signals, checked in order, because different endpoints
 * report the same fact differently: an explicit flag, an `ORDER_MODIFIED`
 * history note, or a line carrying a round number above one.
 */

const ORDER_MODIFIED_NOTE = "ORDER_MODIFIED"

type OrderHistoryLike = {
  notes?: unknown
}

type OrderModifiedSource = {
  isModified?: unknown
  is_modified?: unknown
  orderStatusHistory?: OrderHistoryLike[] | null
  items?: Array<{ roundNo?: unknown }> | null
}

/**
 * True when the order payload marks the order as modified after POS update.
 * @param value - Raw `isModified` / `is_modified` from list or detail API
 * @returns Whether the Modified badge should show
 */
export function isOrderModifiedFlag(value: unknown): boolean {
  return value === true || value === "true" || value === 1
}

/**
 * True when status-history notes mark a POS modification.
 * @param notes - History `notes` value
 * @returns Whether this entry is an ORDER_MODIFIED event
 */
function isOrderModifiedHistoryNote(notes: unknown): boolean {
  if (typeof notes !== "string") {
    return false
  }
  return notes.trim().toUpperCase() === ORDER_MODIFIED_NOTE
}

/**
 * Reads modified signal from list/detail order payload.
 * Prefers `isModified`, then history `ORDER_MODIFIED` notes, then extra item rounds.
 * @param order - Order payload (list item or detail `data`)
 * @returns Whether the Modified badge should show
 */
export function isOrderModified(
  order: OrderModifiedSource | null | undefined
): boolean {
  if (!order) {
    return false
  }
  if (
    isOrderModifiedFlag(order.isModified) ||
    isOrderModifiedFlag(order.is_modified)
  ) {
    return true
  }
  if (
    order.orderStatusHistory?.some((entry) =>
      isOrderModifiedHistoryNote(entry.notes)
    )
  ) {
    return true
  }
  return Boolean(
    order.items?.some((item) => {
      const roundNo = Number(item.roundNo)
      return Number.isFinite(roundNo) && roundNo > 1
    })
  )
}
