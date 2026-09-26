/** Upload lifecycle for user media stored in Firestore. */
export type MediaStatus = "none" | "pending" | "ready" | "failed";

/**
 * Returns true when a URI is a local device file (needs Storage upload).
 * @param uri - Image URI from picker or remote URL
 * @returns Whether the URI should be uploaded
 */
export function isLocalMediaUri(uri: string | null | undefined): boolean {
  if (!uri?.trim()) return false;
  const value = uri.trim().toLowerCase();
  return (
    value.startsWith("file:") ||
    value.startsWith("content:") ||
    value.startsWith("ph://") ||
    value.startsWith("assets-library:") ||
    value.startsWith("/")
  );
}

/**
 * Picks the best display URI for list thumbs / avatars.
 * @param input - Media URL fields
 * @returns Prefer thumb, then full download, then local
 */
export function pickDisplayMediaUri(input: {
  thumbURL?: string | null;
  downloadURL?: string | null;
  localUri?: string | null;
}): string | null {
  return (
    input.thumbURL?.trim() ||
    input.downloadURL?.trim() ||
    input.localUri?.trim() ||
    null
  );
}
