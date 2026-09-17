import {
  ERROR_MESSAGES,
  type DeliveryProvider,
  type OrderStatus
} from "./index"

export const ORDER_STATUS_TRANSITION_ERROR_CODES = {
  TERMINAL_STATE: ERROR_MESSAGES.ORDER_STATUS_TERMINAL_STATE,
  TRANSITION_NOT_ALLOWED: ERROR_MESSAGES.ORDER_STATUS_TRANSITION_NOT_ALLOWED
} as const

export type OrderStatusTransitionErrorCode =
  (typeof ORDER_STATUS_TRANSITION_ERROR_CODES)[keyof typeof ORDER_STATUS_TRANSITION_ERROR_CODES]

export interface OrderStatusTransitionErrorParams
  extends Record<string, unknown> {
  currentStatus: OrderStatus
  requestedStatus: OrderStatus
  validStatuses: string
}

export interface OrderStatusTransitionError {
  code: OrderStatusTransitionErrorCode
  params: OrderStatusTransitionErrorParams
}

const DIRECT_FULFILLMENT_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [], // Terminal state
  cancelled: [], // Terminal state

  confirmed: ["preparing", "cancelled"], // Online orders
  on_hold: ["preparing", "cancelled"], // Marketplace
  rejected: [] // Terminal state (marketplace rejection)
}

const POS_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ...DIRECT_FULFILLMENT_TRANSITIONS,
  preparing: ["ready", "completed", "cancelled"]
}

const PLATFORM_RIDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: [],
  completed: [], // Terminal state
  cancelled: [], // Terminal state

  confirmed: ["preparing", "cancelled"], // Online orders
  on_hold: ["preparing", "cancelled"], // Marketplace
  rejected: [] // Terminal state (marketplace rejection)
}

const VALID_TRANSITIONS_BY_DELIVERY_PROVIDER: Record<
  DeliveryProvider,
  Record<OrderStatus, OrderStatus[]>
> = {
  own_rider: DIRECT_FULFILLMENT_TRANSITIONS,
  customer_pickup: DIRECT_FULFILLMENT_TRANSITIONS,
  platform_rider: PLATFORM_RIDER_TRANSITIONS
}

function isDeliveryProvider(
  deliveryProvider?: string | null
): deliveryProvider is DeliveryProvider {
  return (
    deliveryProvider === "own_rider" ||
    deliveryProvider === "platform_rider" ||
    deliveryProvider === "customer_pickup"
  )
}

function getTransitionsForDeliveryProvider(
  deliveryProvider?: DeliveryProvider | string | null
): Record<OrderStatus, OrderStatus[]> {
  if (isDeliveryProvider(deliveryProvider)) {
    return VALID_TRANSITIONS_BY_DELIVERY_PROVIDER[deliveryProvider]
  }

  return POS_ORDER_TRANSITIONS
}

export function isTransitionAllowed(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  deliveryProvider?: DeliveryProvider | string | null
): boolean {
  if (currentStatus === nextStatus) {
    return true
  }

  return getValidNextStatuses(currentStatus, deliveryProvider).includes(
    nextStatus
  )
}

export function getValidNextStatuses(
  currentStatus: OrderStatus,
  deliveryProvider?: DeliveryProvider | string | null
): OrderStatus[] {
  const transitions = getTransitionsForDeliveryProvider(deliveryProvider)
  return transitions[currentStatus] ?? []
}

export function getTransitionError(
  currentStatus: OrderStatus,
  requestedStatus: OrderStatus,
  deliveryProvider?: DeliveryProvider | string | null
): OrderStatusTransitionError {
  const validNextStatuses = getValidNextStatuses(
    currentStatus,
    deliveryProvider
  )
  const validStatuses = validNextStatuses.join(", ")

  if (validNextStatuses.length === 0) {
    return {
      code: ORDER_STATUS_TRANSITION_ERROR_CODES.TERMINAL_STATE,
      params: {
        currentStatus,
        requestedStatus,
        validStatuses
      }
    }
  }

  return {
    code: ORDER_STATUS_TRANSITION_ERROR_CODES.TRANSITION_NOT_ALLOWED,
    params: {
      currentStatus,
      requestedStatus,
      validStatuses
    }
  }
}

export function getTransitionErrorMessage(
  currentStatus: OrderStatus,
  requestedStatus: OrderStatus,
  deliveryProvider?: DeliveryProvider | string | null
): OrderStatusTransitionErrorCode {
  return getTransitionError(currentStatus, requestedStatus, deliveryProvider)
    .code
}
