import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { SAFETY_ITEMS_QUERY_KEY } from "@/features/safety/hooks/useSafetyItems";
import type { ChecklistItem } from "@/features/vessel/data/demoChecklist";
import { pendingChecklistItems } from "@/features/vessel/services/pendingChecklistItems";
import { WALLET_DOCS_QUERY_KEY } from "@/features/wallet/hooks/useWalletDocs";
import {
  getWalletCategoryLabel,
  type WalletCategory,
} from "@/features/wallet/types/wallet";

/** Shown until the user adds a real due or expiry date. */
export const DATE_NOT_SET_LABEL = "Date not set";

/** Fields that mean the user has added a date, photo, or file to a placeholder. */
const USER_SET_FIELDS = [
  "dueDateIso",
  "expiryDateIso",
  "lastServiceDate",
  "photoLocalUri",
  "photoStoragePath",
  "photoDownloadURL",
  "certLocalUri",
  "certStoragePath",
  "certDownloadURL",
  "localUri",
  "storagePath",
  "downloadURL",
] as const;

/**
 * Whether a record is a checklist placeholder the user has not touched yet.
 * Only these are removed when their checklist entry is unticked.
 * @param data - Firestore fields
 * @returns True when it still needs setup and has no date, photo, or file
 */
function isUntouchedPlaceholder(data: Record<string, unknown>): boolean {
  if (data.needsSetup !== true) return false;
  return USER_SET_FIELDS.every((field) => !data[field]);
}

/**
 * Creates a placeholder safety item or wallet document for each new checklist entry,
 * and removes untouched placeholders whose entry was unticked.
 * Placeholders have no photo, file, location, or date, so they stay out of reminders.
 * @param checklistIds - Ticked checklist ids
 * @returns How many records were created
 * @throws {Error} When signed out or a Firestore write fails
 */
export async function createChecklistRecords(
  checklistIds: string[]
): Promise<number> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const safetyCollection = collection(
    firebaseFirestore,
    "users",
    user.uid,
    "safety"
  );
  const walletCollection = collection(
    firebaseFirestore,
    "users",
    user.uid,
    "wallet"
  );
  const [safetySnap, walletSnap] = await Promise.all([
    getDocs(safetyCollection),
    getDocs(walletCollection),
  ]);

  const ticked = new Set(checklistIds);
  const existingIds: string[] = [];
  const existingTitles: string[] = [];
  const unticked: typeof safetySnap.docs = [];
  for (const snap of [...safetySnap.docs, ...walletSnap.docs]) {
    const data = snap.data() as Record<string, unknown>;
    if (typeof data.checklistId === "string") {
      if (!ticked.has(data.checklistId) && isUntouchedPlaceholder(data)) {
        unticked.push(snap);
        continue;
      }
      existingIds.push(data.checklistId);
    }
    const title = data.name ?? data.title;
    if (typeof title === "string") existingTitles.push(title);
  }

  const pending = pendingChecklistItems(checklistIds, {
    checklistIds: existingIds,
    titles: existingTitles,
  });
  if (pending.length === 0 && unticked.length === 0) return 0;

  const batch = writeBatch(firebaseFirestore);
  for (const snap of unticked) {
    batch.delete(snap.ref);
  }
  for (const item of pending) {
    if (item.kind === "document") {
      batch.set(doc(walletCollection), walletPlaceholder(item));
    } else {
      batch.set(doc(safetyCollection), safetyPlaceholder(item));
    }
  }
  await batch.commit();

  await queryClient.invalidateQueries({ queryKey: SAFETY_ITEMS_QUERY_KEY });
  await queryClient.invalidateQueries({ queryKey: WALLET_DOCS_QUERY_KEY });
  return pending.length;
}

/**
 * Builds a safety placeholder with no date, photo, or location.
 * @param item - Checklist entry
 * @returns Firestore fields
 */
function safetyPlaceholder(item: ChecklistItem) {
  return {
    checklistId: item.id,
    needsSetup: true,
    itemType: item.category,
    category: item.category,
    name: item.title,
    makeModel: null,
    serial: null,
    locationAboard: "",
    location: "",
    lastServiceDate: null,
    nextDueDate: DATE_NOT_SET_LABEL,
    dueDate: DATE_NOT_SET_LABEL,
    dueDateIso: null,
    expiryDate: null,
    notes: item.standard,
    latitude: null,
    longitude: null,
    photoLocalUri: null,
    photoDownloadURL: null,
    photoThumbURL: null,
    photoStoragePath: null,
    photoMediaStatus: "none",
    certLocalUri: null,
    certDownloadURL: null,
    certThumbURL: null,
    certStoragePath: null,
    certMediaStatus: "none",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Builds a wallet placeholder with no file or expiry date.
 * @param item - Checklist document entry
 * @returns Firestore fields
 */
function walletPlaceholder(item: ChecklistItem) {
  const category = item.category as WalletCategory;
  return {
    checklistId: item.id,
    needsSetup: true,
    docType: item.docType ?? "Other",
    category,
    categoryLabel: getWalletCategoryLabel(category),
    title: item.title,
    reference: null,
    issueDate: "",
    expiryDate: DATE_NOT_SET_LABEL,
    expiryDateIso: null,
    localUri: null,
    downloadURL: null,
    thumbURL: null,
    storagePath: null,
    mediaStatus: "none",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
