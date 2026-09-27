type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

/**
 * Normalizes Firebase error codes (strips brackets / whitespace).
 * @param error - Unknown thrown value
 * @returns Normalized code string, or empty string
 */
export function getAuthErrorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "";
  }
  const raw = (error as { code: unknown }).code;
  if (typeof raw !== "string") return "";
  return raw.replace(/^\[|\]$/g, "").trim();
}

/**
 * Reads a human message from a Firebase / native error when present.
 * @param error - Unknown thrown value
 * @returns Message string or empty
 */
export function getAuthErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return String(error ?? "");
  }
  const e = error as {
    message?: unknown;
    nativeErrorMessage?: unknown;
  };
  if (typeof e.nativeErrorMessage === "string" && e.nativeErrorMessage) {
    return e.nativeErrorMessage;
  }
  if (typeof e.message === "string" && e.message) {
    return e.message;
  }
  return "";
}

/**
 * Maps a Firebase Auth / Firestore error into a localized message.
 * @param error - Unknown thrown value from Auth or Firestore
 * @param t - Translation function
 * @returns User-facing error string
 */
export function mapAuthError(error: unknown, t: Translate): string {
  const code = getAuthErrorCode(error);
  const message = getAuthErrorMessage(error);
  console.log("[mapAuthError]", {
    code,
    message,
  });

  if (
    message === "GOOGLE_SIGNIN_CANCELLED" ||
    message === "APPLE_SIGNIN_CANCELLED"
  ) {
    return t("auth.social-signin-cancelled");
  }
  if (
    message === "APPLE_SIGNIN_UNSUPPORTED" ||
    message === "GOOGLE_SIGNIN_NO_TOKEN" ||
    message === "APPLE_SIGNIN_NO_TOKEN"
  ) {
    return t("auth.social-signin-error");
  }

  switch (code) {
    case "auth/email-already-in-use":
      return t("auth.error-email-in-use");
    case "auth/invalid-email":
      return t("auth.error-invalid-email");
    case "auth/weak-password":
      return t("auth.error-weak-password");
    case "auth/network-request-failed":
      return t("auth.error-network");
    case "auth/too-many-requests":
      return t("auth.error-too-many-requests");
    case "auth/operation-not-allowed":
      return t("auth.error-operation-not-allowed");
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return t("auth.error-invalid-credentials");
    case "auth/user-disabled":
      return t("auth.error-user-disabled");
    case "auth/configuration-not-found":
    case "auth/invalid-api-key":
    case "auth/app-not-authorized":
      return t("auth.error-firebase-config");
    case "firestore/permission-denied":
    case "permission-denied":
      return t("auth.error-permission");
    default: {
      const detail = getAuthErrorMessage(error);
      const fallback = t("auth.error-auth-failed");
      if (code || detail) {
        return `${fallback}\n\n[${code || "unknown"}] ${detail}`.trim();
      }
      return fallback;
    }
  }
}
