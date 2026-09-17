import { describe, expect, test } from "vitest"
import {
  SUPERADMIN_FEATURE_KEYS,
  SUPERADMIN_FEATURES_LIST,
  isSuperadminFeatureEnabled
} from "../superadmin-features"

describe("isSuperadminFeatureEnabled", () => {
  test("treats a missing feature map as enabled", () => {
    expect(
      isSuperadminFeatureEnabled(
        undefined,
        SUPERADMIN_FEATURE_KEYS.GEO_TAXONOMY
      )
    ).toBe(true)
  })

  test("treats an explicit false as disabled", () => {
    expect(
      isSuperadminFeatureEnabled(
        { geo_taxonomy: false },
        SUPERADMIN_FEATURE_KEYS.GEO_TAXONOMY
      )
    ).toBe(false)
  })

  test("treats an explicit true as enabled", () => {
    expect(
      isSuperadminFeatureEnabled(
        { geo_taxonomy: true },
        SUPERADMIN_FEATURE_KEYS.GEO_TAXONOMY
      )
    ).toBe(true)
  })
})

describe("SUPERADMIN_FEATURES_LIST", () => {
  test("includes the geo taxonomy flag", () => {
    expect(SUPERADMIN_FEATURE_KEYS.GEO_TAXONOMY).toBe("geo_taxonomy")
    expect(
      SUPERADMIN_FEATURES_LIST.some(
        (feature) => feature.key === SUPERADMIN_FEATURE_KEYS.GEO_TAXONOMY
      )
    ).toBe(true)
  })
})
