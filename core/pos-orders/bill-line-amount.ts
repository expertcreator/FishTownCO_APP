import { roundMoney } from "./tender"

export interface BillLineAmountAddon {
  price?: number | string | null
  quantity?: number | string | null
}

export interface BillLineAmountInput {
  price?: number | string | null
  subtotal?: number | string | null
  quantity?: number | string | null
  addons?: BillLineAmountAddon[] | null
}

function money(raw: number | string | null | undefined): number {
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function qty(raw: number | string | null | undefined): number {
  if (raw == null || raw === "") {
    return 1
  }
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * Sums add-on unit price × quantity for a bill/cart line.
 * @param addons - Line add-ons
 * @returns Add-on total, or 0
 */
export function billLineAddonAmount(
  addons?: BillLineAmountAddon[] | null
): number {
  let total = 0
  for (const addon of addons ?? []) {
    const addonQty = qty(addon.quantity)
    if (addonQty <= 0) {
      continue
    }
    total = roundMoney(total + money(addon.price) * addonQty)
  }
  return total
}

/**
 * Parent product amount only. Add-on prices stay on the nested addon rows.
 * @param line - Server/cart line
 * @returns Product unit × quantity, or subtotal minus add-ons when price is missing
 * @example
 * billLineProductAmount({
 *   price: 100,
 *   subtotal: 100,
 *   quantity: 1,
 *   addons: [{ price: 100, quantity: 1 }]
 * })
 * // 100
 */
export function billLineProductAmount(line: BillLineAmountInput): number {
  const quantity = qty(line.quantity)
  const productOnly = roundMoney(money(line.price) * Math.max(1, quantity))
  if (productOnly > 0) {
    return productOnly
  }
  const reported = money(line.subtotal)
  const addons = billLineAddonAmount(line.addons)
  if (addons > 0 && reported > addons) {
    return roundMoney(reported - addons)
  }
  return reported
}

/**
 * Line total including add-ons when the server subtotal is product-only.
 * Use for bill footers, not the parent product price.
 * @param line - Server/cart line
 * @returns Amount to settle for this line
 * @example
 * billLineTotal({
 *   price: 100,
 *   subtotal: 100,
 *   quantity: 1,
 *   addons: [{ price: 100, quantity: 1 }]
 * })
 * // 200
 */
export function billLineTotal(line: BillLineAmountInput): number {
  const quantity = qty(line.quantity)
  const unit = money(line.price)
  const productOnly = roundMoney(unit * Math.max(1, quantity))
  const reported = money(line.subtotal) || productOnly
  const addons = billLineAddonAmount(line.addons)
  if (addons <= 0) {
    return reported
  }
  if (reported + 0.005 >= productOnly + addons) {
    return reported
  }
  return roundMoney(reported + addons)
}

/**
 * Raises bill subtotal/total when line add-on prices were omitted by the API.
 * @param input - Server totals plus item rows
 * @param input.subtotal - Reported bill subtotal
 * @param input.total - Reported bill total
 * @param input.items - Bill lines with add-ons
 * @returns Totals that include missing add-on amounts
 */
export function billAmountsIncludingAddons(input: {
  subtotal: number
  total: number
  items?: BillLineAmountInput[] | null
}): { subtotal: number; total: number } {
  const reportedSubtotal = roundMoney(Math.max(0, Number(input.subtotal) || 0))
  const reportedTotal = roundMoney(Math.max(0, Number(input.total) || 0))
  let lines = 0
  for (const item of input.items ?? []) {
    lines = roundMoney(lines + billLineTotal(item))
  }
  const delta = roundMoney(Math.max(0, lines - reportedSubtotal))
  return {
    subtotal: roundMoney(reportedSubtotal + delta),
    total: roundMoney(reportedTotal + delta)
  }
}
