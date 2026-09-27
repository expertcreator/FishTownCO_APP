import {
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { DEFAULT_PHONE_COUNTRY } from "@/ui/types/country";

/**
 * Builds a flag emoji from an ISO country code.
 * @param countryCode - ISO 3166-1 alpha-2 code
 * @returns Flag emoji string
 */
export function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127_397 + char.charCodeAt(0))
    );
}

/**
 * Returns the international calling-code digits for a country.
 * @param countryCode - ISO country code
 * @returns Calling code without `+` (defaults to GB `44`)
 */
export function getCallingCode(countryCode: CountryCode): string {
  try {
    return getCountryCallingCode(countryCode);
  } catch {
    return getCountryCallingCode(DEFAULT_PHONE_COUNTRY);
  }
}

/**
 * Validates a national mobile number for the selected country.
 * @param nationalNumber - Digits (and spaces) typed by the user
 * @param countryCode - Selected ISO country
 * @returns Whether the number is a valid phone for that country
 */
export function isValidNationalPhone(
  nationalNumber: string,
  countryCode: CountryCode
): boolean {
  const trimmed = nationalNumber.trim();
  if (!trimmed) return false;
  try {
    return isValidPhoneNumber(trimmed, countryCode);
  } catch {
    return false;
  }
}

/**
 * Formats a national number + country into E.164 for storage / `tel:` links.
 * @param nationalNumber - National number from the form
 * @param countryCode - Selected ISO country
 * @returns E.164 string, or a best-effort `+{cc}{digits}` fallback
 */
export function formatPhoneE164(
  nationalNumber: string,
  countryCode: CountryCode
): string {
  const trimmed = nationalNumber.trim();
  const parsed = parsePhoneNumberFromString(trimmed, countryCode);
  if (parsed?.isValid()) {
    return parsed.format("E.164");
  }
  const digits = trimmed.replace(/\D/g, "");
  return `+${getCallingCode(countryCode)}${digits}`;
}

/**
 * Splits a stored phone string into country + national number for form hydrate.
 * @param storedPhone - Value from Firestore (E.164 preferred)
 * @returns Country code and national number for the form
 */
export function splitStoredPhone(storedPhone: string): {
  countryCode: CountryCode;
  nationalNumber: string;
} {
  const trimmed = storedPhone.trim();
  if (!trimmed) {
    return { countryCode: DEFAULT_PHONE_COUNTRY, nationalNumber: "" };
  }
  const parsed = parsePhoneNumberFromString(trimmed);
  if (parsed?.country) {
    return {
      countryCode: parsed.country,
      nationalNumber: parsed.nationalNumber,
    };
  }
  return {
    countryCode: DEFAULT_PHONE_COUNTRY,
    nationalNumber: trimmed.replace(/^\+/, ""),
  };
}
