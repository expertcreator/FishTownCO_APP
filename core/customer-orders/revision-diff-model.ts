// biome-ignore-all lint/style/useConsistentTypeDefinitions: verbatim copy from mobile-tenant-app (mw-4-3) — rewriting these to `interface` is an UNSAFE fix that breaks the token-equivalence AC, and interfaces get no implicit index signature. Suppressed in-file so it travels to every app that mounts core.
/**
 * Side-by-side diff between an order and its POS revision (`mw-4-3`, copied
 * verbatim from `mobile-tenant-app`'s `features/orders/utils/revisionDiffModel.ts`).
 *
 * Lines are matched by an identity key rather than by row id, because a revision
 * writes new rows for the same product; the money comparison is deliberately
 * fuzzy to half a paisa so a rounding difference does not read as a change.
 */

import type { OrderDetailItem } from "./types"

/** How a line changed between the original order and its revision. */
export type RevisionLineKind = "removed" | "changed" | "added" | "unchanged"

/** One row of the side-by-side diff. `null` marks a side the line is absent from. */
export type RevisionDiffLine = {
  key: string
  kind: RevisionLineKind
  name: string
  priorQuantity: number | null
  revisedQuantity: number | null
  priorSubtotal: number | null
  revisedSubtotal: number | null
}

/** The rendered diff plus both totals and whether anything actually changed. */
export type RevisionDiffResult = {
  lines: RevisionDiffLine[]
  priorTotal: number
  revisedTotal: number
  hasChanges: boolean
}

type DiffableLine = {
  key: string
  name: string
  quantity: number
  subtotal: number
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") {
    return
  }
  return value as Record<string, unknown>
}

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function localizedName(
  obj: { en?: string; ar?: string; ur?: string } | null | undefined,
  language: string
): string {
  if (!obj) {
    return ""
  }
  const lang = language.split("-")[0] || "en"
  if (lang === "ar") {
    return obj.ar || obj.en || ""
  }
  if (lang === "ur" || lang === "rmu") {
    return obj.ur || obj.en || ""
  }
  return obj.en || obj.ar || ""
}

function lineName(item: OrderDetailItem, language: string): string {
  const fromProductName = localizedName(item.productName, language)
  if (fromProductName?.trim()) {
    return fromProductName.trim()
  }
  const names = item.product?.name
  if (Array.isArray(names)) {
    const lang = language.split("-")[0] || "en"
    const match =
      names.find((entry) => entry.language?.startsWith(lang)) ??
      names.find((entry) => entry.language?.startsWith("en")) ??
      names[0]
    if (match?.value?.trim()) {
      return match.value.trim()
    }
  }
  return item.dealId ? "Deal" : "Item"
}

function lineKey(item: OrderDetailItem): string {
  if (item.dealId) {
    return `deal:${item.dealId}`
  }
  const productId = item.productId ?? item.inventory?.productId ?? "unknown"
  const inventoryId = item.inventoryId || item.inventory?.id || ""
  const variant = item.variantId
    ? String(item.variantId)
    : JSON.stringify(item.variantDetails ?? null)
  return `product:${productId}:${inventoryId}:${variant}`
}

function toDiffable(
  items: OrderDetailItem[] | undefined,
  language: string
): Map<string, DiffableLine> {
  const map = new Map<string, DiffableLine>()
  for (const item of items ?? []) {
    if (item.deletedAt || item.isAddon) {
      continue
    }
    const key = lineKey(item)
    const quantity = readNumber(item.quantity)
    const subtotal =
      readNumber(item.subtotal) || readNumber(item.price) * (quantity || 1)
    const existing = map.get(key)
    if (existing) {
      existing.quantity += quantity
      existing.subtotal += subtotal
      continue
    }
    map.set(key, {
      key,
      name: lineName(item, language),
      quantity,
      subtotal
    })
  }
  return map
}

function moneyClose(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005
}

/**
 * Pure side-by-side revision diff for ticket 83.
 * Compares pre-revision lines to revised (child) lines.
 */
export function buildRevisionDiff(input: {
  priorItems?: OrderDetailItem[]
  revisedItems?: OrderDetailItem[]
  priorTotal?: number | null
  revisedTotal?: number | null
  language?: string
}): RevisionDiffResult {
  const language = input.language ?? "en"
  const prior = toDiffable(input.priorItems, language)
  const revised = toDiffable(input.revisedItems, language)
  const keys = new Set([...prior.keys(), ...revised.keys()])
  const lines: RevisionDiffLine[] = []

  for (const key of keys) {
    const left = prior.get(key)
    const right = revised.get(key)
    if (left && !right) {
      lines.push({
        key,
        kind: "removed",
        name: left.name,
        priorQuantity: left.quantity,
        revisedQuantity: null,
        priorSubtotal: left.subtotal,
        revisedSubtotal: null
      })
      continue
    }
    if (!left && right) {
      lines.push({
        key,
        kind: "added",
        name: right.name,
        priorQuantity: null,
        revisedQuantity: right.quantity,
        priorSubtotal: null,
        revisedSubtotal: right.subtotal
      })
      continue
    }
    if (left && right) {
      const changed =
        left.quantity !== right.quantity ||
        !moneyClose(left.subtotal, right.subtotal)
      lines.push({
        key,
        kind: changed ? "changed" : "unchanged",
        name: right.name || left.name,
        priorQuantity: left.quantity,
        revisedQuantity: right.quantity,
        priorSubtotal: left.subtotal,
        revisedSubtotal: right.subtotal
      })
    }
  }

  const kindOrder: Record<RevisionLineKind, number> = {
    removed: 0,
    changed: 1,
    added: 2,
    unchanged: 3
  }
  lines.sort(
    (a, b) =>
      kindOrder[a.kind] - kindOrder[b.kind] || a.name.localeCompare(b.name)
  )

  const priorTotal =
    typeof input.priorTotal === "number" && Number.isFinite(input.priorTotal)
      ? input.priorTotal
      : [...prior.values()].reduce((sum, line) => sum + line.subtotal, 0)
  const revisedTotal =
    typeof input.revisedTotal === "number" &&
    Number.isFinite(input.revisedTotal)
      ? input.revisedTotal
      : [...revised.values()].reduce((sum, line) => sum + line.subtotal, 0)

  return {
    lines,
    priorTotal,
    revisedTotal,
    hasChanges: lines.some((line) => line.kind !== "unchanged")
  }
}

/**
 * Soft-deleted prior lines may still appear on reads that include deletedAt.
 *
 * Deliberately keeps `deletedAt` rows and drops only add-ons: on the PRIOR side
 * a removed line is exactly what the diff needs to show, so filtering it out
 * here would silently turn every removal into "unchanged".
 * @param items - Pre-revision order lines as returned by the detail endpoint
 * @returns The same lines minus add-ons, soft-deleted rows kept
 */
export function includeSoftDeletedPriorLines(
  items: OrderDetailItem[] | undefined
): OrderDetailItem[] {
  return (items ?? []).filter((item) => !item.isAddon)
}

/**
 * Digs the order-detail payload out of whichever wrapper it arrived in.
 *
 * Probes up to three nesting layers (`ApiResponse<{ data: Order }>`, the flat
 * `GetOrderDetailResponse`, and the bare payload) and takes the first layer that
 * carries each field, so a partially-wrapped response still yields a whole
 * order. Returns `null` only when the input is not an object at all.
 * @param raw - An order-detail response of unknown wrapper depth
 * @returns The flattened payload, or `null` when nothing object-shaped was given
 */
export function extractOrderDetailPayload(raw: unknown): {
  id?: string
  orderNumber?: string
  total?: number
  items?: OrderDetailItem[]
  revisionStatus?: string | null
  preRevisionOrderId?: string | null
  revisionExpiryDeadline?: string | null
} | null {
  const root = asRecord(raw)
  if (!root) {
    return null
  }
  // Handle ApiResponse<{ data: Order }> and GetOrderDetailResponse shapes.
  const layer1 = asRecord(root.data) ?? root
  const nested = asRecord(layer1.data) ?? layer1
  let items: OrderDetailItem[] | undefined
  if (Array.isArray(nested.items)) {
    items = nested.items as OrderDetailItem[]
  } else if (Array.isArray(layer1.items)) {
    items = layer1.items as OrderDetailItem[]
  } else if (Array.isArray(root.items)) {
    items = root.items as OrderDetailItem[]
  }
  const pickString = (...values: unknown[]): string | undefined => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim()
      }
    }
    return
  }
  return {
    id: pickString(nested.id, layer1.id, root.id),
    orderNumber: pickString(
      nested.orderNumber,
      layer1.orderNumber,
      root.orderNumber
    ),
    total: readNumber(nested.total ?? layer1.total ?? root.total),
    items,
    revisionStatus:
      (nested.revisionStatus as string | null | undefined) ??
      (layer1.revisionStatus as string | null | undefined) ??
      (root.revisionStatus as string | null | undefined) ??
      null,
    preRevisionOrderId:
      (nested.preRevisionOrderId as string | null | undefined) ??
      (layer1.preRevisionOrderId as string | null | undefined) ??
      (root.preRevisionOrderId as string | null | undefined) ??
      null,
    revisionExpiryDeadline:
      (nested.revisionExpiryDeadline as string | null | undefined) ??
      (layer1.revisionExpiryDeadline as string | null | undefined) ??
      (root.revisionExpiryDeadline as string | null | undefined) ??
      null
  }
}
