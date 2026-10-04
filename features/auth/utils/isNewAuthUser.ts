/**
 * True when this Firebase session is the account's first sign-in.
 * Creation and last sign-in are the same moment for a brand-new user.
 * @param user - Signed-in Firebase user
 * @returns Whether the account was just created
 */
export function isNewAuthUser(user: {
  metadata: { creationTime?: string; lastSignInTime?: string };
}): boolean {
  const created = user.metadata.creationTime;
  const signedIn = user.metadata.lastSignInTime;
  if (!created || !signedIn) return false;

  const createdMs = Date.parse(created);
  const signedInMs = Date.parse(signedIn);
  if (!Number.isFinite(createdMs) || !Number.isFinite(signedInMs)) {
    return created === signedIn;
  }

  return Math.abs(signedInMs - createdMs) < 20_000;
}
