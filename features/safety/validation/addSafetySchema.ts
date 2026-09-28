import { z } from "zod";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const required = (t: Translate) =>
  z.string().trim().min(1, t("validation.required"));

/**
 * Add-safety-item schema matching the Fishtownco prototype form.
 * @param t - Translation function
 * @returns Zod safety item schema
 */
export const createAddSafetySchema = (t: Translate) =>
  z.object({
    itemType: required(t),
    name: required(t),
    makeModel: z.string().trim().optional(),
    serial: z.string().trim().optional(),
    locationAboard: required(t),
    lastServiceDate: z.string().trim().optional(),
    nextDueDate: required(t),
    expiryDate: z.string().trim().optional(),
});

export type AddSafetySchema = z.infer<ReturnType<typeof createAddSafetySchema>>;
