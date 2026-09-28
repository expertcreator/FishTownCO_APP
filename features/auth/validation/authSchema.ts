import { z } from "zod";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

/**
 * Login schema: required email and an 8-character password.
 * @param t - Translation function
 * @returns Zod login schema
 */
export const createLoginSchema = (t: Translate) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, t("validation.email-required"))
      .email(t("validation.email-invalid")),
    password: z
      .string()
      .min(1, t("validation.password-required"))
      .min(8, t("validation.password-min-length")),
});

export type LoginSchema = z.infer<ReturnType<typeof createLoginSchema>>;

/**
 * Sign-up password: at least 8 characters, one number, and one symbol.
 * @param t - Translation function
 * @returns Zod password schema
 */
const signupPassword = (t: Translate) =>
  z
    .string()
    .min(1, t("validation.password-required"))
    .min(8, t("validation.password-min-length"))
    .regex(/\d/, t("validation.password-number"))
    .regex(/[^A-Za-z0-9]/, t("validation.password-symbol"));

/**
 * Create-account schema: name, email, password, and accepted terms.
 * @param t - Translation function
 * @returns Zod create-account schema
 */
export const createAccountSchema = (t: Translate) =>
  z.object({
    name: z.string().trim().min(1, t("validation.name-required")),
    email: z
      .string()
      .trim()
      .min(1, t("validation.email-required"))
      .email(t("validation.email-invalid")),
    password: signupPassword(t),
    agreed: z.boolean().refine((value) => value, {
      message: t("validation.terms-required"),
    }),
});

export type CreateAccountSchema = z.infer<
  ReturnType<typeof createAccountSchema>
>;

/**
 * Reset-password schema: a required, valid email.
 * @param t - Translation function
 * @returns Zod reset-password schema
 */
export const createResetPasswordSchema = (t: Translate) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, t("validation.email-required"))
      .email(t("validation.email-invalid")),
});

export type ResetPasswordSchema = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
