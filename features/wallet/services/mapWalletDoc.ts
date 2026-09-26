import type { QueryDocumentSnapshot } from "@react-native-firebase/firestore";
import type { StatusTone } from "@/features/common/data/demo";
import {
  formatSafetyDueDateLong,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";
import {
  daysUntilDue,
  getSafetyStatusLabel,
  getSafetyTone,
} from "@/features/safety/utils/safetyStatus";
import {
  getWalletCategoryLabel,
  mapDocTypeToCategory,
  type WalletDoc,
} from "@/features/wallet/types/wallet";

/**
 * Maps a Firestore wallet document into the list / card model.
 * @param docSnap - Firestore document snapshot
 * @returns Wallet document for UI
 */
export function mapWalletDoc(docSnap: QueryDocumentSnapshot): WalletDoc {
  const data = docSnap.data() as Record<string, unknown>;
  const docType = String(data.docType ?? data.category ?? "Other").trim();
  const category = mapDocTypeToCategory(docType);
  const title = String(data.title ?? "").trim() || "Untitled document";
  const reference = String(data.reference ?? data.code ?? "").trim();
  const expiryRaw = String(
    data.expiryDateIso ?? data.expiryDate ?? data.expires ?? ""
  );
  const parsed =
    parseSafetyDueDate(expiryRaw) ??
    (typeof data.expiryDateIso === "string"
      ? new Date(data.expiryDateIso)
      : null);
  const expiryDate =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const tone: StatusTone = expiryDate
    ? getSafetyTone(expiryDate) === "info"
      ? "ok"
      : getSafetyTone(expiryDate)
    : "ok";
  const status = getSafetyStatusLabel(tone);
  const days = expiryDate ? daysUntilDue(expiryDate) : null;
  const expiresMeta =
    days !== null && days >= 0 && days <= 90 ? `${days} days` : undefined;

  const detail = reference
    ? reference.toLowerCase().startsWith("policy")
      ? reference
      : `Ref: ${reference}`
    : docType;

  return {
    id: docSnap.id,
    title,
    docType,
    category,
    categoryLabel: getWalletCategoryLabel(category),
    detail,
    reference,
    issueDate: String(data.issueDate ?? "").trim(),
    expires: expiryDate
      ? formatSafetyDueDateLong(expiryDate)
      : String(data.expiryDate ?? data.expires ?? "—"),
    expiresIso: expiryDate ? expiryDate.toISOString() : null,
    expiresMeta,
    tone,
    status,
    code: reference || undefined,
    localUri: data.localUri ? String(data.localUri) : null,
    downloadURL: data.downloadURL ? String(data.downloadURL) : null,
    thumbURL: data.thumbURL ? String(data.thumbURL) : null,
    storagePath: data.storagePath ? String(data.storagePath) : null,
    mediaStatus:
      (data.mediaStatus as WalletDoc["mediaStatus"]) ??
      (data.downloadURL ? "ready" : data.localUri ? "pending" : "none"),
  };
}
