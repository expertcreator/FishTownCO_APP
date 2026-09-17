export type BrandKey = "fishtownco";

/** Email accent colors for Fishtownco. */
export const BRAND_EMAIL_COLORS = {
  fishtownco: {
    primary: "#F06524",
  },
} as const satisfies Record<BrandKey, { primary: string }>;

export type BrandEmailColors = (typeof BRAND_EMAIL_COLORS)[BrandKey];

export const DEFAULT_BRAND: BrandKey = "fishtownco";

function isBrandKey(brandName: string): brandName is BrandKey {
  return brandName in BRAND_EMAIL_COLORS;
}

function resolveBrandNameFromEnv(): BrandKey {
  const envBrandName =
    process.env.APP_BRAND ?? process.env.BRAND_NAME ?? DEFAULT_BRAND;

  if (isBrandKey(envBrandName)) {
    return envBrandName;
  }

  return DEFAULT_BRAND;
}

/**
 * Resolves email brand colors for the active brand.
 * @returns Brand email color tokens
 */
export function getBrandEmailColors(): BrandEmailColors {
  return BRAND_EMAIL_COLORS[resolveBrandNameFromEnv()];
}
