/** Decimal wire values, matching `schemas.ts`'s reading of the same columns. */
const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/

/**
 * Reads a `priceModifier` off the wire, answering `0` for anything unusable.
 *
 * **Tolerant on purpose, and it is the one money reader in this domain that
 * is.** A price the domain cannot read has to fail the record — a menu that
 * quotes a number nobody agreed to is worse than a menu that does not render.
 * A *modifier* is different: it is a delta on top of a price that already
 * parsed, so an unreadable one costs that option its surcharge rather than
 * costing the item its page. That is the same trade `degradableImageRefSchema`
 * makes one field over, reached from the other direction.
 *
 * Negative values are preserved. `priceSchema` floors at `NUMBER_LIMITS.PRICE_MIN`
 * (`0`), which is right for a price and wrong for a delta: a "without cheese"
 * option worth `-50` is a shape the column allows and deal pricing uses.
 *
 * Ported from mobile's `useVariantPricing.ts`, which is the one part of that
 * hook this domain reproduces unchanged.
 * @param raw - The value as it arrived, of unknown shape
 * @returns The modifier as a finite number, or `0` when there is nothing to read
 * @example parsePriceModifier("0.00") // -> 0
 * @example parsePriceModifier("-50") // -> -50
 * @example parsePriceModifier("n/a") // -> 0
 */
export function parsePriceModifier(raw: unknown): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : 0
  }

  if (typeof raw !== "string" || !DECIMAL_REGEX.test(raw)) {
    return 0
  }

  const parsed = Number(raw)

  return Number.isFinite(parsed) ? parsed : 0
}
