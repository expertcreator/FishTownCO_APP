import { doc, getDoc } from "@react-native-firebase/firestore";
import { firebaseFirestore } from "@/features/common/firebase";

/** Public version check. Collection `appConfig`, document `version`. */
export const APP_CONFIG_COLLECTION = "appConfig";
export const APP_CONFIG_DOC_ID = "version";

export type AppConfigResponse = {
  enforced: boolean;
  minimumVersion: string | null;
};

const OPEN: AppConfigResponse = {
  enforced: false,
  minimumVersion: null,
};

/**
 * Reads `enforced` and `minimumVersion` from the version document.
 * @param raw - Document data
 * @returns Config that does not block when the fields are missing
 */
export function parseAppConfigBody(raw: unknown): AppConfigResponse {
  if (raw == null || typeof raw !== "object") return OPEN;
  const record = raw as Record<string, unknown>;
  const rawEnforced = record.enforced;
  const enforced =
    rawEnforced === true ||
    rawEnforced === 1 ||
    String(rawEnforced).toLowerCase() === "true";
  const rawMinimum = record.minimumVersion;
  const minimumVersion =
    rawMinimum == null
      ? null
      : typeof rawMinimum === "string"
        ? rawMinimum.trim()
        : String(rawMinimum).trim();

  return {
    enforced,
    minimumVersion: minimumVersion ? minimumVersion : null,
  };
}

/**
 * Reads `appConfig/version`. A missing document does not block the app.
 * @returns Parsed version check
 */
export async function fetchAppConfig(): Promise<AppConfigResponse> {
  const snap = await getDoc(
    doc(firebaseFirestore, APP_CONFIG_COLLECTION, APP_CONFIG_DOC_ID)
  );
  if (!snap.exists()) return OPEN;
  return parseAppConfigBody(snap.data());
}
