import type { Href } from "expo-router";

const WELCOME_ROUTE = "/welcome" as const;
const LOGIN_ROUTE = "/(auth)/login" as const;

/**
 * Resolves the first screen after native splash (Foori pattern).
 * @param onboardingCompleted - Whether onboarding was finished
 * @returns Expo Router href
 */
export function resolveAppLaunchRoute(onboardingCompleted: boolean): Href {
  if (!onboardingCompleted) {
    return WELCOME_ROUTE;
  }
  return LOGIN_ROUTE;
}
