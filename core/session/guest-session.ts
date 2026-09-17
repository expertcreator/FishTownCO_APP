import { ERROR_MESSAGES } from "@/constants"
import type {
  GuestSessionMinter,
  GuestSessionResult,
  SessionStorage
} from "./types"

/**
 * The `401` codes that mean the bearer token itself is dead, rather than that
 * this particular request was refused.
 *
 * Ported from mobile's `sessionExpiry.ts`, which is the only place the
 * distinction has ever been made. Taken from `@/constants` rather than
 * restated — the backend sends these exact strings.
 */
export const SESSION_INVALID_CODES: ReadonlySet<string> = new Set<string>([
  ERROR_MESSAGES.UNAUTHORIZED,
  ERROR_MESSAGES.INVALID_OR_EXPIRED_SESSION
])

/**
 * True when a `401` body's code means the token that was sent is finished and
 * a new one has to be minted.
 *
 * Any other code — a permission failure, a blocked user, a tenant problem —
 * is a refusal of the request, and discarding a working session over it would
 * log the visitor out for a reason that had nothing to do with their session.
 * @param code - The `code` field of the error body, if it had one
 * @returns Whether the token should be treated as expired
 * @example isDeadSessionCode("INVALID_OR_EXPIRED_SESSION") // -> true
 */
export function isDeadSessionCode(code: string | null | undefined): boolean {
  return code != null && SESSION_INVALID_CODES.has(code)
}

/**
 * True when the token that failed was the guest one rather than the user's.
 *
 * This is what keeps recovery proportionate: a dead guest token is repaired by
 * minting another, while a dead user token ends a real signed-in session.
 * Confusing them signs a customer out mid-checkout.
 * @param sent - The bearer token that was actually on the failed request
 * @param guestToken - The guest token currently stored
 * @returns Whether the failure belonged to the guest session
 * @example wasGuestToken("abc", "abc") // -> true
 */
export function wasGuestToken(
  sent: string | null | undefined,
  guestToken: string | null | undefined
): boolean {
  return Boolean(sent && guestToken && sent === guestToken)
}

/**
 * Runs the minter and turns any escape into absence.
 * @param mint - The injected minter
 * @returns The mint response, or `null`
 */
async function mintQuietly(mint: GuestSessionMinter) {
  try {
    return await mint()
  } catch {
    // A minter is documented to report failure as `null`; one that throws
    // anyway must still not take the funnel down with it.
    return null
  }
}

/**
 * Resolves the token this client should be ordering with, minting one only if
 * it holds neither.
 *
 * The precedence is mobile's (`guestService.ts:36`) and the order is the whole
 * point: **a stored user token wins outright**, so a signed-in customer can
 * never have a guest identity minted underneath them and end up placing an
 * order as somebody anonymous.
 *
 * A failed mint answers `unavailable` and writes nothing. Nothing about the
 * funnel is gated on this succeeding — the caller is expected to ignore that
 * status entirely.
 * @param storage - The platform's token persistence
 * @param mint - Performs one mint against the auth service
 * @returns Which token the client now holds, or that it holds none
 * @throws When `storage` throws; a persistence failure is not a mint failure
 * @example await ensureGuestSession(cookieSessionStorage, () => mintGuestSession(deviceId))
 */
export async function ensureGuestSession(
  storage: SessionStorage,
  mint: GuestSessionMinter
): Promise<GuestSessionResult> {
  const user = await storage.read("user")

  if (user) {
    return { status: "active", token: user }
  }

  const guest = await storage.read("guest")

  if (guest) {
    return { status: "active", token: guest }
  }

  const minted = await mintQuietly(mint)

  if (minted === null) {
    return { status: "unavailable" }
  }

  await storage.write("guest", minted.sessionId)

  return { status: "created", token: minted.sessionId }
}

/**
 * Discards the stored guest token and resolves a session again — the repair
 * for a guest token the service has stopped accepting.
 *
 * Ported from mobile's `recoverGuestOnly`, and it keeps that function's one
 * load-bearing property: **it never touches the user token.** Everything
 * mobile does around it — clearing stores, the query cache, the app-icon badge
 * — is app state this website does not have, and is not ported.
 *
 * If a user token turns up, this returns it without minting: the guest half
 * being broken says nothing about the real session.
 * @param storage - The platform's token persistence
 * @param mint - Performs one mint against the auth service
 * @returns Which token the client now holds, or that it holds none
 * @throws When `storage` throws
 * @example await recoverGuestSession(cookieSessionStorage, () => mintGuestSession(deviceId))
 */
export async function recoverGuestSession(
  storage: SessionStorage,
  mint: GuestSessionMinter
): Promise<GuestSessionResult> {
  await storage.clear("guest")

  return await ensureGuestSession(storage, mint)
}
