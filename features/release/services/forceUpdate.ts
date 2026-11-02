import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import {
  fetchAppConfig,
  type AppConfigResponse,
} from "@/features/release/services/fetchAppConfig";

export const APP_CONFIG_QUERY_KEY = ["release", "app-config", "version"] as const;

/**
 * Installed app version from the native build, then the Expo config.
 * @returns Version string such as `1.0.0`
 */
export function currentAppVersion(): string {
  const nativeVersion = Constants.nativeAppVersion;
  if (typeof nativeVersion === "string" && nativeVersion.trim()) {
    return nativeVersion.trim();
  }
  const configVersion = Constants.expoConfig?.version;
  if (typeof configVersion === "string" && configVersion.trim()) {
    return configVersion.trim();
  }
  return "0.0.0";
}

/**
 * Compares two dotted versions. Missing parts count as 0.
 * @param left - Installed version
 * @param right - Required version
 * @returns Negative when `left` is older
 */
export function compareSemanticVersion(left: string, right: string): number {
  const parse = (value: string) =>
    value.split(/[.+]/).map((part) => {
      const number = Number.parseInt(part, 10);
      return Number.isFinite(number) ? number : 0;
    });
  const leftParts = parse(left);
  const rightParts = parse(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart !== rightPart) return leftPart - rightPart;
  }
  return 0;
}

/**
 * True when the server requires a newer store build than the one installed.
 * A missing config, enforcement off, or an empty minimum does not block.
 * @param data - Parsed app config
 * @returns Whether the app must stop and ask for an update
 */
export function shouldBlockForAppConfig(
  data: AppConfigResponse | undefined
): boolean {
  if (!data?.enforced) return false;
  const minimumVersion = data.minimumVersion?.trim() ?? "";
  if (!minimumVersion) return false;
  return compareSemanticVersion(currentAppVersion(), minimumVersion) < 0;
}

/**
 * Loads the public app-config document once per launch.
 * A failed read does not block the app.
 * @returns Pending flag and whether an update is required
 */
export function useForceUpdate(): {
  isPending: boolean;
  isUpdateRequired: boolean;
  config: AppConfigResponse | undefined;
} {
  const { data, isError, isPending } = useQuery({
    queryKey: APP_CONFIG_QUERY_KEY,
    queryFn: fetchAppConfig,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  if (data !== undefined) {
    return {
      isPending: false,
      isUpdateRequired: shouldBlockForAppConfig(data),
      config: data,
    };
  }

  return {
    isPending: isPending && !isError,
    isUpdateRequired: false,
    config: undefined,
  };
}
