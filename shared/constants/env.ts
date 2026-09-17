/**
 * Environment config – EXPO_PUBLIC_APP_VARIANT (development | staging | production) selects API URL.
 * Prefer the stable EAS-owned names (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SOCKET_URL`).
 * Fall back to older per-variant names while the repo finishes migrating off shared `.env` templates.
 */

import {
  normalizeLocationString,
  parseCountryName,
  type CountryName,
} from './locationData';

export type AppVariant = 'development' | 'staging' | 'production';

/** Driver UserInfo step 2 (location) default when API has no `step2Data` yet. */
function getDefaultUserInfoCountry(): CountryName {
  const raw = normalizeLocationString(
    process.env.EXPO_PUBLIC_DEFAULT_USER_COUNTRY ?? '',
  );
  if (raw === '') {
    return 'Pakistan';
  }
  return parseCountryName(raw) ?? 'Pakistan';
}

const raw = (
  process.env.EXPO_PUBLIC_APP_VARIANT || 'development'
).toLowerCase();
let EXPO_PUBLIC_APP_VARIANT: AppVariant;
if (raw === 'production') {
  EXPO_PUBLIC_APP_VARIANT = 'production';
} else if (raw === 'staging') {
  EXPO_PUBLIC_APP_VARIANT = 'staging';
} else {
  EXPO_PUBLIC_APP_VARIANT = 'development';
}

function ensureSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function getApiUrl(): string {
  let legacyFallback: string | undefined;
  if (EXPO_PUBLIC_APP_VARIANT === 'production') {
    legacyFallback =
      process.env.EXPO_PUBLIC_PROD_API_URL ||
      process.env.EXPO_PUBLIC_PROD_BASE_URL;
  } else if (EXPO_PUBLIC_APP_VARIANT === 'staging') {
    legacyFallback =
      process.env.EXPO_PUBLIC_STAGING_API_URL ||
      process.env.EXPO_PUBLIC_STAGING_BASE_URL;
  } else {
    legacyFallback =
      process.env.EXPO_PUBLIC_DEV_API_URL ||
      process.env.EXPO_PUBLIC_DEV_BASE_URL;
  }
  const url =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    legacyFallback;
  if (!url) {
    throw new Error(
      `Set EXPO_PUBLIC_API_BASE_URL (preferred) or a compatible legacy API URL variable. EXPO_PUBLIC_APP_VARIANT=${EXPO_PUBLIC_APP_VARIANT}`,
    );
  }
  return ensureSlash(url);
}

function getSocketUrl(): string {
  let explicit: string | undefined;
  if (EXPO_PUBLIC_APP_VARIANT === 'development') {
    explicit = process.env.EXPO_PUBLIC_DEV_SOCKET_URL;
  } else if (EXPO_PUBLIC_APP_VARIANT === 'staging') {
    explicit = process.env.EXPO_PUBLIC_STAGING_SOCKET_URL;
  } else {
    explicit = process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  if (explicit) {
    return explicit.endsWith('/') ? explicit : `${explicit}/`;
  }
  try {
    return `${new URL(getApiUrl()).origin}/`;
  } catch {
    return '';
  }
}

export const env = {
  EXPO_PUBLIC_APP_VARIANT,
  /** Single gateway base URL (trailing slash). */
  get apiUrl() {
    return getApiUrl();
  },
  /** @deprecated Use `apiUrl` — same value, kept for older call sites. */
  get baseUrl() {
    return getApiUrl();
  },
  get socketUrl() {
    return getSocketUrl();
  },
  get googleWebClientId() {
    return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  },
  get googleIosClientId() {
    return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  },
  /** `EXPO_PUBLIC_DEFAULT_USER_COUNTRY` — `Pakistan` | `Jordan` (default: Pakistan). */
  get defaultUserInfoCountry(): CountryName {
    return getDefaultUserInfoCountry();
  },
} as const;
