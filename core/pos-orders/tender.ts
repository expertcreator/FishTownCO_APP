import type { PosPartPayResult, PosTenderSnapshot } from "./types"

/**
 * Rounds to 2 decimal places.
 * @param value - Raw number
 * @returns Currency-safe amount
 */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export type EditedBillLine = {
  id: string
  quantity: number
}

export type EditedBillItem = {
  id: string
  quantity?: number | null
  price?: number | null
  subtotal?: number | null
}

function unitPriceFromItem(item: EditedBillItem): number {
  const qty = Number(item.quantity) || 0
  const subtotal = Number(item.subtotal)
  if (qty > 0 && Number.isFinite(subtotal)) {
    return roundMoney(subtotal / qty)
  }
  return roundMoney(Number(item.price) || 0)
}

/**
 * Recalculates subtotal/total after local qty/void so paid vs due stays honest.
 * Keeps server extras (tax, delivery, discount) as `total - subtotal`.
 * @param input - Server totals plus current lines
 * @returns Updated subtotal and total
 */
export function estimateEditedBillAmounts(input: {
  serverTotal: number
  serverSubtotal: number
  items: EditedBillItem[]
  lines: EditedBillLine[]
}): { subtotal: number; total: number } {
  const serverTotal = roundMoney(Math.max(0, Number(input.serverTotal) || 0))
  const serverSubtotal = roundMoney(
    Math.max(0, Number(input.serverSubtotal) || 0)
  )
  let subtotal = 0
  for (const line of input.lines) {
    const qty = Math.max(0, Number(line.quantity) || 0)
    if (qty <= 0) {
      continue
    }
    const item = input.items.find((row) => String(row.id) === String(line.id))
    if (!item) {
      continue
    }
    subtotal = roundMoney(subtotal + unitPriceFromItem(item) * qty)
  }
  const extras = roundMoney(serverTotal - serverSubtotal)
  return {
    subtotal,
    total: roundMoney(Math.max(0, subtotal + extras))
  }
}

/**
 * Cash still owed after prior payments.
 * @param totalInput - Current bill total
 * @param receivedInput - Amount already collected
 * @returns Remaining due, or 0 when paid in full or overpaid
 */
export function remainingBillDue(
  totalInput: number,
  receivedInput: number
): number {
  const total = roundMoney(Math.max(0, Number(totalInput) || 0))
  const received = roundMoney(Math.max(0, Number(receivedInput) || 0))
  return roundMoney(Math.max(0, total - received))
}

/**
 * Cash tender math (exact / over / short).
 * @param totalInput - Amount due
 * @param receivedInput - Cash received
 * @returns Tender snapshot
 */
export function computeTender(
  totalInput: number,
  receivedInput: number
): PosTenderSnapshot {
  const total = roundMoney(Math.max(0, Number(totalInput) || 0))
  const received = roundMoney(Math.max(0, Number(receivedInput) || 0))

  if (received <= 0) {
    return {
      kind: "empty",
      total,
      received: 0,
      changeToGive: 0,
      shortBy: 0,
      balanceDue: total
    }
  }

  const diff = roundMoney(received - total)
  if (diff === 0) {
    return {
      kind: "exact",
      total,
      received,
      changeToGive: 0,
      shortBy: 0,
      balanceDue: 0
    }
  }
  if (diff > 0) {
    return {
      kind: "over",
      total,
      received,
      changeToGive: diff,
      shortBy: 0,
      balanceDue: 0
    }
  }
  return {
    kind: "short",
    total,
    received,
    changeToGive: 0,
    shortBy: roundMoney(-diff),
    balanceDue: roundMoney(-diff)
  }
}

/**
 * Cash amount to persist when settling or taking payment.
 * Over-tender records only what is still owed, not the cash handed over.
 * @param input - Prior payments, amount due, and this tender
 * @param input.priorReceived - Amount already recorded on the bill
 * @param input.amountDue - Remaining amount owed
 * @param input.cashTendered - Cash handed over this turn
 * @param input.paymentMethod - Tender method (`cash` or card)
 * @param input.grandTotal - Current bill total
 * @returns Recorded received total for the backend
 */
export function resolveSettleReceivedAmount(input: {
  priorReceived: number
  amountDue: number
  cashTendered: number
  paymentMethod: string
  grandTotal: number
}): number {
  if (input.paymentMethod !== "cash") {
    return roundMoney(Math.max(0, Number(input.grandTotal) || 0))
  }

  const priorReceived = roundMoney(
    Math.max(0, Number(input.priorReceived) || 0)
  )
  const amountDue = roundMoney(Math.max(0, Number(input.amountDue) || 0))
  const cashTendered = roundMoney(Math.max(0, Number(input.cashTendered) || 0))

  if (amountDue <= 0) {
    return priorReceived
  }

  const tender = computeTender(amountDue, cashTendered)
  if (tender.kind === "over") {
    return roundMoney(priorReceived + amountDue)
  }

  return roundMoney(priorReceived + cashTendered)
}

/**
 * Cash short-tender must be > 0 and < total. Never fabricate exact.
 * @param received - Typed cash
 * @param grandTotal - Bill total
 * @returns ok or part-payment-invalid
 */
export function validateCashPartPay(
  received: number,
  grandTotal: number
): PosPartPayResult {
  const part = Number(received)
  const total = Number(grandTotal)
  if (!(Number.isFinite(part) && Number.isFinite(total))) {
    return { ok: false, code: "part-payment-invalid" }
  }
  if (part <= 0 || part >= total) {
    return { ok: false, code: "part-payment-invalid" }
  }
  return { ok: true }
}
