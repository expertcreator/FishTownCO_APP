import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants"
import { describe, expect, it, vi } from "vitest"
import {
  ensureGuestSession,
  isDeadSessionCode,
  recoverGuestSession,
  wasGuestToken
} from "../guest-session"
import type {
  GuestSessionResponse,
  SessionStorage,
  SessionTokenKind
} from "../index"

/**
 * A hand-written `SessionStorage` over a plain record — the interface-contract
 * style `catalog/__tests__/transport.test.ts` uses. No mocking framework is
 * needed to hold two strings.
 * @param seed - Tokens already stored
 * @returns The storage plus the record behind it
 */
function storageWith(seed: Partial<Record<SessionTokenKind, string>> = {}) {
  const held: Partial<Record<SessionTokenKind, string>> = { ...seed }
  const storage: SessionStorage = {
    clear: (kind) => {
      delete held[kind]

      return Promise.resolve()
    },
    read: (kind) => Promise.resolve(held[kind] ?? null),
    write: (kind, token) => {
      held[kind] = token

      return Promise.resolve()
    }
  }

  return { held, storage }
}

/**
 * A minter that answers with one session id.
 * @param sessionId - What the service returns
 * @returns The minter
 */
function mintsSession(sessionId: string) {
  return vi.fn(
    (): Promise<GuestSessionResponse> =>
      Promise.resolve({
        code: SUCCESS_MESSAGES.GUEST_USER_CREATED,
        sessionId,
        success: true,
        userId: "user-1"
      })
  )
}

describe("ensureGuestSession", () => {
  it("mints on a first visit and persists what came back", async () => {
    const { held, storage } = storageWith()
    const mint = mintsSession("sess-new")

    const result = await ensureGuestSession(storage, mint)

    expect(result).toEqual({ status: "created", token: "sess-new" })
    expect(held.guest).toBe("sess-new")
    expect(mint).toHaveBeenCalledTimes(1)
  })

  it("spends no upstream call for a returning visitor", async () => {
    const { storage } = storageWith({ guest: "sess-stored" })
    const mint = mintsSession("sess-new")

    const result = await ensureGuestSession(storage, mint)

    expect(result).toEqual({ status: "active", token: "sess-stored" })
    expect(mint).not.toHaveBeenCalled()
  })

  it("returns a stored user token and never mints underneath it", async () => {
    // The precedence that stops a signed-in customer placing an order as
    // somebody anonymous. Both tokens present is the case that proves the
    // order, not just the presence, of the two reads.
    const { held, storage } = storageWith({
      guest: "sess-guest",
      user: "sess-user"
    })
    const mint = mintsSession("sess-new")

    const result = await ensureGuestSession(storage, mint)

    expect(result).toEqual({ status: "active", token: "sess-user" })
    expect(mint).not.toHaveBeenCalled()
    expect(held.guest).toBe("sess-guest")
  })

  it("reports a failed mint as unavailable and writes nothing", async () => {
    const { held, storage } = storageWith()

    const result = await ensureGuestSession(storage, () =>
      Promise.resolve(null)
    )

    expect(result).toEqual({ status: "unavailable" })
    expect(held.guest).toBeUndefined()
  })

  it("absorbs a minter that throws instead of answering null", async () => {
    // The contract says report failure as `null`. An implementation that
    // leaks a rejection must still not take the funnel down.
    const { held, storage } = storageWith()

    const result = await ensureGuestSession(storage, () =>
      Promise.reject(new Error("getaddrinfo ENOTFOUND api.test.invalid"))
    )

    expect(result).toEqual({ status: "unavailable" })
    expect(held.guest).toBeUndefined()
  })

  it("lets a persistence failure surface rather than pretending it minted", async () => {
    // A write that failed means the next request mints again. Reporting
    // `created` there would claim a cookie the browser never received.
    const { storage } = storageWith()

    await expect(
      ensureGuestSession(
        { ...storage, write: () => Promise.reject(new Error("no headers")) },
        mintsSession("sess-new")
      )
    ).rejects.toThrow("no headers")
  })
})

describe("recoverGuestSession", () => {
  it("drops the dead guest token and mints another", async () => {
    const { held, storage } = storageWith({ guest: "sess-dead" })
    const mint = mintsSession("sess-fresh")

    const result = await recoverGuestSession(storage, mint)

    expect(result).toEqual({ status: "created", token: "sess-fresh" })
    expect(held.guest).toBe("sess-fresh")
    expect(mint).toHaveBeenCalledTimes(1)
  })

  it("never touches a still-valid user token", async () => {
    const { held, storage } = storageWith({
      guest: "sess-dead",
      user: "sess-user"
    })
    const mint = mintsSession("sess-fresh")

    const result = await recoverGuestSession(storage, mint)

    expect(result).toEqual({ status: "active", token: "sess-user" })
    expect(held.user).toBe("sess-user")
    expect(mint).not.toHaveBeenCalled()
  })

  it("leaves nothing stored when the replacement mint fails", async () => {
    const { held, storage } = storageWith({ guest: "sess-dead" })

    const result = await recoverGuestSession(storage, () =>
      Promise.resolve(null)
    )

    expect(result).toEqual({ status: "unavailable" })
    expect(held.guest).toBeUndefined()
  })
})

describe("isDeadSessionCode", () => {
  it.each([
    ERROR_MESSAGES.UNAUTHORIZED,
    ERROR_MESSAGES.INVALID_OR_EXPIRED_SESSION
  ])("treats %s as a dead token", (code) => {
    expect(isDeadSessionCode(code)).toBe(true)
  })

  it.each([
    ERROR_MESSAGES.FORBIDDEN,
    ERROR_MESSAGES.USER_BLOCKED,
    ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
    "",
    null,
    undefined
  ])("leaves the session alone for %j", (code) => {
    // Discarding a working session over a permission refusal logs the visitor
    // out for a reason that had nothing to do with their session.
    expect(isDeadSessionCode(code)).toBe(false)
  })
})

describe("wasGuestToken", () => {
  it("is true only when the failed bearer is the stored guest token", () => {
    expect(wasGuestToken("abc", "abc")).toBe(true)
    expect(wasGuestToken("abc", "xyz")).toBe(false)
  })

  it.each([
    [null, "abc"],
    ["abc", null],
    [null, null],
    ["", "abc"],
    ["abc", ""]
  ])("is false when either side is missing (%j, %j)", (sent, guest) => {
    expect(wasGuestToken(sent, guest)).toBe(false)
  })
})
