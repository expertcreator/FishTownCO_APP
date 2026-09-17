import {
  formatAppVersionLine,
  formatOtaRevisionLine,
  getAppVersionDisplay,
  getFormattedAppVersion,
} from "@/shared/utils/appVersion";
import { useUpdates } from "expo-updates";
import { useMemo } from "react";

/** Profile-friendly version strings; re-reads when an OTA applies (`useUpdates`). */
export function useAppVersionDisplay() {
  const { currentlyRunning } = useUpdates();
  const runningUpdateId = currentlyRunning?.updateId;

  return useMemo(() => {
    const display = getAppVersionDisplay({ otaUpdateId: runningUpdateId });
    return {
      display,
      versionLine: formatAppVersionLine(display),
      otaLine: formatOtaRevisionLine(display),
      formattedVersion: getFormattedAppVersion({ otaUpdateId: runningUpdateId }),
    };
  }, [runningUpdateId]);
}
