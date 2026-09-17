import { describe, expect, it } from "vitest"
import {
  buildProfileDiff,
  MAX_SAVED_ADDRESSES,
  parseProfileMutationResponse,
  parseProfilePayload,
  parseProfileReadResponse,
  parseAddressListResponse,
  parseAddressMutationResponse,
  parseAddressPayload,
  parseServiceabilityResponse,
  savedAddressSchema,
  SERVICEABILITY_REASONS,
  serviceabilityRequestSchema
} from "../schemas"

/** The backend's full `AddressData` row — more than the picker needs. */
const BACKEND_ROW = {
  addressLine1: "House 12, Street 4",
  addressLine2: null,
  city: "Gujranwala",
  country: "PK",
  createdAt: "2026-08-01T00:00:00Z",
  id: "addr-1",
  isDefault: true,
  label: "Home",
  latitude: 32.1617,
  longitude: 74.1883,
  postalCode: "52250",
  state: "Punjab",
  updatedAt: "2026-08-01T00:00:00Z",
  userId: "user-9"
}

describe("savedAddressSchema — the parse is the sanitiser", () => {
  it("strips every field the picker does not render", () => {
    const parsed = savedAddressSchema.parse(BACKEND_ROW)

    expect(parsed).toEqual({
      addressLine1: "House 12, Street 4",
      addressLine2: null,
      city: "Gujranwala",
      id: "addr-1",
      isDefault: true,
      label: "Home"
    })
    // The leak-prone fields, named: none of them survive the parse.
    expect(Object.keys(parsed)).not.toContain("userId")
    expect(Object.keys(parsed)).not.toContain("latitude")
    expect(Object.keys(parsed)).not.toContain("longitude")
  })

  it("tolerates absent optional fields and defaults isDefault", () => {
    const parsed = savedAddressSchema.parse({
      addressLine1: "Shop 3",
      city: "Lahore",
      id: "addr-2",
      label: "Work"
    })

    expect(parsed.addressLine2).toBeUndefined()
    expect(parsed.isDefault).toBe(false)
  })

  it("refuses a row with no id", () => {
    expect(
      savedAddressSchema.safeParse({ ...BACKEND_ROW, id: "" }).success
    ).toBe(false)
  })
})

describe("parseAddressListResponse", () => {
  it("parses the backend's { success, data } envelope", () => {
    const parsed = parseAddressListResponse({
      data: [BACKEND_ROW],
      success: true
    })

    expect(parsed).toHaveLength(1)
    expect(parsed?.[0]?.id).toBe("addr-1")
  })

  it("accepts an empty list — the no-addresses matrix row", () => {
    expect(parseAddressListResponse({ data: [], success: true })).toEqual([])
  })

  it.each([
    ["a refusal dressed as 200", { data: [], success: false }],
    ["a missing data array", { success: true }],
    ["a row missing required fields", { data: [{ id: "x" }], success: true }],
    ["a non-object body", "<html>"],
    ["null", null]
  ])("reports %s as absence", (_label, body) => {
    expect(parseAddressListResponse(body)).toBeNull()
  })
})

describe("MAX_SAVED_ADDRESSES", () => {
  it("matches mobile's addressService constant", () => {
    expect(MAX_SAVED_ADDRESSES).toBe(5)
  })
})

// ============================================================================
// WRITE PAYLOADS + SERVICEABILITY (mw-2-6)
// ============================================================================

/** A payload the form would submit after a pin and the detail fields. */
const VALID_PAYLOAD = {
  addressLine1: "221 B#166 G, Street 3",
  addressLine2: "Floor 2 · near the park",
  city: "Gujranwala",
  country: "Pakistan",
  isDefault: false,
  label: "Home",
  latitude: 32.102_014,
  longitude: 74.208_89,
  postalCode: "52250",
  state: "Punjab"
}

describe("parseAddressPayload", () => {
  it("accepts a complete payload and trims its text", () => {
    const result = parseAddressPayload({
      ...VALID_PAYLOAD,
      label: "  Home  "
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.label).toBe("Home")
      expect(result.payload.latitude).toBe(32.102_014)
    }
  })

  it("defaults the optional fields rather than demanding them", () => {
    const { addressLine2, postalCode, isDefault, ...rest } = VALID_PAYLOAD
    const result = parseAddressPayload(rest)

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Absent, not `null`: upstream's `optional()` refuses `null`, and the
      // proxy would report that 400 as an outage.
      expect(result.payload.addressLine2).toBeUndefined()
      expect(result.payload.postalCode).toBe("")
      expect(result.payload.isDefault).toBe(false)
    }

    // The form sends an explicit `null` for "no second line"; it must leave the
    // process as an omitted key, which is what `JSON.stringify` makes of this.
    const explicit = parseAddressPayload({ ...rest, addressLine2: null })

    expect(explicit.ok).toBe(true)
    if (explicit.ok) {
      expect(
        "addressLine2" in JSON.parse(JSON.stringify(explicit.payload))
      ).toBe(false)
    }
  })

  it("names each failing field so the form can mark the input", () => {
    const result = parseAddressPayload({
      ...VALID_PAYLOAD,
      city: "   ",
      label: ""
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fields).toContain("city")
      expect(result.fields).toContain("label")
    }
  })

  it("rejects coordinates outside the globe", () => {
    const result = parseAddressPayload({ ...VALID_PAYLOAD, latitude: 91 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fields).toContain("latitude")
    }
  })

  it.each([
    ["a non-object", "House 12"],
    ["null", null],
    ["an empty object", {}]
  ])("refuses %s", (_label, body) => {
    expect(parseAddressPayload(body).ok).toBe(false)
  })
})

describe("parseAddressMutationResponse", () => {
  it("sanitises a created address the same way the list read does", () => {
    const parsed = parseAddressMutationResponse({
      data: BACKEND_ROW,
      success: true
    })

    expect(parsed?.id).toBe("addr-1")
    // Same leak rule as the list: coordinates never survive into a proxy body.
    expect(parsed).not.toHaveProperty("latitude")
    expect(parsed).not.toHaveProperty("userId")
  })

  it.each([
    ["a refusal dressed as 200", { data: BACKEND_ROW, success: false }],
    [
      "a list where one row was promised",
      { data: [BACKEND_ROW], success: true }
    ],
    ["a missing body", null]
  ])("reports %s as absence", (_label, body) => {
    expect(parseAddressMutationResponse(body)).toBeNull()
  })
})

describe("parseServiceabilityResponse", () => {
  it("reads a positive verdict", () => {
    expect(
      parseServiceabilityResponse({
        data: { serviceable: true },
        success: true
      })
    ).toEqual({ serviceable: true })
  })

  it.each(SERVICEABILITY_REASONS)("reads the %s refusal", (reason) => {
    expect(
      parseServiceabilityResponse({
        data: { reason, serviceable: false },
        success: true
      })
    ).toEqual({ reason, serviceable: false })
  })

  it("refuses a reason the service never defined", () => {
    expect(
      parseServiceabilityResponse({
        data: { reason: "BECAUSE_I_SAID_SO", serviceable: false },
        success: true
      })
    ).toBeNull()
  })

  it("never invents a positive verdict from an unreadable body", () => {
    // The caller decides what "unknown" means; the parser must not decide it.
    for (const body of [null, "<html>", { success: true }, { data: {} }]) {
      expect(parseServiceabilityResponse(body)).toBeNull()
    }
  })
})

describe("serviceabilityRequestSchema", () => {
  it("matches the discovery service's own body schema", () => {
    const parsed = serviceabilityRequestSchema.safeParse({
      deliveryAddress: { latitude: 32.102_014, longitude: 74.208_89 },
      marketplace: "fishtownco",
      tenantId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    })

    expect(parsed.success).toBe(true)
  })

  it("rejects a marketplace the service does not know", () => {
    expect(
      serviceabilityRequestSchema.safeParse({
        deliveryAddress: { latitude: 32.1, longitude: 74.2 },
        marketplace: "deliveroo",
        tenantId: "t1"
      }).success
    ).toBe(false)
  })
})

describe("parseProfilePayload (mw-3-2)", () => {
  it("accepts a name and a phone together, trimmed", () => {
    const parsed = parseProfilePayload({
      name: "  Qaseem  ",
      phone: " +923001234567 "
    })

    expect(parsed.ok).toBe(true)
    expect(parsed.ok && parsed.payload).toEqual({
      name: "Qaseem",
      phone: "+923001234567"
    })
  })

  it("accepts each field on its own — a blank name is simply omitted", () => {
    expect(parseProfilePayload({ phone: "+923001234567" }).ok).toBe(true)
    expect(parseProfilePayload({ name: "Qaseem" }).ok).toBe(true)
  })

  it("refuses an empty body, so the upstream's own 400 is unreachable", () => {
    const parsed = parseProfilePayload({})

    expect(parsed.ok).toBe(false)
    // The object-level refusal carries no field path; "body" is what is wrong.
    expect(!parsed.ok && parsed.fields).toEqual(["body"])
  })

  it("names the bad field rather than forwarding it", () => {
    const blankName = parseProfilePayload({ name: "   ", phone: "+92300" })

    expect(!blankName.ok && blankName.fields).toEqual(["name"])

    const badPhone = parseProfilePayload({ name: "Qaseem", phone: "0300 x" })

    expect(!badPhone.ok && badPhone.fields).toEqual(["phone"])
  })

  it("strips every field the proxy does not name", () => {
    // `latitude`/`longitude` and `locale` are all real upstream fields; none
    // of them may ride through this payload. `image` LEFT this list in
    // `mw-3-5` — it is now a named field, tested on its own below.
    const parsed = parseProfilePayload({
      latitude: 32.1,
      locale: "ur",
      longitude: 74.1,
      name: "Qaseem"
    })

    expect(parsed.ok && parsed.payload).toEqual({ name: "Qaseem" })
  })

  it("accepts a picture URL alone (mw-3-5)", () => {
    const parsed = parseProfilePayload({
      image: "https://cdn.test.invalid/uploads/profiles/1-a-b.png"
    })

    expect(parsed.ok && parsed.payload).toEqual({
      image: "https://cdn.test.invalid/uploads/profiles/1-a-b.png"
    })
  })

  it("refuses a picture that is not a URL", () => {
    const parsed = parseProfilePayload({ image: "uploads/profiles/x.png" })

    expect(parsed.ok).toBe(false)
    expect(!parsed.ok && parsed.fields).toContain("image")
  })

  it("refuses a picture that is not https", () => {
    // Core states the protocol; the proxy pins the origin. Both are needed —
    // this half stops `http://` and `javascript:` shaped values outright.
    for (const image of [
      "http://cdn.test.invalid/a.png",
      "ftp://cdn.test.invalid/a.png"
    ]) {
      const parsed = parseProfilePayload({ image })

      expect(parsed.ok, image).toBe(false)
    }
  })
})

describe("parseProfileReadResponse (mw-3-5)", () => {
  const ROW = {
    address: "House 12",
    email: "qaseem@test.invalid",
    id: "user-9",
    image: "https://cdn.test.invalid/a.png",
    latitude: 32.1,
    locale: "en",
    longitude: 74.1,
    name: "Qaseem",
    phone: "+923001234567",
    phoneVerified: false,
    type: "customer"
  }

  it("keeps the six fields the account page renders and strips the rest", () => {
    expect(parseProfileReadResponse({ data: ROW, success: true })).toEqual({
      email: "qaseem@test.invalid",
      id: "user-9",
      image: "https://cdn.test.invalid/a.png",
      name: "Qaseem",
      phone: "+923001234567",
      phoneVerified: false
    })
  })

  it("accepts an account with no picture and no phone yet", () => {
    expect(
      parseProfileReadResponse({
        data: { ...ROW, image: null, phone: null, phoneVerified: null },
        success: true
      })
    ).toEqual({
      email: "qaseem@test.invalid",
      id: "user-9",
      image: null,
      name: "Qaseem",
      phone: null,
      phoneVerified: null
    })
  })

  it("reports drift as absence — a read with no row is a LOAD FAILURE", () => {
    expect(parseProfileReadResponse({ success: false })).toBeNull()
    expect(
      parseProfileReadResponse({ data: { id: "" }, success: true })
    ).toBeNull()
    expect(parseProfileReadResponse(null)).toBeNull()
  })

  it("refuses a row whose email is not one", () => {
    expect(
      parseProfileReadResponse({
        data: { ...ROW, email: "not-an-email" },
        success: true
      })
    ).toBeNull()
  })

  it("refuses a non-object body", () => {
    expect(parseProfilePayload(null).ok).toBe(false)
    expect(parseProfilePayload("Qaseem").ok).toBe(false)
  })
})

describe("parseProfileMutationResponse (mw-3-2)", () => {
  it("keeps id, name and phone and drops the rest of the row", () => {
    expect(
      parseProfileMutationResponse({
        data: {
          address: "somewhere",
          email: "qaseem@test.invalid",
          id: "user-9",
          image: null,
          latitude: 32.1,
          locale: "en",
          longitude: 74.1,
          name: "Qaseem",
          phone: "+923001234567",
          phoneVerified: false,
          type: "customer"
        },
        success: true
      })
    ).toEqual({ id: "user-9", name: "Qaseem", phone: "+923001234567" })
  })

  it("tolerates the null phone the column allows", () => {
    expect(
      parseProfileMutationResponse({
        data: { id: "user-9", name: "Qaseem", phone: null },
        success: true
      })?.phone
    ).toBeNull()
  })

  it("answers null for a body that is not an updated row", () => {
    expect(parseProfileMutationResponse({ success: false })).toBeNull()
    expect(parseProfileMutationResponse({ ok: true })).toBeNull()
    expect(parseProfileMutationResponse(null)).toBeNull()
  })
})

describe("buildProfileDiff (mw-3-5)", () => {
  const LOADED = {
    image: "https://cdn.test.invalid/old.png",
    name: "Qaseem",
    phone: "+923001234567"
  }

  it("sends the changed field ALONE — the story's headline acceptance", () => {
    expect(buildProfileDiff(LOADED, { ...LOADED, name: "Qaseem Ali" })).toEqual(
      {
        name: "Qaseem Ali"
      }
    )
  })

  it("answers nothing at all when nothing moved, so `{}` is never sent", () => {
    // The upstream 400s on an empty update object. An empty diff is the
    // caller's signal to skip the request entirely.
    expect(buildProfileDiff(LOADED, LOADED)).toEqual({})
  })

  it("does not resend an untouched phone, which would flip phoneVerified", () => {
    expect(
      buildProfileDiff(LOADED, { ...LOADED, image: "https://c.test/new.png" })
    ).toEqual({ image: "https://c.test/new.png" })
  })

  it("trims the name before comparing, so whitespace alone is not a change", () => {
    expect(buildProfileDiff(LOADED, { ...LOADED, name: "  Qaseem  " })).toEqual(
      {}
    )
    expect(buildProfileDiff(LOADED, { ...LOADED, name: "  Ali  " })).toEqual({
      name: "Ali"
    })
  })

  it("treats an emptied box as leave-it-alone, never as a delete", () => {
    // `users.name` is NOT NULL and `UpdateProfileSchema` offers no way to
    // clear a phone or a picture, so a blank field cannot mean removal.
    expect(
      buildProfileDiff(LOADED, { image: "", name: "", phone: "" })
    ).toEqual({})
  })

  it("fills a row that started with nulls", () => {
    expect(
      buildProfileDiff(
        { image: null, name: "Qaseem", phone: null },
        { image: null, name: "Qaseem", phone: "+923001234567" }
      )
    ).toEqual({ phone: "+923001234567" })
  })

  it("carries all three when all three moved", () => {
    const diff = buildProfileDiff(LOADED, {
      image: "https://c.test/new.png",
      name: "Ali",
      phone: "+923009999999"
    })

    expect(diff).toEqual({
      image: "https://c.test/new.png",
      name: "Ali",
      phone: "+923009999999"
    })
    // And what it produces is a payload the proxy accepts.
    expect(parseProfilePayload(diff).ok).toBe(true)
  })

  it("ignores a field the form did not carry at all", () => {
    expect(buildProfileDiff(LOADED, { name: "Ali" })).toEqual({ name: "Ali" })
  })
})
