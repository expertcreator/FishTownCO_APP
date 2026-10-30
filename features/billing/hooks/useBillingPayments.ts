import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/common/firebase";
import { fetchBillingPayments } from "@/features/billing/services/fetchBillingPayments";
import type { BillingPlanId, BillingRow } from "@/features/billing/types/billing";

export const BILLING_QUERY_KEY = ["billing", "payments"] as const;

export type BillingHistory = {
  payments: BillingRow[];
  planId: BillingPlanId | null;
};

/**
 * React Query hook for the signed-in user's Firestore billing payments.
 * Note: ensureActivePlanBilling has been removed as per M. Sufian's instructions 
 * to prevent duplicate client-side payment writes.
 * @returns Query result with billing rows and the current plan
 */
export function useBillingPayments() {
  const uid = getCurrentUser()?.uid ?? null;

  return useQuery<BillingHistory, Error>({
    queryKey: [...BILLING_QUERY_KEY, uid],
    enabled: Boolean(uid),
    queryFn: async () => {
      const payments = await fetchBillingPayments();
      // Client-side automatic billing creation removed. Webhook handles payment records.
      let planId: BillingPlanId | null = null;
      if (payments.length > 0) {
        // Pick the plan from the latest payment if available
        planId = payments[0].planId ?? null;
      }

      return { payments, planId };
    },
  });
}