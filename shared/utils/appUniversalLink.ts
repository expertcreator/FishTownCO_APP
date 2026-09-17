import type { AppBrand } from "@/shared/constants/appConfig.types";
import { APP_BRAND } from "@/shared/constants/appConfig";
import { resolveBrandAppDomain } from "@/shared/constants/brandAppDomains";

/**
 * Resolves the Fishtownco brand id.
 * @returns Always `fishtownco`
 */
function resolveAppBrand(): AppBrand {
  return APP_BRAND;
}

function isDevelopmentVariant(): boolean {
  const raw = (process.env.EXPO_PUBLIC_APP_VARIANT ?? process.env.APP_VARIANT)
    ?.trim()
    .toLowerCase();
  return !raw || raw === "development";
}

/**
 * Builds `https://<appDomain>` for the active brand.
 * @returns Absolute origin URL
 */
export function getAppUniversalLinkOrigin(): string {
  const envOverride = process.env.EXPO_PUBLIC_APP_DOMAIN?.trim();
  if (envOverride && isDevelopmentVariant()) {
    const host = envOverride.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  const brand = resolveAppBrand();
  return `https://${resolveBrandAppDomain(brand)}`;
}

/**
 * Builds a universal link URL.
 * @param path - Path starting with `/`
 * @returns Absolute universal link
 */
export function buildAppUniversalLink(path = "/"): string {
  const origin = getAppUniversalLinkOrigin().replace(/\/$/, "");
  if (!path || path === "/") {
    return `${origin}/`;
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${p}`;
}
