import {
  doc,
  serverTimestamp,
  updateDoc,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { WALLET_DOCS_QUERY_KEY } from "@/features/wallet/hooks/useWalletDocs";
import type { AddWalletDocInput } from "@/features/wallet/services/addWalletDoc";
import {
  getWalletCategoryLabel,
  mapDocTypeToCategory,
} from "@/features/wallet/types/wallet";

export type UpdateWalletDocInput = AddWalletDocInput & {
  id: string;
  /** True when the user picked a new local file that still needs upload. */
  replaceFile?: boolean;
};

/**
 * Updates an existing wallet document at `users/{uid}/wallet/{id}`.
 * A newly picked file is marked pending so the background upload can replace it.
 * @param input - Document id plus form fields
 * @returns Updated document id and path
 * @throws {Error} When signed out or the Firestore update fails
 */
export async function updateWalletDoc(
  input: UpdateWalletDocInput
): Promise<{ id: string; path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const category = mapDocTypeToCategory(input.docType);
  const path = `users/${user.uid}/wallet/${input.id}`;
  const mediaPatch = input.replaceFile
    ? {
        localUri: input.localUri?.trim() || null,
        mediaStatus: "pending" as const,
      }
    : {};

  await updateDoc(doc(firebaseFirestore, "users", user.uid, "wallet", input.id), {
    docType: input.docType.trim(),
    category,
    categoryLabel: getWalletCategoryLabel(category),
    title: input.title.trim(),
    reference: input.reference?.trim() || null,
    issueDate: input.issueDate.trim(),
    expiryDate: input.expiryDate.trim(),
    expiryDateIso: input.expiryDateIso,
    needsSetup: false,
    ...mediaPatch,
    updatedAt: serverTimestamp(),
  });

  await queryClient.invalidateQueries({ queryKey: WALLET_DOCS_QUERY_KEY });
  await queryClient.invalidateQueries({
    queryKey: ["wallet", "doc", input.id],
  });

  return { id: input.id, path };
}
