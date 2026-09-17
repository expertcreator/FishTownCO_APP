/**
 * The branch minimum-order gate.
 *
 * Extracted from mobile's two `useMemo`s
 * (`ViewCartDetailScreen.tsx:1270-1276` derives the value,
 * `:1592-1598` derives `meetsMinimumOrder` / `showMinimumOrderWarning`), which
 * spell the same three outcomes across two hooks and a boolean pair.
 *
 * **Three outcomes, not two.** "The minimum is not met" and "there is no
 * minimum to check" are different facts and must not collapse into one falsy
 * value: mobile guards the second with a separate `tenantMinimumOrderResolved`
 * flag precisely so an unresolved minimum blocks nothing and quotes nothing.
 * Web has no fetch to be pending, but a cart saved before the capture existed
 * lands in the same state, and it must not be told it is Rs 0 short.
 */

/** What the gate decided. */
export interface MinimumOrderGate {
  /**
   * `met` — there is no minimum, or the subtotal reaches it; `below` — the
   * subtotal is short by {@link MinimumOrderGate.shortfall}; `unresolved` — no
   * minimum was captured, so nothing is known and nothing is claimed.
   */
  readonly status: "met" | "below" | "unresolved"
  /** How much is missing. `0` for any status other than `below`. */
  readonly shortfall: number
}

/**
 * Whether the cart clears the branch's minimum order.
 *
 * An empty cart is `met`, not `below`: a visitor who has added nothing is not
 * "short" of anything, and mobile's `checkoutItems.length > 0` guard says the
 * same thing at the warning site.
 * @param minimumOrder - The branch minimum captured at add time, or `null`
 * @param subtotal - The cart subtotal
 * @param lineCount - How many lines the cart holds
 * @returns The status and, when `below`, the missing amount
 * @example minimumOrderGate(500, 300, 1) // -> { status: "below", shortfall: 200 }
 */
export function minimumOrderGate(
  minimumOrder: number | null | undefined,
  subtotal: number,
  lineCount: number
): MinimumOrderGate {
  // A non-finite SUBTOTAL is unresolved too, not `below`: the subtraction would
  // answer `NaN` and the shortfall note renders it verbatim as "Rs NaN".
  if (
    minimumOrder === null ||
    minimumOrder === undefined ||
    !(Number.isFinite(minimumOrder) && Number.isFinite(subtotal))
  ) {
    return { shortfall: 0, status: "unresolved" }
  }

  if (lineCount === 0 || minimumOrder <= 0 || subtotal >= minimumOrder) {
    return { shortfall: 0, status: "met" }
  }

  return { shortfall: minimumOrder - subtotal, status: "below" }
}
