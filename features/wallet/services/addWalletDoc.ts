import {
  addDoc,
  collection,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { WALLET_DOCS_QUERY_KEY } from "@/features/wallet/hooks/useWalletDocs";
import {
  getWalletCategoryLabel,
  mapDocTypeToCategory,
} from "@/features/wallet/types/wallet";

export type AddWalletDocInput = {
  docType: string;
  title: string;
  reference?: string;
  issueDate: string;
  expiryDate: string;
  expiryDateIso: string;
  localUri?: string | null;
};

export type AddWalletDocResult = {
  id: string;
  path: string;
};

/**
 * Creates a wallet document under `users/{uid}/wallet`.
 * @param input - Document fields from the Add Document form
 * @returns Created document id and path
 * @throws {Error} When signed out or the Firestore write fails
 */
export async function addWalletDoc(
  input: AddWalletDocInput
): Promise<AddWalletDocResult> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const category = mapDocTypeToCategory(input.docType);
  const walletCollection = collection(
    firebaseFirestore,
    "users",
    user.uid,
    "wallet"
  );
  const consolePath = `users/${user.uid}/wallet`;
  const hasLocal = Boolean(input.localUri?.trim());

  console.log("[addWalletDoc] start", {
    consolePath,
    title: input.title,
    docType: input.docType,
  });

  try {
    const ref = await addDoc(walletCollection, {
      docType: input.docType.trim(),
      category,
      categoryLabel: getWalletCategoryLabel(category),
      title: input.title.trim(),
      reference: input.reference?.trim() || null,
      issueDate: input.issueDate.trim(),
      expiryDate: input.expiryDate.trim(),
      expiryDateIso: input.expiryDateIso,
      localUri: input.localUri?.trim() || null,
      downloadURL: null,
      thumbURL: null,
      storagePath: null,
      mediaStatus: hasLocal ? "pending" : "none",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const fullPath = `${consolePath}/${ref.id}`;
    console.log("[addWalletDoc] success", { id: ref.id, fullPath });
    await queryClient.invalidateQueries({ queryKey: WALLET_DOCS_QUERY_KEY });

    return { id: ref.id, path: fullPath };
  } catch (error) {
    console.error("[addWalletDoc] failed", {
      consolePath,
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      error,
    });
    throw error;
  }
}
