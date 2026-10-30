import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { BILLING_QUERY_KEY } from "@/features/billing/hooks/useBillingPayments";
import type {
  BillingPlanId,
  BillingStatus,
} from "@/features/billing/types/billing";

export type CreateBillingPaymentInput = {
  planId: BillingPlanId;
  status?: BillingStatus;
  method?: string;
  /** Override payment date (defaults to now). */
  paidAt?: Date;
  /** Stable id so the same purchase is not written twice. */
  paymentId?: string;
};

/**
 * Creates a subscription payment under `users/{uid}/billing`.
 * Note: Client-side direct payment writes have been removed as per M. Sufian's instructions,
 * so that payments are handled exclusively by the backend webhook to avoid duplicate rows.
 * This function now returns a dummy/placeholder entry to prevent breaking call flows.
 */
export async function createBillingPayment(
  input: CreateBillingPaymentInput
): Promise<{ id: string; path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  // Webhook handles actual subscription database logging automatically.
  // Returning a stable placeholder reference so client navigation and flows don't break.
  const dummyId = input.paymentId || `client-${Date.now()}`;
  const consolePath = `users/${user.uid}/billing`;
  const fullPath = `${consolePath}/${dummyId}`;

  return { id: dummyId, path: fullPath };
}