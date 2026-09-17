import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "sessionId";
const GUEST_KEY = "guestSessionId";

let sessionCache: string | null = null;
let guestCache: string | null = null;

const listeners: (() => void)[] = [];

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeTokenCache(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

export function getTokenCacheSnapshot(): string {
  return `${sessionCache ?? ""}\u0000${guestCache ?? ""}`;
}

export async function hydrateSessionTokens(): Promise<void> {
  try {
    const [s, g] = await Promise.all([
      SecureStore.getItemAsync(SESSION_KEY),
      SecureStore.getItemAsync(GUEST_KEY),
    ]);
    sessionCache = s ?? null;
    guestCache = g ?? null;
  } catch {
    sessionCache = null;
    guestCache = null;
  }
  notify();
}

export async function getSessionId(): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(SESSION_KEY);
    sessionCache = value ?? null;
    notify();
    return sessionCache;
  } catch {
    sessionCache = null;
    notify();
    return null;
  }
}

export function getSessionIdSync(): string | null {
  return sessionCache;
}

export function getGuestSessionIdSync(): string | null {
  return guestCache;
}

export function getActiveAuthTokenSync(): string | null {
  return sessionCache || guestCache;
}

/**
 * Dev diagnostics: in-memory session mirrors SecureStore after hydrate/set (no secrets).
 */
export type SessionCacheDebugInfo = {
  hasStaffSession: boolean;
  hasGuestSession: boolean;
  /** Which token `getActiveAuthTokenSync()` resolves to. */
  activeTokenSource: "staff" | "guest" | "none";
};

export function getSessionCacheDebugInfo(): SessionCacheDebugInfo {
  let activeTokenSource: SessionCacheDebugInfo["activeTokenSource"];
  if (sessionCache) {
    activeTokenSource = "staff";
  } else if (guestCache) {
    activeTokenSource = "guest";
  } else {
    activeTokenSource = "none";
  }
  return {
    hasStaffSession: sessionCache != null,
    hasGuestSession: guestCache != null,
    activeTokenSource,
  };
}

export async function setSessionId(id: string): Promise<void> {
  sessionCache = id;
  notify();
  try {
    await SecureStore.setItemAsync(SESSION_KEY, id);
  } catch {
    // Keep in-memory cache so the current app session keeps working.
  }
}

export async function removeSessionId(): Promise<void> {
  sessionCache = null;
  notify();
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // SecureStore may fail; in-memory cache is already cleared.
  }
}

export async function setGuestSessionId(id: string): Promise<void> {
  guestCache = id;
  notify();
  try {
    await SecureStore.setItemAsync(GUEST_KEY, id);
  } catch {
    // Keep in-memory cache so the current app session keeps working.
  }
}

export async function removeGuestSessionId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(GUEST_KEY);
  } finally {
    guestCache = null;
  }
  notify();
}

export function clearSessionCaches(): void {
  sessionCache = null;
  guestCache = null;
  notify();
}

export async function clearPersistedSessionTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(GUEST_KEY).catch(() => {}),
  ]);
}
