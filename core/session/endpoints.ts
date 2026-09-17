import {
  changePasswordRequestSchema,
  changePasswordResponseSchema,
  guestSessionRequestSchema,
  guestSessionResponseSchema,
  otpRequiredResponseSchema,
  resendSignupOtpRequestSchema,
  resetOtpVerifiedResponseSchema,
  resetPasswordRequestSchema,
  resetRequestSchema,
  resetVerifyOtpRequestSchema,
  signupLoginRequestSchema,
  signupLoginResponseSchema,
  socialSignInRequestSchema,
  userSessionResponseSchema,
  verifySignupOtpRequestSchema
} from "./schemas"

/**
 * Auth-service paths, relative to the service root and with **no leading
 * slash** — the same shape as `CATALOG_ENDPOINTS`.
 *
 * The gateway segment (`auth/api/v1`) is deliberately absent. `api.fishtownco.itoasis.co`
 * routes by leading path segment, so the real address is
 * `{host}/auth/api/v1/users/guest`; the backend owner's 2026-08-21 ruling is
 * that the segment is *config, not contract*, so it belongs in the app's
 * transport beside `GATEWAY_PREFIX` rather than in this shared package.
 * Probing `GET {host}/auth/api/v1/users/guest` answers
 * `Route GET:/api/v1/users/guest not found`, which is the gateway proving it
 * strips that first segment before the service sees the path.
 *
 * Definitions only. Nothing here fetches. None of the user-auth routes carry
 * a service token either — like `createGuest`, they have no
 * `verifyPublicApiKey` in front of them.
 */
export const SESSION_ENDPOINTS = {
  /**
   * Creates a guest user, or restores the one that already owns `deviceId`.
   *
   * It carries **no** service token: unlike the public catalog reads, this
   * route has no `verifyPublicApiKey` in front of it, so sending
   * `PUBLIC_API_KEY` here would be cargo-culted from the wrong domain.
   */
  createGuest: {
    method: "POST",
    /**
     * Builds the guest-mint path.
     * @returns The `users/guest` path
     */
    path: () => "users/guest",
    request: guestSessionRequestSchema,
    response: guestSessionResponseSchema
  },
  /** Re-sends the signup OTP for an email whose signup session is still live. */
  resendSignupOtp: {
    method: "POST",
    /**
     * Builds the resend-OTP path.
     * @returns The `users/resend-signup-otp` path
     */
    path: () => "users/resend-signup-otp",
    request: resendSignupOtpRequestSchema,
    response: otpRequiredResponseSchema
  },
  /**
   * The unified email+password entry: the backend answers a session for an
   * existing account and an OTP challenge for a new one.
   */
  signupLogin: {
    method: "POST",
    /**
     * Builds the signup-login path.
     * @returns The `users/signup-login` path
     */
    path: () => "users/signup-login",
    request: signupLoginRequestSchema,
    response: signupLoginResponseSchema
  },
  /** Google/Apple sign-in: one provider id token in, one session out. */
  socialSignIn: {
    method: "POST",
    /**
     * Builds the social sign-in path.
     * @returns The `users/social-signin` path
     */
    path: () => "users/social-signin",
    request: socialSignInRequestSchema,
    response: userSessionResponseSchema
  },
  /** Proves the inbox and creates (or converts the guest into) the account. */
  verifySignupOtp: {
    method: "POST",
    /**
     * Builds the OTP-verification path.
     * @returns The `users/signup-verify-otp` path
     */
    path: () => "users/signup-verify-otp",
    request: verifySignupOtpRequestSchema,
    response: userSessionResponseSchema
  },
  /**
   * Changes the password of the account whose bearer token is on the call.
   *
   * The one endpoint in this map that is AUTHENTICATED: `authenticate` is its
   * `preHandler` (`password.routes.ts:78`), so the platform transport behind
   * it must carry the caller's session, where every other path here is
   * anonymous by construction.
   */
  changePassword: {
    method: "POST",
    /**
     * Builds the change-password path.
     * @returns The `users/change-password` path
     */
    path: () => "users/change-password",
    request: changePasswordRequestSchema,
    response: changePasswordResponseSchema
  },
  /** Step 3 of the forgot-password flow: spends the reset token on a new password. */
  resetPassword: {
    method: "POST",
    /**
     * Builds the reset-password path.
     * @returns The `users/reset-password` path
     */
    path: () => "users/reset-password",
    request: resetPasswordRequestSchema,
    response: resetOtpVerifiedResponseSchema
  },
  /** Step 1 of the forgot-password flow: sends the reset OTP (and re-sends it). */
  resetVerifyEmail: {
    method: "POST",
    /**
     * Builds the reset-request path.
     * @returns The `users/reset-password/verify-email` path
     */
    path: () => "users/reset-password/verify-email",
    request: resetRequestSchema,
    response: otpRequiredResponseSchema
  },
  /** Step 2 of the forgot-password flow: trades the OTP for the reset token. */
  resetVerifyOtp: {
    method: "POST",
    /**
     * Builds the reset-OTP verification path.
     * @returns The `users/reset-password/verify-otp` path
     */
    path: () => "users/reset-password/verify-otp",
    request: resetVerifyOtpRequestSchema,
    response: resetOtpVerifiedResponseSchema
  }
} as const
