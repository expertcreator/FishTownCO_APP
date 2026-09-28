import { z } from "zod";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const required = (t: Translate) =>
  z.string().trim().min(1, t("validation.required"));

const mmsi = (t: Translate) =>
  required(t).regex(/^\d{9}$/, t("validation.mmsi-invalid"));

/**
 * Vessel setup schema for the first vessel form.
 * @param t - Translation function
 * @returns Zod vessel setup schema
 */
export const createVesselSetupSchema = (t: Translate) =>
  z.object({
    name: required(t),
    type: required(t),
    length: required(t),
    homePort: required(t),
    mmsi: mmsi(t),
});

export type VesselSetupSchema = z.infer<
  ReturnType<typeof createVesselSetupSchema>
>;

/**
 * Edit-vessel schema matching prototype screen 18 fields.
 * @param t - Translation function
 * @returns Zod edit-vessel schema
 */
export const createEditVesselSchema = (t: Translate) =>
  z.object({
    name: required(t),
    type: required(t),
    length: required(t),
    homePort: required(t),
    mmsi: mmsi(t),
    registrationNo: z.string().trim(),
    engineHours: z.string().trim(),
    usage: z.string().trim(),
});

export type EditVesselSchema = z.infer<
  ReturnType<typeof createEditVesselSchema>
>;
