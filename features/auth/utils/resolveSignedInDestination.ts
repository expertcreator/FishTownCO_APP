import { resolveAppLaunchRoute } from "@/features/auth/utils/resolveAppLaunchRoute";
import {
  canUseApp,
  fetchSubscriptionAccess,
} from "@/features/subscription/services/subscriptionAccess";
import { fetchVesselProfile } from "@/features/vessel/services/fetchVesselProfile";
import type { Href } from "expo-router";

/**
 * Chooses the screen after a successful sign-in.
 * A user with no saved vessel opens Add Vessel, which continues into the
 * build checklist and then the trial or subscription.
 * A user who already has a vessel opens the payment screen when the trial
 * has not started or has ended, and Home when the app is unlocked.
 * @returns Expo Router href
 */
export async function resolveSignedInDestination(): Promise<Href> {
  let hasVessel = true;
  let requiresSubscription = false;

  try {
    const profile = await fetchVesselProfile();
    hasVessel = Boolean(profile?.name.trim());
  } catch {
    hasVessel = true;
  }

  if (hasVessel) {
    try {
      const access = await fetchSubscriptionAccess();
      requiresSubscription = !canUseApp(access);
    } catch {
      requiresSubscription = false;
    }
  }

  return resolveAppLaunchRoute(true, true, hasVessel, requiresSubscription);
}
