import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/common/firebase";
import { fetchBillingPayments } from "@/features/billing/services/fetchBillingPayments";
import type { BillingRow } from "@/features/billing/types/billing";

export const BILLING_QUERY_KEY = ["billing", "payments"] as const;

/**
 * React Query hook for the signed-in user's Firestore billing payments.
 * @returns Query result with billing rows
 */
export function useBillingPayments() {
  const uid = getCurrentUser()?.uid ?? null;

  return useQuery<BillingRow[], Error>({
    queryKey: [...BILLING_QUERY_KEY, uid],
    enabled: Boolean(uid),
    queryFn: fetchBillingPayments,
  });
}
