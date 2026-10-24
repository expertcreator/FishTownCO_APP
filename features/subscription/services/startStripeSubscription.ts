// import { firebaseAuth, queryClient } from "@/features/common/firebase"; // Stripe service disabled
// import { BILLING_QUERY_KEY } from "@/features/billing/hooks/useBillingPayments"; // Stripe service disabled
import type { BillingPlanId } from "@/features/billing/types/billing";

// const FUNCTION_BASE = "https://europe-west2-fishtownco-5093a.cloudfunctions.net"; // Stripe cloud function disabled

export type SubscriptionSheet = {
  alreadyActive: boolean;
  customerId?: string;
  ephemeralKey?: string;
  paymentIntentClientSecret?: string;
  subscriptionId?: string;
};

/**
 * Stripe Cloud Function calls disabled. Ready for RevenueCat integration.
 */

/*
async function postFunction<T>(name: string, body: unknown): Promise<T> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("NOT_SIGNED_IN");

  const token = await user.getIdToken();
  const url = `${FUNCTION_BASE}/${name}`;
  console.log("[Payment] request", name, body);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  let payload: { error?: string; detail?: string } = {};
  try {
    payload = raw ? (JSON.parse(raw) as { error?: string; detail?: string }) : {};
  } catch {
    console.log("[Payment] response was not JSON", name, response.status, raw.slice(0, 500));
  }
  console.log("[Payment] response", name, response.status, payload.error ?? "ok", payload.detail ?? "");
  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "PAYMENT_FAILED");
  }
  return payload as T;
}
*/

/**
 * Stripe subscription sheet creation disabled.
 * @param planId - Monthly or annual price
 * @returns Sheet secrets placeholder
 */
export function createSubscriptionSheet(
  planId: BillingPlanId
): Promise<SubscriptionSheet> {
  // Stripe disabled, return dummy/empty or mock for now
  console.log("[Payment] createSubscriptionSheet disabled for Stripe, use RevenueCat instead", planId);
  return Promise.resolve({ alreadyActive: false });
}

/**
 * Stripe invoice recording disabled.
 * @param subscriptionId - Subscription id placeholder
 * @returns Promise
 */
export async function recordSubscriptionPayment(
  subscriptionId: string
): Promise<void> {
  // Stripe disabled
  console.log("[Payment] recordSubscriptionPayment disabled for Stripe", subscriptionId);
}