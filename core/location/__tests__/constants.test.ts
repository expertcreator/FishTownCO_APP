import { describe, expect, test } from "vitest"
import {
  LOCATION_API,
  LOCATION_COUNTRY_CODE,
  LOCATION_SEARCH_LIMIT,
  PHOTON_BASE_URL
} from "../constants"

describe("location constants", () => {
  test("points at public Photon paths", () => {
    expect(PHOTON_BASE_URL).toBe("https://photon.komoot.io")
    expect(LOCATION_API).toEqual({ reverse: "reverse", search: "api" })
  })

  test("restricts and biases searches", () => {
    expect(LOCATION_COUNTRY_CODE).toBe("pk")
    expect(LOCATION_SEARCH_LIMIT).toBe(5)
  })
})
