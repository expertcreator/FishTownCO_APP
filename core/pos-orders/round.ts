import { buildPlaceOrderApiItems } from "./items"
import type {
  PosBillEditAction,
  PosBillLine,
  PosCartLine,
  PosExistingPutItem,
  PosOrderShell,
  PosSendRoundPutBody
} from "./types"

/**
 * Last remaining line cannot be voided — cancel the order instead.
 * @param input - Current line count
 * @returns True when void is allowed
 */
export function canVoidBillLine(input: { lineCount: number }): boolean {
  return input.lineCount > 1
}

/**
 * Maps an existing bill line for PUT `/orders/:id` — keep `id`.
 * @param item - Server line
 * @returns PUT row or null when empty
 */
export function mapExistingOrderItemForPut(
  item: PosBillLine
): PosExistingPutItem | null {
  const mapped = mapBillLineIdentityForPut(item)
  if (!(mapped && item.quantity > 0)) {
    return null
  }
  return { ...mapped, quantity: item.quantity }
}

/**
 * Maps a removed bill line as quantity 0 so PUT can drop it.
 * @param item - Line that left the ticket
 * @returns PUT row with quantity 0, or null when it has no id
 */
export function mapVoidedOrderItemForPut(
  item: PosBillLine
): PosExistingPutItem | null {
  const mapped = mapBillLineIdentityForPut(item)
  if (!mapped) {
    return null
  }
  return { ...mapped, quantity: 0 }
}

function mapBillLineIdentityForPut(
  item: PosBillLine
): Omit<PosExistingPutItem, "quantity"> | null {
  if (!item?.id) {
    return null
  }

  const dealId = typeof item.dealId === "string" ? item.dealId : undefined
  const combinationId =
    item.combinationId ?? item.variantDetails?.combinationId ?? undefined
  const addons =
    item.addons
      ?.filter((addon) => addon.quantity > 0)
      .map((addon) => ({
        addonProductId: addon.addonProductId,
        quantity: addon.quantity,
        ...(addon.combinationId ? { combinationId: addon.combinationId } : {})
      })) ?? []

  const variantDetails: Record<string, unknown> = {
    ...(combinationId ? { combinationId } : {}),
    ...(item.variantDetails?.combinationLabel
      ? { combinationLabel: item.variantDetails.combinationLabel }
      : {}),
    modifierSelections:
      item.modifierSelections ??
      item.variantDetails?.modifierSelections ??
      undefined,
    modifierTotal: item.variantDetails?.modifierTotal ?? 0
  }
  const selections = item.variantDetails?.selections
  if (selections) {
    variantDetails.selections = selections
  }

  let identity: {
    dealId?: string
    combinationId?: string
    productId?: string
  }
  if (dealId) {
    identity = { dealId }
  } else if (combinationId) {
    identity = { combinationId }
  } else {
    identity = { productId: item.productId }
  }

  return {
    id: item.id,
    ...identity,
    ...(addons.length > 0 ? { addons } : {}),
    variantDetails
  }
}

/**
 * Applies qty/void onto bill lines. Caller must block last-line void first.
 * Quantity below 1 is a void.
 * @param items - Current lines
 * @param action - Void, add qty, or replace qty
 * @returns Next lines
 * @throws {Error} `bill_edit_empty` when the result has no lines
 * @throws {Error} `bill_edit_last_item` when the last line would be voided
 */
export function applyPosBillEditToItems(
  items: PosBillLine[],
  action: PosBillEditAction
): PosBillLine[] {
  if (
    action.kind === "void" ||
    (action.kind === "replace-qty" && action.quantity < 1)
  ) {
    if (!canVoidBillLine({ lineCount: items.length })) {
      throw new Error("bill_edit_last_item")
    }
    const next = items.filter(
      (item) => String(item.id) !== String(action.itemId)
    )
    if (next.length === 0) {
      throw new Error("bill_edit_empty")
    }
    return next
  }

  const next = items
    .map((item) => {
      if (String(item.id) !== String(action.itemId)) {
        return item
      }
      if (action.kind === "add") {
        const nextQty =
          Math.max(1, Number(item.quantity) || 1) + action.quantity
        return { ...item, quantity: nextQty }
      }
      return { ...item, quantity: Math.max(1, action.quantity) }
    })
    .filter((item) => (Number(item.quantity) || 0) > 0)

  if (next.length === 0) {
    throw new Error("bill_edit_empty")
  }
  return next
}

/**
 * POS/marketplace send-round body: existing lines (with id) + new lines (no id).
 * @param order - Open bill
 * @param newItems - Round cart lines
 * @param orderStatusOverride - Kitchen status to send; defaults to the open bill
 * @returns PUT body
 * @throws {Error} `send_round_empty` when newItems is empty and no existing mapped lines
 */
export function buildSendRoundPutBody(
  order: PosOrderShell,
  newItems: PosCartLine[],
  orderStatusOverride?: string
): PosSendRoundPutBody {
  const existing = (order.items ?? [])
    .map(mapExistingOrderItemForPut)
    .filter((row): row is PosExistingPutItem => row != null)
  const appended = buildPlaceOrderApiItems(newItems)

  if (existing.length === 0 && appended.length === 0) {
    throw new Error("send_round_empty")
  }

  return {
    items: [...existing, ...appended],
    orderStatus:
      orderStatusOverride ?? String(order.orderStatus ?? "confirmed"),
    paymentStatus: order.paymentStatus ?? "pending",
    paymentMethod: order.paymentMethod ?? "cash",
    orderType: order.orderType,
    notes: order.notes ?? "",
    customerName: order.customerName ?? "",
    customerMobile: order.customerMobile ?? "",
    isOnlineOrder: order.isOnlineOrder === true
  }
}

/**
 * PUT body for qty/void (no new lines).
 * @param order - Open bill
 * @param nextItems - Edited lines
 * @param orderStatusOverride - Kitchen status to send; defaults to the open bill
 * @returns PUT body
 */
export function buildPosBillEditPutBody(
  order: PosOrderShell,
  nextItems: PosBillLine[],
  orderStatusOverride?: string
): PosSendRoundPutBody {
  const original = order.items ?? []
  const body = buildSendRoundPutBody(
    { ...order, items: nextItems },
    [],
    orderStatusOverride
  )
  const keptIds = new Set(nextItems.map((item) => String(item.id)))
  const removed = original
    .filter((item) => item.id && !keptIds.has(String(item.id)))
    .map(mapVoidedOrderItemForPut)
    .filter((row): row is PosExistingPutItem => row != null)
  return {
    ...body,
    items: [...body.items, ...removed]
  }
}

/**
 * Server/live line fields used to group kitchen sends.
 */
export interface KitchenRoundItem {
  id: string
  roundNo?: number | null
  roundSentAt?: string | null
  createdAt?: string | null
}

/**
 * One kitchen send: the items that went out together.
 */
export interface KitchenRoundGroup {
  key: string
  sentAt: string | null
  itemIds: string[]
  roundNo: number | null
  modificationIndex: number
  isOpening: boolean
  isLatest: boolean
}

/**
 * Maps a 1-based kitchen send to a 0-based modification index.
 * Zero is the original order; later sends are modifications 1, 2, …
 * @param roundNo - Kitchen send number (1 = original)
 * @returns `roundNo - 1`, clamped at 0
 * @example
 * kitchenModificationIndex(1) // 0 — original order
 * kitchenModificationIndex(3) // 2 — second modification
 */
export function kitchenModificationIndex(roundNo: number): number {
  if (!Number.isFinite(roundNo) || roundNo < 1) {
    return 0
  }
  return Math.trunc(roundNo) - 1
}

function asRoundItem(item: unknown, index: number): KitchenRoundItem {
  if (!(item && typeof item === "object")) {
    return { id: String(index) }
  }
  const rec = item as Record<string, unknown>
  const roundNo = Number(rec.roundNo)
  return {
    id: typeof rec.id === "string" ? rec.id : String(index),
    roundNo: Number.isFinite(roundNo) && roundNo > 0 ? roundNo : null,
    roundSentAt: typeof rec.roundSentAt === "string" ? rec.roundSentAt : null,
    createdAt: typeof rec.createdAt === "string" ? rec.createdAt : null
  }
}

function roundBucketKey(item: KitchenRoundItem): string {
  if (item.roundNo != null) {
    return `n:${item.roundNo}`
  }
  const stamp = item.roundSentAt ?? item.createdAt
  if (stamp) {
    return `t:${stamp}`
  }
  return "unknown"
}

function roundSortStamp(item: KitchenRoundItem): string {
  return item.roundSentAt ?? item.createdAt ?? ""
}

/**
 * Opening send first: `roundNo` when both groups have it, else timestamp.
 * A missing stamp sorts before an ISO time so marketplace originals
 * (`roundNo: 1`, `roundSentAt: null`) stay ahead of later sends.
 * @param left - Left group
 * @param right - Right group
 * @returns Negative when `left` is earlier
 */
function compareKitchenRoundGroups(
  left: { key: string; sortAt: string; roundNo: number | null },
  right: { key: string; sortAt: string; roundNo: number | null }
): number {
  if (left.roundNo != null && right.roundNo != null) {
    const byRound = left.roundNo - right.roundNo
    if (byRound !== 0) {
      return byRound
    }
  }
  if (left.sortAt && right.sortAt) {
    const byTime = left.sortAt.localeCompare(right.sortAt)
    if (byTime !== 0) {
      return byTime
    }
  } else if (left.sortAt !== right.sortAt) {
    return left.sortAt ? 1 : -1
  }
  return left.key.localeCompare(right.key)
}

/**
 * Groups bill lines by kitchen send (API `roundNo`, else sent/created stamp).
 * Display order is `roundNo` then timestamp. A missing stamp is the opening
 * send, not a fallback key — `"n:1"` would sort after later ISO times.
 * `modificationIndex` is send-order minus one (0 = original), so skipped API
 * round numbers do not appear as gaps.
 * @param items - Order lines with optional round fields
 * @returns Chronological send groups
 */
export function groupItemsByKitchenRound(
  items: unknown[] | null | undefined
): KitchenRoundGroup[] {
  if (!items?.length) {
    return []
  }
  const buckets = new Map<string, KitchenRoundItem[]>()
  for (const [index, raw] of items.entries()) {
    const item = asRoundItem(raw, index)
    const key = roundBucketKey(item)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(item)
      continue
    }
    buckets.set(key, [item])
  }

  const groups = [...buckets.entries()]
    .map(([key, bucket]) => {
      const stamps = bucket.map(roundSortStamp).filter(Boolean).sort()
      const sentAt =
        bucket.find((item) => item.roundSentAt)?.roundSentAt ??
        bucket.find((item) => item.createdAt)?.createdAt ??
        null
      const roundNo =
        bucket.find((item) => item.roundNo != null)?.roundNo ?? null
      return {
        key,
        sortAt: stamps.at(0) ?? "",
        sentAt,
        roundNo,
        itemIds: bucket.map((item) => item.id)
      }
    })
    .sort(compareKitchenRoundGroups)

  return groups.map((group, index) => ({
    key: group.key,
    sentAt: group.sentAt,
    itemIds: group.itemIds,
    roundNo: group.roundNo,
    modificationIndex: kitchenModificationIndex(index + 1),
    isOpening: index === 0,
    isLatest: index === groups.length - 1
  }))
}

/**
 * Next kitchen-send ordinal from distinct sends already on the bill.
 * @param items - Current bill items
 * @returns 1 when empty; otherwise group count + 1
 */
export function nextKitchenRoundNumber(
  items: unknown[] | null | undefined
): number {
  const groups = groupItemsByKitchenRound(items)
  if (groups.length === 0) {
    return 1
  }
  return groups.length + 1
}

/**
 * Formats when a kitchen send left the ticket, without pinning ICU "at" wording.
 * @param iso - Round sent-at timestamp
 * @param locale - Active UI locale
 * @returns Localized short time, or empty when missing/invalid
 * @example
 * formatKitchenRoundTime("2026-08-20T06:52:46.715Z", "en")
 */
export function formatKitchenRoundTime(
  iso: string | null | undefined,
  locale: string
): string {
  if (!iso) {
    return ""
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit"
  })
}
