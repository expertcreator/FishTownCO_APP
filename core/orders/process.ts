/**
 * Marketplace accept / reject: gate + POST `/orders/:id/process` helpers.
 * POS pending tickets keep the kitchen advance path (not this module).
 */

/** Restaurant-admin process / status paths (no leading slash). */
export const ORDERS_PROCESS_API = {
  /**
   * @param orderId - Order id
   * @returns `orders/:id/process`
   */
  process: (orderId: string) => `orders/${encodeURIComponent(orderId)}/process`,
  /**
   * @param orderId - Order id
   * @returns `orders/:id/status`
   */
  status: (orderId: string) => `orders/${encodeURIComponent(orderId)}/status`
} as const

/**
 * Whether a marketplace ticket still needs Accept / Reject.
 * @param input - Online flag and kitchen status
 * @returns `true` when the operator must accept or reject
 */
export function needsMarketplaceAcceptReject(input: {
  isOnlineOrder?: boolean | null
  orderStatus?: string | null
}): boolean {
  return (
    input.isOnlineOrder === true &&
    String(input.orderStatus ?? "")
      .trim()
      .toLowerCase() === "pending"
  )
}

export type ProcessOrderAcceptBody = {
  action: "accept"
  estimatedPreparationMinutes?: number
  estimatedDeliveryMinutes?: number
  excludeDeliveryFee?: boolean
}

export type ProcessOrderRejectBody = {
  action: "reject"
  reason: string
}

export type ProcessOrderBody = ProcessOrderAcceptBody | ProcessOrderRejectBody

export type ProcessOrderAcceptArgs = {
  orderId: string
  action: "accept"
  estimatedPreparationMinutes?: number
  estimatedDeliveryMinutes?: number
  excludeDeliveryFee?: boolean
}

export type ProcessOrderRejectArgs = {
  orderId: string
  action: "reject"
  reason: string
}

export type ProcessOrderArgs = ProcessOrderAcceptArgs | ProcessOrderRejectArgs

export type ProcessedOrderSnapshot = {
  id: string
  orderStatus?: string
  paymentStatus?: string
}

/** Minimal HTTP surface for process + optional status follow-up. */
export type OrdersProcessHttp = {
  post: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
  patch: <TResponse, TBody extends object>(
    path: string,
    json: TBody
  ) => Promise<TResponse>
}

/**
 * Builds the POST `/orders/:id/process` JSON body.
 * @param input - Accept or reject args (orderId stripped)
 * @returns Request body
 */
export function buildProcessOrderBody(
  input: ProcessOrderBody
): ProcessOrderBody {
  if (input.action === "reject") {
    return { action: "reject", reason: input.reason }
  }
  return {
    action: "accept",
    ...(input.estimatedPreparationMinutes !== undefined
      ? { estimatedPreparationMinutes: input.estimatedPreparationMinutes }
      : {}),
    ...(input.estimatedDeliveryMinutes !== undefined
      ? { estimatedDeliveryMinutes: input.estimatedDeliveryMinutes }
      : {}),
    ...(input.excludeDeliveryFee !== undefined
      ? { excludeDeliveryFee: input.excludeDeliveryFee }
      : {})
  }
}

/**
 * Reads id / orderStatus / paymentStatus from a process response payload.
 * @param payload - Raw JSON (possibly nested under `order`)
 * @param fallbackId - Path order id when body omits id
 * @returns Snapshot or null
 */
export function parseProcessedOrder(
  payload: unknown,
  fallbackId: string
): ProcessedOrderSnapshot | null {
  if (!payload || typeof payload !== "object") {
    return null
  }
  const root = payload as Record<string, unknown>
  const nested =
    root.order && typeof root.order === "object"
      ? (root.order as Record<string, unknown>)
      : null
  const source = nested ?? root
  const id =
    typeof source.id === "string" && source.id.trim() ? source.id : fallbackId
  let orderStatus: string | undefined
  if (typeof source.orderStatus === "string") {
    orderStatus = source.orderStatus.toLowerCase()
  } else if (typeof source.order_status === "string") {
    orderStatus = source.order_status.toLowerCase()
  }
  let paymentStatus: string | undefined
  if (typeof source.paymentStatus === "string") {
    paymentStatus = source.paymentStatus
  } else if (typeof source.payment_status === "string") {
    paymentStatus = source.payment_status
  }
  return { id, orderStatus, paymentStatus }
}

/**
 * True when accept left the ticket outside preparing (needs status PATCH).
 * @param orderStatus - Status after process
 * @returns Whether to PATCH → preparing
 */
export function needsAcceptPreparingFollowUp(
  orderStatus: string | null | undefined
): boolean {
  return (
    String(orderStatus ?? "")
      .trim()
      .toLowerCase() !== "preparing"
  )
}

/**
 * Builds PATCH `/orders/:id/status` body after accept when still not preparing.
 * @param input - Optional payment + prep / delivery minutes from the accept call
 * @returns Status patch JSON
 */
export function buildAcceptPreparingStatusPatch(input: {
  paymentStatus?: string | null
  estimatedPreparationMinutes?: number
  estimatedDeliveryMinutes?: number
}): {
  new_status: "preparing"
  payment_status?: string
  estimated_preparation_minutes?: number
  estimated_delivery_minutes?: number
} {
  return {
    new_status: "preparing",
    ...(input.paymentStatus ? { payment_status: input.paymentStatus } : {}),
    ...(input.estimatedPreparationMinutes !== undefined
      ? {
          estimated_preparation_minutes: input.estimatedPreparationMinutes
        }
      : {}),
    ...(input.estimatedDeliveryMinutes !== undefined
      ? { estimated_delivery_minutes: input.estimatedDeliveryMinutes }
      : {})
  }
}

/**
 * POST process, then PATCH → preparing when accept did not land there.
 * @param http - Injected client
 * @param args - Order id + accept/reject body fields
 * @returns Parsed id / status snapshot
 */
export async function processOrderAction(
  http: OrdersProcessHttp,
  args: ProcessOrderArgs
): Promise<ProcessedOrderSnapshot> {
  const { orderId, ...bodyFields } = args
  const body = buildProcessOrderBody(bodyFields)
  const raw = await http.post<unknown, ProcessOrderBody>(
    ORDERS_PROCESS_API.process(orderId),
    body
  )
  const processed = parseProcessedOrder(raw, orderId) ?? { id: orderId }

  if (args.action !== "accept") {
    return processed
  }
  if (!needsAcceptPreparingFollowUp(processed.orderStatus)) {
    return processed
  }

  const patched = await http.patch<
    unknown,
    ReturnType<typeof buildAcceptPreparingStatusPatch>
  >(
    ORDERS_PROCESS_API.status(orderId),
    buildAcceptPreparingStatusPatch({
      paymentStatus: processed.paymentStatus,
      estimatedPreparationMinutes: args.estimatedPreparationMinutes,
      estimatedDeliveryMinutes: args.estimatedDeliveryMinutes
    })
  )

  return (
    parseProcessedOrder(patched, orderId) ?? {
      ...processed,
      orderStatus: "preparing"
    }
  )
}
