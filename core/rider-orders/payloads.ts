import type { RiderOrderActionRequest } from "./types"
import {
  failRiderOrderDeliveryBodySchema,
  riderOrderActionBodySchema,
  updateEstimatedDeliveryTimeBodySchema,
  type FailRiderOrderDeliveryBody,
  type RiderOrderActionBody,
  type UpdateEstimatedDeliveryTimeBody
} from "./schemas"
import type {
  FailRiderOrderDeliveryRequest,
  RiderOrderActionResponse,
  UpdateEstimatedDeliveryTimeRequest,
  UpdateEstimatedDeliveryTimeResponse
} from "./types"

/**
 * Returns true when a payload looks like an order resource.
 * @param value - Candidate object
 * @returns Whether identity fields are present
 */
function hasOrderIdentity(value: object): boolean {
  return "id" in value || "orderNumber" in value || "deliveryStatus" in value
}

/**
 * Builds the POST `/riders/orders/:id/action` JSON body.
 * Proof images are included only for dropoff; fail fields only for failed.
 * @param request - Action request including `orderId` (stripped from the body)
 * @returns Validated action body
 * @throws {ZodError} If the body fails schema validation
 * @example
 * buildRiderOrderActionBody({ orderId: "o1", action: "accept" })
 * // { action: "accept" }
 */
export function buildRiderOrderActionBody(
  request: RiderOrderActionRequest
): RiderOrderActionBody {
  const payload: RiderOrderActionBody = { action: request.action }

  if (request.action === "dropoff") {
    if (request.deliveryProofImage) {
      payload.deliveryProofImage = request.deliveryProofImage
    }
    if (request.paymentProofImage) {
      payload.paymentProofImage = request.paymentProofImage
    }
  }

  if (request.action === "failed") {
    if (typeof request.contactAttempted === "boolean") {
      payload.contactAttempted = request.contactAttempted
    }
    if (request.failureReason) {
      payload.failureReason = request.failureReason
    }
  }

  return riderOrderActionBodySchema.parse(payload)
}

/**
 * Builds the POST `/riders/orders/:id/fail` JSON body.
 * @param request - Fail request including `orderId` (stripped from the body)
 * @returns Validated fail body
 * @throws {ZodError} If the body fails schema validation
 */
export function buildFailRiderOrderDeliveryBody(
  request: FailRiderOrderDeliveryRequest
): FailRiderOrderDeliveryBody {
  return failRiderOrderDeliveryBodySchema.parse({
    failureReason: request.failureReason,
    contactAttempted: request.contactAttempted
  })
}

/**
 * Builds the PATCH `/orders/:id/estimated-delivery-time` JSON body.
 * @param request - Request including `orderId` (stripped from the body)
 * @returns Validated `{ minutes }` body
 * @throws {ZodError} If minutes is not a positive integer
 */
export function buildUpdateEstimatedDeliveryTimeBody(
  request: UpdateEstimatedDeliveryTimeRequest
): UpdateEstimatedDeliveryTimeBody {
  return updateEstimatedDeliveryTimeBodySchema.parse({
    minutes: request.minutes
  })
}

/**
 * Normalizes wrapped `{ data }` and unwrapped order mutation responses.
 * @param body - Raw JSON body from the gateway
 * @returns Action response, with `success: true` when an order identity is present
 */
export function unwrapRiderOrderMutationResponse(
  body: unknown
): RiderOrderActionResponse {
  if (!body || typeof body !== "object") {
    return body as RiderOrderActionResponse
  }

  if ("data" in body) {
    const inner = (body as { data: unknown }).data
    if (inner && typeof inner === "object" && hasOrderIdentity(inner)) {
      return {
        success: true,
        ...(inner as object)
      } as RiderOrderActionResponse
    }
    return inner as RiderOrderActionResponse
  }

  if (hasOrderIdentity(body)) {
    return {
      success: true,
      ...body
    } as RiderOrderActionResponse
  }

  return body as RiderOrderActionResponse
}

/**
 * Normalizes wrapped `{ data }` and unwrapped estimated-delivery-time responses.
 * @param body - Raw JSON body from the gateway
 * @returns Response, with `success: true` when an `order` object is present
 */
export function unwrapEstimatedDeliveryTimeResponse(
  body: unknown
): UpdateEstimatedDeliveryTimeResponse {
  if (!body || typeof body !== "object") {
    return body as UpdateEstimatedDeliveryTimeResponse
  }

  if ("data" in body) {
    const inner = (body as { data: unknown }).data
    if (inner && typeof inner === "object" && "order" in inner) {
      return {
        success: true,
        ...(inner as object)
      } as UpdateEstimatedDeliveryTimeResponse
    }
    return inner as UpdateEstimatedDeliveryTimeResponse
  }

  if ("order" in body) {
    return {
      success: true,
      ...body
    } as UpdateEstimatedDeliveryTimeResponse
  }

  return body as UpdateEstimatedDeliveryTimeResponse
}
