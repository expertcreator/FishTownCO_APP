import type { CountryCode as LibPhoneCountryCode } from "libphonenumber-js";

/**
 * ISO 3166-1 alpha-2 country code (e.g. `"PK"`, `"US"`).
 *
 * Aliased to `libphonenumber-js`'s `CountryCode` so it stays in sync with the
 * library the app already uses for phone parsing/validation. Replaces the
 * `CountryCode` type that used to come from `react-native-country-picker-modal`.
 */
export type CountryCode = LibPhoneCountryCode;

/**
 * Minimal country shape shared by the phone-input flows and the in-house
 * `CountryPickerSheet`. Replaces the `Country` type from the (abandoned)
 * `react-native-country-picker-modal` — only the fields the app actually reads
 * are kept (`cca2`, `callingCode[0]`).
 */
export type Country = {
  /** ISO 3166-1 alpha-2 code. */
  cca2: CountryCode;
  /** Calling code(s), digits only, no `+`. First entry is the primary one. */
  callingCode: string[];
  /** Localized display name (falls back to the ISO code). */
  name: string;
};
