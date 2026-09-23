/**
 * Builds the Firestore path segment under the signed-in user.
 * @param uid - Firebase Auth uid
 * @param segments - Collection / doc path parts after `users/{uid}`
 * @returns Path like `users/abc/safety` or `users/abc`
 * @throws {Error} If `uid` is empty
 */
export function userPath(uid: string, ...segments: string[]): string {
  if (!uid.trim()) {
    throw new Error("userPath requires a non-empty Firebase Auth uid");
  }
  if (segments.length === 0) {
    return `users/${uid}`;
  }
  return `users/${uid}/${segments.join("/")}`;
}
