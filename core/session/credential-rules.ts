import { z } from "zod"

/**
 * The credential field rules every Fishtownco auth surface enforces — the two
 * limits, the two form field schemas, the four `t`-injected form-schema
 * factories, and the resolver that turns a failed parse into the one error
 * key a caller should render.
 *
 * The factories are copies of mobile's `features/auth/validation/*.ts` and of
 * the inline `useMemo` schema in `features/auth/screens/ResetPasswordScreen.tsx`
 * (`mw-4-6`), verbatim except for three things: the literal `8` is now
 * {@link MIN_PASSWORD_LENGTH}, the four identical local `TranslateFunction`
 * declarations are now the one {@link TranslateFunction} below, and the
 * import specifier changed. **Every message key and every `|| "…"` English
 * fallback is load-bearing and is preserved exactly** — a screen reads the
 * fallback whenever its locale bundle has no entry for the key, so changing
 * one changes what a user sees. Mobile keeps its copies until `mw-4-13`
 * points it here (`BOUNDARIES.md` §4).
 *
 * These are the FORM rules, not the wire rules. `schemas.ts` keeps its own
 * private `authEmailSchema`, which lowercases for the backend's `lower(email)`
 * lookup; a form schema must never lowercase what the user typed back at them.
 * Both halves now share {@link MIN_PASSWORD_LENGTH} and {@link OTP_PATTERN},
 * which is the point of the module.
 */

/**
 * The password floor — mobile's four form schemas, `schemas.ts`'s two request
 * schemas and the web login modal all enforce this same number.
 */
export const MIN_PASSWORD_LENGTH = 8

/** The backend's signup and reset OTP length. */
export const OTP_LENGTH = 6

/**
 * A six-digit OTP, exactly. Re-homed here from `schemas.ts` rather than
 * redefined, so the wire schemas and any OTP input agree by construction.
 */
export const OTP_PATTERN = /^\d{6}$/

/**
 * The app-supplied translator. Declared once here because mobile declares
 * this identical type separately in all four of its validation files, which
 * is the smaller half of the duplication this module exists to end.
 * @param key - The message key, e.g. `validation.email-required`
 * @param params - Optional interpolation values
 * @returns The translated string, or `""` when the bundle has no entry
 */
export type TranslateFunction = (
  key: string,
  params?: Record<string, string | number>
) => string

/**
 * One email as a form field: trimmed, required, then format-checked.
 *
 * The `.min(1)`-before-`.email()` order matters, but not for the reason it
 * looks like: zod 4 collects BOTH issues for `""` rather than stopping at the
 * first — measured on 4.3.6, `safeParse("")` yields `[required, invalid]`.
 * What the order decides is which one comes FIRST, and every consumer here
 * reads the first issue per path: react-hook-form's `zodResolver` keeps one
 * error per field, and this module's own resolver and its callers read
 * `issues[0]`. So an empty box renders "required"; a caller that renders
 * every issue would see both.
 * @param t - The app's translator
 * @returns A zod string schema carrying both messages
 * @example emailFieldSchema(t).safeParse("") // -> validation.email-required
 */
export const emailFieldSchema = (t: TranslateFunction) =>
  z
    .string()
    .trim()
    .min(1, t("validation.email-required") || "Email is required")
    .email(t("validation.email-invalid") || "Invalid email format")

/**
 * One password as a form field: required, then at least
 * {@link MIN_PASSWORD_LENGTH} characters. Same two-step reason as
 * {@link emailFieldSchema} — an empty box reads "required", a short one reads
 * the length rule.
 * @param t - The app's translator
 * @returns A zod string schema carrying both messages
 * @example passwordFieldSchema(t).safeParse("1234") // -> validation.password-min-length
 */
export const passwordFieldSchema = (t: TranslateFunction) =>
  z
    .string()
    .min(1, t("validation.password-required") || "Password is required")
    .min(
      MIN_PASSWORD_LENGTH,
      t("validation.password-min-length") ||
        "Password must be at least 8 characters long"
    )

/**
 * The unified login/signup form schema — mobile's `createAuthSchema`.
 * @param t - The app's translator
 * @returns A zod object schema over `email` and `password`
 * @example createAuthFormSchema(t).safeParse({ email: "a@b.co", password: "12345678" })
 */
export const createAuthFormSchema = (t: TranslateFunction) =>
  z.object({
    email: emailFieldSchema(t),
    password: passwordFieldSchema(t)
  })

/** The login/signup form's values. */
export type AuthFormValues = z.infer<ReturnType<typeof createAuthFormSchema>>

/**
 * The forgot-password step-1 form schema — mobile's
 * `createForgotPasswordSchema`. Kept as a verbatim copy rather than reusing
 * {@link emailFieldSchema}, though the two differ only in the DEAD half: both
 * call the same key `validation.email-invalid`, which is present in all four
 * mobile bundles (`en` / `ur` / `rmu` / `ar`), so a user sees identical copy
 * from either. Only the `||` English fallback differs ("Please enter a valid
 * email address" against "Invalid email format"), and that string is
 * unreachable in mobile production. Preserved anyway — this is a copy, and
 * the fallbacks are the half a bundle edit can make live again.
 * @param t - The app's translator
 * @returns A zod object schema over `email`
 * @example createForgotPasswordFormSchema(t).safeParse({ email: "a@b.co" })
 */
export const createForgotPasswordFormSchema = (t: TranslateFunction) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, t("validation.email-required") || "Email is required")
      .email(
        t("validation.email-invalid") || "Please enter a valid email address"
      )
  })

/** The forgot-password form's values. */
export type ForgotPasswordFormValues = z.infer<
  ReturnType<typeof createForgotPasswordFormSchema>
>

/**
 * The change-password form schema — mobile's `createChangePasswordSchema`.
 *
 * Its keys are the `validation-error.*` namespace, not `validation.*`; that
 * is mobile's, and it is preserved. Both refinements carry an explicit
 * `path`, which is what puts each message under the right field: a mismatch
 * reports on `confirmPassword`, a reused password on `newPassword`.
 * @param t - The app's translator
 * @returns A zod schema over the three password fields, with both refinements
 * @example createChangePasswordFormSchema(t).safeParse({ oldPassword: "a", newPassword: "b", confirmPassword: "c" })
 */
export const createChangePasswordFormSchema = (t: TranslateFunction) =>
  z
    .object({
      oldPassword: z
        .string()
        .min(
          1,
          t("validation-error.password-required") || "Old password is required"
        ),
      newPassword: z
        .string()
        .min(
          1,
          t("validation-error.password-required") || "New password is required"
        )
        .min(
          MIN_PASSWORD_LENGTH,
          t("validation-error.password-min-length") ||
            "Password must be at least 8 characters"
        ),
      confirmPassword: z
        .string()
        .min(
          1,
          t("validation-error.confirm-password") ||
            "Please confirm your password"
        )
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message:
        t("validation-error.passwords-no-match") || "Passwords do not match",
      path: ["confirmPassword"]
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
      message:
        t("validation-error.new-password-same-as-old") ||
        "New password must be different from old password",
      path: ["newPassword"]
    })

/** The change-password form's values. */
export type ChangePasswordFormValues = z.infer<
  ReturnType<typeof createChangePasswordFormSchema>
>

/**
 * The reset-password form schema — lifted verbatim from the inline `useMemo`
 * in mobile's `ResetPasswordScreen.tsx:38-61`.
 *
 * Both fields carry the length rule rather than a `.min(1)` required rule,
 * so an empty confirm box reads as too short; that is mobile's behaviour and
 * this is a copy, not a correction.
 * @param t - The app's translator
 * @returns A zod schema over `password` and `confirmPassword`, refined to match
 * @example createResetPasswordFormSchema(t).safeParse({ password: "12345678", confirmPassword: "12345678" })
 */
export const createResetPasswordFormSchema = (t: TranslateFunction) =>
  z
    .object({
      password: z
        .string()
        .min(
          MIN_PASSWORD_LENGTH,
          t("validation.password-min-8") ||
            "Password must be at least 8 characters"
        ),
      confirmPassword: z
        .string()
        .min(
          MIN_PASSWORD_LENGTH,
          t("validation.confirm-password") || "Confirm your password"
        )
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwords-no-match") || "Passwords do not match",
      path: ["confirmPassword"]
    })

/** The reset-password form's values. */
export type ResetPasswordFormValues = z.infer<
  ReturnType<typeof createResetPasswordFormSchema>
>

/**
 * The two credential field errors a caller can render, as error keys rather
 * than as messages — the app owns the copy.
 */
export type CredentialIssueKey = "email-invalid" | "password-short"

/**
 * Picks the one credential error to show from a failed credential parse.
 *
 * Email wins over password, which is the behaviour every caller already had
 * and what a visitor expects when both boxes are wrong. An empty password
 * resolves to `password-short` rather than a distinct "required" key, because
 * the wire schema states the floor and not the presence.
 *
 * It reads the `email` and `password` paths ONLY. An error from
 * {@link createChangePasswordFormSchema} or
 * {@link createResetPasswordFormSchema} — whose paths are `oldPassword`,
 * `newPassword` and `confirmPassword` — therefore answers `null` by design,
 * not by accident; those forms render per-field messages rather than one key.
 *
 * Reading paths in one tested place is the point: an issue on a field the
 * caller has no input for answers `null`, which a
 * `some(path[0] === "email")` check cannot express and which would otherwise
 * render `password-short` against a password the visitor typed correctly.
 * `signupLoginRequestSchema` carries two such fields, `role` and
 * `guestSessionId`. At the login modal's call site neither can fail — `role`
 * is a literal and `guestSessionId` is not passed — so the `null` branch is
 * unreachable there; the exported resolver has no such guarantee.
 * @param error - The `ZodError` from a failed credential parse
 * @returns The error key to render, or `null` when no credential field failed
 * @example
 * const parsed = signupLoginRequestSchema.safeParse({
 *   email: "x",
 *   password: "12345678",
 *   role: "customer"
 * })
 * if (!parsed.success) resolveCredentialIssueKey(parsed.error) // -> "email-invalid"
 */
export function resolveCredentialIssueKey(
  error: z.ZodError
): CredentialIssueKey | null {
  let hasPasswordIssue = false

  for (const issue of error.issues) {
    if (issue.path[0] === "email") {
      return "email-invalid"
    }

    if (issue.path[0] === "password") {
      hasPasswordIssue = true
    }
  }

  return hasPasswordIssue ? "password-short" : null
}
