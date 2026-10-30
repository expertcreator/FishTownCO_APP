import Purchases from "react-native-purchases";
import { getCurrentUser } from "@/features/common/firebase";
import {
  configurePurchases,
  PREMIUM_ENTITLEMENT_ID,
  revenueCatApiKey,
} from "@/features/subscription/services/configurePurchases";
import { notifySubscriptionAccessChanged } from "@/features/subscription/services/subscriptionAccess";

export type RestorePurchasesResult = "restored" | "none";

type StoreEntitlement = {
  productIdentifier?: string;
  expirationDate?: string | null;
};

/**
 * Asks Apple or Google for purchases already made on this store account.
 * An active FishTownCo Pro entitlement unlocks the app immediately.
 * @returns `restored` when Pro is active, otherwise `none`
 * @throws {Error} When the user is signed out or the store request fails
 */
export async function restoreSubscriptionPurchases(): Promise<RestorePurchasesResult> {
  const uid = getCurrentUser()?.uid ?? null;
  if (!uid) throw new Error("NOT_SIGNED_IN");
  if (!revenueCatApiKey()) return "none";

  await configurePurchases(uid);
  const info = await Purchases.restorePurchases();
  const premium = info.entitlements.active[PREMIUM_ENTITLEMENT_ID] as
    | StoreEntitlement
    | undefined;
  if (!premium) return "none";

  // Note: recordSubscriptionPurchase has been removed here because restores 
  // are not new payments. All payment logging is handled exclusively by the backend webhook.

  notifySubscriptionAccessChanged({ storePaid: true });
  return "restored";
}