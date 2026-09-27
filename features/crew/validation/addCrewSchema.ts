import type { CountryCode } from "libphonenumber-js";
import { z } from "zod";
import { isValidNationalPhone } from "@/ui/utils/phone";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const required = (t: Translate) =>
  z.string().trim().min(1, t("validation.required"));

/**
 * Add-crew person-fields schema matching prototype screen 20.
 * Certificates are validated separately as a multi-entry list.
 * Phone is the national number; country is validated via `countryCode`.
 * @param t - Translation function
 * @param countryCode - Selected ISO country for phone validation
 * @returns Zod crew member schema
 */
export const createAddCrewSchema = (
  t: Translate,
  countryCode: CountryCode
) =>
  z.object({
    name: z.string().trim().min(1, t("validation.name-required")),
    role: required(t),
    phone: required(t).refine(
      (value) => isValidNationalPhone(value, countryCode),
      { message: t("validation.phone-invalid") }
    ),
    email: z
      .string()
      .trim()
      .min(1, t("validation.email-required"))
      .email(t("validation.email-invalid")),
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
