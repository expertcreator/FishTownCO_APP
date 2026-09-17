import { SUCCESS_MESSAGES } from "@/constants"
import { describe, expect, it } from "vitest"
import {
  changePasswordRequestSchema,
  guestSessionRequestSchema,
  guestSessionResponseSchema,
  parseGuestSessionResponse,
  resetPasswordRequestSchema
} from "../schemas"

/** A mint response exactly as `api-dev` sent it on 2026-08-29. */
const CREATED = {
  code: SUCCESS_MESSAGES.GUEST_USER_CREATED,
  isGuest: true,
  message: SUCCESS_MESSAGES.GUEST_USER_CREATED,
  sessionId: "sess-abc",
  success: true,
  user: {
    email: null,
    id: "user-1",
    tenantId: null,
    type: "customer"
  },
  userId: "user-1"
}

describe("guestSessionRequestSchema", () => {
  it("accepts a device id and accepts its absence", () => {
    expect(
      guestSessionRequestSchema.parse({ deviceId: "web-1", role: "customer" })
    ).toEqual({ deviceId: "web-1", role: "customer" })
    expect(guestSessionRequestSchema.parse({ role: "customer" })).toEqual({
      role: "customer"
    })
  })

  it("rejects an empty device id rather than sending one", () => {
    // An empty string is trimmed to `undefined` by the service, so sending it
    // would silently mean "mint a brand new guest" while reading as continuity.
    expect(
      guestSessionRequestSchema.safeParse({ deviceId: "", role: "customer" })
        .success
    ).toBe(false)
  })

  it("mints customers only", () => {
    expect(guestSessionRequestSchema.safeParse({ role: "rider" }).success).toBe(
      false
    )
  })
})

describe("parseGuestSessionResponse", () => {
  it("parses a newly created guest", () => {
    const parsed = parseGuestSessionResponse(CREATED)

    expect(parsed?.sessionId).toBe("sess-abc")
    expect(parsed?.code).toBe(SUCCESS_MESSAGES.GUEST_USER_CREATED)
  })

  it("parses a restored guest, which is the same shape with the other code", () => {
    const parsed = parseGuestSessionResponse({
      ...CREATED,
      code: SUCCESS_MESSAGES.GUEST_SESSION_RESTORED,
      message: SUCCESS_MESSAGES.GUEST_SESSION_RESTORED
    })

    expect(parsed?.code).toBe(SUCCESS_MESSAGES.GUEST_SESSION_RESTORED)
  })

  it("keeps the fields the login modal will need", () => {
    expect(parseGuestSessionResponse(CREATED)?.userId).toBe("user-1")
    expect(parseGuestSessionResponse(CREATED)?.user?.id).toBe("user-1")
  })

  it.each([
    ["an absent sessionId", { ...CREATED, sessionId: undefined }],
    ["an empty sessionId", { ...CREATED, sessionId: "" }],
    ["success: false", { ...CREATED, success: false }],
    ["a code from another flow", { ...CREATED, code: "LOGIN_SUCCESS" }],
    ["an unparseable body", "<html>502 Bad Gateway</html>"],
    ["a null body", null],
    ["nothing at all", undefined]
  ])("reports %s as absence", (_label, body) => {
    // Every one of these is a 200 the caller must treat exactly like an
    // outage: there is no credential in it.
    expect(parseGuestSessionResponse(body)).toBeNull()
  })

  it("survives the optional halves going missing", () => {
    // `isGuest` and `user` are described but never read here; dropping them
    // upstream must not break the funnel.
    expect(
      parseGuestSessionResponse({
        code: CREATED.code,
        sessionId: "sess-abc",
        success: true,
        userId: "user-1"
      })?.sessionId
    ).toBe("sess-abc")
  })

  it("drops fields nobody declared rather than carrying them forward", () => {
    const parsed = guestSessionResponseSchema.parse({
      ...CREATED,
      internalTrace: "auth-svc-7"
    })

    expect(parsed).not.toHaveProperty("internalTrace")
  })
})

describe("resetPasswordRequestSchema — the flow discriminator (mw-3-5)", () => {
  it("defaults to the reset journey when the caller names no flow", () => {
    // Every pre-mw-3-5 caller omitted the field entirely. Widening the
    // literal to an enum must not change what any of them send.
    expect(
      resetPasswordRequestSchema.parse({
        password: "12345678",
        sessionId: "reset-tok-1"
      })
    ).toEqual({
      flow: "reset-password",
      password: "12345678",
      sessionId: "reset-tok-1"
    })
  })

  it("accepts the set-password journey, which is what the sentinel unlocks", () => {
    expect(
      resetPasswordRequestSchema.parse({
        flow: "set-password",
        password: "12345678",
        sessionId: "reset-tok-1"
      }).flow
    ).toBe("set-password")
  })

  it("refuses a flow the upstream does not declare", () => {
    expect(
      resetPasswordRequestSchema.safeParse({
        flow: "make-password",
        password: "12345678",
        sessionId: "reset-tok-1"
      }).success
    ).toBe(false)
  })
})

describe("changePasswordRequestSchema (mw-3-5)", () => {
  it("mirrors the upstream body, with the floor on the new password", () => {
    expect(
      changePasswordRequestSchema.parse({
        newPassword: "12345678",
        oldPassword: "x"
      })
    ).toEqual({ newPassword: "12345678", oldPassword: "x" })
    expect(
      changePasswordRequestSchema.safeParse({
        newPassword: "1234567",
        oldPassword: "x"
      }).success
    ).toBe(false)
  })

  it("refuses an empty current password before a call is spent on it", () => {
    expect(
      changePasswordRequestSchema.safeParse({
        newPassword: "12345678",
        oldPassword: ""
      }).success
    ).toBe(false)
  })

  it("strips anything else a caller attaches", () => {
    expect(
      changePasswordRequestSchema.parse({
        confirmPassword: "12345678",
        newPassword: "12345678",
        oldPassword: "x"
      })
    ).toEqual({ newPassword: "12345678", oldPassword: "x" })
  })
})
