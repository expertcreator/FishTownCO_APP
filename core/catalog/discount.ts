/**
 * Derived discount math for a product carrying a strikethrough comparison
 * price.
 *
 * **Imports nothing, deliberately.** Same rule as `item-pricing.ts`: this is
 * the shape a `"use client"` leaf reaches for by exact path, and every input
 * here is a plain number a caller has already parsed through `priceSchema`.
 */

/**
 * The percentage a dish is discounted by, or `null` when there is nothing
 * honest to claim.
 *
 * Answers `null` rather than `0` for every case that is not a genuine
 * markdown — no comparison price, one at or below the selling price, a
 * non-positive one — so a caller can treat `null` as "omit the badge".
 *
 * Rounded to the nearest whole percent; a fractional percent reads as a bug.
 * @param price - The item's real price; `priceSchema` has already parsed it
 * @param compareAtPrice - The struck-through "was" price, or `null` when the item is not marked down
 * @returns The whole-percent discount, or `null` when there is none to state
 * @example discountPercent(450, 900) // -> 50
 * @example discountPercent(450, null) // -> null
 * @example discountPercent(450, 450) // -> null
 */
export function discountPercent(
  price: number,
  compareAtPrice: number | null
): number | null {
  if (
    compareAtPrice === null ||
    compareAtPrice <= 0 ||
    compareAtPrice <= price
  ) {
    return null
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}
