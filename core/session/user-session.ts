import { ERROR_MESSAGES } from "@/constants"
import {
  type AuthenticatedUser,
  changePasswordRequestSchema,
  changePasswordResponseSchema,
  parseResetOtpVerifiedResponse,
  parseSignupLoginResponse,
  parseUserSessionResponse,
  resendSignupOtpRequestSchema,
  resetPasswordRequestSchema,
  resetRequestSchema,
  type PasswordResetFlow,
  resetVerifyOtpRequestSchema,
  signupLoginRequestSchema,
  type SocialProvider,
  socialSignInRequestSchema,
  verifySignupOtpRequestSchema
} from "./schemas"
import type { SessionStorage } from "./types"

/**
 * The user-auth calls a platform transport must be able to perform.
 *
 * `changePassword` is the one AUTHENTICATED member: its upstream carries an
 * `authenticate` preHandler, so a transport that can perform it must bind the
 * caller's session. A transport that cannot — the anonymous one behind the
 * login modal — simply is never asked for it.
 */
export type UserAuthEndpointKey =
  | "changePassword"
  | "resendSignupOtp"
  | "resetPassword"
  | "resetVerifyEmail"
  | "resetVerifyOtp"
  | "signupLogin"
  | "socialSignIn"
  | "verifySignupOtp"

/**
 * What one transport call came back with.
 *
 * Unlike the guest minter's single `null`, failure here is two distinct
 * things and the modal treats them differently: `denied` is the service
 * answering no (a code the visitor can act on — wrong password, dead OTP),
 * while `unreachable` is the service not answering at all (retry later).
 * Collapsing them would leave the visitor retrying a password that will
 * never work, or blaming their password for an outage.
 */
export type UserAuthTransportResult =
  | { readonly kind: "ok"; readonly body: unknown }
  | {
      readonly kind: "denied"
      readonly status: number
      readonly code: string | null
    }
  | { readonly kind: "unreachable" }

/**
 * Performs one user-auth call with the platform's own HTTP client bound —
 * web: a server-side fetch behind a Route Handler; mobile (later): ky.
 * @param endpoint - Which of the four calls to perform
 * @param body - The request body, already schema-parsed
 * @returns The transport's classification of what happened
 */
export type UserAuthTransport = (
  endpoint: UserAuthEndpointKey,
  body: unknown
) => Promise<UserAuthTransportResult>

/**
 * The stable, platform-facing failure vocabulary. Screens map these to copy;
 * the backend's own code strings stay behind this function so a backend
 * rename is one edit here rather than one per screen per platform.
 */
export type AuthFailureCode =
  | "already-exists"
  | "auth-failed"
  | "blocked"
  | "expired-otp"
  | "invalid-otp"
  | "invalid-password"
  | "otp-cooldown"
  | "reset-expired"
  | "signup-expired"
  | "social-only"
  | "social-rejected"
  | "user-not-found"

/** What one auth attempt produced. */
export type UserAuthResult =
  | {
      readonly status: "authenticated"
      readonly user: AuthenticatedUser | null
    }
  | { readonly status: "otp-required" }
  | { readonly status: "failed"; readonly code: AuthFailureCode }
  | { readonly status: "unavailable" }

/** What one resend attempt produced. Resending never establishes a session. */
export type ResendOtpResult =
  | { readonly status: "sent" }
  | { readonly status: "failed"; readonly code: AuthFailureCode }
  | { readonly status: "unavailable" }

/** The one status the backend reuses `INVALID_PASSWORD` on for a different meaning. */
const HTTP_BAD_REQUEST = 400

/**
 * Maps one denied call to the stable failure vocabulary.
 *
 * The interesting row is `INVALID_PASSWORD`, which the backend sends for two
 * different situations distinguished only by status (measured,
 * `customers.controllers.ts`): a `400` means the account has no usable
 * password at all — `passwordHash` is `"!social!"`, so the fix is "sign in
 * with Google/Apple" — while a `401` means the password sent was wrong.
 * @param status - The HTTP status of the denial
 * @param code - The `code` field of the error body, if it had one
 * @returns The stable failure code a screen can map to copy
 * @example classifyAuthDenial(400, "INVALID_PASSWORD") // -> "social-only"
 */
export function classifyAuthDenial(
  status: number,
  code: string | null | undefined
): AuthFailureCode {
  switch (code) {
    case ERROR_MESSAGES.INVALID_PASSWORD:
      return status === HTTP_BAD_REQUEST ? "social-only" : "invalid-password"
    case ERROR_MESSAGES.USER_BLOCKED:
      return "blocked"
    case ERROR_MESSAGES.INVALID_OTP:
      return "invalid-otp"
    case ERROR_MESSAGES.EXPIRED_OTP:
    case ERROR_MESSAGES.OTP_EXPIRED:
      return "expired-otp"
    case ERROR_MESSAGES.SIGNUP_SESSION_EXPIRED:
      return "signup-expired"
    case ERROR_MESSAGES.USER_ALREADY_EXISTS:
      return "already-exists"
    case ERROR_MESSAGES.PLEASE_TRY_AGAIN_IN_30_SECONDS:
    case ERROR_MESSAGES.RATE_LIMIT_EXCEEDED:
      return "otp-cooldown"
    case ERROR_MESSAGES.UNAUTHORIZED:
      return "social-rejected"
    case ERROR_MESSAGES.USER_NOT_FOUND:
      return "user-not-found"
    case ERROR_MESSAGES.INVALID_OR_EXPIRED_SESSION:
      return "reset-expired"
    default:
      return "auth-failed"
  }
}

/**
 * Persists a freshly established user session: the user token first, then
 * the guest token cleared. That order is load-bearing — if the clear throws
 * after the write, the visitor still holds their new session and the stale
 * guest token is dead weight; cleared-then-failed-to-write would leave them
 * with no session at all.
 * @param storage - The platform's token persistence
 * @param sessionId - The session the service just established
 */
async function persistUserSession(
  storage: SessionStorage,
  sessionId: string
): Promise<void> {
  await storage.write("user", sessionId)

  try {
    await storage.clear("guest")
  } catch {
    // The session IS established; a clear that fails leaves a stale guest
    // token that is inert (the user token wins every read). Letting this
    // throw would turn a successful login into a 503 in the visitor's face.
  }
}

/**
 * Runs one session-establishing call and folds its answer into a result.
 * @param storage - The platform's token persistence
 * @param transport - The platform's user-auth transport
 * @param endpoint - Which call to perform
 * @param body - The parsed request body
 * @returns The auth result
 */
async function establishSession(
  storage: SessionStorage,
  transport: UserAuthTransport,
  endpoint: UserAuthEndpointKey,
  body: unknown
): Promise<UserAuthResult> {
  const answer = await transport(endpoint, body)

  if (answer.kind === "unreachable") {
    return { status: "unavailable" }
  }

  if (answer.kind === "denied") {
    return {
      code: classifyAuthDenial(answer.status, answer.code),
      status: "failed"
    }
  }

  const parsed = parseUserSessionResponse(answer.body)

  if (parsed === null) {
    // A 2xx carrying no credential is contract drift, which is an outage as
    // far as the visitor is concerned — not a password problem.
    return { status: "unavailable" }
  }

  await persistUserSession(storage, parsed.sessionId)

  return { status: "authenticated", user: parsed.user ?? null }
}

/** Email+password credentials, exactly mobile's two fields. */
export interface EmailCredentials {
  /** The email as typed; the request schema trims and lowercases it. */
  readonly email: string
  /** The password as typed. Minimum 8, mobile's floor. */
  readonly password: string
}

/**
 * The unified email+password entry, mobile's `signupLogin` ported: the
 * backend decides login vs signup. The stored guest token rides along as
 * `guestSessionId` so a signup converts the guest row — its cart, its
 * device continuity — instead of orphaning it.
 *
 * On an established session the user token is written and the guest token
 * cleared, in that order (see {@link persistUserSession}).
 * @param storage - The platform's token persistence
 * @param transport - The platform's user-auth transport
 * @param credentials - The visitor's email and password
 * @returns Authenticated, OTP-required (new email), failed, or unavailable
 * @throws When `storage` throws, or `credentials` violate the request schema
 * @example await loginWithEmail(cookieSessionStorage, authTransport, { email, password })
 */
export async function loginWithEmail(
  storage: SessionStorage,
  transport: UserAuthTransport,
  credentials: EmailCredentials
): Promise<UserAuthResult> {
  const guest = await storage.read("guest")
  const body = signupLoginRequestSchema.parse({
    email: credentials.email,
    password: credentials.password,
    role: "customer",
    // Spread, not `?? undefined`: zod keeps an explicitly-undefined optional
    // key in its output, and the contract is that an absent guest sends no
    // key at all.
    ...(guest === null ? {} : { guestSessionId: guest })
  })
  const answer = await transport("signupLogin", body)

  if (answer.kind === "unreachable") {
    return { status: "unavailable" }
  }

  if (answer.kind === "denied") {
    return {
      code: classifyAuthDenial(answer.status, answer.code),
      status: "failed"
    }
  }

  const parsed = parseSignupLoginResponse(answer.body)

  if (parsed === null) {
    return { status: "unavailable" }
  }

  if (!("sessionId" in parsed)) {
    return { status: "otp-required" }
  }

  await persistUserSession(storage, parsed.sessionId)

  return { status: "authenticated", user: parsed.user ?? null }
}

/**
 * Proves the inbox and finishes the signup that `loginWithEmail` started.
 * No `guestSessionId` here: the backend captured the guest at signup-login
 * time and holds it in the Redis signup session.
 * @param storage - The platform's token persistence
 * @param transport - The platform's user-auth transport
 * @param submission - The email under verification and the six-digit code
 * @param submission.email - The email under verification
 * @param submission.otp - The six-digit code from the inbox
 * @returns Authenticated, failed (wrong/expired code), or unavailable
 * @throws When `storage` throws, or the submission violates the request schema
 * @example await verifySignupOtp(cookieSessionStorage, authTransport, { email, otp: "123456" })
 */
export async function verifySignupOtp(
  storage: SessionStorage,
  transport: UserAuthTransport,
  submission: { readonly email: string; readonly otp: string }
): Promise<UserAuthResult> {
  const body = verifySignupOtpRequestSchema.parse(submission)

  return await establishSession(storage, transport, "verifySignupOtp", body)
}

/**
 * Asks for the signup OTP again. Pure request/answer — nothing is persisted,
 * because nothing was established.
 * @param transport - The platform's user-auth transport
 * @param email - The email whose signup session should get a fresh code
 * @returns Sent, failed (cooldown, expired session), or unavailable
 * @throws When `email` violates the request schema
 * @example await resendSignupOtp(authTransport, "a@b.c")
 */
export async function resendSignupOtp(
  transport: UserAuthTransport,
  email: string
): Promise<ResendOtpResult> {
  const body = resendSignupOtpRequestSchema.parse({ email })
  const answer = await transport("resendSignupOtp", body)

  if (answer.kind === "unreachable") {
    return { status: "unavailable" }
  }

  if (answer.kind === "denied") {
    return {
      code: classifyAuthDenial(answer.status, answer.code),
      status: "failed"
    }
  }

  return { status: "sent" }
}

/**
 * Google/Apple sign-in, mobile's `socialSignIn` ported: the provider's id
 * token goes to the backend, which verifies it against its configured
 * audiences and answers a session. The guest token rides along for the
 * new-account case, where the backend merges and deletes the guest user.
 * @param storage - The platform's token persistence
 * @param transport - The platform's user-auth transport
 * @param signIn - The provider and its identity token
 * @param signIn.provider - `"google"` or `"apple"`; there is no Facebook
 * @param signIn.idToken - The provider's identity token, verbatim
 * @returns Authenticated, failed (token rejected), or unavailable
 * @throws When `storage` throws, or the token violates the request schema
 * @example await socialSignIn(cookieSessionStorage, authTransport, { provider: "google", idToken })
 */
export async function socialSignIn(
  storage: SessionStorage,
  transport: UserAuthTransport,
  signIn: { readonly provider: SocialProvider; readonly idToken: string }
): Promise<UserAuthResult> {
  const guest = await storage.read("guest")
  const body = socialSignInRequestSchema.parse({
    idToken: signIn.idToken,
    provider: signIn.provider,
    role: "customer",
    ...(guest === null ? {} : { guestSessionId: guest })
  })

  return await establishSession(storage, transport, "socialSignIn", body)
}

/** What one password-reset confirmation produced. Never a session. */
export type PasswordResetResult =
  | { readonly status: "reset" }
  | { readonly status: "failed"; readonly code: AuthFailureCode }
  | { readonly status: "unavailable" }

/**
 * Starts (or re-starts) the forgot-password flow — mobile's step 1 and its
 * resend, which the backend implements as the same OTP generation with the
 * same cooldown. Nothing is persisted; nothing is established.
 * @param transport - The platform's user-auth transport
 * @param email - The account email, as typed
 * @returns Sent, failed (unknown email, cooldown), or unavailable
 * @throws When `email` violates the request schema
 * @example await requestPasswordReset(authTransport, "a@b.co")
 */
export async function requestPasswordReset(
  transport: UserAuthTransport,
  email: string
): Promise<ResendOtpResult> {
  const body = resetRequestSchema.parse({ email, role: "customer" })
  const answer = await transport("resetVerifyEmail", body)

  if (answer.kind === "unreachable") {
    return { status: "unavailable" }
  }

  if (answer.kind === "denied") {
    return {
      code: classifyAuthDenial(answer.status, answer.code),
      status: "failed"
    }
  }

  return { status: "sent" }
}

/**
 * Finishes the forgot-password flow: mobile's steps 2 and 3 in one call.
 * The OTP is verified for the reset token, and the token is spent on the
 * new password immediately — so on the web the token lives for microseconds
 * inside a Route Handler and never reaches the browser at all, where mobile
 * carries it between two screens.
 *
 * No session is established: the visitor logs in with the new password,
 * which is mobile's flow too.
 * @param transport - The platform's user-auth transport
 * @param submission - The email under reset, the code and the new password
 * @param submission.email - The email under reset
 * @param submission.otp - The six-digit code from the inbox
 * @param submission.password - The new password; minimum 8, mobile's floor
 * @param submission.flow - Which journey this is; defaults to `"reset-password"`
 * @returns Reset, failed (wrong/expired code, expired token), or unavailable
 * @throws When the submission violates the request schemas
 * @example await confirmPasswordReset(authTransport, { email, otp, password })
 */
export async function confirmPasswordReset(
  transport: UserAuthTransport,
  submission: {
    readonly email: string
    readonly otp: string
    readonly password: string
    readonly flow?: PasswordResetFlow
  }
): Promise<PasswordResetResult> {
  const verifyBody = resetVerifyOtpRequestSchema.parse({
    email: submission.email,
    otp: submission.otp,
    role: "customer"
  })
  // The password is validated BEFORE step 2 runs: the verify call spends the
  // OTP, and an under-length password discovered after it would strand the
  // visitor with a used code and no reset.
  const password = resetPasswordRequestSchema.shape.password.parse(
    submission.password
  )
  const verifyAnswer = await transport("resetVerifyOtp", verifyBody)

  if (verifyAnswer.kind === "unreachable") {
    return { status: "unavailable" }
  }

  if (verifyAnswer.kind === "denied") {
    return {
      code: classifyAuthDenial(verifyAnswer.status, verifyAnswer.code),
      status: "failed"
    }
  }

  const verified = parseResetOtpVerifiedResponse(verifyAnswer.body)

  if (verified === null) {
    // A 2xx carrying no reset token is contract drift — an outage as far as
    // the visitor is concerned, not a code problem.
    return { status: "unavailable" }
  }

  const resetBody = resetPasswordRequestSchema.parse({
    flow: submission.flow ?? "reset-password",
    password,
    sessionId: verified.sessionId
  })
  const answer = await transport("resetPassword", resetBody)

  if (answer.kind === "unreachable") {
    return { status: "unavailable" }
  }

  if (answer.kind === "denied") {
    return {
      code: classifyAuthDenial(answer.status, answer.code),
      status: "failed"
    }
  }

  return { status: "reset" }
}

/**
 * What one change-password attempt produced.
 *
 * `wrong-password` and `session-dead` are the whole reason this union exists.
 * The upstream answers `401` for both — a mistyped current password and a
 * bearer the `authenticate` preHandler rejected — and they are told apart by
 * the body's `code` and by nothing else. Collapsed into one outcome, a typo
 * signs the customer out of the page they are standing on.
 */
export type ChangePasswordResult =
  | { readonly status: "changed" }
  | { readonly status: "wrong-password" }
  | { readonly status: "session-dead" }
  | { readonly status: "failed"; readonly code: AuthFailureCode }
  | { readonly status: "unavailable" }

/**
 * Changes the password of the account the transport's session belongs to.
 *
 * **The transport must be an authenticated one.** Unlike every other call in
 * this module the upstream carries an `authenticate` preHandler, so the
 * platform binds the caller's bearer behind {@link UserAuthTransport} rather
 * than passing a credential through this signature.
 *
 * No session is destroyed and none is established: `changePasswordController`
 * revokes nothing, so a customer who changes their password stays signed in
 * — which is the opposite of the reset flow and is measured, not assumed.
 *
 * A social account reaches `wrong-password` too, and correctly: its stored
 * hash is the sentinel `"!social!"`, so the friendly `400` the controller
 * writes for a null hash is unreachable and the real answer is a `401`
 * `INVALID_PASSWORD` from the hash comparison. The caller's copy is what
 * offers such an account the set-password path instead.
 * @param transport - An AUTHENTICATED user-auth transport
 * @param submission - The current password and the replacement
 * @param submission.oldPassword - The password the account has now
 * @param submission.newPassword - The replacement; minimum 8, mobile's floor
 * @returns Changed, wrong-password, session-dead, failed, or unavailable
 * @throws When `newPassword` is shorter than the floor
 * @example await changePassword(transport, { oldPassword: "a", newPassword: "12345678" })
 */
export async function changePassword(
  transport: UserAuthTransport,
  submission: {
    readonly oldPassword: string
    readonly newPassword: string
  }
): Promise<ChangePasswordResult> {
  const body = changePasswordRequestSchema.parse(submission)
  const answer = await transport("changePassword", body)

  if (answer.kind === "unreachable") {
    return { status: "unavailable" }
  }

  if (answer.kind === "ok") {
    // A 2xx that does not carry `success: true` is contract drift, and
    // reporting it as a change that happened would leave the customer signing
    // in with a password the service never stored. Every sibling in this
    // module parses its 2xx for the same reason.
    return changePasswordResponseSchema.safeParse(answer.body).success
      ? { status: "changed" }
      : { status: "unavailable" }
  }

  if (answer.code === ERROR_MESSAGES.UNAUTHORIZED) {
    // The bearer itself was refused. The ONLY branch that ends the session.
    return { status: "session-dead" }
  }

  if (
    answer.code === ERROR_MESSAGES.INVALID_PASSWORD ||
    answer.status === HTTP_BAD_REQUEST
  ) {
    // The two ways the service says "that is not your password": the hash
    // comparison's 401 `INVALID_PASSWORD`, and the 400 its own `min(8)` on
    // `oldPassword` produces (the social-login 400 is unreachable but lands
    // here too). NOT a catch-all — a 404, a 429 or a 503 mean something else
    // entirely, and telling a rate-limited customer their password is wrong
    // sends them to reset a password that was correct.
    return { status: "wrong-password" }
  }

  return {
    code: classifyAuthDenial(answer.status, answer.code),
    status: "failed"
  }
}
