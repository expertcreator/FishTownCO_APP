/**
 * Shared release / EAS Update utilities for reuse across mobile-tenant-* apps.
 * Per-app: set `EXPO_PUBLIC_EAS_PROJECT_ID` and brand-specific eas.json channels only.
 */

export {
  validateEasProjectEnvForConfig,
  type EasConfigVariant,
} from "./easProjectEnv";
export { OTA_COMPATIBILITY_RULES } from "./otaCompatibilityRules";
export { resolveOtaChannelLabel } from "./resolveOtaChannelLabel";
/**
 * Optional configuration for {@link useOTAUpdate}. See {@link "./useOTAUpdate"}.
 */
export type { UseOTAUpdateOptions } from "./useOTAUpdate";
/**
 * EAS OTA check / fetch / reload on root mount. See {@link "./useOTAUpdate"}.
 */
export { useOTAUpdate } from "./useOTAUpdate";
