import { describe, expect, it } from "vitest"
import { SESSION_ENDPOINTS } from "../endpoints"

describe("SESSION_ENDPOINTS", () => {
  it("is the service-root-relative mint path, with no gateway segment", () => {
    // The `auth/api/v1` prefix is app-side config (`mint.ts`). A leading slash
    // or the prefix here would push a deployment detail into shared code.
    expect(SESSION_ENDPOINTS.createGuest.path()).toBe("users/guest")
    expect(SESSION_ENDPOINTS.createGuest.method).toBe("POST")
  })

  it("carries the request and response contracts beside the path", () => {
    expect(
      SESSION_ENDPOINTS.createGuest.request.safeParse({ role: "customer" })
        .success
    ).toBe(true)
    expect(SESSION_ENDPOINTS.createGuest.response.safeParse({}).success).toBe(
      false
    )
  })
})

describe("SESSION_ENDPOINTS — the user-auth paths", () => {
  it.each([
    ["resendSignupOtp", "users/resend-signup-otp"],
    ["signupLogin", "users/signup-login"],
    ["socialSignIn", "users/social-signin"],
    ["verifySignupOtp", "users/signup-verify-otp"]
  ] as const)("%s POSTs to %s, service-root-relative", (key, path) => {
    expect(SESSION_ENDPOINTS[key].path()).toBe(path)
    expect(SESSION_ENDPOINTS[key].method).toBe("POST")
  })

  it("carries the contracts beside the paths", () => {
    expect(
      SESSION_ENDPOINTS.signupLogin.request.safeParse({
        email: "a@b.co",
        password: "12345678",
        role: "customer"
      }).success
    ).toBe(true)
    expect(
      SESSION_ENDPOINTS.socialSignIn.request.safeParse({
        idToken: "short",
        provider: "facebook",
        role: "customer"
      }).success
    ).toBe(false)
    expect(
      SESSION_ENDPOINTS.verifySignupOtp.response.safeParse({}).success
    ).toBe(false)
  })
})

describe("SESSION_ENDPOINTS.changePassword (mw-3-5)", () => {
  it("POSTs to the service-root-relative change-password path", () => {
    expect(SESSION_ENDPOINTS.changePassword.path()).toBe(
      "users/change-password"
    )
    expect(SESSION_ENDPOINTS.changePassword.method).toBe("POST")
  })

  it("carries the upstream's own two fields and its password floor", () => {
    expect(
      SESSION_ENDPOINTS.changePassword.request.safeParse({
        newPassword: "12345678",
        oldPassword: "old-one"
      }).success
    ).toBe(true)
    // The floor is on the NEW password only: a short old one is the
    // upstream's 400 to give, and it means the same as its 401.
    expect(
      SESSION_ENDPOINTS.changePassword.request.safeParse({
        newPassword: "short",
        oldPassword: "old-one"
      }).success
    ).toBe(false)
    expect(
      SESSION_ENDPOINTS.changePassword.response.safeParse({}).success
    ).toBe(false)
  })
})
