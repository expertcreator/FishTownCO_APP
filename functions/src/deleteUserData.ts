import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import { user } from "firebase-functions/v1/auth";

/**
 * Finishes erasure after Firebase Auth deletes the user.
 * Removes the user document, every subcollection (including device tokens),
 * and every Storage object under `users/{uid}/`.
 */
export const deleteUserData = user().onDelete(async (account) => {
  const uid = account.uid;
  const db = getFirestore();
  await db.recursiveDelete(db.doc(`users/${uid}`));
  await getStorage().bucket().deleteFiles({ prefix: `users/${uid}/` });
  logger.info("Deleted stored account data", { uid });
});
