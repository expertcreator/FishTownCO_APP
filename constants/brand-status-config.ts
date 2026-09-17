export type BrandKey = "fishtownco";

const BRAND_KEYS = ["fishtownco"] as const satisfies readonly BrandKey[];
const DEFAULT_BRAND: BrandKey = "fishtownco";

function isBrandKey(brandName: string): brandName is BrandKey {
  return (BRAND_KEYS as readonly string[]).includes(brandName);
}

/**
 * Resolves brand name from env for status/config helpers.
 * @returns Always `fishtownco` unless a matching env override is set
 */
export function resolveBrandNameFromEnv(): BrandKey {
  const envBrandName =
    process.env.APP_BRAND ?? process.env.BRAND_NAME ?? DEFAULT_BRAND;

  if (isBrandKey(envBrandName)) {
    return envBrandName;
  }

  return DEFAULT_BRAND;
}
