import { z } from "zod";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const required = (t: Translate) =>
  z.string().trim().min(1, t("validation.required"));

/**
 * Add-safety-item schema. Serial is optional.
 * @param t - Translation function
 * @returns Zod safety item schema
 */
export const createAddSafetySchema = (t: Translate) =>
  z.object({
    name: required(t),
    category: required(t),
    location: required(t),
    dueDate: required(t),
    serial: z.string().trim().optional(),
  });

export type AddSafetySchema = z.infer<ReturnType<typeof createAddSafetySchema>>;
