import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";

type ExpoConfigWithIosInfoPlist = {
  version?: string;
  ios?: {
    infoPlist?: Record<string, unknown>;
  };
};

type ConstantsWithManifest2 = typeof Constants & {
  manifest2?: {
    extra?: {
      expoClient?: ExpoConfigWithIosInfoPlist;
    };
  };
};

export type AppTrackingTransparencyReadinessReason =
  | "not_ios"
  | "missing_expo_config_version"
  | "missing_native_app_version"
  | "native_version_mismatch"
  | "missing_usage_description";

export type AppTrackingTransparencyReadiness = {
  canRequest: boolean;
  reason?: AppTrackingTransparencyReadinessReason;
  expoConfigVersion: string | null;
  nativeAppVersion: string | null;
  hasUsageDescription: boolean;
};

function getRuntimeExpoConfig(): ExpoConfigWithIosInfoPlist | null {
  const constants = Constants as ConstantsWithManifest2;
  return constants.expoConfig ?? constants.manifest2?.extra?.expoClient ?? null;
}

function hasTrackingUsageDescription(
  config: ExpoConfigWithIosInfoPlist | null
): boolean {
  const value = config?.ios?.infoPlist?.NSUserTrackingUsageDescription;
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

export function getAppTrackingTransparencyReadiness(): AppTrackingTransparencyReadiness {
  const config = getRuntimeExpoConfig();
  const expoConfigVersion = config?.version ?? null;
  const nativeAppVersion = Application.nativeApplicationVersion ?? null;
  const hasUsageDescription = hasTrackingUsageDescription(config);

  if (Platform.OS !== "ios") {
    return {
      canRequest: false,
      reason: "not_ios",
      expoConfigVersion,
      nativeAppVersion,
      hasUsageDescription,
    };
  }

  if (!expoConfigVersion) {
    return {
      canRequest: false,
      reason: "missing_expo_config_version",
      expoConfigVersion,
      nativeAppVersion,
      hasUsageDescription,
    };
  }

  if (!nativeAppVersion) {
    return {
      canRequest: false,
      reason: "missing_native_app_version",
      expoConfigVersion,
      nativeAppVersion,
      hasUsageDescription,
    };
  }

  if (nativeAppVersion !== expoConfigVersion) {
    return {
      canRequest: false,
      reason: "native_version_mismatch",
      expoConfigVersion,
      nativeAppVersion,
      hasUsageDescription,
    };
  }

  if (!hasUsageDescription) {
    return {
      canRequest: false,
      reason: "missing_usage_description",
      expoConfigVersion,
      nativeAppVersion,
      hasUsageDescription,
    };
  }

  return {
    canRequest: true,
    expoConfigVersion,
    nativeAppVersion,
    hasUsageDescription,
  };
}

export function canRequestAppTrackingTransparency(): boolean {
  return getAppTrackingTransparencyReadiness().canRequest;
}
