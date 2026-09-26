import type { StatusTone } from "@/features/common/data/demo";

/** Wallet document category used for filters and card labels. */
export type WalletCategory =
  | "insurance"
  | "registry"
  | "compliance"
  | "telecom"
  | "safety"
  | "other";

/**
 * Wallet document from Firestore `users/{uid}/wallet/{id}`.
 */
export type WalletDoc = {
  id: string;
  title: string;
  docType: string;
  category: WalletCategory;
  categoryLabel: string;
  detail: string;
  reference: string;
  issueDate: string;
  expires: string;
  expiresIso: string | null;
  expiresMeta?: string;
  tone: StatusTone;
  status: string;
  code?: string;
  localUri?: string | null;
  downloadURL?: string | null;
  thumbURL?: string | null;
  storagePath?: string | null;
  mediaStatus?: "none" | "pending" | "ready" | "failed";
};

/**
 * Maps an Add Document type label to a wallet category key.
 * @param docType - Document type from the form
 * @returns Wallet category
 */
export function mapDocTypeToCategory(docType: string): WalletCategory {
  const value = docType.toLowerCase();
  if (value.includes("insurance")) return "insurance";
  if (value.includes("registration") || value.includes("registry"))
    return "registry";
  if (value.includes("compliance") || value.includes("scv"))
    return "compliance";
  if (value.includes("vhf") || value.includes("radio") || value.includes("telecom"))
    return "telecom";
  if (value.includes("certificate") || value.includes("safety") || value.includes("manual"))
    return "safety";
  return "other";
}

/**
 * Builds the uppercase category label shown on wallet cards.
 * @param category - Wallet category
 * @returns Display label
 */
export function getWalletCategoryLabel(category: WalletCategory): string {
  switch (category) {
    case "insurance":
      return "INSURANCE";
    case "registry":
      return "FLAG REGISTRY";
    case "compliance":
      return "COMPLIANCE CODE";
    case "telecom":
      return "TELECOMMUNICATIONS";
    case "safety":
      return "MANDATORY SAFETY";
    default:
      return "DOCUMENT";
  }
}
