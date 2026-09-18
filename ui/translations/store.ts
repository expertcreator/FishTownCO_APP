import { createZustandMMKVStorage, mmkv } from "@/ui/stores/mmkvStorage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "./translations";

// Persisted state (data only)
type I18nPersistedState = {
  language: Language;
  hasExplicitLanguage: boolean;
};

// Full store state (includes actions)
type I18nState = I18nPersistedState & {
  setLanguage: (lng: Language, options?: { explicit?: boolean }) => void;
  resetLanguage: () => void;
  _hasHydrated: boolean;
};

// Type for old store structure (for migration)
type OldI18nState = {
  locale?: Language | null;
  language?: Language;
  hasExplicitLanguage?: boolean;
};

const OLD_STORAGE_KEY = "locale";
const NEW_STORAGE_KEY = "i18n-storage";
const I18N_PERSIST_VERSION = 1;
const VALID_LANGUAGES: Language[] = ["en", "ar", "ur", "rmu"];

const initialState = {
  language: "en" as Language,
  hasExplicitLanguage: false,
  _hasHydrated: false,
};

/**
 * Writes language preference to MMKV immediately so a reload cannot drop it.
 * @param state - Persisted i18n fields
 * @returns Nothing
 */
function persistI18nState(state: I18nPersistedState): void {
  mmkv.set(
    NEW_STORAGE_KEY,
    JSON.stringify({
      state,
      version: I18N_PERSIST_VERSION,
    })
  );
}

/**
 * Check if a value is a valid Language
 */
const isValidLanguage = (value: unknown): value is Language =>
  typeof value === "string" && VALID_LANGUAGES.includes(value as Language);

/**
 * Extract language from various old storage formats
 * Returns the language if found, or null if not extractable
 */
const extractLanguageFromOldData = (data: string): Language | null => {
  // Case 1: Raw string value (e.g., "ar" or "en")
  const trimmed = data.trim();
  if (isValidLanguage(trimmed)) {
    return trimmed;
  }

  // Case 2: JSON-quoted string (e.g., '"ar"')
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const unquoted = trimmed.slice(1, -1);
    if (isValidLanguage(unquoted)) {
      return unquoted;
    }
  }

  // Case 3: Try parsing as JSON for object formats
  try {
    const parsed = JSON.parse(data) as unknown;

    // Case 3a: Zustand persist format { state: { language/locale } }
    if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as Record<string, unknown>;

      // Zustand format: { state: { language } } or { state: { locale } }
      if (obj.state && typeof obj.state === "object") {
        const state = obj.state as Record<string, unknown>;
        if (isValidLanguage(state.language)) {
          return state.language;
        }
        if (isValidLanguage(state.locale)) {
          return state.locale;
        }
      }

      // Top-level object: { language } or { locale }
      if (isValidLanguage(obj.language)) {
        return obj.language;
      }
      if (isValidLanguage(obj.locale)) {
        return obj.locale;
      }
    }

    // Case 3b: Parsed to a valid language string
    if (isValidLanguage(parsed)) {
      return parsed;
    }
  } catch {
    // JSON parsing failed, already tried raw string above
  }

  return null;
};

/**
 * One-time migration from old storage key ("locale") to new key ("i18n-storage")
 * This runs synchronously before the store is created to ensure data isn't lost
 * Only deletes the old key if a valid language was successfully extracted
 */
const migrateFromOldStorageKey = (): void => {
  try {
    // Check if new key already has data (migration already done)
    const newKeyData = mmkv.getString(NEW_STORAGE_KEY);
    if (newKeyData) {
      return; // Already migrated, nothing to do
    }

    // Check if old key has data
    const oldKeyData = mmkv.getString(OLD_STORAGE_KEY);
    if (!oldKeyData) {
      return; // No old data to migrate
    }

    // Extract language from old data (handles multiple formats)
    const language = extractLanguageFromOldData(oldKeyData);

    // Only migrate and delete if we found a valid language
    if (language) {
      persistI18nState({
        language,
        hasExplicitLanguage: language !== "en",
      });

      // Clean up old key only after successful migration with valid language
      mmkv.delete(OLD_STORAGE_KEY);
    }
    // If no valid language found, leave old key intact and use default state
  } catch {
    // Migration failed - leave old key intact and use default state
  }
};

// Run migration before store creation
migrateFromOldStorageKey();

/**
 * Reads the persisted UI language from MMKV, if a valid value exists.
 * @returns Stored language code, or `null` when nothing valid is saved
 */
export function readPersistedLanguage(): Language | null {
  const data = mmkv.getString(NEW_STORAGE_KEY);
  if (!data) {
    return null;
  }
  return extractLanguageFromOldData(data);
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setLanguage: (lng, options) => {
        const explicit = options?.explicit ?? true;
        const next = {
          language: lng,
          hasExplicitLanguage: explicit ? true : get().hasExplicitLanguage,
        };
        persistI18nState(next);
        set(next);
      },
      resetLanguage: () => {
        const next = {
          language: "en" as Language,
          hasExplicitLanguage: false,
        };
        persistI18nState(next);
        set(next);
      },
    }),
    {
      name: NEW_STORAGE_KEY,
      storage: createZustandMMKVStorage<I18nPersistedState>(),
      version: I18N_PERSIST_VERSION,
      partialize: (state) => ({
        language: state.language,
        hasExplicitLanguage: state.hasExplicitLanguage,
      }),
      onRehydrateStorage: () => () => {
        useI18nStore.setState({ _hasHydrated: true });
      },
      // Migrate from old store structure (handles state shape changes)
      migrate: (persistedState, _version) => {
        const state = persistedState as OldI18nState;
        const language = state?.language || state?.locale || "en";
        return {
          language,
          hasExplicitLanguage:
            state?.hasExplicitLanguage ?? language !== "en",
        };
      },
    }
  )
);
