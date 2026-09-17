/**
 * The rules a view must not invent: which options can be chosen together, which
 * combination a selection resolves to, whether the selection is finished, and
 * which add-ons that combination unlocks.
 *
 * **Every function here is a place the mobile screen this rebuilds gets it
 * wrong.** `TenantProductsDetail.tsx` is 2,566 lines of which roughly 700 are
 * these decisions, spread across a hook, a widget and three `useMemo`s, and the
 * spread is why `maxSelections` ends up enforced only at toggle time
 * (`VariantSelector.tsx:608-612`, never re-checked at add-to-cart) and why
 * `isAvailable` is read nowhere at all. Ported as pure functions, each one is a
 * table-driven test rather than a screen.
 *
 * **Imports nothing, deliberately** — see `item-pricing.ts`'s header for the
 * measurement. Inputs are structural types describing the members this file
 * reads; `MenuItemDetail` satisfies them by construction, and so does a
 * localized view model carrying extra display members.
 */

/** One choice inside a picker, as this module identifies it. */
export interface SelectableOption {
  /** The option's id, which is what a selection holds. */
  readonly id: string
}

/** One picker, as this module reads it. */
export interface SelectableVariant {
  /** The variant's id, which keys a selection. */
  readonly id: string
  /**
   * `"multiple"` is a modifier group priced by `priceModifier`; anything else —
   * **including a value the schema defaulted** — is single-select and priced
   * only through combinations. The one predicate that splits the two kinds
   * apart, ported from mobile's `variantSelection.ts:4`.
   */
  readonly selectionType: "single" | "multiple"
  /** Whether the visitor must choose from this group at all. */
  readonly isRequired: boolean
  /** Fewest choices this group accepts. `0` on every live variant. */
  readonly minSelections: number
  /** Most choices this group accepts, or `null` for no ceiling. */
  readonly maxSelections: number | null
  /** The choices, in the order the backend returned them. */
  readonly options: readonly SelectableOption[]
}

/** One option as a combination names it. */
export interface SelectableCombinationOption {
  /** The option's id. */
  readonly id: string
  /** The variant that option belongs to. */
  readonly variantId: string
}

/** One purchasable price point, as this module reads it. */
export interface SelectableCombination {
  /** The combination's id, which gates add-ons. */
  readonly id: string
  /** Whether this exact path can be ordered right now. */
  readonly isAvailable: boolean
  /** Every option the combination is made of, across all single-select variants. */
  readonly options: readonly SelectableCombinationOption[]
}

/** One add-on, as this module reads it. */
export interface SelectableAddon {
  /** The **link** id, unique per `(product, addon)` pair. */
  readonly id: string
  /**
   * The combinations this add-on applies to, or `null` for all of them.
   *
   * `null` and `[]` mean opposite things and must never be conflated — see
   * `menuItemAddonSchema`.
   */
  readonly selectedCombinationIds: readonly string[] | null
}

/** An item, reduced to the three collections these rules read. */
export interface SelectableItem {
  /** Every picker on the item. */
  readonly variants: readonly SelectableVariant[]
  /** Every purchasable price point at this branch. */
  readonly combinations: readonly SelectableCombination[]
  /** Every add-on offered alongside it. */
  readonly addons: readonly SelectableAddon[]
}

/**
 * What a visitor has chosen so far.
 *
 * Single-select and multi-select are **separate maps**, not one map of arrays,
 * because they are priced by different mechanisms — a single-select choice is
 * priced only by the combination it forms, a multi-select choice only by its own
 * `priceModifier` — and a shape that let one be read as the other is a shape
 * that eventually prices a line twice.
 */
export interface ItemSelection {
  /** Variant id to the one option chosen, for single-select variants. */
  readonly options: Readonly<Record<string, string>>
  /** Variant id to the options chosen, for multi-select variants. */
  readonly modifiers: Readonly<Record<string, readonly string[]>>
  /** Link ids of the add-ons chosen. */
  readonly addonIds: readonly string[]
}

/** Nothing chosen at all — the starting point every builder extends. */
const EMPTY_SELECTION: ItemSelection = {
  addonIds: [],
  modifiers: {},
  options: {}
}

/**
 * The single-select variants, in the order they were given.
 *
 * Single-select is the default reading, so this filters on `"multiple"` rather
 * than testing for `"single"` — the column is nullable and the schema defaults
 * it, and a positive test would silently reclassify anything unrecognised as a
 * modifier group priced by `priceModifier` instead of by a combination.
 * @param variants - Every picker on the item
 * @returns Only the pickers that resolve through combinations
 * @example singleSelectVariantsOf([{ selectionType: "multiple", ... }]).length // -> 0
 */
export function singleSelectVariantsOf<TVariant extends SelectableVariant>(
  variants: readonly TVariant[]
): TVariant[] {
  return variants.filter((variant) => variant.selectionType !== "multiple")
}

/**
 * Whether a combination's single-select options match a selection exactly.
 * @param combination - The combination under test
 * @param singleVariantIds - Ids of every single-select variant
 * @param chosen - The option ids chosen across those variants
 * @returns `true` when the two option sets are equal
 */
function combinationMatches(
  combination: SelectableCombination,
  singleVariantIds: ReadonlySet<string>,
  chosen: ReadonlySet<string>
): boolean {
  const ids = combination.options
    .filter((option) => singleVariantIds.has(option.variantId))
    .map((option) => option.id)

  return ids.length === chosen.size && ids.every((id) => chosen.has(id))
}

/**
 * The combination a selection resolves to, or `null` until it resolves to one.
 *
 * **Set equality over the single-select option ids, and nothing weaker.** A
 * combination is a specific point in the product of every single-select variant,
 * so a subset match would resolve "Large" alone onto whichever "Large + Beef"
 * row happened to come first and price the line as though a second choice had
 * been made. Multi-select options are excluded from the comparison entirely:
 * they are modifiers, they do not appear in combination rows, and including them
 * would make every match fail.
 *
 * `null` while any single-select variant is unchosen. That is a real state
 * rather than an error — it is what the overlay renders its "pick an option"
 * prompt from — and it is why `selectionComplete` exists as a separate
 * predicate.
 *
 * Ported from mobile's `getMatchingCombination` (`useVariantPricing.ts:250-286`).
 * @param item - The item being configured
 * @param selection - What has been chosen so far
 * @returns The resolved combination, or `null`
 * @example resolveCombination(item, { options: {}, modifiers: {}, addonIds: [] }) // -> null
 */
export function resolveCombination<TItem extends SelectableItem>(
  item: TItem,
  selection: ItemSelection
): TItem["combinations"][number] | null {
  const singles = singleSelectVariantsOf(item.variants)

  if (singles.length === 0 || item.combinations.length === 0) {
    return null
  }

  const chosen: string[] = []

  for (const variant of singles) {
    const optionId = selection.options[variant.id]

    // Every single-select variant must be chosen. Resolving a partial selection
    // is the subset match above, arrived at by a different route.
    if (optionId === undefined) {
      return null
    }

    chosen.push(optionId)
  }

  const singleVariantIds = new Set(singles.map((variant) => variant.id))
  const chosenIds = new Set(chosen)

  return (
    item.combinations.find((combination) =>
      combinationMatches(combination, singleVariantIds, chosenIds)
    ) ?? null
  )
}

/**
 * The options of one variant that can still be chosen, given the others.
 *
 * **The cross-filter is what makes "this pair forms no combination"
 * unreachable by clicking.** An option that appears in no combination alongside
 * the current choices is not offered at all, so a visitor cannot assemble a
 * selection the branch does not sell — which is why the matrix row for an
 * unmatched option set describes a state reached only by hand-editing the URL.
 *
 * A multi-select variant is never filtered: its options are modifiers, they
 * appear in no combination row, and filtering them against combinations would
 * remove every one of them.
 *
 * **Availability is not a filter here.** A sold-out combination's options stay
 * offered and are marked sold out where they are rendered, matching
 * `MenuItemRow`'s rule that an out-of-stock item is shown in place and never
 * hidden — hiding it makes the page disagree with the restaurant's real menu.
 *
 * Ported from mobile's `getAvailableOptions` (`VariantSelector.tsx:491-540`),
 * which is pure and had no business living inside a widget.
 * @param item - The item being configured
 * @param variantId - The variant whose options are being offered
 * @param selection - What has been chosen so far
 * @returns The offerable options, in the backend's order; `[]` for an unknown variant
 * @example availableOptionsFor(item, "size", selection).length // -> 2
 */
export function availableOptionsFor<TItem extends SelectableItem>(
  item: TItem,
  variantId: string,
  selection: ItemSelection
): TItem["variants"][number]["options"][number][] {
  const variant = item.variants.find((entry) => entry.id === variantId)

  if (variant === undefined) {
    return []
  }

  const options = [
    ...variant.options
  ] as TItem["variants"][number]["options"][number][]

  if (variant.selectionType === "multiple") {
    return options
  }

  const others = singleSelectVariantsOf(item.variants)
    .filter(
      (entry) =>
        entry.id !== variantId && selection.options[entry.id] !== undefined
    )
    .map((entry) => ({
      optionId: selection.options[entry.id],
      variantId: entry.id
    }))

  if (others.length === 0) {
    return options
  }

  const offerable = new Set<string>()

  for (const combination of item.combinations) {
    const agrees = others.every((other) =>
      combination.options.some(
        (option) =>
          option.variantId === other.variantId && option.id === other.optionId
      )
    )

    if (agrees) {
      for (const option of combination.options) {
        if (option.variantId === variantId) {
          offerable.add(option.id)
        }
      }
    }
  }

  return options.filter((option) => offerable.has(option.id))
}

/**
 * The selection an overlay opens with.
 *
 * **The first offerable option of each single-select variant, chosen in
 * order** — so each choice narrows the next through {@link availableOptionsFor}
 * and the default always resolves to a real combination when the item has one.
 * Mobile picks `options[0]` of every variant independently
 * (`TenantProductsDetail.tsx:953-984`), which on an item whose first sizes and
 * first flavours do not co-occur opens on a selection matching nothing, and its
 * price line then falls back to the cheapest combination with no explanation.
 *
 * It is the **first** option rather than the cheapest, matching mobile: the
 * backend orders options by `position`, which is an editorial decision the
 * restaurant made, and re-sorting it by price would present a menu the
 * restaurant did not write. Multi-select groups start empty and add-ons start
 * unchosen — both are additions the visitor opts into.
 *
 * It does **not** steer away from a sold-out combination. The matrix's rule is
 * that an unavailable path is shown and marked, not hidden, and silently
 * landing on a different size than the one listed first would be a different
 * kind of lie.
 * @param item - The item being configured
 * @returns The opening selection; empty for the 73% of items with no variants
 * @example defaultSelection({ variants: [], combinations: [], addons: [] }).options // -> {}
 */
export function defaultSelection(item: SelectableItem): ItemSelection {
  const singles = singleSelectVariantsOf(item.variants)

  if (singles.length === 0) {
    return EMPTY_SELECTION
  }

  const options: Record<string, string> = {}

  for (const variant of singles) {
    const offerable = availableOptionsFor(item, variant.id, {
      addonIds: [],
      modifiers: {},
      options
    })
    const first = offerable[0]

    if (first !== undefined) {
      options[variant.id] = first.id
    }
  }

  return { addonIds: [], modifiers: {}, options }
}

/**
 * Whether one multi-select group's chosen count is inside its bounds.
 * @param variant - The multi-select variant
 * @param chosen - Option ids chosen in it
 * @returns `true` when the count satisfies the group's own rules
 */
function modifierCountIsValid(
  variant: SelectableVariant,
  chosen: readonly string[]
): boolean {
  // A required group needs at least one even when `minSelections` says `0`,
  // which is the live shape: `minSelections` is `0` on every variant in
  // production. Mobile's `variantSelectionsComplete` reaches the same figure
  // (`TenantProductsDetail.tsx:879-905`) and it is the one part of that
  // function worth keeping.
  const min = variant.isRequired
    ? Math.max(variant.minSelections, 1)
    : variant.minSelections

  if (chosen.length < min) {
    return false
  }

  // THE CHECK MOBILE NEVER MAKES. `VariantSelector.tsx:608-612` refuses a
  // toggle past the ceiling and nothing re-checks it, so a selection restored
  // from a cart, deep-linked, or assembled while the widget was unmounted goes
  // to the kitchen over the limit. Ledger M-038.
  return (
    variant.maxSelections === null || chosen.length <= variant.maxSelections
  )
}

/**
 * Whether a selection is finished enough to be priced as a real line.
 *
 * Four rules, and core owns all four:
 *
 * - every single-select variant has a choice, and that choice is one of its own
 *   options;
 * - every multi-select group meets its effective minimum, where a required
 *   group's minimum is at least one however `minSelections` reads;
 * - **no multi-select group exceeds `maxSelections`**;
 * - the single-select choices together resolve to a real combination.
 *
 * It says nothing about **availability**, deliberately. "Finished" and
 * "orderable right now" are different facts with different remedies — one is
 * fixed by choosing, the other by coming back later — and collapsing them would
 * make a sold-out item look like an unfinished form.
 * @param item - The item being configured
 * @param selection - What has been chosen
 * @returns `true` when every rule is satisfied
 * @example selectionComplete({ variants: [], combinations: [], addons: [] }, selection) // -> true
 */
export function selectionComplete(
  item: SelectableItem,
  selection: ItemSelection
): boolean {
  for (const variant of item.variants) {
    if (variant.selectionType === "multiple") {
      if (
        !modifierCountIsValid(variant, selection.modifiers[variant.id] ?? [])
      ) {
        return false
      }

      continue
    }

    const chosen = selection.options[variant.id]

    if (
      chosen === undefined ||
      !variant.options.some((option) => option.id === chosen)
    ) {
      return false
    }
  }

  // An item with single-select variants but no resolvable combination is not
  // orderable, whatever its pickers say — the combination IS the product.
  return (
    singleSelectVariantsOf(item.variants).length === 0 ||
    resolveCombination(item, selection) !== null
  )
}

/**
 * The add-ons offered against one resolved combination.
 *
 * **`selectedCombinationIds` gating does not exist on mobile at all** — the
 * field appears once in its type declarations (`shared/types/db.ts:199`) and is
 * referenced nowhere — so every add-on is offered against every combination
 * there. It is real on 4 of the 5 live add-ons, and it is the one add-on rule
 * that has to work: an add-on scoped to the large size must disappear when the
 * selection moves to the small one.
 *
 * A `null` combination — nothing resolved yet — offers only the ungated
 * add-ons. Offering a gated one before its gate is known would let a visitor
 * choose an extra that the next click withdraws.
 * @param item - The item being configured
 * @param combinationId - The resolved combination's id, or `null`
 * @returns The add-ons that apply, in the backend's order
 * @example addonsFor(item, null).length // -> however many are ungated
 */
export function addonsFor<TItem extends SelectableItem>(
  item: TItem,
  combinationId: string | null
): TItem["addons"][number][] {
  return item.addons.filter((addon) => {
    if (addon.selectedCombinationIds === null) {
      return true
    }

    return (
      combinationId !== null &&
      addon.selectedCombinationIds.includes(combinationId)
    )
  }) as TItem["addons"][number][]
}

/**
 * Whether an item has combinations and every one of them is sold out.
 *
 * A named predicate rather than an expression at a call site, because it is a
 * state with its own copy and its own matrix row: **one live item is in it**,
 * and it is not the same thing as `isAvailable: false` on the item. The item is
 * approved and on the menu; there is simply no path through its pickers that can
 * be ordered right now, so the overlay opens, shows the dish, and offers nothing.
 *
 * `false` for an item with no combinations at all — those are the 73% that are
 * ordered directly, and their availability is the item's own flag.
 * @param item - The item being configured
 * @returns `true` only when combinations exist and none is available
 * @example allCombinationsUnavailable({ variants: [], combinations: [], addons: [] }) // -> false
 */
export function allCombinationsUnavailable(item: SelectableItem): boolean {
  return (
    item.combinations.length > 0 &&
    item.combinations.every((combination) => !combination.isAvailable)
  )
}
