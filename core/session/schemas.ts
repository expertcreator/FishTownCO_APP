import { SUCCESS_MESSAGES } from "@/constants"
import { z } from "zod"
import { MIN_PASSWORD_LENGTH, OTP_PATTERN } from "./credential-rules"

/**
 * The mint request body.
 *
 * `deviceId` is optional because the service treats it as optional: without
 * one it always creates a fresh guest user, with one it restores the guest
 * that already owns that device. `role` is fixed — this domain mints ordering
 * customers, and a rider identity is a different app with a different flow.
 * @example guestSessionRequestSchema.parse({ deviceId: "web-…", role: "customer" })
 */
export const guestSessionRequestSchema = z.object({
  deviceId: z.string().min(1).optional(),
  role: z.literal("customer")
})

/** A mint request body. */
export type GuestSessionRequest = z.infer<typeof guestSessionRequestSchema>

/**
 * The two codes a successful mint answers with: `GUEST_USER_CREATED` (`201`,
 * a new row) and `GUEST_SESSION_RESTORED` (`200`, the same `deviceId` came
 * back). Taken from `@/constants` rather than restated, because those strings
 * are the backend's own and the 5-backend pin is what keeps them in step.
 */
export const guestSessionCodeSchema = z.enum([
  SUCCESS_MESSAGES.GUEST_USER_CREATED,
  SUCCESS_MESSAGES.GUEST_SESSION_RESTORED
])

/**
 * The mint response.
 *
 * `success` is pinned to `true` and `sessionId` to a non-empty string, so a
 * `200` carrying neither — the contract-drift case — fails to parse and is
 * handled as the failure it is rather than persisted as an empty credential.
 *
 * `isGuest` and `user` are optional even though the service always sends them:
 * this domain reads neither today, and making a field we do not use required
 * would turn a harmless upstream change into a dead funnel. `user` is still
 * described rather than dropped, because the login modal (`mw-2-4`) is the
 * next reader of it.
 */
export const guestSessionResponseSchema = z.object({
  code: guestSessionCodeSchema,
  isGuest: z.boolean().optional(),
  message: z.string().optional(),
  sessionId: z.string().min(1),
  success: z.literal(true),
  user: z
    .object({
      email: z.string().nullable().optional(),
      id: z.string(),
      tenantId: z.string().nullable().optional(),
      type: z.string().optional()
    })
    .optional(),
  userId: z.string().min(1)
})

/** A parsed mint response. */
export type GuestSessionResponse = z.infer<typeof guestSessionResponseSchema>

/**
 * Parses a mint response, reporting drift as absence.
 *
 * A service boundary is parsed, not trusted, and every way this call can be
 * wrong — `success: false`, a missing or empty `sessionId`, an unknown `code`,
 * a body that is not an object at all — has the same consequence for the
 * caller: there is no session to store. One `null` says that, so the caller
 * needs no error taxonomy for cases it would treat identically.
 * @param value - The decoded response body
 * @returns The parsed response, or `null` when the body is not a successful mint
 * @example parseGuestSessionResponse({ success: false }) // -> null
 */
export function parseGuestSessionResponse(
  value: unknown
): GuestSessionResponse | null {
  const parsed = guestSessionResponseSchema.safeParse(value)

  return parsed.success ? parsed.data : null
}

/**
 * One email, normalised exactly as mobile's `authSchema.ts` and the backend's
 * `NormalizedEmailSchema` normalise it: trimmed, lowercased, format-checked.
 * Normalising in the schema rather than in each caller is what keeps the
 * web and a later mobile retrofit sending byte-identical emails, which is
 * what the backend's `lower(email)` lookup and its Redis `signup:{email}`
 * keys silently depend on.
 */
const authEmailSchema = z.string().trim().toLowerCase().email()

/**
 * The `users/signup-login` request body — mobile's exact fields
 * (`SignupLogin.tsx`): the backend decides login vs signup from whether the
 * email exists. `guestSessionId` is the stored guest token; the service reads
 * it only when the call turns out to be a signup, where it marks the guest
 * row for conversion.
 * @example signupLoginRequestSchema.parse({ email: "A@b.c ", password: "12345678", role: "customer" })
 */
export const signupLoginRequestSchema = z.object({
  email: authEmailSchema,
  guestSessionId: z.string().min(1).optional(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
  role: z.literal("customer")
})

/** A signup-login request body. */
export type SignupLoginRequest = z.infer<typeof signupLoginRequestSchema>

/**
 * The `users/signup-verify-otp` request body. No `guestSessionId`: the
 * backend captured the guest at signup-login time and holds it in the Redis
 * signup session, so the verify call carries only what proves the inbox.
 */
export const verifySignupOtpRequestSchema = z.object({
  email: authEmailSchema,
  otp: z.string().regex(OTP_PATTERN)
})

/** A signup OTP verification request body. */
export type VerifySignupOtpRequest = z.infer<
  typeof verifySignupOtpRequestSchema
>

/** The `users/resend-signup-otp` request body. */
export const resendSignupOtpRequestSchema = z.object({
  email: authEmailSchema
})

/** A resend-OTP request body. */
export type ResendSignupOtpRequest = z.infer<
  typeof resendSignupOtpRequestSchema
>

/**
 * The `users/social-signin` request body. Both providers send the same shape;
 * `idToken` is the provider's identity token, verified server-side against
 * the configured audiences. `min(10)` mirrors the backend's own floor.
 */
export const socialSignInRequestSchema = z.object({
  guestSessionId: z.string().min(1).optional(),
  idToken: z.string().min(10),
  provider: z.enum(["google", "apple"]),
  role: z.literal("customer")
})

/** A social sign-in request body. */
export type SocialSignInRequest = z.infer<typeof socialSignInRequestSchema>

/** The two social providers the backend verifies. There is no Facebook. */
export type SocialProvider = SocialSignInRequest["provider"]

/**
 * The user summary a successful auth call carries. Only `id` is pinned:
 * every other field is display data whose absence must not fail a login that
 * already produced a session.
 */
export const authenticatedUserSchema = z.object({
  email: z.string().nullable().optional(),
  id: z.string(),
  locale: z.string().optional(),
  name: z.string().nullable().optional(),
  tenantId: z.string().nullable().optional(),
  type: z.string().optional()
})

/** The parsed user summary. */
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>

/**
 * A response that established a session: existing-user login
 * (`LOGIN_SUCCESS`), OTP verification (`ACCOUNT_CREATED` /
 * `GUEST_ACCOUNT_CONVERTED`) and social sign-in all answer this shape.
 * `user` is optional for the same reason the guest schema's is: this domain
 * can finish its job — persist the credential — without it.
 */
export const userSessionResponseSchema = z.object({
  code: z.string(),
  message: z.string().optional(),
  sessionId: z.string().min(1),
  success: z.literal(true),
  user: authenticatedUserSchema.optional()
})

/** A parsed session-establishing auth response. */
export type UserSessionResponse = z.infer<typeof userSessionResponseSchema>

/**
 * A signup-login answer that started a signup instead of a login: the OTP is
 * in the visitor's inbox and nothing was established yet.
 *
 * The backend's dev mode adds an `otp` field to this body. It is deliberately
 * NOT declared here: zod strips undeclared keys, so parsing is what removes
 * it, and no handler downstream can forward what the parse already dropped.
 */
export const otpRequiredResponseSchema = z.object({
  code: z.literal(SUCCESS_MESSAGES.OTP_GENERATED),
  message: z.string().optional(),
  success: z.literal(true)
})

/** A parsed OTP-required response. */
export type OtpRequiredResponse = z.infer<typeof otpRequiredResponseSchema>

/**
 * The signup-login union: the backend decides which of the two flows this
 * call was, and the union's order tries the session-establishing shape first
 * because it is the one carrying a credential to pin.
 */
export const signupLoginResponseSchema = z.union([
  userSessionResponseSchema,
  otpRequiredResponseSchema
])

/** A parsed signup-login response, either flow. */
export type SignupLoginResponse = z.infer<typeof signupLoginResponseSchema>

/**
 * Parses a session-establishing auth response, reporting drift as absence —
 * same posture as {@link parseGuestSessionResponse}.
 * @param value - The decoded response body
 * @returns The parsed response, or `null` when the body carries no session
 * @example parseUserSessionResponse({ success: false }) // -> null
 */
export function parseUserSessionResponse(
  value: unknown
): UserSessionResponse | null {
  const parsed = userSessionResponseSchema.safeParse(value)

  return parsed.success ? parsed.data : null
}

/**
 * Parses a signup-login response, either flow, reporting drift as absence.
 * @param value - The decoded response body
 * @returns The parsed response, or `null` when it is neither flow
 * @example parseSignupLoginResponse({ success: true, code: "OTP_GENERATED" })
 */
export function parseSignupLoginResponse(
  value: unknown
): SignupLoginResponse | null {
  const parsed = signupLoginResponseSchema.safeParse(value)

  return parsed.success ? parsed.data : null
}

/**
 * The `users/reset-password/verify-email` request body — mobile's forgot
 * password step 1. `role` disambiguates customer vs rider accounts sharing
 * an email, exactly as `signupLoginRequestSchema` sends it.
 */
export const resetRequestSchema = z.object({
  email: authEmailSchema,
  role: z.literal("customer")
})

/** A password-reset request body. */
export type ResetRequest = z.infer<typeof resetRequestSchema>

/** The `users/reset-password/verify-otp` request body — step 2. */
export const resetVerifyOtpRequestSchema = z.object({
  email: authEmailSchema,
  otp: z.string().regex(OTP_PATTERN),
  role: z.literal("customer")
})

/** A reset-OTP verification request body. */
export type ResetVerifyOtpRequest = z.infer<typeof resetVerifyOtpRequestSchema>

/**
 * The two things the same three endpoints can be doing, and the ONLY thing
 * `flow` changes upstream: which confirmation email is sent
 * (`password.controllers.ts:370-377`). Everything else — the OTP, the reset
 * token, the session destruction — is identical.
 *
 * `set-password` exists because a social account's `passwordHash` is the
 * sentinel `"!social!"` rather than `NULL`, so forgot-password's social guard
 * never fires and the OTP sends normally. Giving such an account its first
 * password therefore needs no backend work at all, only the honest wording.
 */
export const PASSWORD_RESET_FLOWS = ["reset-password", "set-password"] as const

/** Which of the two password-set journeys a reset call belongs to. */
export type PasswordResetFlow = (typeof PASSWORD_RESET_FLOWS)[number]

/**
 * The `users/reset-password` request body — step 3. `sessionId` is the
 * short-lived reset token step 2 answered, never a login session; `flow` is
 * the backend's own discriminator, whose upstream declaration is
 * `z.enum(["reset-password","set-password"]).optional()` — mirrored here as an
 * enum that DEFAULTS to the reset journey, so every existing caller keeps
 * sending exactly what it sent before without naming the field.
 */
export const resetPasswordRequestSchema = z.object({
  flow: z.enum(PASSWORD_RESET_FLOWS).default("reset-password"),
  password: z.string().min(MIN_PASSWORD_LENGTH),
  sessionId: z.string().min(1)
})

/** A reset-password request body. */
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>

/**
 * The `users/change-password` request body, mirroring the auth service's
 * `ChangePasswordSchema` (`shared/validation/auth.schema.ts:71-74`).
 *
 * `oldPassword` carries `.min(1)` where the upstream states `.min(8)`,
 * deliberately: the upstream's own floor makes a short old password a `400`,
 * and a `400` and a `401` here mean the same thing to the customer — the
 * password they typed is not their password. Refusing it locally would only
 * change which of two identical messages they read.
 */
export const changePasswordRequestSchema = z.object({
  newPassword: z.string().min(MIN_PASSWORD_LENGTH),
  oldPassword: z.string().min(1)
})

/** A change-password request body. */
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>

/**
 * What `users/change-password` answers on success — `SuccessResponseSchema`,
 * narrowed to the one field a caller acts on. Nothing else in the body is
 * read, and nothing in it may reach a browser.
 */
export const changePasswordResponseSchema = z.object({
  success: z.literal(true)
})

/** A parsed change-password response. */
export type ChangePasswordResponse = z.infer<
  typeof changePasswordResponseSchema
>

/**
 * Step 2's answer: the reset token that authorises step 3. The backend's
 * dev-mode `otp` echo on step 1 is NOT declared anywhere, so zod strips it
 * before any handler can forward it — the signup flow's exact rule.
 */
export const resetOtpVerifiedResponseSchema = z.object({
  sessionId: z.string().min(1),
  success: z.literal(true)
})

/** A parsed reset-OTP verification response. */
export type ResetOtpVerifiedResponse = z.infer<
  typeof resetOtpVerifiedResponseSchema
>

/**
 * Parses step 2's answer, reporting drift as absence.
 * @param value - The decoded response body
 * @returns The parsed response, or `null` when it carries no reset token
 * @example parseResetOtpVerifiedResponse({ success: true, sessionId: "r1" })
 */
export function parseResetOtpVerifiedResponse(
  value: unknown
): ResetOtpVerifiedResponse | null {
  const parsed = resetOtpVerifiedResponseSchema.safeParse(value)

  return parsed.success ? parsed.data : null
}
