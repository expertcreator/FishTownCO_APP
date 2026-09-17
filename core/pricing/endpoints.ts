import { z } from "zod"
import { tenantDeliveryChargeRuleSchema } from "./delivery-rule"

/**
 * The one pricing-config read, on `business-discovery-backend`. Relative and
 * with **no leading slash**, exactly like `CATALOG_ENDPOINTS` — the gateway
 * segment (`discovery/api/v1`) is config, not contract, and stays in the app's
 * `http-endpoint.ts`.
 *
 * **It is public, and that was measured rather than assumed.** The route is
 * registered with no auth `preHandler` (`delivery-charges-config.ts:10`) and the
 * service declares no global auth hook, so a guest client may read it.
 *
 * Resolution happens server-side: the tenant's own row when its
 * `deliveryProvider` is `own_rider`, otherwise the platform row for that
 * tenant's country, with the `ADD_TAX` marketplace flag already applied to the
 * tax rates. What arrives is the effective rule, so nothing here re-derives one.
 *
 * Definitions only. Nothing here fetches.
 */
export const PRICING_ENDPOINTS = {
  /**
   * A tenant or branch's effective delivery-charge rule.
   *
   * **An array, and `.nullable()` on top of it.** The controller answers
   * `{ success: true, data: [...] }` — one row per configured country — and
   * `404` when the tenant does not exist, which is absence rather than failure.
   * The caller takes the first row: web asks about one branch, and the branch
   * has exactly one country.
   */
  tenantDeliveryCharges: {
    method: "GET",
    /**
     * Builds the delivery-charges path.
     * @param tenantId - The branch's tenant id, as captured in the cart
     * @returns Encoded `tenants/{tenantId}/delivery-charges` path
     */
    path: (tenantId: string) =>
      `tenants/${encodeURIComponent(tenantId)}/delivery-charges`,
    response: z.object({
      data: tenantDeliveryChargeRuleSchema.array().nullable(),
      message: z.string().optional(),
      success: z.literal(true).optional()
    })
  }
} as const
