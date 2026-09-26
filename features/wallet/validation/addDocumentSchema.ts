import { z } from "zod";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const required = (t: Translate) =>
  z.string().trim().min(1, t("validation.required"));

/** Document type options on Add Document (prototype screen 17). */
export const WALLET_DOCUMENT_TYPES = [
  "Insurance",
  "Registration",
  "Compliance Code",
  "VHF Licence",
  "Certificate",
  "Manual",
  "Other",
] as const;

/**
 * Add-document schema matching prototype screen 17.
 * @param t - Translation function
 * @returns Zod wallet document schema
 */
export const createAddDocumentSchema = (t: Translate) =>
  z.object({
    docType: required(t),
    title: required(t),
    reference: z.string().trim(),
    issueDate: required(t),
    expiryDate: required(t),
  });

export type AddDocumentSchema = z.infer<
  ReturnType<typeof createAddDocumentSchema>
>;
