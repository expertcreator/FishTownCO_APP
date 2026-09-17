export type WellKnownBrand = "fishtownco";

export const WELL_KNOWN_BRANDS = ["fishtownco"] as const;

export const WELL_KNOWN_DATA = {
  fishtownco: {
    scheme: {
      android: "fishtownco",
      ios: "exp+fishtownco",
    },
    ios: {
      applinks: {
        details: [
          {
            appIDs: ["TEAMID.com.itoasis.Fishtownco"],
            components: [{ "/": "*" }],
          },
        ],
      },
    },
    android: {
      package_name: "com.itoasis.Fishtownco",
      sha256_cert_fingerprints: [] as string[],
    },
  },
} as const;

/**
 * Resolves well-known brand from env.
 * @returns Always `fishtownco`
 */
export function resolveWellKnownBrand(): WellKnownBrand {
  return "fishtownco";
}
