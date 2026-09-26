import { z } from "zod";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const required = (t: Translate) =>
  z.string().trim().min(1, t("validation.required"));

/**
 * Add-crew schema matching prototype screen 20 fields.
 * @param t - Translation function
 * @returns Zod crew member schema
 */
export const createAddCrewSchema = (t: Translate) =>
  z.object({
    name: z.string().trim().min(1, t("validation.name-required")),
    role: required(t),
    phone: required(t).refine(
      (value) => value.replace(/\D/g, "").length >= 7,
      { message: t("validation.phone-invalid") }
    ),
    email: z
      .string()
      .trim()
      .min(1, t("validation.email-required"))
      .email(t("validation.email-invalid")),
    certType: required(t),
    certTitle: z.string().trim(),
    issueDate: required(t),
    expiryDate: required(t),
  });

export type AddCrewSchema = z.infer<ReturnType<typeof createAddCrewSchema>>;

/** Certificate type options shown on Add Crew. */
export const CREW_CERTIFICATE_TYPES = [
  "Medical (ENG1 / MLS)",
  "STCW Basic Safety Training",
  "Master / Skipper CoC",
  "GMDSS Radio Operator (SRC/LRC)",
  "Advanced Fire Fighting",
  "First Aid at Sea",
  "Personal Survival Techniques",
  "Other Qualification",
] as const;
