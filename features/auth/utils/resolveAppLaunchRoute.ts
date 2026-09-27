import type { Href } from "expo-router";

const WELCOME_ROUTE = "/welcome" as const;
const LOGIN_ROUTE = "/(auth)/login" as const;
const HOME_ROUTE = "/(tabs)/home" as const;

/**
 * Resolves the first screen after native splash.
 * Keeps signed-in users on Home so restarting the app does not log them out.
 * @param onboardingCompleted - Whether onboarding was finished
 * @param isSignedIn - Whether Firebase Auth has a restored session
 * @returns Expo Router href
 */
export function resolveAppLaunchRoute(
  onboardingCompleted: boolean,
  isSignedIn: boolean
): Href {
  if (!onboardingCompleted) {
    return WELCOME_ROUTE;
  }
  if (isSignedIn) {
    return HOME_ROUTE;
  }
  return LOGIN_ROUTE;
}
