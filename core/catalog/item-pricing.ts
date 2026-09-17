/**
 * Price arithmetic for one configured item line.
 *
 * **Imports nothing, deliberately.** This module and `item-selection.ts` are the
 * two core modules a `"use client"` overlay reaches for by exact path, and the
 * measured cost of reaching `schemas.ts` from a client file — through the
 * `@/core/catalog` barrel or otherwise — is 476.8 KB gzipped first-load JS
 * against 406.4 KB, because zod pulls the whole `@/constants` package behind it
 * (`area-filters.tsx`, ledger M-012). So every input here is a **structural**
 * type describing the members this file reads, which `MenuItemDetail` satisfies
 * by construction and a localized view model satisfies too.
 *
 * **It is not `calculatePricing`, and it never becomes it.** `@/constants`
 * (`index.ts:2467`) owns subtotal, tax, delivery, platform fee, promo and tip,
 * and it takes lines that are **already priced** — `CartItemInput` at `:2120` is
 * `{price, quantity}`. This module produces exactly that `price`: the cost of one
 * configured line, before anything a cart does to it. Nothing here may grow a
 * fee, a tax or a discount.
 */

/** A combination as this module prices it: one already-parsed money value. */
export interface PricedCombination {
  /** The combination's own price at this branch. `0` is a legitimate value. */
  readonly price: number
}

/** An option as this module prices it. */
export interface PricedOption {
  /** The option's surcharge, already parsed. May be negative. */
  readonly priceModifier: number
}

/** An add-on as this module prices it. */
export interface PricedAddon {
  /** What adding it costs, per unit of the parent line. */
  readonly price: number
}

/**
 * The price of one combination — **including a legitimate zero.**
 *
 * A one-line function that exists to be the opposite of mobile's
 * `combinationPriceOrBase` (`useVariantPricing.ts:22-30`), which reads
 * `Number.parseFloat(price || "0")` and then discards anything not `> 0` in
 * favour of the item's base price. A free size, a zero-priced sample and a
 * genuinely mispriced row all silently become the base price there, so the app
 * charges for something the branch has set to nothing and no test can see it.
 * Logged as ledger M-038.
 *
 * There is no base-price fallback here at all: `menuItemCombinationSchema.price`
 * is required and non-nullable, so a combination that reached this function has
 * a price by construction.
 * @param combination - One purchasable combination
 * @returns Its price, exactly as the branch set it
 * @example combinationPrice({ price: 0 }) // -> 0
 */
export function combinationPrice(combination: PricedCombination): number {
  return combination.price
}

/**
 * The cheapest combination on an item, or `null` when it has none.
 *
 * **Not filtered by availability.** An item whose every combination is sold out
 * still has a price, and the overlay renders it beside a sold-out treatment
 * rather than rendering nothing — the same rule `MenuItemRow` follows for a
 * sold-out row, where "a price is what the dish costs, which does not stop being
 * true because the kitchen has run out of it".
 *
 * `null` rather than `0` for an empty list: `0` is a real price this domain has
 * to be able to express, so it cannot double as "there is no price".
 * @param combinations - Every combination on the item
 * @returns The lowest price, or `null` when there are no combinations
 * @example lowestCombinationPrice([{ price: 450 }, { price: 300 }]) // -> 300
 */
export function lowestCombinationPrice(
  combinations: readonly PricedCombination[]
): number | null {
  let lowest: number | null = null

  for (const combination of combinations) {
    const price = combinationPrice(combination)

    if (lowest === null || price < lowest) {
      lowest = price
    }
  }

  return lowest
}

/** An option id paired with the combination it appears in, for the delta map. */
interface DeltaCombination extends PricedCombination {
  readonly options: readonly { readonly id: string }[]
}

/**
 * What choosing each option adds to the cheapest line on the item.
 *
 * For every option: the **lowest** price among the combinations containing it,
 * minus the lowest price on the item overall. So the cheapest path reads `0` and
 * everything else reads what it costs above it — which is the only figure that
 * means anything before a full selection exists, since a single option has no
 * price of its own.
 *
 * Ported from mobile's `optionPriceMap` (`useVariantPricing.ts:157-227`) with
 * its display classification dropped: that hook returns an
 * `"included" | "base" | number` union which is a rendering decision, and a view
 * that wants "+Rs 50" can derive it from the number. Mobile also skips any
 * combination priced `<= 0`, which is the `combinationPriceOrBase` defect one
 * layer on; a zero-priced combination is kept here.
 *
 * Every delta is `0` on live data — `priceModifier` is `"0.00"` on all 111
 * options and combination prices do not vary per option in the seeded set — so
 * nothing may render a `+Rs X` affordance unconditionally.
 * @param combinations - Every combination on the item
 * @returns Option id to its delta above the cheapest line; empty when there are no combinations
 * @example optionPriceDeltas([{ price: 300, options: [{ id: "s" }] }, { price: 450, options: [{ id: "l" }] }]).get("l") // -> 150
 */
export function optionPriceDeltas(
  combinations: readonly DeltaCombination[]
): ReadonlyMap<string, number> {
  const lowest = lowestCombinationPrice(combinations)
  const deltas = new Map<string, number>()

  if (lowest === null) {
    return deltas
  }

  for (const combination of combinations) {
    const price = combinationPrice(combination)

    for (const option of combination.options) {
      const current = deltas.get(option.id)

      if (current === undefined || price - lowest < current) {
        deltas.set(option.id, price - lowest)
      }
    }
  }

  return deltas
}

/** Everything one configured line is priced from. */
export interface ItemLineTotalInput {
  /**
   * The item's own price, used when — and only when — there is no combination.
   *
   * Not a fallback for a combination that priced badly: that is exactly the
   * substitution {@link combinationPrice} exists to refuse. It is the price of
   * the 73% of items that have no combinations at all, where `menuItemDetailSchema.price`
   * is the only price there is.
   */
  readonly basePrice: number
  /**
   * The resolved combination, or `null` when the item has none.
   *
   * A caller whose selection resolves to nothing passes the cheapest
   * combination and marks its own line incomplete — see `selectionComplete`.
   * Passing `null` here means "this item has no combinations", not "the visitor
   * has not finished choosing".
   */
  readonly combination: PricedCombination | null
  /** The multi-select options chosen, which price through `priceModifier`. */
  readonly options: readonly PricedOption[]
  /** The add-ons chosen. */
  readonly addons: readonly PricedAddon[]
  /**
   * How many of this line.
   *
   * A parameter even though `mw-1-7` always passes `1` and renders no stepper.
   * `mw-2-1` needs the same arithmetic with a real quantity, and a function that
   * has to grow a parameter later is a function two callers will disagree about.
   */
  readonly quantity: number
}

/** One priced line, broken down so a caller can show its parts. */
export interface ItemLineTotal {
  /** The combination's price, or the item's base price when there is no combination. */
  readonly unitBase: number
  /** Sum of the chosen multi-select options' modifiers. May be negative. */
  readonly optionsTotal: number
  /** Sum of the chosen add-ons' prices. */
  readonly addonsTotal: number
  /** What one of this line costs. */
  readonly unitTotal: number
  /** The quantity the total was computed at. */
  readonly quantity: number
  /** What the whole line costs. */
  readonly total: number
}

/**
 * Prices one configured line, and stops there.
 *
 * **This is the seam `mw-2-1` plugs into.** The value it returns is a `price`
 * for `calculatePricing`'s `CartItemInput` and nothing more: no fee, no tax, no
 * promo, no minimum-order check. Those belong to `@/constants`, which both apps
 * and all five backends pin, and reimplementing any of them here is the single
 * worst outcome available (Rule 1).
 *
 * A breakdown rather than a bare number, because a line that shows only its
 * total cannot explain itself — and because the cart story needs the same parts
 * to render an order summary without re-deriving them from a selection it no
 * longer holds.
 * @param input - The resolved combination, chosen options and add-ons, and a quantity
 * @returns The line's parts and its total
 * @example itemLineTotal({ basePrice: 450, combination: null, options: [], addons: [], quantity: 1 }).total // -> 450
 */
export function itemLineTotal(input: ItemLineTotalInput): ItemLineTotal {
  const { addons, basePrice, combination, options, quantity } = input
  const unitBase =
    combination === null ? basePrice : combinationPrice(combination)
  let optionsTotal = 0
  let addonsTotal = 0

  for (const option of options) {
    optionsTotal += option.priceModifier
  }

  for (const addon of addons) {
    addonsTotal += addon.price
  }

  const unitTotal = unitBase + optionsTotal + addonsTotal

  return {
    addonsTotal,
    optionsTotal,
    quantity,
    total: unitTotal * quantity,
    unitBase,
    unitTotal
  }
}

// Re-exported so catalog callers keep importing the seed type from this domain.
// The authored value lives in `@/constants`.
// It is re-exported here to avoid circular dependencies.
export * from "@/constants/geo-taxonomy/item-pricing"
