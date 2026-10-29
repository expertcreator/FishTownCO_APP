import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "@react-native-firebase/firestore";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import { firebaseFirestore, getCurrentUser } from "@/features/common/firebase";
import { createBillingPayment } from "@/features/billing/services/createBillingPayment";
import type { BillingPlanId, BillingRow } from "@/features/billing/types/billing";
import {
  configurePurchases,
  PREMIUM_ENTITLEMENT_ID,
  revenueCatApiKey,
} from "@/features/subscription/services/configurePurchases";

type StoreEntitlement = {
  productIdentifier?: string;
  expirationDate?: string | null;
};

/**
 * Maps a store product id onto the monthly or annual plan.
 * @param productId - RevenueCat product id
 * @returns Plan id, or null when the product is unknown
 */
export function planIdFromProduct(productId: string): BillingPlanId | null {
  if (/year|annual/i.test(productId)) return "annual";
  if (/month/i.test(productId)) return "monthly";
  return null;
}

/**
 * Saves the purchased plan on the user and adds one billing-history row.
 * The same plan on the same day updates the existing row.
 * @param input - Plan that was just purchased
 * @returns Promise that resolves when both writes finish
 * @throws {Error} When the user is signed out or a write fails
 */
export async function recordSubscriptionPurchase(input: {
  planId: BillingPlanId;
  productId?: string;
  paidAt?: Date;
  expiresAt?: Date | null;
}): Promise<void> {
  const user = getCurrentUser();
  if (!user?.uid) throw new Error("NOT_SIGNED_IN");

  const paidAt = input.paidAt ?? new Date();
  const day = paidAt.toISOString().slice(0, 10);
  await createBillingPayment({
    planId: input.planId,
    method: Platform.OS === "ios" ? "App Store" : "Google Play",
    paidAt,
    paymentId: `store-${input.planId}-${day}`,
  });

  const expiresAt =
    input.expiresAt && !Number.isNaN(input.expiresAt.getTime())
      ? input.expiresAt
      : null;
  await setDoc(
    doc(firebaseFirestore, "users", user.uid),
    {
      subscriptionStatus: "active",
      subscriptionPlan: input.planId,
      subscriptionProductId: input.productId ?? null,
      subscriptionExpiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      subscriptionUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Reads the active plan from the user document, then from RevenueCat.
 * @returns Active plan, or null when the account is not subscribed
 */
async function readActivePlan(): Promise<BillingPlanId | null> {
  const user = getCurrentUser();
  if (!user?.uid) return null;

  const snap = await getDoc(doc(firebaseFirestore, "users", user.uid));
  const data = snap.data() ?? {};
  const stored = String(data.subscriptionPlan ?? "");
  const status = String(data.subscriptionStatus ?? "");
  if (
    (status === "active" || status === "canceled") &&
    (stored === "monthly" || stored === "annual")
  ) {
    return stored;
  }

  if (!revenueCatApiKey()) return null;
  try {
    await configurePurchases(user.uid);
    const info = await Purchases.getCustomerInfo();
    const premium = info.entitlements.active[PREMIUM_ENTITLEMENT_ID] as
      | StoreEntitlement
      | undefined;
    if (!premium) return null;
    return planIdFromProduct(premium.productIdentifier ?? "");
  } catch {
    return null;
  }
}

/**
 * Adds the missing billing row when a subscription is already active.
 * @param payments - Payments already stored for this user
 * @returns Active plan, or null when the account is not subscribed
 */
export async function ensureActivePlanBilling(
  payments: BillingRow[]
): Promise<BillingPlanId | null> {
  const planId = await readActivePlan();
  if (!planId) return null;
  const recorded = payments.some(
    (row) => row.status === "Paid" && row.planId === planId
  );
  if (!recorded) {
    await recordSubscriptionPurchase({ planId });
  }
  return planId;
}
