import { describe, expect, it } from "vitest"
import { CHECKOUT_ENDPOINTS } from "../endpoints"

describe("CHECKOUT_ENDPOINTS.listAddresses", () => {
  it("is mobile's ADDRESS.GET_ALL, service-root-relative", () => {
    // The trailing slash is the backend's own spelling; without it the
    // gateway routes elsewhere. No leading slash — `authServiceUrl` joins it.
    expect(CHECKOUT_ENDPOINTS.listAddresses.path()).toBe("users/addresses/")
    expect(CHECKOUT_ENDPOINTS.listAddresses.method).toBe("GET")
  })

  it("carries the response schema so the caller cannot skip the parse", () => {
    expect(
      CHECKOUT_ENDPOINTS.listAddresses.response.safeParse({
        data: [],
        success: true
      }).success
    ).toBe(true)
  })
})

describe("CHECKOUT_ENDPOINTS address writes (mw-2-6)", () => {
  it("creates on the list path — same trailing slash, different verb", () => {
    expect(CHECKOUT_ENDPOINTS.createAddress.path()).toBe("users/addresses/")
    expect(CHECKOUT_ENDPOINTS.createAddress.method).toBe("POST")
  })

  it("addresses one row by id, with NO trailing slash", () => {
    // The id terminates the path; this is the backend's own spelling
    // (mobile `ADDRESS.UPDATE`/`DELETE`), and adding a slash routes elsewhere.
    expect(CHECKOUT_ENDPOINTS.updateAddress.path("a1")).toBe(
      "users/addresses/a1"
    )
    expect(CHECKOUT_ENDPOINTS.deleteAddress.path("a1")).toBe(
      "users/addresses/a1"
    )
    expect(CHECKOUT_ENDPOINTS.setDefaultAddress.path("a1")).toBe(
      "users/addresses/a1/set-default"
    )
  })

  it("escapes an id rather than letting it reshape the path", () => {
    expect(CHECKOUT_ENDPOINTS.deleteAddress.path("a/../b")).toBe(
      "users/addresses/a%2F..%2Fb"
    )
  })

  it("puts serviceability on its own path for the discovery service", () => {
    expect(CHECKOUT_ENDPOINTS.validateServiceability.path()).toBe(
      "serviceability/validate"
    )
    expect(CHECKOUT_ENDPOINTS.validateServiceability.method).toBe("POST")
  })
})

describe("CHECKOUT_ENDPOINTS.updateMe (mw-3-2)", () => {
  it("patches the caller's own row — no trailing slash, no id", () => {
    expect(CHECKOUT_ENDPOINTS.updateMe.path()).toBe("users/me")
    expect(CHECKOUT_ENDPOINTS.updateMe.method).toBe("PATCH")
  })

  it("carries the narrowed response schema", () => {
    expect(
      CHECKOUT_ENDPOINTS.updateMe.response.safeParse({
        data: { id: "user-9", name: "Qaseem", phone: null },
        success: true
      }).success
    ).toBe(true)
  })
})

describe("CHECKOUT_ENDPOINTS.getMe (mw-3-5)", () => {
  it("reads the caller's own row on the same path the write patches", () => {
    // One route file upstream, two verbs. If these ever disagree, one of the
    // two calls is 404ing silently.
    expect(CHECKOUT_ENDPOINTS.getMe.path()).toBe("users/me")
    expect(CHECKOUT_ENDPOINTS.getMe.method).toBe("GET")
    expect(CHECKOUT_ENDPOINTS.getMe.path()).toBe(
      CHECKOUT_ENDPOINTS.updateMe.path()
    )
  })

  it("carries the narrowed read schema, which demands a real email", () => {
    expect(
      CHECKOUT_ENDPOINTS.getMe.response.safeParse({
        data: {
          email: "qaseem@test.invalid",
          id: "user-9",
          image: null,
          name: "Qaseem",
          phone: null
        },
        success: true
      }).success
    ).toBe(true)
    expect(
      CHECKOUT_ENDPOINTS.getMe.response.safeParse({ success: true }).success
    ).toBe(false)
  })
})
