import { z } from "zod";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const required = (t: Translate) =>
  z.string().trim().min(1, t("validation.required"));

/**
 * Add-document schema. The document code is optional.
 * @param t - Translation function
 * @returns Zod wallet document schema
 */
export const createAddDocumentSchema = (t: Translate) =>
  z.object({
    title: required(t),
    issuer: required(t),
    expires: required(t),
    code: z.string().trim().optional(),
  });

export type AddDocumentSchema = z.infer<
  ReturnType<typeof createAddDocumentSchema>
>;
