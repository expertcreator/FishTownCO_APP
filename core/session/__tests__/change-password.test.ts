import { describe, expect, it, vi } from "vitest"
import {
  changePassword,
  type UserAuthTransport,
  type UserAuthTransportResult
} from "../user-session"

/**
 * `changePassword`'s whole reason to exist is the 401/401 discrimination:
 * the upstream answers the same status for a mistyped current password and
 * for a bearer it refused, and only the body's `code` separates them. Wired
 * the obvious way, one typo signs the customer out.
 */

/** A transport answering one scripted result, recording the call. */
function scriptedTransport(answer: UserAuthTransportResult) {
  const calls: { endpoint: string; body: unknown }[] = []
  const transport: UserAuthTransport = (endpoint, body) => {
    calls.push({ body, endpoint })

    return Promise.resolve(answer)
  }

  return { calls, transport }
}

const SUBMISSION = { newPassword: "new-password-1", oldPassword: "old-one" }

describe("changePassword", () => {
  it("sends the two-field body to the change-password endpoint", async () => {
    const { calls, transport } = scriptedTransport({
      body: { success: true },
      kind: "ok"
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      status: "changed"
    })
    expect(calls).toEqual([
      {
        body: { newPassword: "new-password-1", oldPassword: "old-one" },
        endpoint: "changePassword"
      }
    ])
  })

  it("maps a 401 INVALID_PASSWORD to wrong-password, NOT to a dead session", async () => {
    // The row this whole module exists for. `wrong-password` never clears a
    // session; `session-dead` always does.
    const { transport } = scriptedTransport({
      code: "INVALID_PASSWORD",
      kind: "denied",
      status: 401
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      status: "wrong-password"
    })
  })

  it("maps a 401 UNAUTHORIZED to session-dead — the only signing-out branch", async () => {
    const { transport } = scriptedTransport({
      code: "UNAUTHORIZED",
      kind: "denied",
      status: 401
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      status: "session-dead"
    })
  })

  it("treats a social account exactly as a wrong password", async () => {
    // Measured: the hash is the sentinel `"!social!"`, never NULL, so the
    // controller's friendly 400 is unreachable and the hash comparison's 401
    // is what actually comes back. The caller's copy offers the
    // set-password path beside the field error.
    const { transport } = scriptedTransport({
      code: "INVALID_PASSWORD",
      kind: "denied",
      status: 401
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      status: "wrong-password"
    })
  })

  it("reports a 200 that does not confirm the change as an outage", async () => {
    // Contract drift. Reporting `changed` here would leave the customer
    // signing in with a password the service never stored.
    const { transport } = scriptedTransport({
      body: { success: false },
      kind: "ok"
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      status: "unavailable"
    })
  })

  it("does NOT call a rate-limit a wrong password", async () => {
    // A 429 is not the customer's password being wrong. Told otherwise they
    // go and reset a password that was correct all along.
    const { transport } = scriptedTransport({
      code: "RATE_LIMIT_EXCEEDED",
      kind: "denied",
      status: 429
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      code: "otp-cooldown",
      status: "failed"
    })
  })

  it("does NOT call a missing account a wrong password", async () => {
    const { transport } = scriptedTransport({
      code: "USER_NOT_FOUND",
      kind: "denied",
      status: 404
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      code: "user-not-found",
      status: "failed"
    })
  })

  it("folds the upstream's own oldPassword floor (a 400) into wrong-password", async () => {
    // `ChangePasswordSchema` states `min(8)` on `oldPassword` where the form
    // states `min(1)`. A short current password is still just a current
    // password that is not theirs.
    const { transport } = scriptedTransport({
      code: "VALIDATION_ERROR",
      kind: "denied",
      status: 400
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      status: "wrong-password"
    })
  })

  it("maps a 401 with an unrecognised code through the failure vocabulary", async () => {
    const { transport } = scriptedTransport({
      code: "USER_BLOCKED",
      kind: "denied",
      status: 401
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      code: "blocked",
      status: "failed"
    })
  })

  it("maps a 401 with no code at all through the failure vocabulary", async () => {
    const { transport } = scriptedTransport({
      code: null,
      kind: "denied",
      status: 401
    })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      code: "auth-failed",
      status: "failed"
    })
  })

  it("reports an unreachable service as unavailable, never as a bad password", async () => {
    const { transport } = scriptedTransport({ kind: "unreachable" })

    expect(await changePassword(transport, SUBMISSION)).toEqual({
      status: "unavailable"
    })
  })

  it("refuses an under-length new password before any upstream call", async () => {
    const transportSpy = vi.fn()

    await expect(
      changePassword(transportSpy as unknown as UserAuthTransport, {
        newPassword: "short",
        oldPassword: "old-one"
      })
    ).rejects.toThrow()
    expect(transportSpy).not.toHaveBeenCalled()
  })
})
