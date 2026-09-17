import type { GuestSessionResponse } from "./schemas"

/**
 * Which of the two tokens a client can hold.
 *
 * They are separate on purpose: a guest token is the anonymous ordering
 * identity and a user token is the real one, and a guest-token failure must
 * never be recoverable by discarding a still-valid user session (mobile's
 * `recoverGuestOnly` exists for exactly that reason).
 */
export type SessionTokenKind = "guest" | "user"

/**
 * The persistence seam for session tokens — the one thing about a session that
 * is platform-shaped.
 *
 * Web implements it over two httpOnly cookies; mobile will implement it over
 * Expo SecureStore. Every method is async because both of those are: Next's
 * `cookies()` is awaited and SecureStore is a native bridge call. Core never
 * imports either.
 *
 * An implementation may throw — a cookie write after the response has been
 * sent, a locked keystore. Callers decide what a throw means; nothing here
 * swallows it.
 */
export interface SessionStorage {
  /**
   * Reads one token.
   * @param kind - Which token to read
   * @returns The token, or `null` when none is stored
   */
  read(kind: SessionTokenKind): Promise<string | null>

  /**
   * Persists one token, replacing whatever was there.
   * @param kind - Which token to write
   * @param token - The token value; never empty
   * @returns Nothing
   */
  write(kind: SessionTokenKind, token: string): Promise<void>

  /**
   * Removes one token. Removing an absent token is not an error.
   * @param kind - Which token to clear
   * @returns Nothing
   */
  clear(kind: SessionTokenKind): Promise<void>
}

/**
 * Performs one mint against the auth service, with the platform's own HTTP
 * client, headers and device id already bound.
 *
 * It reports failure as `null` rather than by throwing, because a failed mint
 * is a non-event for the funnel: browsing, add-to-cart and `/cart` behave
 * identically without a session. {@link ensureGuestSession} still guards
 * against a throw, so an implementation that leaks one cannot break the funnel
 * either.
 * @returns The parsed mint response, or `null` when the call or its parsing failed
 */
export type GuestSessionMinter = () => Promise<GuestSessionResponse | null>

/**
 * What {@link ensureGuestSession} decided.
 *
 * - `active` — a token was already stored; nothing was called.
 * - `created` — the service minted one and it has been persisted.
 * - `unavailable` — the mint failed. Nothing was persisted and the caller
 *   carries on without a session.
 *
 * The token is deliberately absent from `unavailable` rather than nullable, so
 * a caller cannot read one that does not exist.
 */
export type GuestSessionResult =
  | { readonly status: "active"; readonly token: string }
  | { readonly status: "created"; readonly token: string }
  | { readonly status: "unavailable" }
