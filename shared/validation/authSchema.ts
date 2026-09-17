import { z } from "zod";

/** Matches `useTranslation`’s `t` signature (shared/translations/useTranslation). */
export type AuthSchemaTranslate = (
  key: string,
  defaultValueOrParams?: string | Record<string, string | number>,
  params?: Record<string, string | number>
) => string;

export const createAuthSchema = (t: AuthSchemaTranslate) =>
  z.object({
    email: z
      .string()
      .min(1, t("auth-validation-email-required"))
      .email(t("auth-validation-email-invalid")),
    password: z
      .string()
      .min(1, t("auth-validation-password-required"))
      .min(6, t("auth-validation-password-min", { min: 6 })),
  });

export type AuthFormValues = z.infer<ReturnType<typeof createAuthSchema>>;
