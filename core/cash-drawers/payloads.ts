import {
  CASH_DRAWER_IN_CATEGORY,
  CASH_DRAWER_OCCURRENCE_MAX_AGE_MS,
  NON_DRAWER_PAYMENT_METHOD
} from "./constants"
import { isPositiveCashDrawerKeypadAmount } from "./keypad"
import type {
  CashDrawerEntryValidationErrors,
  CashEntryCategory,
  CreateCashEntryBody
} from "./types"

/**
 * Validates amount and occurrence bounds shared by cash in/out.
 * @param amount - Keypad digit string
 * @param occurredAt - Selected occurrence time
 * @param nowMs - Clock used for future/90-day checks
 * @returns Field errors keyed for the money namespace
 */
export function validateCashDrawerOccurrence(
  amount: string,
  occurredAt: Date | null,
  nowMs = Date.now()
): CashDrawerEntryValidationErrors {
  const errors: CashDrawerEntryValidationErrors = {}
  if (!isPositiveCashDrawerKeypadAmount(amount)) {
    errors.amount = "validation.amount-required"
  }
  if (!occurredAt) {
    errors.occurredAt = "validation.occurred-at-required"
    return errors
  }
  const occurredMs = occurredAt.getTime()
  if (occurredMs > nowMs) {
    errors.occurredAt = "validation.occurred-at-future"
  } else if (nowMs - occurredMs > CASH_DRAWER_OCCURRENCE_MAX_AGE_MS) {
    errors.occurredAt = "validation.occurred-at-too-old"
  }
  return errors
}

/**
 * Builds the create payload for adding change to the drawer.
 * @param input - Branch, keypad amount, and occurrence
 * @returns POST /cash-entries body
 * @example
 * buildCashDrawerInPayload({
 *   branchId: "11111111-1111-1111-1111-111111111111",
 *   amount: "55",
 *   occurredAt: new Date("2026-08-17T10:08:00.000Z")
 * })
 */
export function buildCashDrawerInPayload(input: {
  branchId: string
  amount: string
  occurredAt: Date
}): CreateCashEntryBody {
  return {
    branchId: input.branchId,
    direction: "in",
    category: CASH_DRAWER_IN_CATEGORY,
    amount: input.amount.trim(),
    affectsDrawer: true,
    occurredAt: input.occurredAt.toISOString()
  }
}

/**
 * Builds the create payload for a cash-out entry.
 * @param input - Branch, amount, reason, drawer toggle, note, and occurrence
 * @returns POST /cash-entries body
 */
export function buildCashDrawerOutPayload(input: {
  branchId: string
  amount: string
  category: CashEntryCategory
  affectsDrawer: boolean
  note: string
  occurredAt: Date
  relatedUserId?: string | null
}): CreateCashEntryBody {
  const note = input.note.trim()
  const relatedUserId = input.relatedUserId?.trim()
  return {
    branchId: input.branchId,
    direction: "out",
    category: input.category,
    amount: input.amount.trim(),
    affectsDrawer: input.affectsDrawer,
    occurredAt: input.occurredAt.toISOString(),
    ...(input.affectsDrawer
      ? {}
      : { paymentMethod: NON_DRAWER_PAYMENT_METHOD }),
    ...(note ? { note } : {}),
    ...(relatedUserId ? { relatedUserId } : {})
  }
}
