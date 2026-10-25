import { deleteUser } from "@react-native-firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "@react-native-firebase/firestore";
import Purchases from "react-native-purchases";
import {
  firebaseAuth,
  firebaseFirestore,
  queryClient,
} from "@/features/common/firebase";
import { revokeAppleSignInIfNeeded } from "@/features/auth/services/appleRevoke";
import { deleteUserStorage } from "@/features/auth/services/deleteUserStorage";
import { revenueCatApiKey } from "@/features/subscription/services/configurePurchases";

const USER_COLLECTIONS = [
  "safety",
  "wallet",
  "crew",
  "billing",
  "devices",
] as const;

/**
 * Deletes the signed-in Firebase account, Storage files, and Firestore records.
 * An Apple account revokes its Sign in with Apple token first. Storage files
 * and device tokens are removed before the Auth user so the signed-in user
 * can still authorize those deletes.
 * @returns Promise that resolves when the auth user is deleted
 * @throws {Error} When no user is signed in, Storage deletion fails, or Auth rejects the delete
 */
export async function deleteAccount(): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error("NOT_SIGNED_IN");
  }

  const uid = user.uid;
  await revokeAppleSignInIfNeeded(user);
  await deleteUserStorage(uid);
  try {
    await wipeUserData(uid);
  } catch {
    // Auth deletion still runs when a Firestore record is already gone.
  }
  await detachStoreSubscriber();
  await deleteUser(user);
  queryClient.clear();
}

/**
 * Detaches the store subscriber after billing has been cancelled.
 * Logout does not cancel Apple or Google billing by itself.
 */
async function detachStoreSubscriber(): Promise<void> {
  if (!revenueCatApiKey()) return;
  try {
    await Purchases.logOut();
  } catch {
    // Already anonymous, or RevenueCat was not configured in this session.
  }
}

/**
 * Removes the signed-in user's Firestore documents, including push-token devices.
 * @param uid - Firebase user id
 * @returns Promise that resolves when the writes finish
 */
async function wipeUserData(uid: string): Promise<void> {
  await Promise.all(
    USER_COLLECTIONS.map(async (name) => {
      const snapshot = await getDocs(
        collection(firebaseFirestore, "users", uid, name)
      );
      await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
    })
  );
  await deleteDoc(doc(firebaseFirestore, "users", uid, "vessel", "profile"));
  await deleteDoc(doc(firebaseFirestore, "users", uid));
}
