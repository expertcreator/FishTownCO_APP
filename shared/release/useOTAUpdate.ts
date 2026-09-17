/**
 * @module shared/release/useOTAUpdate
 * OTA bootstrap for mobile-tenant apps: `expo-updates` + React only (no QueryClient or app context).
 * Story 20-7b — production/staged release builds; fail-open.
 */

import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";

/**
 * Configuration for {@link useOTAUpdate}.
 *
 * Optional callbacks let the **app** layer attach crash reporting without importing analytics into `shared`.
 */
export type UseOTAUpdateOptions = {
  /**
   * Called after an update failure. Use this to forward the error to Sentry or another reporter when initialized.
   *
   * @param error - Rejection reason or value thrown from {@link https://docs.expo.dev/versions/latest/sdk/updates/ | expo-updates} (`checkForUpdateAsync`, `fetchUpdateAsync`, or `reloadAsync`).
   */
  onError?: (error: unknown) => void;
};

function reportOtaFailure(
  error: unknown,
  _label: string,
  onError?: (error: unknown) => void
): void {
  onError?.(error);
}

/**
 * Checks for an EAS Update once when the root layout mounts, then downloads and reloads if one exists.
 *
 * **When it runs:** A single `useEffect` (empty deps) after mount. No-op if `__DEV__` is true or
 * `Updates.isEnabled` is false (development clients, Expo Go, or disabled updates).
 *
 * **Flow:** `checkForUpdateAsync` → if `isAvailable`, `fetchUpdateAsync` → `reloadAsync`. Errors at any
 * step are forwarded to optional {@link UseOTAUpdateOptions.onError}; the app continues on failure.
 *
 * **Where to call:** Top-level root layout, before readiness gates / `QueryClientProvider`, so an update can
 * apply before heavier UI. Requires no React context.
 *
 * @param options - Optional {@link UseOTAUpdateOptions}; `onError` is kept fresh via ref so the effect does not re-run.
 *
 * @remarks The implementation stores `options.onError` in a ref so inline callbacks do not re-trigger the OTA effect.
 */
export function useOTAUpdate(options?: UseOTAUpdateOptions): void {
  const onErrorRef = useRef(options?.onError);
  onErrorRef.current = options?.onError;

  useEffect(() => {
    if (__DEV__) {
      return;
    }
    if (!Updates.isEnabled) {
      return;
    }

    let cancelled = false;

    async function checkAndApplyUpdate() {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) {
          return;
        }
        await Updates.fetchUpdateAsync();
        if (cancelled) {
          return;
        }
        await Updates.reloadAsync();
      } catch (error) {
        const label = cancelled
          ? "Update flow error after unmount"
          : "Update check or apply failed";
        reportOtaFailure(error, label, onErrorRef.current);
      }
    }

    checkAndApplyUpdate().catch((error) => {
      const label = cancelled
        ? "Update hook promise rejected after unmount"
        : "Update hook promise rejected";
      reportOtaFailure(error, label, onErrorRef.current);
    });

    return () => {
      cancelled = true;
    };
  }, []);
}
