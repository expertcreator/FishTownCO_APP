/**
 * Shared EAS / Expo project env validation for `app.config.ts`.
 * Reuse across apps (mobile-tenant-pos, mobile-tenant-app, …): only env vars / project ids differ.
 */

export type EasConfigVariant = "development" | "staging" | "production";

function warnConfig(message: string): void {
  const emitWarning = (
    process as typeof process & { emitWarning?: (warning: string) => void }
  ).emitWarning;
  emitWarning?.(message);
}

/**
 * Enforces project id + owner for staging/production on **remote** EAS builds and CI.
 * Local `eas build --local` (local-build-plugin) and plain `expo config` warn instead of throwing.
 *
 * @param params.variant - Parsed `EXPO_PUBLIC_APP_VARIANT`.
 * @param params.explicitEasProjectId - Resolved project UUID (`EXPO_PUBLIC_EAS_PROJECT_ID` + brand fallbacks).
 * @param params.expoAccountOwner - `EXPO_ACCOUNT_OWNER` / `EAS_ACCOUNT_SLUG`.
 * @param params.isEasRemoteBuild - `EAS_BUILD=true` and not `EAS_BUILD_RUNNER=local-build-plugin`.
 * @param params.isCi - `CI=true` / GitHub Actions / GitLab / Circle (strict like remote EAS).
 */
export function validateEasProjectEnvForConfig(params: {
  variant: EasConfigVariant;
  explicitEasProjectId: string;
  expoAccountOwner: string;
  isEasRemoteBuild: boolean;
  isCi: boolean;
}): void {
  const {
    variant,
    explicitEasProjectId,
    expoAccountOwner,
    isEasRemoteBuild,
    isCi,
  } = params;
  const needsStoreOtaIds = variant === "staging" || variant === "production";
  const strictPipeline = isEasRemoteBuild || isCi;

  if (strictPipeline) {
    if (needsStoreOtaIds) {
      if (!explicitEasProjectId) {
        throw new Error(
          "[app.config] Set EXPO_PUBLIC_EAS_PROJECT_ID (and brand-specific fallbacks) for staging/production EAS/CI builds (Expo → Environment variables or profile `env` in eas.json). Required for OTA and `extra.eas.projectId`.",
        );
      }
      if (!expoAccountOwner) {
        throw new Error(
          "[app.config] Set EXPO_ACCOUNT_OWNER (or EAS_ACCOUNT_SLUG) for staging/production EAS/CI builds (same as project `owner` on expo.dev).",
        );
      }
    } else if (!explicitEasProjectId) {
      warnConfig(
        "[app.config] EXPO_PUBLIC_EAS_PROJECT_ID is not set — optional for development EAS builds; set for push/OTA alignment with expo.dev.",
      );
    }
    if (!needsStoreOtaIds && explicitEasProjectId && !expoAccountOwner) {
      warnConfig(
        "[app.config] EXPO_ACCOUNT_OWNER (or EAS_ACCOUNT_SLUG) is not set — set on expo.dev for consistent `owner` in prebuild.",
      );
    }
    return;
  }

  if (!explicitEasProjectId) {
    if (needsStoreOtaIds) {
      warnConfig(
        "[app.config] EXPO_PUBLIC_EAS_PROJECT_ID is not set — required for staging/production OTA; use .env.local or `eas env:pull`.",
      );
    } else {
      warnConfig(
        "[app.config] EXPO_PUBLIC_EAS_PROJECT_ID is not set — set in .env / .env.local so push, updates, and `extra.eas` match your project.",
      );
    }
  }
  if (!expoAccountOwner) {
    warnConfig(
      "[app.config] EXPO_ACCOUNT_OWNER (or EAS_ACCOUNT_SLUG) is not set — set in .env for a consistent `owner` when running config locally.",
    );
  }
}
