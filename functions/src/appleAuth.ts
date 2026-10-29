import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { createAppleClientSecret } from "./appleClientSecret";

/** iOS bundle id. Apple uses this as the native Sign in with Apple client id. */
const APPLE_CLIENT_ID = "com.itoasis.Fishtownco";

const appleTeamId = defineSecret("APPLE_TEAM_ID");
const appleKeyId = defineSecret("APPLE_KEY_ID");
const applePrivateKey = defineSecret("APPLE_PRIVATE_KEY");

const TOKEN_URL = "https://appleid.apple.com/auth/token";
const REVOKE_URL = "https://appleid.apple.com/auth/revoke";

/**
 * Exchanges a Sign in with Apple authorization code for a refresh token and stores it.
 * The code expires in a few minutes, so the app sends it immediately after sign-in.
 */
export const storeAppleRefreshToken = onRequest(
  {
    region: "europe-west2",
    cors: true,
    invoker: "public",
    secrets: [appleTeamId, appleKeyId, applePrivateKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }

    try {
      const uid = await uidFromRequest(req.get("Authorization"));
      const code = readAuthorizationCode(req.body);
      if (!code) {
        res.status(400).json({ error: "APPLE_CODE_MISSING" });
        return;
      }
      const refreshToken = await exchangeAuthorizationCode(code);
      await saveRefreshToken(uid, refreshToken);
      res.status(200).json({ stored: true });
    } catch (error) {
      const status = errorStatus(error);
      logger.error("Store Apple refresh token failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(status).json({ error: errorCode(error) });
    }
  }
);

/**
 * Revokes the user's Sign in with Apple refresh token.
 * A fresh authorization code is exchanged first when the app sends one.
 * Accounts that never used Apple sign-in succeed without calling Apple.
 */
export const revokeAppleToken = onRequest(
  {
    region: "europe-west2",
    cors: true,
    invoker: "public",
    secrets: [appleTeamId, appleKeyId, applePrivateKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }

    try {
      const uid = await uidFromRequest(req.get("Authorization"));
      const user = await getAuth().getUser(uid);
      const usesApple = user.providerData.some(
        (provider) => provider.providerId === "apple.com"
      );
      if (!usesApple) {
        res.status(200).json({ revoked: false });
        return;
      }

      const code = readAuthorizationCode(req.body);
      const refreshToken = code
        ? await exchangeAuthorizationCode(code)
        : await readRefreshToken(uid);
      if (!refreshToken) {
        res.status(409).json({ error: "APPLE_TOKEN_MISSING" });
        return;
      }

      await revokeRefreshToken(refreshToken);
      await getFirestore().doc(`appleAuth/${uid}`).delete();
      res.status(200).json({ revoked: true });
    } catch (error) {
      const status = errorStatus(error);
      logger.error("Revoke Apple token failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(status).json({ error: errorCode(error) });
    }
  }
);

/**
 * Reads the Firebase user id from a bearer ID token.
 * @param header - Authorization header
 * @returns Firebase uid
 */
async function uidFromRequest(header: string | undefined): Promise<string> {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? "");
  if (!match?.[1]) {
    throw Object.assign(new Error("UNAUTHORIZED"), { status: 401 });
  }
  const decoded = await getAuth().verifyIdToken(match[1]);
  return decoded.uid;
}

/**
 * Reads an authorization code from a JSON body.
 * @param body - Request body
 * @returns Code, or null when it was not sent
 */
function readAuthorizationCode(body: unknown): string | null {
  const code = (body as { authorizationCode?: unknown } | null)?.authorizationCode;
  if (typeof code !== "string") return null;
  const trimmed = code.trim();
  return trimmed || null;
}

/**
 * Exchanges an authorization code for an Apple refresh token.
 * @param code - Authorization code from the device
 * @returns Refresh token
 */
async function exchangeAuthorizationCode(code: string): Promise<string> {
  const secret = clientSecret();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: APPLE_CLIENT_ID,
      client_secret: secret,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    await logAppleRejection("exchange", response);
    throw Object.assign(new Error("APPLE_TOKEN_EXCHANGE_FAILED"), { status: 502 });
  }
  const payload = (await response.json()) as { refresh_token?: string };
  const refreshToken = payload.refresh_token?.trim() ?? "";
  if (!refreshToken) {
    throw Object.assign(new Error("APPLE_REFRESH_TOKEN_MISSING"), { status: 502 });
  }
  return refreshToken;
}

/**
 * Revokes an Apple refresh token.
 * @param refreshToken - Token returned by Apple's token endpoint
 * @returns Promise that resolves when Apple accepts the revoke
 */
async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const response = await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: APPLE_CLIENT_ID,
      client_secret: clientSecret(),
      token: refreshToken,
      token_type_hint: "refresh_token",
    }),
  });
  if (!response.ok) {
    await logAppleRejection("revoke", response);
    throw Object.assign(new Error("APPLE_REVOKE_FAILED"), { status: 502 });
  }
}

/**
 * Logs why Apple refused a token or revoke request.
 * Apple's error body only holds a short code (e.g. invalid_client, invalid_grant),
 * so no token or key is logged.
 * @param step - Which Apple call failed
 * @param response - Apple's error response
 * @returns Promise that resolves when the reason is logged
 */
async function logAppleRejection(
  step: "exchange" | "revoke",
  response: Response
): Promise<void> {
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
    error_description?: unknown;
  } | null;
  logger.warn("Apple rejected the request", {
    step,
    status: response.status,
    appleError: typeof body?.error === "string" ? body.error : "unknown",
    appleErrorDescription:
      typeof body?.error_description === "string" ? body.error_description : "",
  });
}

/**
 * Saves the refresh token where only the server can read it.
 * @param uid - Firebase user id
 * @param refreshToken - Apple refresh token
 */
async function saveRefreshToken(uid: string, refreshToken: string): Promise<void> {
  await getFirestore().doc(`appleAuth/${uid}`).set({
    refreshToken,
    updatedAt: new Date(),
  });
}

/**
 * Reads a previously stored Apple refresh token.
 * @param uid - Firebase user id
 * @returns Refresh token, or null when this account has none
 */
async function readRefreshToken(uid: string): Promise<string | null> {
  const snap = await getFirestore().doc(`appleAuth/${uid}`).get();
  const token = snap.get("refreshToken");
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

/**
 * Signs a short-lived Apple client secret.
 * @returns JWT client secret
 */
function clientSecret(): string {
  return createAppleClientSecret({
    teamId: appleTeamId.value(),
    keyId: appleKeyId.value(),
    clientId: APPLE_CLIENT_ID,
    privateKey: applePrivateKey.value(),
  });
}

/**
 * Maps a thrown error onto an HTTP status.
 * @param error - Caught error
 * @returns HTTP status
 */
function errorStatus(error: unknown): number {
  const status = (error as { status?: number }).status;
  return typeof status === "number" ? status : 500;
}

/**
 * Maps a thrown error onto a stable error code.
 * @param error - Caught error
 * @returns Error code
 */
function errorCode(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "APPLE_REVOKE_FAILED";
}
