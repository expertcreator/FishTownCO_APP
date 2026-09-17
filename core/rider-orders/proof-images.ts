/**
 * Picks delivery and payment proof image URLs from an order-details payload.
 * Accepts current field names plus a few legacy aliases.
 * @param payload - Order details API `data` object (or equivalent record)
 * @returns Non-empty proof image URLs when present
 * @example
 * pickOrderProofImageUrls({ deliveryProofImage: "https://cdn/a.jpg" })
 * // { deliveryProofImage: "https://cdn/a.jpg" }
 */
export function pickOrderProofImageUrls(
  payload: Record<string, unknown> | null | undefined
): {
  deliveryProofImage?: string
  paymentProofImage?: string
} {
  if (!payload || typeof payload !== "object") {
    return {}
  }

  const tracking =
    payload.tracking && typeof payload.tracking === "object"
      ? (payload.tracking as Record<string, unknown>)
      : undefined

  const asUrl = (...candidates: unknown[]): string | undefined => {
    for (const value of candidates) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim()
      }
    }
    return
  }

  return {
    deliveryProofImage: asUrl(
      payload.deliveryProofImage,
      payload.dropoffImage,
      payload.dropOffImage,
      payload.proofOfDelivery,
      tracking?.deliveryProofImage,
      tracking?.dropoffImage
    ),
    paymentProofImage: asUrl(
      payload.paymentProofImage,
      payload.cashProofImage,
      payload.paymentCollectedImage,
      tracking?.paymentProofImage,
      tracking?.cashProofImage
    )
  }
}
