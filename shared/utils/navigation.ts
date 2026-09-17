import { router } from "expo-router";

export const HOME_TAB_PATH = "/(tabs)/home" as const;

/**
 * Pops the navigation stack when possible; otherwise opens Home (e.g. cold-start deep link).
 */
export function navigateBackOrHome(canGoBack: () => boolean): void {
  if (canGoBack()) {
    router.back();
    return;
  }
  router.replace(HOME_TAB_PATH);
}
