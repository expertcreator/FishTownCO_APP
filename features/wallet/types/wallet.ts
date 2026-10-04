import type { Ionicons } from "@expo/vector-icons";
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

/** Document type choices for Add Document, including the list-card icon. */
export const WALLET_DOCUMENT_TYPES: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Insurance", icon: "shield-outline" },
  { label: "Registration", icon: "ribbon-outline" },
  { label: "Compliance Code", icon: "checkmark-done-outline" },
  { label: "VHF Licence", icon: "radio-outline" },
  { label: "Certificate", icon: "document-text-outline" },
  { label: "Manual", icon: "book-outline" },
  { label: "Other", icon: "folder-outline" },
];

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
 * Picks the icon shown for a document type, matching the type picker.
 * @param docType - Document type label saved on the wallet doc
 * @returns Ionicons glyph name
 */
export function getWalletDocTypeIcon(
  docType: string
): keyof typeof Ionicons.glyphMap {
  const match = WALLET_DOCUMENT_TYPES.find(
    (type) => type.label.toLowerCase() === docType.trim().toLowerCase()
  );
  if (match) return match.icon;
  return getWalletCategoryIcon(mapDocTypeToCategory(docType));
}

/**
 * Picks the list icon for a wallet category.
 * @param category - Wallet category key
 * @returns Ionicons glyph name
 */
export function getWalletCategoryIcon(
  category: WalletCategory
): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case "insurance":
      return "shield";
    case "registry":
      return "ribbon-outline";
    case "compliance":
      return "checkmark-done-outline";
    case "telecom":
      return "cellular-outline";
    case "safety":
      return "alert-circle-outline";
    default:
      return "document-text-outline";
  }
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
