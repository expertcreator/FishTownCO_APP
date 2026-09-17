/**
 * RFC 4122 UUID v4 without native modules (avoids `expo-crypto` when the native
 * binary is missing or stale). Fine for one-off client idempotency keys.
 */
export function randomUuidV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r % 4) + 8;
    return v.toString(16);
  });
}
