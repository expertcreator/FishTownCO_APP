import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/common/firebase";
import { fetchBillingPayments } from "@/features/billing/services/fetchBillingPayments";
import { ensureActivePlanBilling } from "@/features/billing/services/recordSubscriptionPurchase";
import type { BillingPlanId, BillingRow } from "@/features/billing/types/billing";

export const BILLING_QUERY_KEY = ["billing", "payments"] as const;

export type BillingHistory = {
  payments: BillingRow[];
  planId: BillingPlanId | null;
};

/**
 * React Query hook for the signed-in user's Firestore billing payments.
 * Also records a payment when a subscription is active but history is empty.
 * @returns Query result with billing rows and the current plan
 */
export function useBillingPayments() {
  const uid = getCurrentUser()?.uid ?? null;

  return useQuery<BillingHistory, Error>({
    queryKey: [...BILLING_QUERY_KEY, uid],
    enabled: Boolean(uid),
    queryFn: async () => {
      const payments = await fetchBillingPayments();
      let planId: BillingPlanId | null = null;
      try {
        planId = await ensureActivePlanBilling(payments);
      } catch (error) {
        console.log(
          "[Billing] could not record the active plan",
          error instanceof Error ? error.message : error
        );
      }
      if (
        planId &&
        !payments.some((row) => row.status === "Paid" && row.planId === planId)
      ) {
        return { payments: await fetchBillingPayments(), planId };
      }
      return { payments, planId };
    },
  });
}
