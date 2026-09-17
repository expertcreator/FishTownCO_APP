import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

export type AppVersionInfo = {
  platform: "ios" | "android" | "web" | "native";
  version: string;
  buildNumber?: string;
};

export type AppVersionDisplay = {
  storeVersion: string;
  buildNumber?: string;
  releaseLabel?: string;
  otaUpdateId?: string;
};

function getCurrentPlatform(): AppVersionInfo["platform"] {
  if (Platform.OS === "ios") {
    return "ios";
  }
  if (Platform.OS === "android") {
    return "android";
  }
  if (Platform.OS === "web") {
    return "web";
  }
  return "native";
}

function getReleaseLabelFromConfig(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { releaseLabel?: string }
    | undefined;
  const label = extra?.releaseLabel?.trim();
  if (!label) {
    return;
  }
  return label;
}

function getOtaUpdateIdShort(updateId?: string | null): string | undefined {
  if (!Updates.isEnabled) {
    return;
  }
  const id = updateId ?? Updates.updateId;
  if (!id) {
    return;
  }
  return id.replace(/-/g, "").slice(0, 8);
}

/**
 * Native app version helper used by screens that should show the installed build.
 * iOS reads CFBundleShortVersionString/CFBundleVersion; Android reads versionName/versionCode.
 */
export function getAppVersionInfo(): AppVersionInfo {
  const version =
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    "0.0.0";
  let buildNumber =
    Application.nativeBuildVersion ?? Constants.expoConfig?.ios?.buildNumber;
  if (!buildNumber && Constants.expoConfig?.android?.versionCode != null) {
    buildNumber = String(Constants.expoConfig.android.versionCode);
  }

  return {
    platform: getCurrentPlatform(),
    version,
    buildNumber,
  };
}

/**
 * Version shown in Profile / Settings.
 * Prefers `Constants.expoConfig.version` so an OTA can surface a newer
 * marketing version without a store binary bump. Native version remains in
 * `getAppVersionInfo()` for analytics / crash reporting.
 */
export function getAppVersionDisplay(options?: {
  otaUpdateId?: string | null;
}): AppVersionDisplay {
  const native = getAppVersionInfo();
  const fromUpdate = Constants.expoConfig?.version?.trim();
  return {
    storeVersion: fromUpdate || native.version,
    buildNumber: native.buildNumber,
    releaseLabel: getReleaseLabelFromConfig(),
    otaUpdateId: getOtaUpdateIdShort(options?.otaUpdateId),
  };
}

/** Primary line, e.g. `1.1.1 (42)`. */
export function formatAppVersionLine(display: AppVersionDisplay): string {
  const buildSuffix = display.buildNumber ? ` (${display.buildNumber})` : "";
  return `${display.storeVersion}${buildSuffix}`;
}

/** Secondary line after OTA, e.g. `20250618.a1b2c3d · abc12345`. */
export function formatOtaRevisionLine(
  display: AppVersionDisplay
): string | undefined {
  const parts: string[] = [];
  if (display.releaseLabel) {
    parts.push(display.releaseLabel);
  }
  if (display.otaUpdateId) {
    parts.push(display.otaUpdateId);
  }
  if (parts.length === 0) {
    return;
  }
  return parts.join(" · ");
}

/** User-facing version, e.g. `1.1.0` or `1.1.0 · 20250618.a1b2c3d` after OTA. */
export function getFormattedAppVersion(options?: {
  otaUpdateId?: string | null;
}): string {
  const display = getAppVersionDisplay(options);
  const ota = formatOtaRevisionLine(display);
  if (!ota) {
    return display.storeVersion;
  }
  return `${display.storeVersion} · ${ota}`;
}
