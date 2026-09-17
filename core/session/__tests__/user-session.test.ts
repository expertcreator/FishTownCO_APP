import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants"
import { describe, expect, it, vi } from "vitest"
import type {
  SessionStorage,
  SessionTokenKind,
  UserAuthTransport,
  UserAuthTransportResult
} from "../index"
import {
  classifyAuthDenial,
  loginWithEmail,
  resendSignupOtp,
  socialSignIn,
  verifySignupOtp
} from "../user-session"

/**
 * A hand-written `SessionStorage` that also records the ORDER of writes and
 * clears — the guest-clear-after-user-write ordering is a matrix row, and a
 * plain record cannot see it.
 * @param seed - Tokens already stored
 * @returns The storage, the record behind it, and the operation log
 */
function storageWith(seed: Partial<Record<SessionTokenKind, string>> = {}) {
  const held: Partial<Record<SessionTokenKind, string>> = { ...seed }
  const ops: string[] = []
  const storage: SessionStorage = {
    clear: (kind) => {
      ops.push(`clear:${kind}`)
      delete held[kind]

      return Promise.resolve()
    },
    read: (kind) => Promise.resolve(held[kind] ?? null),
    write: (kind, token) => {
      ops.push(`write:${kind}`)
      held[kind] = token

      return Promise.resolve()
    }
  }

  return { held, ops, storage }
}

/** The user summary `api-dev` shapes for customers. */
const USER = {
  email: "a@b.co",
  id: "user-1",
  locale: "en",
  tenantId: null,
  type: "customer"
}

/**
 * A session-establishing response body.
 * @param code - The success code the flow answers with
 * @returns The body
 */
function sessionBody(code: string = SUCCESS_MESSAGES.LOGIN_SUCCESS) {
  return {
    code,
    message: code,
    sessionId: "sess-user",
    success: true,
    user: USER
  }
}

/**
 * A transport answering one canned result for every call.
 * @param result - What every call comes back with
 * @returns The mocked transport
 */
function transportWith(result: UserAuthTransportResult) {
  return vi.fn(() => Promise.resolve(result)) as ReturnType<typeof vi.fn> &
    UserAuthTransport
}

/**
 * A denial, as the backend's error handler shapes it.
 * @param status - HTTP status
 * @param code - The error body's code
 * @returns The transport result
 */
function denied(status: number, code: string | null): UserAuthTransportResult {
  return { code, kind: "denied", status }
}

const CREDENTIALS = { email: "a@b.co", password: "12345678" }

describe("loginWithEmail — an existing account", () => {
  it("writes the user token, then clears the guest one", async () => {
    const { held, ops, storage } = storageWith({ guest: "sess-guest" })
    const transport = transportWith({ body: sessionBody(), kind: "ok" })

    const result = await loginWithEmail(storage, transport, CREDENTIALS)

    expect(result).toEqual({ status: "authenticated", user: USER })
    expect(held.user).toBe("sess-user")
    expect(held.guest).toBeUndefined()
    // Ordering, not just outcome: a clear that ran first and a write that
    // then threw would leave the visitor with NO session at all.
    expect(ops).toEqual(["write:user", "clear:guest"])
  })

  it("sends the stored guest token as guestSessionId", async () => {
    const { storage } = storageWith({ guest: "sess-guest" })
    const transport = transportWith({ body: sessionBody(), kind: "ok" })

    await loginWithEmail(storage, transport, CREDENTIALS)

    expect(transport).toHaveBeenCalledWith("signupLogin", {
      email: "a@b.co",
      guestSessionId: "sess-guest",
      password: "12345678",
      role: "customer"
    })
  })

  it("omits guestSessionId entirely when no guest token is stored", async () => {
    const { storage } = storageWith()
    const transport = transportWith({ body: sessionBody(), kind: "ok" })

    await loginWithEmail(storage, transport, CREDENTIALS)

    const body = transport.mock.calls[0]?.[1] as Record<string, unknown>

    expect("guestSessionId" in body).toBe(false)
  })

  it("normalises the email exactly as mobile does: trim, lowercase", async () => {
    const { storage } = storageWith()
    const transport = transportWith({ body: sessionBody(), kind: "ok" })

    await loginWithEmail(storage, transport, {
      email: "  A@B.CO ",
      password: "12345678"
    })

    const body = transport.mock.calls[0]?.[1] as Record<string, unknown>

    expect(body.email).toBe("a@b.co")
  })

  it("still authenticates when clearing the guest token throws", async () => {
    // The session IS established at that point; a locked store must not turn
    // a successful login into a failure.
    const { held, storage } = storageWith({ guest: "sess-guest" })

    storage.clear = () => Promise.reject(new Error("locked keystore"))

    const transport = transportWith({ body: sessionBody(), kind: "ok" })
    const result = await loginWithEmail(storage, transport, CREDENTIALS)

    expect(result).toEqual({ status: "authenticated", user: USER })
    expect(held.user).toBe("sess-user")
  })

  it("still authenticates when the response carries no user summary", async () => {
    const { held, storage } = storageWith()
    const { user: _user, ...withoutUser } = sessionBody()
    const transport = transportWith({ body: withoutUser, kind: "ok" })

    const result = await loginWithEmail(storage, transport, CREDENTIALS)

    expect(result).toEqual({ status: "authenticated", user: null })
    expect(held.user).toBe("sess-user")
  })
})

describe("loginWithEmail — a new email", () => {
  it("reports otp-required and persists nothing", async () => {
    const { held, storage } = storageWith({ guest: "sess-guest" })
    const transport = transportWith({
      body: {
        code: SUCCESS_MESSAGES.OTP_GENERATED,
        message: SUCCESS_MESSAGES.OTP_GENERATED,
        // The backend's dev mode leaks the OTP here. The schema strips it.
        otp: "123456",
        success: true
      },
      kind: "ok"
    })

    const result = await loginWithEmail(storage, transport, CREDENTIALS)

    expect(result).toEqual({ status: "otp-required" })
    expect(held.user).toBeUndefined()
    expect(held.guest).toBe("sess-guest")
  })
})

describe("loginWithEmail — denials", () => {
  it.each([
    [
      "a wrong password",
      401,
      ERROR_MESSAGES.INVALID_PASSWORD,
      "invalid-password"
    ],
    [
      "a social-only account",
      400,
      ERROR_MESSAGES.INVALID_PASSWORD,
      "social-only"
    ],
    ["a blocked user", 403, ERROR_MESSAGES.USER_BLOCKED, "blocked"],
    ["an unknown code", 500, "SOMETHING_NEW", "auth-failed"]
  ])("maps %s and writes nothing", async (_label, status, code, expected) => {
    const { held, storage } = storageWith({ guest: "sess-guest" })
    const transport = transportWith(denied(status, code))

    const result = await loginWithEmail(storage, transport, CREDENTIALS)

    expect(result).toEqual({ code: expected, status: "failed" })
    expect(held.user).toBeUndefined()
    expect(held.guest).toBe("sess-guest")
  })

  it("reports an unreachable service as unavailable", async () => {
    const { storage } = storageWith()
    const transport = transportWith({ kind: "unreachable" })

    expect(await loginWithEmail(storage, transport, CREDENTIALS)).toEqual({
      status: "unavailable"
    })
  })

  it("treats a 2xx with no usable session as an outage, not a login", async () => {
    const { held, storage } = storageWith()
    const transport = transportWith({
      body: "<html>502 Bad Gateway</html>",
      kind: "ok"
    })

    const result = await loginWithEmail(storage, transport, CREDENTIALS)

    expect(result).toEqual({ status: "unavailable" })
    expect(held.user).toBeUndefined()
  })
})

describe("verifySignupOtp", () => {
  it("authenticates, writes user, clears guest — in that order", async () => {
    const { held, ops, storage } = storageWith({ guest: "sess-guest" })
    const transport = transportWith({
      body: sessionBody(SUCCESS_MESSAGES.GUEST_ACCOUNT_CONVERTED),
      kind: "ok"
    })

    const result = await verifySignupOtp(storage, transport, {
      email: "a@b.co",
      otp: "123456"
    })

    expect(result).toEqual({ status: "authenticated", user: USER })
    expect(held.user).toBe("sess-user")
    expect(ops).toEqual(["write:user", "clear:guest"])
    expect(transport).toHaveBeenCalledWith("verifySignupOtp", {
      email: "a@b.co",
      otp: "123456"
    })
  })

  it.each([
    ["a wrong code", ERROR_MESSAGES.INVALID_OTP, "invalid-otp"],
    ["an expired code", ERROR_MESSAGES.EXPIRED_OTP, "expired-otp"],
    [
      "an expired signup session",
      ERROR_MESSAGES.SIGNUP_SESSION_EXPIRED,
      "signup-expired"
    ]
  ])("surfaces %s and stays unauthenticated", async (_label, code, expected) => {
    const { held, storage } = storageWith()
    const transport = transportWith(denied(400, code))

    const result = await verifySignupOtp(storage, transport, {
      email: "a@b.co",
      otp: "000000"
    })

    expect(result).toEqual({ code: expected, status: "failed" })
    expect(held.user).toBeUndefined()
  })

  it("rejects a code that is not six digits before any call is spent", async () => {
    const { storage } = storageWith()
    const transport = transportWith({ body: sessionBody(), kind: "ok" })

    await expect(
      verifySignupOtp(storage, transport, { email: "a@b.co", otp: "12345" })
    ).rejects.toThrow()
    expect(transport).not.toHaveBeenCalled()
  })

  it("reports an unreachable service as unavailable", async () => {
    const { storage } = storageWith()
    const transport = transportWith({ kind: "unreachable" })

    expect(
      await verifySignupOtp(storage, transport, {
        email: "a@b.co",
        otp: "123456"
      })
    ).toEqual({ status: "unavailable" })
  })
})

describe("resendSignupOtp", () => {
  it("reports a fresh code as sent", async () => {
    const transport = transportWith({
      body: { code: SUCCESS_MESSAGES.OTP_GENERATED, success: true },
      kind: "ok"
    })

    expect(await resendSignupOtp(transport, "a@b.co")).toEqual({
      status: "sent"
    })
    expect(transport).toHaveBeenCalledWith("resendSignupOtp", {
      email: "a@b.co"
    })
  })

  it("maps the 30-second cooldown", async () => {
    const transport = transportWith(
      denied(429, ERROR_MESSAGES.PLEASE_TRY_AGAIN_IN_30_SECONDS)
    )

    expect(await resendSignupOtp(transport, "a@b.co")).toEqual({
      code: "otp-cooldown",
      status: "failed"
    })
  })

  it("reports an unreachable service as unavailable", async () => {
    const transport = transportWith({ kind: "unreachable" })

    expect(await resendSignupOtp(transport, "a@b.co")).toEqual({
      status: "unavailable"
    })
  })
})

describe("socialSignIn", () => {
  const TOKEN = { idToken: "a-provider-token", provider: "google" as const }

  it("authenticates like an email login, guest token riding along", async () => {
    const { held, ops, storage } = storageWith({ guest: "sess-guest" })
    const transport = transportWith({ body: sessionBody(), kind: "ok" })

    const result = await socialSignIn(storage, transport, TOKEN)

    expect(result).toEqual({ status: "authenticated", user: USER })
    expect(held.user).toBe("sess-user")
    expect(ops).toEqual(["write:user", "clear:guest"])
    expect(transport).toHaveBeenCalledWith("socialSignIn", {
      guestSessionId: "sess-guest",
      idToken: "a-provider-token",
      provider: "google",
      role: "customer"
    })
  })

  it("maps a rejected provider token", async () => {
    const { held, storage } = storageWith()
    const transport = transportWith(denied(401, ERROR_MESSAGES.UNAUTHORIZED))

    const result = await socialSignIn(storage, transport, {
      idToken: "a-rejected-token",
      provider: "apple"
    })

    expect(result).toEqual({ code: "social-rejected", status: "failed" })
    expect(held.user).toBeUndefined()
  })

  it("reports an unreachable service as unavailable", async () => {
    const { storage } = storageWith()
    const transport = transportWith({ kind: "unreachable" })

    expect(await socialSignIn(storage, transport, TOKEN)).toEqual({
      status: "unavailable"
    })
  })

  it("treats contract drift as an outage and persists nothing", async () => {
    const { held, storage } = storageWith({ guest: "sess-guest" })
    const transport = transportWith({
      body: { sessionId: "", success: true },
      kind: "ok"
    })

    expect(await socialSignIn(storage, transport, TOKEN)).toEqual({
      status: "unavailable"
    })
    expect(held.guest).toBe("sess-guest")
  })
})

describe("classifyAuthDenial", () => {
  it.each([
    [409, ERROR_MESSAGES.USER_ALREADY_EXISTS, "already-exists"],
    [400, ERROR_MESSAGES.OTP_EXPIRED, "expired-otp"],
    [429, ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, "otp-cooldown"],
    [503, null, "auth-failed"]
  ])("maps %i %s", (status, code, expected) => {
    expect(classifyAuthDenial(status, code)).toBe(expected)
  })
})
