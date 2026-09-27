import type { CountryCode as LibPhoneCountryCode } from "libphonenumber-js";

/**
 * ISO 3166-1 alpha-2 country code (e.g. `"GB"`, `"PK"`).
 * Aliased to `libphonenumber-js` so calling-code helpers stay in sync.
 */
export type CountryCode = LibPhoneCountryCode;

/**
 * Minimal country shape used by PhoneInput and CountryPickerSheet.
 */
export type Country = {
  /** ISO 3166-1 alpha-2 code. */
  cca2: CountryCode;
  /** Calling code(s), digits only, no `+`. First entry is primary. */
  callingCode: string[];
  /** Localized display name (falls back to the ISO code). */
  name: string;
};

/** Default country for FishTown maritime crew contacts (UK). */
export const DEFAULT_PHONE_COUNTRY: CountryCode = "GB";
