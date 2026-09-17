import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import * as Application from "expo-application";
import Constants from "expo-constants";
// --- types ---

export type AppConfigResponse = {
  versionEnforcement: {
    enforced: boolean;
    minimumVersion: string | null;
  };
};

export type CreateFetchAppConfigParams = {
  appId: string;
  get: (url: string) => Promise<{ data: unknown }>;
  buildConfigUrl: (appId: string) => string;
};

export type CreatePrefetchAppConfigParams = {
  appId: string;
  fetchAppConfig: () => Promise<AppConfigResponse>;
};

export type UseForceUpdateParams = {
  appId: string;
  fetchAppConfig: () => Promise<AppConfigResponse>;
};

// --- query ---

export const appConfigQueryOptions = {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
} as const;

export function getAppConfigQueryKey(appId: string) {
  return ["release", "app-config", appId] as const;
}

// --- parse & version ---

export function parseAppConfigBody(raw: unknown): AppConfigResponse {
  if (raw == null || typeof raw !== "object") {
    return {
      versionEnforcement: { enforced: false, minimumVersion: null },
    };
  }
  const o = raw as Record<string, unknown>;
  const root =
    o.data != null && typeof o.data === "object"
      ? (o.data as Record<string, unknown>)
      : o;
  const ve = (root.versionEnforcement ?? root.version_enforcement) as
    | Record<string, unknown>
    | undefined;
  if (!ve || typeof ve !== "object") {
    return {
      versionEnforcement: { enforced: false, minimumVersion: null },
    };
  }
  const rawEnforced = ve.enforced;
  const enforced =
    rawEnforced === true ||
    rawEnforced === 1 ||
    String(rawEnforced).toLowerCase() === "true";
  const rawMin = ve.minimumVersion ?? ve.minimum_version;
  let minimumVersion: string | null = null;
  if (rawMin != null) {
    minimumVersion = typeof rawMin === "string" ? rawMin : String(rawMin);
  }
  return {
    versionEnforcement: {
      enforced,
      minimumVersion:
        minimumVersion && minimumVersion.length > 0 ? minimumVersion : null,
    },
  };
}

export function currentNativeAppVersion(): string {
  return (
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    "0.0.0"
  );
}

function isVersionBelow(current: string, minimum: string): boolean {
  return compareSemanticVersion(current, minimum) < 0;
}

export function compareSemanticVersion(a: string, b: string): number {
  const parse = (s: string) =>
    s.split(/[.+]/).map((p) => {
      const n = Number.parseInt(p, 10);
      return Number.isFinite(n) ? n : 0;
    });
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va !== vb) {
      return va - vb;
    }
  }
  return 0;
}

export function shouldBlockForAppConfig(
  data: AppConfigResponse | undefined
): boolean {
  if (!data?.versionEnforcement) {
    return false;
  }
  const { enforced, minimumVersion } = data.versionEnforcement;
  if (enforced !== true) {
    return false;
  }
  if (minimumVersion == null || minimumVersion.length === 0) {
    return false;
  }
  const current = currentNativeAppVersion();
  return isVersionBelow(current, minimumVersion.trim());
}

/**
 * Returns whether `value` is a numeric Apple App Store id (not a bundle id).
 * @param value - Candidate App Store id from config or env
 * @returns `true` when `value` is at least six digits
 */
export function isNumericAppStoreId(
  value: string | null | undefined
): boolean {
  if (value == null) {
    return false;
  }
  return /^\d{6,}$/.test(value.trim());
}

export type ResolveIosForceUpdateBlockParams = {
  versionRequiresUpdate: boolean;
  iosAppStoreId: string | undefined;
};

/**
 * Decides whether iOS may show the blocking force-update UI.
 * `iosAppStoreId === undefined` keeps legacy behaviour (block whenever the
 * version check says so). A provided string — including empty — only blocks
 * when it is this app’s numeric App Store id, so a first iOS listing cannot
 * trap App Review on “Update required” with a missing or wrong store page.
 * @param params - Version check result and optional explicit iOS store id
 * @param params.versionRequiresUpdate - Result of {@link shouldBlockForAppConfig}
 * @param params.iosAppStoreId - Explicit id (`undefined` = legacy)
 * @returns Whether the iOS force-update modal should be visible
 */
export function resolveIosForceUpdateBlock(
  params: ResolveIosForceUpdateBlockParams
): boolean {
  if (!params.versionRequiresUpdate) {
    return false;
  }
  if (params.iosAppStoreId === undefined) {
    return true;
  }
  return isNumericAppStoreId(params.iosAppStoreId);
}

// --- fetch / prefetch factories ---

export function createFetchAppConfig(
  params: CreateFetchAppConfigParams
): () => Promise<AppConfigResponse> {
  const { appId, get, buildConfigUrl } = params;
  const url = buildConfigUrl(appId);

  return async function fetchAppConfig(): Promise<AppConfigResponse> {
    const { data } = await get(url);
    return parseAppConfigBody(data);
  };
}

export function createPrefetchAppConfig(
  params: CreatePrefetchAppConfigParams
): (queryClient: QueryClient) => Promise<unknown> {
  const { appId, fetchAppConfig } = params;
  return function prefetchAppConfig(
    queryClient: QueryClient
  ): Promise<unknown> {
    return queryClient.prefetchQuery({
      queryKey: getAppConfigQueryKey(appId),
      queryFn: () => fetchAppConfig(),
      ...appConfigQueryOptions,
    });
  };
}

// --- hook ---

export function useForceUpdate(params: UseForceUpdateParams): {
  isPending: boolean;
  isUpdateRequired: boolean;
} {
  const { appId, fetchAppConfig } = params;
  const { data, isError, isPending } = useQuery({
    queryKey: getAppConfigQueryKey(appId),
    queryFn: () => fetchAppConfig(),
    ...appConfigQueryOptions,
  });

  if (data !== undefined) {
    return {
      isPending: false,
      isUpdateRequired: shouldBlockForAppConfig(data),
    };
  }

  if (isError || isPending) {
    return { isPending, isUpdateRequired: false };
  }
  return {
    isPending: false,
    isUpdateRequired: false,
  };
}
