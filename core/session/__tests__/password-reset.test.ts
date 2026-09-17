import { describe, expect, it, vi } from "vitest"
import {
  confirmPasswordReset,
  requestPasswordReset,
  type UserAuthTransport,
  type UserAuthTransportResult
} from "../user-session"

/** A transport answering a scripted sequence, recording every call. */
function scriptedTransport(answers: UserAuthTransportResult[]) {
  const calls: { endpoint: string; body: unknown }[] = []
  const transport: UserAuthTransport = (endpoint, body) => {
    calls.push({ body, endpoint })

    const answer = answers.shift()

    if (answer === undefined) {
      throw new Error("transport called more times than scripted")
    }

    return Promise.resolve(answer)
  }

  return { calls, transport }
}

const OK: UserAuthTransportResult = {
  body: { message: "OTP_GENERATED", success: true },
  kind: "ok"
}

describe("requestPasswordReset", () => {
  it("sends the normalised email with the customer role", async () => {
    const { calls, transport } = scriptedTransport([OK])

    const result = await requestPasswordReset(transport, "  A@B.CO ")

    expect(result).toEqual({ status: "sent" })
    expect(calls[0]).toEqual({
      body: { email: "a@b.co", role: "customer" },
      endpoint: "resetVerifyEmail"
    })
  })

  it("maps an unknown email to user-not-found", async () => {
    const { transport } = scriptedTransport([
      { code: "USER_NOT_FOUND", kind: "denied", status: 404 }
    ])

    expect(await requestPasswordReset(transport, "a@b.co")).toEqual({
      code: "user-not-found",
      status: "failed"
    })
  })

  it("reports an unreachable service as unavailable", async () => {
    const { transport } = scriptedTransport([{ kind: "unreachable" }])

    expect(await requestPasswordReset(transport, "a@b.co")).toEqual({
      status: "unavailable"
    })
  })
})

describe("confirmPasswordReset", () => {
  const SUBMISSION = {
    email: "a@b.co",
    otp: "123456",
    password: "new-password-1"
  }

  it("verifies the OTP, then spends the reset token on the new password", async () => {
    const { calls, transport } = scriptedTransport([
      { body: { sessionId: "reset-tok-1", success: true }, kind: "ok" },
      { body: { message: "PASSWORD_RESET", success: true }, kind: "ok" }
    ])

    const result = await confirmPasswordReset(transport, SUBMISSION)

    expect(result).toEqual({ status: "reset" })
    expect(calls.map((call) => call.endpoint)).toEqual([
      "resetVerifyOtp",
      "resetPassword"
    ])
    expect(calls[1]?.body).toEqual({
      flow: "reset-password",
      password: "new-password-1",
      sessionId: "reset-tok-1"
    })
  })

  it("maps a wrong code to invalid-otp and never calls step 3", async () => {
    const { calls, transport } = scriptedTransport([
      { code: "INVALID_OTP", kind: "denied", status: 400 }
    ])

    expect(await confirmPasswordReset(transport, SUBMISSION)).toEqual({
      code: "invalid-otp",
      status: "failed"
    })
    expect(calls).toHaveLength(1)
  })

  it("maps an expired reset token to reset-expired", async () => {
    const { transport } = scriptedTransport([
      { body: { sessionId: "reset-tok-2", success: true }, kind: "ok" },
      { code: "INVALID_OR_EXPIRED_SESSION", kind: "denied", status: 401 }
    ])

    expect(await confirmPasswordReset(transport, SUBMISSION)).toEqual({
      code: "reset-expired",
      status: "failed"
    })
  })

  it("treats a 2xx without a reset token as an outage, not a code problem", async () => {
    const { calls, transport } = scriptedTransport([
      { body: { success: true }, kind: "ok" }
    ])

    expect(await confirmPasswordReset(transport, SUBMISSION)).toEqual({
      status: "unavailable"
    })
    expect(calls).toHaveLength(1)
  })

  it("carries the set-password flow through to step 3 (mw-3-5)", async () => {
    // The ONLY thing `flow` changes upstream is which confirmation email is
    // sent (`password.controllers.ts:370-377`). A social account giving
    // itself its first password should not read "your password was reset".
    const { calls, transport } = scriptedTransport([
      { body: { sessionId: "reset-tok-3", success: true }, kind: "ok" },
      { body: { message: "PASSWORD_RESET", success: true }, kind: "ok" }
    ])

    expect(
      await confirmPasswordReset(transport, {
        ...SUBMISSION,
        flow: "set-password"
      })
    ).toEqual({ status: "reset" })
    expect(calls[1]?.body).toEqual({
      flow: "set-password",
      password: "new-password-1",
      sessionId: "reset-tok-3"
    })
  })

  it("refuses an under-length password before any upstream call", async () => {
    const transportSpy = vi.fn()

    await expect(
      confirmPasswordReset(transportSpy as unknown as UserAuthTransport, {
        ...SUBMISSION,
        password: "short"
      })
    ).rejects.toThrow()
    expect(transportSpy).not.toHaveBeenCalled()
  })
})
