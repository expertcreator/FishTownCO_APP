import {
  CASH_DRAWER_KEYPAD_KEYS,
  CASH_DRAWER_KEYPAD_MAX_DIGITS
} from "./constants"
import type { CashDrawerKeypadKey } from "./types"

const NON_DIGITS = /\D/g
const LEADING_ZEROS = /^0+(?=\d)/
const ALL_ZEROS = /^0+$/
const DIGITS_ONLY = /^\d+$/

/**
 * Applies one keypad press to the current integer amount string.
 * @param current - Digits already entered
 * @param key - Keypad key including `back`
 * @param maxDigits - Maximum digit count
 * @returns Updated digit string
 * @example
 * applyCashDrawerKeypad("12", "00")
 * // "1200"
 */
export function applyCashDrawerKeypad(
  current: string,
  key: CashDrawerKeypadKey,
  maxDigits = CASH_DRAWER_KEYPAD_MAX_DIGITS
): string {
  if (key === "back") {
    return current.slice(0, -1)
  }
  const next = `${current}${key}`
  const digitsOnly = next.replace(NON_DIGITS, "")
  if (digitsOnly.length > maxDigits) {
    return current
  }
  return digitsOnly.replace(LEADING_ZEROS, "")
}

/**
 * Sanitizes a typed amount from a text field (digits only, max length).
 * @param raw - Raw input value
 * @param maxDigits - Maximum digit count
 * @returns Digit string with leading zeros stripped
 */
export function sanitizeTypedCashDrawerAmount(
  raw: string,
  maxDigits = CASH_DRAWER_KEYPAD_MAX_DIGITS
): string {
  const digitsOnly = raw.replace(NON_DIGITS, "").slice(0, maxDigits)
  if (!digitsOnly) {
    return ""
  }
  return digitsOnly.replace(LEADING_ZEROS, "")
}

/**
 * Returns whether the keypad value is a positive integer amount.
 * @param value - Current keypad string
 * @returns True when the amount can be saved
 */
export function isPositiveCashDrawerKeypadAmount(value: string): boolean {
  if (!value) {
    return false
  }
  if (!DIGITS_ONLY.test(value)) {
    return false
  }
  return value !== "0" && !ALL_ZEROS.test(value)
}

/**
 * Maps a keyboard key name to a keypad key when it is a digit action.
 * @param event - Object with a `key` field (DOM KeyboardEvent or equivalent)
 * @returns Matching keypad key, or null
 */
export function keyboardEventToCashDrawerKey(event: {
  key: string
}): CashDrawerKeypadKey | null {
  if (event.key === "Backspace") {
    return "back"
  }
  for (const key of CASH_DRAWER_KEYPAD_KEYS) {
    if (key !== "back" && event.key === key) {
      return key
    }
  }
  return null
}
