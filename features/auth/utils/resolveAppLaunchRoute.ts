import type { Href } from "expo-router";

const WELCOME_ROUTE = "/welcome" as const;
const LOGIN_ROUTE = "/(auth)/login" as const;
const HOME_ROUTE = "/(tabs)/home" as const;
const ADD_VESSEL_ROUTE = "/vessel/edit" as const;

/**
 * Resolves the first screen after native splash.
 * A signed-in user with no saved vessel returns to Add Vessel.
 * A signed-in user who already saved a vessel opens Home.
 * @param onboardingCompleted - Whether onboarding was finished
 * @param isSignedIn - Whether Firebase Auth has a restored session
 * @param hasVessel - Whether the saved vessel profile has a name
 * @returns Expo Router href
 */
export function resolveAppLaunchRoute(
  onboardingCompleted: boolean,
  isSignedIn: boolean,
  hasVessel = true
): Href {
  if (!onboardingCompleted) {
    return WELCOME_ROUTE;
  }
  if (!isSignedIn) {
    return LOGIN_ROUTE;
  }
  if (!hasVessel) {
    return ADD_VESSEL_ROUTE;
  }
  return HOME_ROUTE;
}
