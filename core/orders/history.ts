import { ORDER_STATUS, type OrderStatus } from "@/constants"

const ORDER_STATUS_SET = new Set<string>(ORDER_STATUS)
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OPAQUE_ID_PATTERN = /^[a-z0-9_-]{20,}$/i
export const ORDER_HISTORY_NOTES = {
  created: "ORDER_CREATED",
  modified: "ORDER_MODIFIED"
} as const

export interface HistoryActor {
  id?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  type?: string | null
}

export interface OrderStatusHistoryEntry {
  id?: string | null
  orderId?: string | null
  status?: string | null
  oldStatus?: string | null
  newStatus?: string | null
  orderStatus?: string | null
  updatedBy?: string | HistoryActor | null
  updatedByUser?: HistoryActor | null
  user?: HistoryActor | null
  actor?: HistoryActor | null
  isSystemUpdate?: boolean
  notes?: string | null
  changedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface OrderHistorySource {
  id: string
  userId?: string | null
  customerName?: string | null
  customerMobile?: string | null
  createdBy?: string | HistoryActor | null
  orderStatus: string
  createdAt: string
  updatedAt?: string | null
  orderStatusHistory?: OrderStatusHistoryEntry[] | null
}

export type OrderHistoryEventKind =
  | "created"
  | "modified"
  | "accepted"
  | "rejected"
  | "auto-cancelled"
  | "auto-rejected"

export interface OrderHistoryEvent {
  id: string
  status: OrderStatus | null
  kind: OrderHistoryEventKind | null
  timestamp: string
  actor: string | null
  isSystemUpdate: boolean
  reason: string | null
}

function toOrderStatus(status: unknown): OrderStatus | null {
  if (typeof status !== "string") {
    return null
  }

  const normalizedStatus = status.trim()
  return ORDER_STATUS_SET.has(normalizedStatus)
    ? (normalizedStatus as OrderStatus)
    : null
}

function getHistoryStatus(item: OrderStatusHistoryEntry) {
  const status = [item.status, item.orderStatus, item.newStatus].find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0
  )

  return status?.trim() ?? null
}

function getHistoryItemTimestamp(item: OrderStatusHistoryEntry) {
  return item.changedAt || item.createdAt || item.updatedAt || null
}

function sortByOccurredAt(
  a: OrderStatusHistoryEntry,
  b: OrderStatusHistoryEntry
) {
  const firstTime = new Date(getHistoryItemTimestamp(a) || 0).getTime()
  const secondTime = new Date(getHistoryItemTimestamp(b) || 0).getTime()
  return firstTime - secondTime
}

function isLikelyOpaqueId(value: string) {
  return (
    UUID_PATTERN.test(value) ||
    (OPAQUE_ID_PATTERN.test(value) && !value.includes("@"))
  )
}

function getActorDisplayName(actor: unknown, order: OrderHistorySource) {
  if (!actor) {
    return null
  }

  if (typeof actor === "string") {
    const value = actor.trim()

    if (value.length === 0) {
      return null
    }

    if (value === order.userId) {
      return order.customerName || order.customerMobile || null
    }

    return isLikelyOpaqueId(value) ? null : value
  }

  if (typeof actor !== "object") {
    return null
  }

  const record = actor as HistoryActor
  return record.name || record.email || record.phone || null
}

function getHistoryActor(
  item: OrderStatusHistoryEntry,
  order: OrderHistorySource
) {
  return (
    getActorDisplayName(item.updatedByUser, order) ??
    getActorDisplayName(item.user, order) ??
    getActorDisplayName(item.actor, order) ??
    getActorDisplayName(item.updatedBy, order)
  )
}

function getActorType(actor: unknown): string | null {
  if (!actor || typeof actor !== "object") {
    return null
  }

  const type = (actor as HistoryActor).type
  if (typeof type !== "string") {
    return null
  }

  const normalizedType = type.trim().toLowerCase()
  return normalizedType.length > 0 ? normalizedType : null
}

function getHistoryActorType(item: OrderStatusHistoryEntry) {
  return (
    getActorType(item.updatedByUser) ??
    getActorType(item.user) ??
    getActorType(item.actor) ??
    getActorType(item.updatedBy)
  )
}

function getOrderCreatedActor(
  history: OrderStatusHistoryEntry[],
  order: OrderHistorySource
) {
  const creationItem =
    history.find((item) => item.notes === ORDER_HISTORY_NOTES.created) ??
    history.find((item) => toOrderStatus(getHistoryStatus(item)) === "pending")

  return creationItem ? getHistoryActor(creationItem, order) : null
}

function getStatusEventKind(
  status: OrderStatus | null,
  isSystemUpdate = false
): OrderHistoryEventKind | null {
  if (isSystemUpdate && status === "cancelled") {
    return "auto-cancelled"
  }

  if (isSystemUpdate && status === "rejected") {
    return "auto-rejected"
  }

  if (status === "confirmed") {
    return "accepted"
  }

  if (status === "rejected") {
    return "rejected"
  }

  return null
}

function getActorAffiliationLabel(
  isSystemUpdate: boolean,
  systemName: string,
  tenantName: string,
  actorType: string | null
) {
  if (isSystemUpdate) {
    return systemName
  }

  if (actorType === "super_admin") {
    return "Super Admin"
  }

  if (actorType === "rider") {
    return "Rider"
  }

  return tenantName
}

function formatHistoryActor(
  actor: string | null,
  isSystemUpdate: boolean,
  systemName: string,
  tenantName: string,
  actorType: string | null
) {
  if (!actor) {
    return null
  }

  return `${actor} (${getActorAffiliationLabel(isSystemUpdate, systemName, tenantName, actorType)})`
}

function getEventTimestamp(
  item: OrderStatusHistoryEntry,
  order: OrderHistorySource
) {
  return getHistoryItemTimestamp(item) || order.updatedAt || order.createdAt
}

/**
 * Resolves who opened the order, from history notes then `createdBy`.
 * @param order - Order with optional status history
 * @returns Display name, or null when only opaque ids are present
 */
export function getOrderCreatedActorName(
  order: OrderHistorySource
): string | null {
  const history = [...(order.orderStatusHistory ?? [])].sort(sortByOccurredAt)
  return (
    getOrderCreatedActor(history, order) ??
    getActorDisplayName(order.createdBy, order)
  )
}

/**
 * Turns API order-status history into timeline rows for any Fishtownco client.
 * `ORDER_MODIFIED` is kept even when kitchen status does not change.
 * @param order - Order with optional `orderStatusHistory`
 * @param systemName - Brand name shown for system-authored rows
 * @param tenantName - Label shown for staff-authored rows (tenant / restaurant name)
 * @returns Timeline events, including created and modified rows
 * @example
 * getOrderHistoryEvents(order, "Fishtownco", "Dr Saucys")[0]?.kind // "created"
 */
export function getOrderHistoryEvents(
  order: OrderHistorySource,
  systemName: string,
  tenantName: string
): OrderHistoryEvent[] {
  const history = [...(order.orderStatusHistory ?? [])].sort(sortByOccurredAt)
  const createdActor =
    getOrderCreatedActor(history, order) ??
    order.customerName ??
    order.customerMobile ??
    null
  const events: OrderHistoryEvent[] = [
    {
      id: `${order.id}-created`,
      status: "pending",
      kind: "created",
      timestamp: order.createdAt,
      actor: createdActor,
      isSystemUpdate: false,
      reason: null
    }
  ]

  for (const item of history) {
    const notes = item.notes?.trim() ?? ""

    if (notes === ORDER_HISTORY_NOTES.created) {
      continue
    }

    const actor = getHistoryActor(item, order)
    const formattedActor = formatHistoryActor(
      actor,
      item.isSystemUpdate === true,
      systemName,
      tenantName,
      getHistoryActorType(item)
    )
    const timestamp = getEventTimestamp(item, order)

    if (notes === ORDER_HISTORY_NOTES.modified) {
      events.push({
        id: item.id || `${order.id}-modified-${events.length}`,
        status: toOrderStatus(getHistoryStatus(item)),
        kind: "modified",
        timestamp,
        actor: formattedActor,
        isSystemUpdate: item.isSystemUpdate === true,
        reason: null
      })
      continue
    }

    const status = toOrderStatus(getHistoryStatus(item))

    if (!status || status === "pending") {
      continue
    }

    const previousStatus = toOrderStatus(item.oldStatus)

    if (previousStatus && previousStatus === status) {
      continue
    }

    events.push({
      id: item.id || `${order.id}-${status}-${events.length}`,
      status,
      kind: getStatusEventKind(status, item.isSystemUpdate),
      timestamp,
      actor: formattedActor,
      isSystemUpdate: item.isSystemUpdate === true,
      reason:
        item.isSystemUpdate && (status === "cancelled" || status === "rejected")
          ? item.notes?.trim() || null
          : null
    })
  }

  const orderStatus = toOrderStatus(order.orderStatus)

  if (events.length === 1 && orderStatus && orderStatus !== "pending") {
    events.push({
      id: `${order.id}-current-status`,
      status: orderStatus,
      kind: getStatusEventKind(orderStatus),
      timestamp: order.updatedAt || order.createdAt,
      actor: null,
      isSystemUpdate: false,
      reason: null
    })
  }

  return events
}
