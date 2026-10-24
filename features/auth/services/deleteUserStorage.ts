import {
  deleteObject,
  list,
  ref,
  type StorageReference,
} from "@react-native-firebase/storage";
import { firebaseStorage } from "@/features/common/firebase";

const LIST_PAGE_SIZE = 1000;

/**
 * Deletes every Storage object under `users/{uid}/`.
 * That prefix holds vessel photos, documents, safety photos, certificates, and crew files.
 * @param uid - Firebase user id
 * @returns Promise that resolves when the prefix is empty
 * @throws {Error} When listing or deleting an object fails
 */
export async function deleteUserStorage(uid: string): Promise<void> {
  await deletePrefix(ref(firebaseStorage, `users/${uid}`));
}

/**
 * Lists one folder, then deletes its files and child folders.
 * Pages are collected before anything is deleted so a page token stays valid.
 * @param folder - Storage folder reference
 * @returns Promise that resolves when this folder and its children are gone
 */
async function deletePrefix(folder: StorageReference): Promise<void> {
  const items: StorageReference[] = [];
  const prefixes: StorageReference[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const page = await list(folder, {
        maxResults: LIST_PAGE_SIZE,
        pageToken: pageToken ?? null,
      });
      items.push(...page.items);
      prefixes.push(...page.prefixes);
      pageToken = page.nextPageToken;
    } while (pageToken);
  } catch (error) {
    if (isMissingStorageObject(error)) return;
    throw error;
  }

  await Promise.all(prefixes.map((prefix) => deletePrefix(prefix)));
  await Promise.all(items.map((item) => deleteStorageObject(item)));
}

/**
 * Deletes one Storage object. A missing object is already erased.
 * @param item - File reference
 * @returns Promise that resolves when the object is gone
 */
async function deleteStorageObject(item: StorageReference): Promise<void> {
  try {
    await deleteObject(item);
  } catch (error) {
    if (isMissingStorageObject(error)) return;
    throw error;
  }
}

/**
 * True when Storage reports that the path is already gone.
 * @param error - Rejection from list or delete
 * @returns Whether the call can be treated as success
 */
function isMissingStorageObject(error: unknown): boolean {
  const code = (error as { code?: string })?.code ?? "";
  return code.includes("object-not-found");
}
