import { Linking } from "react-native";
import Purchases from "react-native-purchases";
import { getCurrentUser } from "@/features/common/firebase";
import {
  configurePurchases,
  PREMIUM_ENTITLEMENT_ID,
  revenueCatApiKey,
} from "@/features/subscription/services/configurePurchases";

export type CancelSubscriptionResult =
  | "none"
  | "cancelled"
  | "still-renewing";

/**
 * Opens the App Store or Google Play subscription screen when a plan will renew.
 * Store rules require the user to confirm cancellation there. Apple does not
 * allow the app to cancel the charge by itself.
 * @returns Whether a renewing subscription is still active after the store sheet
 */
export async function cancelSubscription(): Promise<CancelSubscriptionResult> {
  if (!revenueCatApiKey()) return "none";
  await configurePurchases(getCurrentUser()?.uid ?? null);

  const current = await Purchases.getCustomerInfo();
  const premium = current.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (!premium) return "none";
  if (!premium.willRenew) return "cancelled";

  try {
    await Purchases.showManageSubscriptions();
  } catch (error) {
    if (!current.managementURL) throw error;
    await Linking.openURL(current.managementURL);
  }

  const refreshed = await Purchases.getCustomerInfo();
  const stillRenewing =
    refreshed.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.willRenew === true;
  return stillRenewing ? "still-renewing" : "cancelled";
}
