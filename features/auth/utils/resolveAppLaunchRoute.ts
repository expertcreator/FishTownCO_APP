import type { Href } from "expo-router";

const WELCOME_ROUTE = "/welcome" as const;
const LOGIN_ROUTE = "/(auth)/login" as const;
const HOME_ROUTE = "/(tabs)/home" as const;
const ADD_VESSEL_ROUTE = "/vessel/edit" as const;
const SUBSCRIPTION_ROUTE = "/subscription" as const;

/**
 * Resolves the first screen after native splash.
 * A signed-out user opens Welcome until onboarding is done, then Login.
 * A signed-in user never sees Welcome, even if they skipped onboarding.
 * A signed-in user with no saved vessel returns to Add Vessel.
 * A signed-in user whose trial has not started, or whose 7-day trial has ended
 * without a payment, opens the subscription screen.
 * A signed-in user in an active trial or with a payment opens Home.
 * @param onboardingCompleted - Whether onboarding was finished
 * @param isSignedIn - Whether Firebase Auth has a restored session
 * @param hasVessel - Whether the saved vessel profile has a name
 * @param requiresSubscription - Whether the app must stay on the payment screen
 * @returns Expo Router href
 */
export function resolveAppLaunchRoute(
  onboardingCompleted: boolean,
  isSignedIn: boolean,
  hasVessel = true,
  requiresSubscription = false
): Href {
  if (!isSignedIn) {
    return onboardingCompleted ? LOGIN_ROUTE : WELCOME_ROUTE;
  }
  if (!hasVessel) {
    return ADD_VESSEL_ROUTE;
  }
  if (requiresSubscription) {
    return SUBSCRIPTION_ROUTE;
  }
  return HOME_ROUTE;
}
