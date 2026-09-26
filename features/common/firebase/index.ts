import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";
import { getStorage } from "@react-native-firebase/storage";

export { FIRESTORE_PAGE_SIZE } from "./pagination";
export {
  fetchQueryPage,
  flattenFirestorePages,
  type FirestorePage,
  type FirestorePageParam,
} from "./pagination";
export { queryClient } from "./queryClient";
export { useFirestoreInfiniteQuery } from "./useFirestoreInfiniteQuery";
export { useFirestoreMutation } from "./useFirestoreMutation";
export { userPath } from "./paths";

/**
 * Shared Firebase Auth instance for the Android app.
 * Native config comes from `google-services.json`.
 */
export const firebaseAuth = getAuth();

/**
 * Shared Firestore instance used by client helpers across the app.
 */
export const firebaseFirestore = getFirestore();

/**
 * Shared Firebase Storage instance for user media uploads.
 */
export const firebaseStorage = getStorage();

/**
 * Returns the signed-in Firebase user, or null when logged out.
 * @returns Current Firebase user
 */
export function getCurrentUser() {
  return firebaseAuth.currentUser;
}
