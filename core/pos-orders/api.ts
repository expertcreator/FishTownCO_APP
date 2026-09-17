import { POS_ORDERS_API } from "./constants"
import type { PosOrdersHttp, PosOrdersSearchParams } from "./http"
import { buildPosBillEditPutBody, buildSendRoundPutBody } from "./round"
import type {
  PosBillLine,
  PosCartLine,
  PosCreateOrderBody,
  PosOrderShell,
  PosSettlePutBody
} from "./types"

/**
 * Lists restaurant-admin orders (`GET /orders/admin`).
 * @param http - Injected client
 * @param searchParams - Serialized list filters (`page`, `limit`, `search`, `sort`, `filters`)
 * @returns Parsed list payload
 * @example
 * const page = await listAdminOrders<{ data: { id: string }[]; total: number }>(
 *   http,
 *   "page=0&limit=20"
 * )
 */
export function listAdminOrders<TResponse>(
  http: PosOrdersHttp,
  searchParams?: PosOrdersSearchParams
): Promise<TResponse> {
  return http.get<TResponse>(POS_ORDERS_API.admin, searchParams)
}

/**
 * Creates a POS walk-in / dine-in order.
 * @param http - Injected client
 * @param body - POST `/orders` body
 * @returns Parsed create response
 */
export function createPosOrder<TResponse>(
  http: PosOrdersHttp,
  body: PosCreateOrderBody
): Promise<TResponse> {
  return http.post<TResponse, PosCreateOrderBody>(POS_ORDERS_API.create, body)
}

/**
 * Replaces an order (settle, round, bill edit).
 * @param http - Injected client
 * @param orderId - Order id
 * @param body - PUT body
 * @returns Parsed response
 */
export function updatePosOrder<TResponse, TBody extends object>(
  http: PosOrdersHttp,
  orderId: string,
  body: TBody
): Promise<TResponse> {
  return http.put<TResponse, TBody>(POS_ORDERS_API.byId(orderId), body)
}

/**
 * Loads one order.
 * @param http - Injected client
 * @param orderId - Order id
 * @returns Parsed order
 */
export function getPosOrder<TResponse>(
  http: PosOrdersHttp,
  orderId: string
): Promise<TResponse> {
  return http.get<TResponse>(POS_ORDERS_API.byId(orderId))
}

/**
 * PATCH `/orders/:id/status`.
 * @param http - Injected client
 * @param orderId - Order id
 * @param body - `{ new_status }` plus optional payment/cancel fields
 * @returns Parsed response
 */
export function updatePosOrderStatus<TResponse, TBody extends object>(
  http: PosOrdersHttp,
  orderId: string,
  body: TBody
): Promise<TResponse> {
  return http.patch<TResponse, TBody>(POS_ORDERS_API.status(orderId), body)
}

/**
 * PATCH `/orders/:id/table`.
 * @param http - Injected client
 * @param orderId - Order id
 * @param tableId - Table to assign
 * @returns Parsed response
 */
export function assignPosOrderTable<TResponse>(
  http: PosOrdersHttp,
  orderId: string,
  tableId: string
): Promise<TResponse> {
  return http.patch<TResponse, { tableId: string }>(
    POS_ORDERS_API.table(orderId),
    { tableId }
  )
}

type BillWriteOrder = PosOrderShell & { id?: string }

/**
 * PUT bill items or a kitchen round in a single `/orders/:id` request.
 * @param http - Injected client
 * @param args - Order, optional new round lines, or already-edited items
 * @returns Parsed PUT response
 */
export function putPosBillItems<TResponse>(
  http: PosOrdersHttp,
  args: {
    orderId: string
    order: BillWriteOrder
    newItems?: PosCartLine[]
    nextItems?: PosBillLine[]
  }
): Promise<TResponse> {
  const newItems = args.newItems ?? []
  const payload =
    args.nextItems != null && newItems.length === 0
      ? buildPosBillEditPutBody(args.order, args.nextItems)
      : buildSendRoundPutBody(
          args.nextItems != null
            ? { ...args.order, items: args.nextItems }
            : args.order,
          newItems
        )

  return updatePosOrder<TResponse, typeof payload>(http, args.orderId, payload)
}

/**
 * PUT payment fields only (inline settle). Does not free the table.
 * @param http - Injected client
 * @param orderId - Order id
 * @param body - Settle PUT body
 * @returns Parsed response
 */
export function settlePosOrder<TResponse>(
  http: PosOrdersHttp,
  orderId: string,
  body: PosSettlePutBody
): Promise<TResponse> {
  return updatePosOrder<TResponse, PosSettlePutBody>(http, orderId, body)
}

/**
 * PATCH `/orders/:id/order-type` to pickup (Fishtownco marketplace delivery).
 * @param http - Injected client
 * @param orderId - Order to convert
 * @returns Parsed response
 */
export function changeOnlineOrderToPickup<TResponse>(
  http: PosOrdersHttp,
  orderId: string
): Promise<TResponse> {
  return http.patch<TResponse, { orderType: "pickup" }>(
    POS_ORDERS_API.orderType(orderId),
    { orderType: "pickup" }
  )
}
