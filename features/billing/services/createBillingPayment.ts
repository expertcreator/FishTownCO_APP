import {
  addDoc,
  collection,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { BILLING_QUERY_KEY } from "@/features/billing/hooks/useBillingPayments";
import { formatBillingAmount } from "@/features/billing/services/mapBillingDoc";
import type {
  BillingPlanId,
  BillingStatus,
} from "@/features/billing/types/billing";
import { formatSafetyDueDateLong } from "@/features/safety/utils/formatSafetyDueDate";

export type CreateBillingPaymentInput = {
  planId: BillingPlanId;
  status?: BillingStatus;
  method?: string;
  /** Override payment date (defaults to now). */
  paidAt?: Date;
};

/** Prototype Skipper Plan is £10/month; annual is ten months up front. */
const PLAN_AMOUNTS: Record<BillingPlanId, number> = {
  monthly: 10,
  annual: 100,
};

/**
 * Creates a subscription payment under `users/{uid}/billing`.
 * Used when the user starts a plan on the Subscription screen.
 * @param input - Plan and optional status/method
 * @returns Created payment id and path
 * @throws {Error} When signed out or the Firestore write fails
 */
export async function createBillingPayment(
  input: CreateBillingPaymentInput
): Promise<{ id: string; path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const paidAt = input.paidAt ?? new Date();
  const amountValue = PLAN_AMOUNTS[input.planId];
  const status = input.status ?? "Paid";
  const method = input.method?.trim() || "Visa •••• 4417";
  const billingCollection = collection(
    firebaseFirestore,
    "users",
    user.uid,
    "billing"
  );
  const consolePath = `users/${user.uid}/billing`;

  console.log("[createBillingPayment] start", {
    consolePath,
    planId: input.planId,
    amountValue,
  });

  try {
    const ref = await addDoc(billingCollection, {
      planId: input.planId,
      amountValue,
      amountLabel: formatBillingAmount(amountValue),
      dateIso: paidAt.toISOString(),
      dateLabel: formatSafetyDueDateLong(paidAt),
      method,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const fullPath = `${consolePath}/${ref.id}`;
    console.log("[createBillingPayment] success", { id: ref.id, fullPath });
    await queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
    return { id: ref.id, path: fullPath };
  } catch (error) {
    console.error("[createBillingPayment] failed", {
      consolePath,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      error,
    });
    throw error;
  }
}
