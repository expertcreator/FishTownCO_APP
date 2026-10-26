import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

/** RevenueCat entitlement that unlocks the paid vessel subscription. */
export const PREMIUM_ENTITLEMENT_ID = "fishtownco_pro";

let configuredKey: string | null = null;

/**
 * Reads the public RevenueCat SDK key for this platform.
 * A Test Store key starts with `test_`. Store keys start with `appl_` or `goog_`.
 * @returns Public SDK key, or null when it is not configured
 */
export function revenueCatApiKey(): string | null {
  const raw =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  const key = raw?.trim() ?? "";
  if (!key || key.includes("placeholder")) return null;
  return key;
}

/**
 * Starts RevenueCat and attaches the Firebase user id.
 * Safe to call again after sign-in. Does nothing when the public key is missing.
 * @param uid - Signed-in Firebase user id, or null when signed out
 */
export async function configurePurchases(uid: string | null): Promise<void> {
  const apiKey = revenueCatApiKey();
  if (!apiKey) {
    console.log("[RevenueCat] public key missing");
    return;
  }

  if (configuredKey !== apiKey) {
    void Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey, appUserID: uid });
    configuredKey = apiKey;
    return;
  }

  try {
    if (uid) {
      await Purchases.logIn(uid);
    } else {
      await Purchases.logOut();
    }
  } catch (error) {
    console.log(
      "[RevenueCat] user sync failed",
      error instanceof Error ? error.message : error
    );
  }
}
