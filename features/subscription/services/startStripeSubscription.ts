import { firebaseAuth, queryClient } from "@/features/common/firebase";
import { BILLING_QUERY_KEY } from "@/features/billing/hooks/useBillingPayments";
import type { BillingPlanId } from "@/features/billing/types/billing";

const FUNCTION_BASE =
  "https://europe-west2-fishtownco-5093a.cloudfunctions.net";

export type SubscriptionSheet = {
  alreadyActive: boolean;
  customerId?: string;
  ephemeralKey?: string;
  paymentIntentClientSecret?: string;
  subscriptionId?: string;
};

/**
 * Calls a Stripe Cloud Function with the signed-in user's ID token.
 * @param name - Function name
 * @param body - JSON body
 * @returns Parsed JSON response
 * @throws {Error} When signed out or the function returns an error code
 */
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

/**
 * Asks Stripe for a Payment Sheet for the selected plan.
 * @param planId - Monthly or annual price
 * @returns Sheet secrets, or an already-active result
 */
export function createSubscriptionSheet(
  planId: BillingPlanId
): Promise<SubscriptionSheet> {
  return postFunction<SubscriptionSheet>("createSubscriptionPayment", { planId });
}

/**
 * Stores the paid invoice after the card sheet succeeds.
 * @param subscriptionId - Stripe subscription id from the sheet request
 * @returns Promise that resolves when Firestore has the billing row
 */
export async function recordSubscriptionPayment(
  subscriptionId: string
): Promise<void> {
  await postFunction("recordSubscriptionPayment", { subscriptionId });
  await queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
}
