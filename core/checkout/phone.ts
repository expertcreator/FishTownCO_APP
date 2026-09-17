/**
 * The Pakistan checkout-contact phone rules, as pure regex — mobile's
 * `editProfileSchema.ts:31-94` (`meetsPakistanCheckoutContactRules`) with the
 * libphonenumber half left to the app on purpose: this package must not pull
 * a phone-metadata library into every consumer (`mw-2-5` Never-clause), so
 * the app composes these rules WITH `libphonenumber-js`'s general validity
 * check rather than instead of it.
 *
 * The number is collected and validated, NOT OTP-verified — mobile's
 * checkout gate is commented out (`ViewCartDetailScreen.tsx:2370`) and web
 * mirrors that; enforcing verification is a product decision, not a rule
 * here.
 */

/** The default (and, today, only special-cased) checkout country. */
export const DEFAULT_CHECKOUT_COUNTRY = "PK"

/** Pakistan's E.164 country calling code, digits only. */
export const PAKISTAN_CALLING_CODE = "92"

/**
 * A Pakistani mobile NSN: `3` then nine digits. Landlines and short codes
 * fail this on purpose — a checkout contact is a mobile.
 */
export const PAKISTAN_MOBILE_NSN_PATTERN = /^3\d{9}$/

/** All-zero tail — `3000000000` and kin. */
const ZERO_TAIL = /^0{9}$/

/** One digit repeated through the tail — `3111111111` and kin. */
const REPEATED_TAIL = /^(\d)\1{8}$/

/**
 * True for an obvious placeholder: a well-formed Pakistani mobile NSN whose
 * nine-digit tail is all zeros or one repeated digit. Mobile's
 * `isObviousPakistanMobilePlaceholder`, verbatim — including answering
 * `false` for input that is not a well-formed NSN at all, which the caller
 * rejects on the pattern instead.
 * @param nsn - The candidate national significant number, digits only
 * @returns Whether it is a placeholder
 * @example isPakistanPlaceholderNsn("3000000000") // -> true
 */
export function isPakistanPlaceholderNsn(nsn: string): boolean {
  if (!PAKISTAN_MOBILE_NSN_PATTERN.test(nsn)) {
    return false
  }

  const tail = nsn.slice(1)

  return ZERO_TAIL.test(tail) || REPEATED_TAIL.test(tail)
}

/**
 * True for an NSN this checkout will accept as a Pakistani mobile: matches
 * the pattern and is not a placeholder.
 * @param nsn - The candidate national significant number, digits only
 * @returns Whether checkout accepts it
 * @example isValidPakistanMobileNsn("3001234567") // -> true
 */
export function isValidPakistanMobileNsn(nsn: string): boolean {
  return PAKISTAN_MOBILE_NSN_PATTERN.test(nsn) && !isPakistanPlaceholderNsn(nsn)
}

/**
 * The one checkout-contact rule, mobile's shape: Pakistani numbers must be
 * a non-placeholder mobile NSN; every other country passes here and is left
 * to the app's general phone validation.
 * @param countryCode - ISO 3166-1 alpha-2 country of the number
 * @param nsn - The national significant number, digits only
 * @returns Whether the checkout-contact rules accept the number
 * @example meetsPakistanCheckoutContactRules("PK", "3111111111") // -> false
 */
export function meetsPakistanCheckoutContactRules(
  countryCode: string,
  nsn: string
): boolean {
  // Case-insensitive: a lowercased "pk" from a caller must not bypass the
  // rules.
  if (countryCode.toUpperCase() !== DEFAULT_CHECKOUT_COUNTRY) {
    return true
  }

  return isValidPakistanMobileNsn(nsn)
}

/**
 * Composes the E.164 form of a Pakistani mobile NSN — what the order payload
 * carries (`mw-2-7`) and what mobile's `composedCheckoutPhone` produces.
 * @param nsn - A valid Pakistani mobile NSN, digits only
 * @returns The `+92…` E.164 string
 * @example composePakistanE164("3001234567") // -> "+923001234567"
 */
export function composePakistanE164(nsn: string): string {
  return `+${PAKISTAN_CALLING_CODE}${nsn}`
}
