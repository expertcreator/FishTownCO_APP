import { Toastify } from "@/shared/components/Toast";
import { t, hasKey } from "@/shared/utils/i18n";
import axios from "axios";

export const ORDER_PLACEMENT_BLOCKED_CONTACT_SUPPORT_CODE =
  "ORDER_PLACEMENT_BLOCKED_CONTACT_SUPPORT" as const;

const DEFAULT_SUPPORT_EMAIL = "support@fishtownco.itoasis.co";

/** When the API returns this code (e.g. 403), show InactiveUserSheet instead of a generic toast. */
export function parseOrderPlacementBlockedError(err: unknown): {
  supportEmail: string;
} | null {
  if (!axios.isAxiosError(err)) {
    return null;
  }
  const data = err.response?.data;
  if (!data || typeof data !== "object") {
    return null;
  }
  const code = (data as { code?: string }).code;
  if (code !== ORDER_PLACEMENT_BLOCKED_CONTACT_SUPPORT_CODE) {
    return null;
  }
  const params = (data as { params?: Record<string, unknown> }).params;
  const raw =
    params &&
    typeof params === "object" &&
    typeof params.email === "string" &&
    params.email.trim().length > 0
      ? params.email.trim()
      : DEFAULT_SUPPORT_EMAIL;
  return { supportEmail: raw };
}

export const TENANT_UNAVAILABLE_CODE = "TENANT_UNAVAILABLE";

/** Detects HTTP 402 TENANT_UNAVAILABLE from POST /orders (tenant fee-blocked). Returns true if matched, null otherwise. */
export function parseTenantUnavailableError(err: unknown): true | null {
  if (!axios.isAxiosError(err)) {
    return null;
  }
  if (err.response?.status !== 402) {
    return null;
  }
  const data = err.response?.data;
  if (!data || typeof data !== "object") {
    return null;
  }
  if ((data as { error?: string }).error === TENANT_UNAVAILABLE_CODE) {
    return true;
  }
  return null;
}

type ApiErrorBodyLoose =
  | { code?: unknown; error?: { code?: unknown }; message?: unknown }
  | string
  | undefined
  | null;

type ParsedErrorData = {
  code?: unknown;
  error?: {
    code?: unknown;
  };
  message?: unknown;
};

function extractCode(data: ApiErrorBodyLoose): string | undefined {
  try {
    const maybeString = typeof data === "string" ? data : undefined;
    const parsed = maybeString ? JSON.parse(maybeString) : data;
    if (parsed && typeof parsed === "object") {
      const direct = (parsed as ParsedErrorData).code;
      if (typeof direct === "string") {
        return direct;
      }
      const nested = (parsed as ParsedErrorData).error?.code;
      if (typeof nested === "string") {
        return nested;
      }
    }
  } catch {
    // ignore JSON parse errors
  }
  return;
}

/** Reads `code`, nested `error.code`, or a string `error` field from a JSON error body. */
export function extractErrorCodeFromResponseBody(
  data: unknown
): string | undefined {
  if (data == null || typeof data !== "object") {
    return;
  }
  const rec = data as Record<string, unknown>;
  const fromStructured = extractCode(data as ApiErrorBodyLoose);
  if (fromStructured) {
    return fromStructured;
  }
  const errField = rec.error;
  if (typeof errField === "string" && errField.trim()) {
    return errField.trim();
  }
  return;
}

export function extractApiErrorCode(err: unknown): string | undefined {
  if (!axios.isAxiosError(err)) {
    return;
  }
  return extractErrorCodeFromResponseBody(err.response?.data);
}

function extractMessage(data: ApiErrorBodyLoose): string | undefined {
  try {
    const maybeString = typeof data === "string" ? data : undefined;
    const parsed = maybeString ? JSON.parse(maybeString) : data;
    if (parsed && typeof parsed === "object") {
      const message = (parsed as ParsedErrorData).message;
      if (typeof message === "string") {
        return message;
      }
    }
  } catch {
    // ignore JSON parse errors
  }
  return;
}

/**
 * Codes whose meaning is "your input is invalid — see `message` for what specifically failed".
 * For these, the server's `message` field (e.g. "Password must be at least 8 characters") is
 * more useful than the generic translated copy, so we try `message` first.
 */
const ENVELOPE_ERROR_CODES = new Set<string>([
  "VALIDATION_ERROR",
  "BAD_REQUEST",
]);

// Map HTTP status codes to error codes
function getErrorCodeFromStatus(status?: number): string | undefined {
  if (!status) {
    return;
  }

  const statusCodeMap: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_SERVER_ERROR",
    503: "SERVICE_UNAVAILABLE",
  };

  return statusCodeMap[status];
}

// Sanitize message to create a valid translation key
// Converts "User not found!" → "USER_NOT_FOUND"
// Converts "Invalid email@domain" → "INVALID_EMAIL_DOMAIN"
function sanitizeMessageKey(message: string): string {
  return message
    .toUpperCase()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^A-Z0-9_]/g, "_") // Replace all non-alphanumeric (except underscore) with underscore
    .replace(/_+/g, "_") // Replace multiple consecutive underscores with single underscore
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
}

// Check if a message looks like a technical/internal error (stack traces, file paths, etc.)
function isTechnicalError(message: string): boolean {
  const technicalIndicators = [
    /at\s+\w+\.\w+/i, // Stack trace patterns: "at function.name"
    /\.(js|ts|tsx|jsx):\d+:\d+/i, // File paths with line numbers
    /Error:\s*\w+Error/i, // Error class names
    /stack\s+trace/i, // "stack trace"
    /internal\s+server/i, // "internal server"
    /database\s+error/i, // "database error"
    /sql/i, // SQL errors
  ];
  return technicalIndicators.some((pattern) => pattern.test(message));
}

const EMAIL_IN_MESSAGE_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

/**
 * Avoid showing raw API text that exposes email addresses or numeric OTPs in toasts.
 */
export const getSafeToastErrorMessage = (
  message: string | undefined,
  fallback: string
): string => {
  if (message == null || typeof message !== "string") {
    return fallback;
  }
  const m = message.trim();
  if (!m) {
    return fallback;
  }
  if (EMAIL_IN_MESSAGE_RE.test(m)) {
    return fallback;
  }
  if (/^\d{4,10}$/.test(m)) {
    return fallback;
  }
  return m;
};

export function toastServerCode(err: unknown, fallback = "unexpected_error") {
  // Get current language direction for RTL/LTR support
  const currentDirection = t("meta.direction") || "ltr";
  const isRTL = currentDirection === "rtl";

  // RTL styling for toast messages
  const rtlTextStyle = {
    textAlign: isRTL ? ("right" as const) : ("left" as const),
    writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
  };

  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBodyLoose;
    const status = err.response?.status;

    let code = extractCode(data);
    if (!code && status) {
      code = getErrorCodeFromStatus(status);
    }
    const message = extractMessage(data);

    /**
     * Envelope codes (`VALIDATION_ERROR`, `BAD_REQUEST`) carry the actionable text in
     * `message`. Try the message-based path FIRST for them so the user sees what
     * specifically failed (e.g. "Password must be at least 8 characters") instead of
     * the generic "Something doesn't look right."
     */
    const preferMessageOverCode =
      code != null && ENVELOPE_ERROR_CODES.has(code) && Boolean(message);

    if (code && !preferMessageOverCode) {
      const translationKey = `error-codes.${code}`;
      if (hasKey(translationKey)) {
        Toastify.error(t(translationKey), { textStyle: rtlTextStyle });
        return;
      }
    }

    if (message) {
      const messageKey = sanitizeMessageKey(message);
      if (messageKey) {
        const translationKey = `error-codes.${messageKey}`;
        if (hasKey(translationKey)) {
          Toastify.error(t(translationKey), { textStyle: rtlTextStyle });
          return;
        }
      }
      if (isTechnicalError(message)) {
        Toastify.error(t(`error-codes.${fallback}`), {
          textStyle: rtlTextStyle,
        });
        return;
      }
      const safeMessage = getSafeToastErrorMessage(
        message,
        t(`error-codes.${fallback}`)
      );
      Toastify.error(safeMessage, { textStyle: rtlTextStyle });
      return;
    }

    Toastify.error(t(`error-codes.${fallback}`), { textStyle: rtlTextStyle });
    return;
  }

  // Not an axios error, use fallback
  Toastify.error(t(`error-codes.${fallback}`), { textStyle: rtlTextStyle });
}
