import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  createAuthFormSchema,
  createChangePasswordFormSchema,
  createForgotPasswordFormSchema,
  createResetPasswordFormSchema,
  emailFieldSchema,
  MIN_PASSWORD_LENGTH,
  OTP_LENGTH,
  OTP_PATTERN,
  passwordFieldSchema,
  resolveCredentialIssueKey
} from "../credential-rules"
import { signupLoginRequestSchema } from "../schemas"

/** A translator that resolves every key, so the key itself is the message. */
const echo = (key: string) => key

/** An untranslated bundle: `""` for every key, so the `||` fallback wins. */
const blank = () => ""

/**
 * The one issue a caller reads back from a failed credential parse. Every row
 * goes through `signupLoginRequestSchema`, because that is the schema the
 * login modal parses and the only producer of these errors in the app.
 */
function keyFor(value: { email: string; password: string }) {
  const parsed = signupLoginRequestSchema.safeParse({
    ...value,
    role: "customer"
  })

  return parsed.success ? null : resolveCredentialIssueKey(parsed.error)
}

describe("limits", () => {
  it("states the password floor and the OTP length once", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
    expect(OTP_LENGTH).toBe(6)
  })

  it("matches a six-digit OTP and nothing else", () => {
    expect(OTP_PATTERN.test("123456")).toBe(true)
    expect(OTP_PATTERN.test("12345")).toBe(false)
    expect(OTP_PATTERN.test("1234567")).toBe(false)
    expect(OTP_PATTERN.test("12345a")).toBe(false)
  })

  it("is the floor the wire schema now enforces", () => {
    // The literal moved out of `schemas.ts`; this is what proves it landed.
    expect(
      signupLoginRequestSchema.safeParse({
        email: "a@b.co",
        password: "1".repeat(MIN_PASSWORD_LENGTH - 1),
        role: "customer"
      }).success
    ).toBe(false)
    expect(
      signupLoginRequestSchema.safeParse({
        email: "a@b.co",
        password: "1".repeat(MIN_PASSWORD_LENGTH),
        role: "customer"
      }).success
    ).toBe(true)
  })
})

describe("resolveCredentialIssueKey", () => {
  it("lets an email issue win over a password issue", () => {
    expect(keyFor({ email: "x", password: "" })).toBe("email-invalid")
  })

  it("lets email win even when the password issue is reported first", () => {
    // The row above cannot prove the precedence: zod emits object issues in
    // declaration order, and `email` is declared first on the wire schema, so
    // a `path[0] === "email"` check on `issues[0]` alone would also pass it.
    // This schema reverses the declaration order to put the password issue
    // first, which is the only thing that exercises the loop.
    const passwordFirst = z.object({
      password: z.string().min(MIN_PASSWORD_LENGTH),
      email: z.string().email()
    })
    const parsed = passwordFirst.safeParse({ email: "x", password: "1234" })

    expect(
      parsed.success ? null : parsed.error.issues.map((issue) => issue.path[0])
    ).toEqual(["password", "email"])
    expect(
      parsed.success ? null : resolveCredentialIssueKey(parsed.error)
    ).toBe("email-invalid")
  })

  it("reports a short password when the email is fine", () => {
    expect(keyFor({ email: "a@b.co", password: "1234" })).toBe("password-short")
  })

  it("reports an empty password as short, not as a distinct required key", () => {
    expect(keyFor({ email: "a@b.co", password: "" })).toBe("password-short")
  })

  it("resolves nothing for a valid pair", () => {
    expect(keyFor({ email: "a@b.co", password: "12345678" })).toBeNull()
  })

  it("answers null for an issue on a field the caller has no input for", () => {
    // `role` and `guestSessionId` are the wire schema's two non-credential
    // fields. Neither can fail at the login modal's call site — `role` is a
    // literal there and `guestSessionId` is not passed — so this branch is
    // unreachable from that caller, but the exported resolver is not scoped
    // to it. A caller showing `password-short` here would blame a password
    // the visitor typed correctly, which is what the old
    // `some(path[0] === "email")` check did.
    const parsed = signupLoginRequestSchema.safeParse({
      email: "a@b.co",
      password: "12345678",
      role: "rider"
    })

    expect(parsed.success).toBe(false)
    expect(
      parsed.success ? null : resolveCredentialIssueKey(parsed.error)
    ).toBeNull()
  })
})

describe("emailFieldSchema", () => {
  it("separates required from invalid by the min-then-email order", () => {
    expect(emailFieldSchema(echo).safeParse("").error?.issues[0]?.message).toBe(
      "validation.email-required"
    )
    expect(
      emailFieldSchema(echo).safeParse("x").error?.issues[0]?.message
    ).toBe("validation.email-invalid")
  })

  it("trims but does not lowercase what the user typed", () => {
    // The wire schema lowercases for the backend's `lower(email)` lookup; a
    // form schema must not rewrite the visitor's own input back at them.
    expect(emailFieldSchema(echo).parse("  A@B.co  ")).toBe("A@B.co")
  })

  it("falls back to English when the key is untranslated", () => {
    expect(
      emailFieldSchema(blank).safeParse("").error?.issues[0]?.message
    ).toBe("Email is required")
    expect(
      emailFieldSchema(blank).safeParse("x").error?.issues[0]?.message
    ).toBe("Invalid email format")
  })
})

describe("passwordFieldSchema", () => {
  it("separates required from too-short", () => {
    expect(
      passwordFieldSchema(echo).safeParse("").error?.issues[0]?.message
    ).toBe("validation.password-required")
    expect(
      passwordFieldSchema(echo).safeParse("1234").error?.issues[0]?.message
    ).toBe("validation.password-min-length")
  })

  it("falls back to English when the key is untranslated", () => {
    expect(
      passwordFieldSchema(blank).safeParse("").error?.issues[0]?.message
    ).toBe("Password is required")
    expect(
      passwordFieldSchema(blank).safeParse("1234").error?.issues[0]?.message
    ).toBe("Password must be at least 8 characters long")
  })
})

describe("createAuthFormSchema", () => {
  it("accepts a valid credential pair", () => {
    expect(
      createAuthFormSchema(echo).parse({
        email: "a@b.co",
        password: "12345678"
      })
    ).toEqual({ email: "a@b.co", password: "12345678" })
  })

  it("reports both fields at once", () => {
    const parsed = createAuthFormSchema(echo).safeParse({
      email: "x",
      password: "1234"
    })

    expect(parsed.error?.issues.map((issue) => issue.path[0])).toEqual([
      "email",
      "password"
    ])
  })
})

describe("createForgotPasswordFormSchema", () => {
  it("carries its own invalid-email fallback, not the auth form's", () => {
    expect(
      createForgotPasswordFormSchema(blank).safeParse({ email: "x" }).error
        ?.issues[0]?.message
    ).toBe("Please enter a valid email address")
  })

  it("reports a missing email as required", () => {
    expect(
      createForgotPasswordFormSchema(echo).safeParse({ email: "" }).error
        ?.issues[0]?.message
    ).toBe("validation.email-required")
  })

  it("accepts a valid email", () => {
    expect(
      createForgotPasswordFormSchema(echo).parse({ email: "a@b.co" })
    ).toEqual({ email: "a@b.co" })
  })
})

describe("createChangePasswordFormSchema", () => {
  const valid = {
    confirmPassword: "newpass123",
    newPassword: "newpass123",
    oldPassword: "oldpass123"
  }

  it("accepts a distinct, matching new password", () => {
    expect(createChangePasswordFormSchema(echo).parse(valid)).toEqual(valid)
  })

  it("puts a mismatch on confirmPassword", () => {
    const parsed = createChangePasswordFormSchema(echo).safeParse({
      ...valid,
      confirmPassword: "different1"
    })
    const issue = parsed.error?.issues[0]

    expect(issue?.path).toEqual(["confirmPassword"])
    expect(issue?.message).toBe("validation-error.passwords-no-match")
  })

  it("puts a reused password on newPassword", () => {
    const parsed = createChangePasswordFormSchema(echo).safeParse({
      confirmPassword: "oldpass123",
      newPassword: "oldpass123",
      oldPassword: "oldpass123"
    })
    const issue = parsed.error?.issues[0]

    expect(issue?.path).toEqual(["newPassword"])
    expect(issue?.message).toBe("validation-error.new-password-same-as-old")
  })

  it("enforces the shared password floor on the new password", () => {
    const parsed = createChangePasswordFormSchema(echo).safeParse({
      confirmPassword: "1234",
      newPassword: "1234",
      oldPassword: "oldpass123"
    })

    expect(
      parsed.error?.issues.some(
        (issue) => issue.message === "validation-error.password-min-length"
      )
    ).toBe(true)
  })

  it("falls back to English on every untranslated message", () => {
    const parsed = createChangePasswordFormSchema(blank).safeParse({
      confirmPassword: "",
      newPassword: "",
      oldPassword: ""
    })

    expect(parsed.error?.issues.map((issue) => issue.message)).toEqual([
      "Old password is required",
      "New password is required",
      "Password must be at least 8 characters",
      "Please confirm your password",
      // Three empty strings satisfy `new === confirm` and violate
      // `old !== new`, so the second refinement fires here too.
      "New password must be different from old password"
    ])
  })
})

describe("createResetPasswordFormSchema", () => {
  it("accepts a matching pair at the floor", () => {
    expect(
      createResetPasswordFormSchema(echo).parse({
        confirmPassword: "12345678",
        password: "12345678"
      })
    ).toEqual({ confirmPassword: "12345678", password: "12345678" })
  })

  it("puts a mismatch on confirmPassword", () => {
    const parsed = createResetPasswordFormSchema(echo).safeParse({
      confirmPassword: "87654321",
      password: "12345678"
    })
    const issue = parsed.error?.issues[0]

    expect(issue?.path).toEqual(["confirmPassword"])
    expect(issue?.message).toBe("validation.passwords-no-match")
  })

  it("enforces the shared floor on both fields, with mobile's messages", () => {
    const parsed = createResetPasswordFormSchema(blank).safeParse({
      confirmPassword: "1234",
      password: "1234"
    })

    expect(parsed.error?.issues.map((issue) => issue.message)).toEqual([
      "Password must be at least 8 characters",
      "Confirm your password"
    ])
  })
})
