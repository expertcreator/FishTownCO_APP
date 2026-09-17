/**
 * Analytics / Sentry channel label for Fishtownco builds.
 */

import * as Updates from "expo-updates";

/**
 * Resolves the OTA / analytics channel label.
 * @returns Channel name such as `development` or `fishtownco-customer-staging`
 */
export function resolveOtaChannelLabel(): string {
  const fromUpdates = Updates.channel;
  if (typeof fromUpdates === "string" && fromUpdates.length > 0) {
    return fromUpdates;
  }

  const variant = (
    process.env.EXPO_PUBLIC_APP_VARIANT ?? "development"
  ).toLowerCase();

  if (variant === "development") {
    return "development";
  }
  if (variant === "staging" || variant === "production") {
    return `fishtownco-customer-${variant}`;
  }
  return "development";
}
