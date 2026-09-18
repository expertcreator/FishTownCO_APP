import { z } from "zod";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const required = (t: Translate) =>
  z.string().trim().min(1, t("validation.required"));

/**
 * Add-crew schema. Phone needs at least 7 digits; email must be valid.
 * @param t - Translation function
 * @returns Zod crew member schema
 */
export const createAddCrewSchema = (t: Translate) =>
  z.object({
    name: z.string().trim().min(1, t("validation.name-required")),
    role: required(t),
    cert: required(t),
    expires: required(t),
    phone: required(t).refine(
      (value) => value.replace(/\D/g, "").length >= 7,
      { message: t("validation.phone-invalid") }
    ),
    email: z
      .string()
      .trim()
      .min(1, t("validation.email-required"))
      .email(t("validation.email-invalid")),
  });

export type AddCrewSchema = z.infer<ReturnType<typeof createAddCrewSchema>>;
