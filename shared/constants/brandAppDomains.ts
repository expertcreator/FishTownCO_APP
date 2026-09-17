import type { AppBrand } from "./appConfig.types";

type AppVariant = "development" | "staging" | "production";

/** Production Universal / App Links host for Fishtownco. */
export const BRAND_APP_DOMAINS = {
  fishtownco: "fishtownco.itoasis.co",
} as const satisfies Record<AppBrand, string>;

/** Development-only hosts. */
export const BRAND_DEV_APP_DOMAINS: Partial<Record<AppBrand, string>> = {
  fishtownco: "fishtownco.itoasis.co",
};

/** Extra hosts for Universal / App Links. */
export const BRAND_APP_DOMAIN_ALIASES: Partial<
  Record<AppBrand, readonly string[]>
> = {
  fishtownco: ["www.fishtownco.itoasis.co"],
};

function normalizeAppVariant(raw: string | undefined): AppVariant {
  const value = raw?.trim().toLowerCase();
  if (value === "staging" || value === "production") {
    return value;
  }
  return "development";
}

/**
 * Resolves the primary app domain for the brand/variant.
 * @param brand - App brand id
 * @param variant - Optional app variant override
 * @returns Domain hostname
 */
export function resolveBrandAppDomain(
  brand: AppBrand,
  variant = process.env.EXPO_PUBLIC_APP_VARIANT ?? process.env.APP_VARIANT
): string {
  if (normalizeAppVariant(variant) === "development") {
    return BRAND_DEV_APP_DOMAINS[brand] ?? BRAND_APP_DOMAINS[brand];
  }
  return BRAND_APP_DOMAINS[brand];
}

/**
 * Primary + alias hosts for associatedDomains / Android intent filters.
 * @param brand - App brand id
 * @param variant - Optional app variant
 * @returns Host list
 */
export function resolveBrandAppLinkHosts(
  brand: AppBrand,
  variant?: string
): string[] {
  const primary = resolveBrandAppDomain(brand, variant);
  const aliases = BRAND_APP_DOMAIN_ALIASES[brand] ?? [];
  return [primary, ...aliases];
}
