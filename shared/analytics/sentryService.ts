import * as Sentry from "@sentry/react-native";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { devLog } from "@/shared/utils/devLog";
import axios from "axios";

let _initialized = false;

export type SentryRuntimeEnvironment =
  | "development"
  | "staging"
  | "production";

export type SentryBuildContext = {
  environment: SentryRuntimeEnvironment;
  release: string;
  dist?: string;
};

export type SentryUserSegment = "authenticated" | "guest";

type SafeApiErrorDetails = {
  message: string;
  name?: string;
  code?: string;
  method?: string;
  url?: string;
  status?: number;
};

export function resolveSentryRuntimeEnvironment(): SentryRuntimeEnvironment {
  const raw =
    process.env.EXPO_PUBLIC_APP_VARIANT ??
    process.env.APP_VARIANT ??
    process.env.EAS_OTA_VARIANT;
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (value === "development" || value === "staging" || value === "production") {
    return value;
  }
  return "development";
}

function withoutExpoUpdatesListener<T extends { name: string }>(
  integrations: T[]
): T[] {
  return integrations.filter(
    (integration) => integration.name !== "ExpoUpdatesListener"
  );
}

function isPlaceholderDsn(dsn: string): boolean {
  const value = dsn.toLowerCase();
  return (
    value.includes("your-key") ||
    value.includes("your_key") ||
    value.includes("your.dsn") ||
    value.includes("example") ||
    value.includes("changeme")
  );
}

export function isUsablePublicSentryDsn(raw: string | undefined): boolean {
  const dsn = typeof raw === "string" ? raw.trim() : "";
  return dsn.length > 0 && dsn.startsWith("https://") && !isPlaceholderDsn(dsn);
}

function pickEnvString(
  primary: string | undefined,
  fallback: string | undefined
): string {
  const first = typeof primary === "string" ? primary.trim() : "";
  const second = typeof fallback === "string" ? fallback.trim() : "";
  return first || second;
}

export function resolvePublicSentryDsnFromEnv(): string {
  return pickEnvString(
    process.env.EXPO_PUBLIC_SENTRY_DSN_FISHTOWNCO,
    process.env.EXPO_PUBLIC_SENTRY_DSN
  );
}

function tracesSampleRateForEnvironment(
  environment: SentryBuildContext["environment"]
): number {
  if (environment === "development") {
    return 1.0;
  }
  if (environment === "staging") {
    return 0.2;
  }
  return 0.1;
}

function resolveDefaultBuildContext(): SentryBuildContext {
  const appVersion =
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    "0.0.0";
  const environment = resolveSentryRuntimeEnvironment();
  const brand = process.env.EXPO_PUBLIC_APP_BRAND ?? "unknown";
  const otaChannel =
    process.env.EXPO_PUBLIC_OTA_CHANNEL ??
    (environment === "development" ? "development" : environment);

  return {
    environment,
    release: `${brand}@${appVersion}+${otaChannel}`,
  };
}

function toSafeApiErrorDetails(error: unknown): SafeApiErrorDetails | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  return {
    message: error.message,
    name: error.name,
    code: error.code,
    method: error.config?.method,
    url: error.config?.url,
    status: error.response?.status,
  };
}

function toCapturedError(error: unknown): unknown {
  const safeDetails = toSafeApiErrorDetails(error);
  if (!safeDetails) {
    return error;
  }
  const captured = new Error(safeDetails.message);
  captured.name = safeDetails.name ?? "AxiosError";
  return captured;
}

export const sentryService = {
  isInitialized(): boolean {
    return _initialized;
  },

  init(dsn: string, context: SentryBuildContext): void {
    if (_initialized) {
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: context.environment,
        release: context.release,
        ...(context.dist ? { dist: context.dist } : {}),
        tracesSampleRate: tracesSampleRateForEnvironment(context.environment),
        enableNative: true,
        enableNativeCrashHandling: true,
        enableNdk: true,
        // TODO: restore `enableTombstone: true` once Sentry is back on 8.x —
        // SDK 54 pins @sentry/react-native ~7.2.0, which predates the option.
        patchGlobalPromise: true,
        enableAutoSessionTracking: true,
        attachStacktrace: true,
        debug: context.environment === "development",
        integrations: withoutExpoUpdatesListener,
      });
      _initialized = true;
    } catch (error) {
      if (__DEV__) {
        devLog(
          "[sentryService] Sentry native setup failed; crash reporting disabled.",
          error
        );
      }
    }
  },

  initFromPublicEnv(): boolean {
    if (_initialized) {
      return true;
    }
    const dsn = resolvePublicSentryDsnFromEnv();
    if (!isUsablePublicSentryDsn(dsn)) {
      return false;
    }
    sentryService.init(dsn, resolveDefaultBuildContext());
    return _initialized;
  },

  captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!_initialized) {
      return;
    }
    const safeApiDetails = toSafeApiErrorDetails(error);
    Sentry.withScope((scope) => {
      if (context || safeApiDetails) {
        scope.setContext("details", {
          ...safeApiDetails,
          ...context,
        });
      }
      Sentry.captureException(toCapturedError(error));
    });
  },

  setUser(user: { id: string; segment: SentryUserSegment } | null): void {
    if (!_initialized) {
      return;
    }
    Sentry.setUser(user);
  },

  addBreadcrumb(message: string, category: string): void {
    if (!_initialized) {
      return;
    }
    Sentry.addBreadcrumb({ message, category, level: "info" });
  },
};
