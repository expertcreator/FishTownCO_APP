/**
 * The guest cart: one restaurant, lines built from a configured item view.
 *
 * **Core-first (tracker decision `logic-placement`).** Everything here is pure
 * TypeScript with structural inputs; the app's only jobs are persistence
 * (`src/features/cart/storage.ts`) and rendering. Imports stay inside
 * `src/core` and reach only the two zero-import catalog modules, so a
 * `"use client"` leaf can import this by exact path without dragging zod or
 * `@/constants` into the bundle (ledger M-012 — the same rule those modules
 * document).
 *
 * **It is not `calculatePricing` and it never becomes it** (Rule 1).
 * `cartToPricingItems` produces that function's `CartItemInput[]` — already
 * priced lines — and stops. Tax, delivery, platform fee, promo and tip belong
 * to `@/constants`, which five backends pin.
 *
 * **Add-ons ride the line, one per unit.** Mobile stores add-ons as separate
 * `isAddon` cart rows and re-nests them at payload time; here they stay nested
 * on their parent from the start, which is the shape the order API takes
 * (`orderValidation.ts` — `addons: [{ productId, inventoryId, quantity }]`)
 * and the shape `itemLineTotal` already prices. An add-on's order quantity is
 * the line's quantity — retro-noted for the `mw-4-2` mobile retrofit.
 */

// TYPE-ONLY. `@/constants` is a 3k-line barrel that constructs zod schemas
// at module scope, and this file is on every route's first load through
// `floating-actions.tsx`. Measured 2026-09-08: the value import put the whole
// barrel plus zod in every route's client bundle, ~74 KB gzipped. The two
// values are restated below and pinned to the shared types with `satisfies`,
// so a change to either upstream fails `tsc` here instead of drifting.
import type {
  NUMBER_LIMITS,
  ORDER_FULFILLMENT,
  OrderFulfillment
} from "@/constants"
import { itemLineTotal } from "../catalog/item-pricing"
// TYPE-ONLY, and that is the M-012 byte decision restated: `delivery-rule.ts`
// imports zod at value level, and this module is imported by `"use client"`
// leaves on every route. A `import type` is erased before bundling, so the
// schema stays where it belongs — at the wire boundary, in the transport — and
// the persisted rule is narrowed by hand below like every other member here.
import type {
  Coordinates,
  TenantDeliveryChargeRule
} from "../pricing/delivery-rule"
import {
  addonsFor,
  type ItemSelection,
  resolveCombination,
  selectionComplete
} from "../catalog/item-selection"

const ORDER_FULFILLMENT_VALUES = [
  "delivery",
  "pickup",
  "hybrid"
] as const satisfies typeof ORDER_FULFILLMENT

const COORDINATE_LIMITS = {
  LATITUDE_MAX: 90,
  LATITUDE_MIN: -90,
  LONGITUDE_MAX: 180,
  LONGITUDE_MIN: -180
} as const satisfies Pick<
  typeof NUMBER_LIMITS,
  "LATITUDE_MAX" | "LATITUDE_MIN" | "LONGITUDE_MAX" | "LONGITUDE_MIN"
>

/** One add-on riding a cart line. Ordered at the line's own quantity. */
export interface CartAddonLine {
  /** The `product_addons` **link** id — what the overlay toggled. */
  readonly addonId: string
  /** The add-on **product's** id — what the order API names it by. */
  readonly productId: string
  /** Its branch inventory row id, or `null` until `be-3-1a` ships. */
  readonly inventoryId: string | null
  /** Display name, localized at add time. */
  readonly name: string
  /** Its per-unit price at add time. */
  readonly price: number
}

/** One chosen option inside a stored modifier group. */
export interface CartModifierOption {
  readonly optionId: string
  readonly optionName: string
  readonly priceModifier: number
}

/**
 * One multi-select group's choices, stored in the order payload's own shape
 * (`variantDetails.modifierSelections` — mobile emits it verbatim from an
 * identical structure, `cartStore.ts:ModifierSelection`).
 */
export interface CartModifierSelection {
  readonly variantId: string
  readonly variantName: string
  readonly selectionType: "multiple"
  readonly selectedOptions: readonly CartModifierOption[]
}

/** One configured, priced line. */
export interface CartLine {
  /** Identity of the configuration — two equal configs merge into quantity. */
  readonly lineId: string
  /** The product's id. */
  readonly productId: string
  /** The `?item=` key, so a cart row can reopen the overlay. */
  readonly itemKey: string
  /** Display name, localized at add time. */
  readonly name: string
  /** Row thumbnail, or `null`. */
  readonly imageUrl: string | null
  /** The resolved combination's id, or `null` for a plain item. */
  readonly combinationId: string | null
  /** Its inventory row id — the order API's identifier. `null` until `be-3-1a`. */
  readonly inventoryId: string | null
  /** The chosen single-select option names, joined for display. */
  readonly combinationLabel: string | null
  /**
   * What one unit costs: combination (or base) price plus modifier deltas.
   * **Add-ons are not in it** — they are priced from `addons`.
   */
  readonly unitPrice: number
  /** Sum of the modifier deltas inside {@link unitPrice}, kept for the payload. */
  readonly modifierTotal: number
  /** The multi-select choices, payload-shaped. */
  readonly modifierSelections: readonly CartModifierSelection[]
  /** The add-ons riding this line. */
  readonly addons: readonly CartAddonLine[]
  /** How many of this line. */
  readonly quantity: number
}

/** One restaurant's guest cart. `carts.ts` holds one of these per restaurant. */
export interface CartState {
  /** The restaurant every line belongs to, or `null` while empty. */
  readonly restaurantSlug: string | null
  /** Its display name, for the bar and the cart page. */
  readonly restaurantName: string | null
  /** The city segment of its URL, so the cart can link back to the menu. */
  readonly citySlug: string | null
  /**
   * The branch's flat delivery fee, captured from the public restaurant record
   * at add time (`mw-2-2`) — the ONLY honest fee source until the backend
   * exposes config (handover §4). `null` on a legacy cart that predates the
   * field; the totals panel then degrades to subtotal-plus-disclaimer.
   */
  readonly deliveryFee: number | null
  /** The branch's minimum order, captured the same way, or `null`. */
  readonly minimumOrder: number | null
  /**
   * The branch's tenant id, captured at add time (`mw-2-6`) so checkout can ask
   * whether it delivers to the chosen address without re-fetching the
   * restaurant. `null` on a cart saved before this field existed — checkout
   * then skips the coverage check rather than guessing, which is why no
   * migration is needed.
   */
  readonly tenantId: string | null
  /**
   * How the branch fulfils orders, captured the same way. Coverage rules bind
   * only for `delivery` and `hybrid` (`serviceabilityService.ts:74`), so a
   * pickup cart never asks. `null` on a legacy cart.
   */
  readonly fulfillment: OrderFulfillment | null
  /**
   * The branch's effective delivery-charge rule, captured at add time
   * (`mw-4-2`) — the tax rate and the distance-derived fee the backend will
   * actually charge, which the flat {@link CartState.deliveryFee} above only
   * approximates. `null` on a cart saved before this field existed, and on a
   * branch whose rule could not be read; the cart then prices exactly as it did
   * before, which is why no migration is needed.
   *
   * Captured rather than re-read at `/cart` or checkout on purpose: those two
   * surfaces do no catalog I/O, and adding one would put a network round trip
   * between a visitor and their own totals.
   */
  readonly deliveryRule: TenantDeliveryChargeRule | null
  /**
   * The branch's map pin, captured the same way — one half of the distance the
   * rule's per-km fee is measured over. `null` when the record carries none, in
   * which case the rule falls back to its `defaultDeliveryFee`.
   */
  readonly branchCoordinates: Coordinates | null
  readonly lines: readonly CartLine[]
}

/** Where a cart line's restaurant identity comes from. */
export interface CartRestaurantRef {
  readonly restaurantSlug: string
  readonly restaurantName: string
  readonly citySlug: string
  /** The branch's flat delivery fee, or `null` when the record carries none. */
  readonly deliveryFee: number | null
  /** The branch's minimum order, or `null` when the record carries none. */
  readonly minimumOrder: number | null
  /** The branch's tenant id — what the serviceability check is asked about. */
  readonly tenantId: string | null
  /** The branch's fulfilment mode, deciding whether coverage is asked at all. */
  readonly fulfillment: OrderFulfillment | null
  /** The branch's effective delivery-charge rule, or `null` when it could not be read. */
  readonly deliveryRule: TenantDeliveryChargeRule | null
  /** The branch's map pin, or `null` when the record carries none. */
  readonly branchCoordinates: Coordinates | null
}

/** The empty cart — also what unreadable persisted state degrades to. */
export const EMPTY_CART: CartState = {
  branchCoordinates: null,
  citySlug: null,
  deliveryFee: null,
  deliveryRule: null,
  fulfillment: null,
  lines: [],
  minimumOrder: null,
  tenantId: null,
  restaurantName: null,
  restaurantSlug: null
}

/** The order API's ceiling (`orderValidation.ts`: quantity 1..100). */
export const LINE_QUANTITY_MAX = 100

/**
 * An item view as this module builds lines from it.
 *
 * Structural, like every core input: `ItemDetailView` satisfies it by
 * construction, and a test can hand-build one. It also satisfies
 * `item-selection.ts`'s `SelectableItem` member-for-member, which is what lets
 * `resolveCombination` and `addonsFor` run over the same object — declared
 * standalone rather than by extension because intersecting two array-typed
 * members erases the element type TypeScript reads back.
 */
export interface CartableOption {
  readonly id: string
  readonly name: string
  readonly priceModifier: number
}

/** One picker, with the display members a cart line snapshots. */
export interface CartableVariant {
  readonly id: string
  readonly name: string
  readonly selectionType: "single" | "multiple"
  readonly isRequired: boolean
  readonly minSelections: number
  readonly maxSelections: number | null
  readonly options: readonly CartableOption[]
}

/** One purchasable price point, with its order identifier. */
export interface CartableCombination {
  readonly id: string
  readonly price: number
  readonly inventoryId: string | null
  readonly isAvailable: boolean
  readonly options: readonly {
    readonly id: string
    readonly variantId: string
  }[]
}

/** One add-on, with everything a cart add-on entry stores. */
export interface CartableAddon {
  readonly id: string
  readonly productId: string
  readonly name: string
  readonly price: number
  readonly inventoryId: string | null
  readonly isAvailable: boolean
  readonly isRequired: boolean
  readonly selectedCombinationIds: readonly string[] | null
}

/** The whole item, as {@link buildCartLine} reads it. */
export interface CartableItem {
  readonly id: string
  readonly key: string
  readonly name: string
  readonly imageUrl: string | null
  readonly basePrice: number
  /**
   * The item's own branch inventory row id — the line to order when it has
   * no combinations (the common, variant-less 73% of catalog items). A
   * resolved combination's own inventory id still wins; see
   * {@link buildCartLine}.
   */
  readonly inventoryId: string | null
  readonly variants: readonly CartableVariant[]
  readonly combinations: readonly CartableCombination[]
  readonly addons: readonly CartableAddon[]
}

/** Why a selection cannot become a cart line yet. */
export type CartLineProblem = "incomplete-selection" | "required-addon-missing"

/**
 * Every reason a selection is not orderable, or `[]` when it is.
 *
 * The required-add-on rule exists ONLY here and in mobile's toast check — the
 * backend never enforces it at order time (handover §3) — so the overlay must
 * gate on this rather than assume a later layer will.
 * @param item - The item being configured
 * @param selection - What has been chosen
 * @returns The problems, in gate order
 * @example lineProblems(item, selection) // -> []
 */
export function lineProblems(
  item: CartableItem,
  selection: ItemSelection
): CartLineProblem[] {
  const problems: CartLineProblem[] = []

  if (!selectionComplete(item, selection)) {
    problems.push("incomplete-selection")
  }

  const combination = resolveCombination(item, selection)
  const missingRequired = addonsFor(item, combination?.id ?? null).some(
    (addon) =>
      addon.isRequired &&
      addon.isAvailable &&
      !selection.addonIds.includes(addon.id)
  )

  if (missingRequired) {
    problems.push("required-addon-missing")
  }

  return problems
}

/**
 * Builds the line one configured item becomes.
 *
 * Prices through {@link itemLineTotal} — the same arithmetic the overlay's
 * total line shows — so what the visitor read is what the cart stores, to the
 * rupee. Returns `null` when {@link lineProblems} is non-empty; a caller that
 * wants the reasons asks that function.
 * @param item - The item being configured
 * @param selection - A complete selection
 * @param quantity - How many, clamped to `1..LINE_QUANTITY_MAX`
 * @returns The line, or `null` while the selection is not orderable
 * @example buildCartLine(item, selection, 2)?.quantity // -> 2
 */
export function buildCartLine(
  item: CartableItem,
  selection: ItemSelection,
  quantity: number
): CartLine | null {
  if (lineProblems(item, selection).length > 0) {
    return null
  }

  const combination = resolveCombination(item, selection)
  const offered = addonsFor(item, combination?.id ?? null)
  const chosenAddons = offered.filter(
    (addon) => addon.isAvailable && selection.addonIds.includes(addon.id)
  )
  const singleNames: string[] = []
  const modifierSelections: CartModifierSelection[] = []

  for (const variant of item.variants) {
    if (variant.selectionType === "multiple") {
      const chosen = selection.modifiers[variant.id] ?? []
      const selectedOptions = variant.options
        .filter((option) => chosen.includes(option.id))
        .map((option) => ({
          optionId: option.id,
          optionName: option.name,
          priceModifier: option.priceModifier
        }))

      if (selectedOptions.length > 0) {
        modifierSelections.push({
          selectedOptions,
          selectionType: "multiple",
          variantId: variant.id,
          variantName: variant.name
        })
      }

      continue
    }

    const chosenId = selection.options[variant.id]
    const option = variant.options.find((entry) => entry.id === chosenId)

    if (option !== undefined) {
      singleNames.push(option.name)
    }
  }

  const modifierTotal = modifierSelections.reduce(
    (total, group) =>
      total +
      group.selectedOptions.reduce((sum, opt) => sum + opt.priceModifier, 0),
    0
  )
  const clamped = Math.min(Math.max(Math.trunc(quantity), 1), LINE_QUANTITY_MAX)
  const line = itemLineTotal({
    addons: [],
    basePrice: item.basePrice,
    combination: combination ?? null,
    options: modifierSelections.flatMap((group) => group.selectedOptions),
    quantity: clamped
  })
  const addons = chosenAddons.map((addon) => ({
    addonId: addon.id,
    inventoryId: addon.inventoryId,
    name: addon.name,
    price: addon.price,
    productId: addon.productId
  }))

  return {
    addons,
    combinationId: combination?.id ?? null,
    combinationLabel: singleNames.length > 0 ? singleNames.join(" / ") : null,
    imageUrl: item.imageUrl,
    // A resolved combination's inventory id wins; a variant-less item (no
    // combination ever resolves, `resolveCombination`'s own early-return)
    // falls back to the item's own row — mobile's `inventoryToUse?.id ??
    // item.inventoryId` (`CartScreen.tsx`). Without this fallback every
    // combination-less item is unorderable: `buildOrderItem` drops any line
    // whose `inventoryId` is `null`.
    inventoryId: combination?.inventoryId ?? item.inventoryId,
    itemKey: item.key,
    lineId: cartLineId(
      item.id,
      combination?.id ?? null,
      modifierSelections,
      addons
    ),
    modifierSelections,
    modifierTotal,
    name: item.name,
    productId: item.id,
    quantity: clamped,
    unitPrice: line.unitTotal
  }
}

/**
 * The identity of one configuration.
 *
 * Mobile's convention (`TenantProductsDetail.tsx:1462` builds
 * `${productId}-${combinationId}[-m-${sortedModifierOptionIds}]`), extended
 * with the add-on set — two adds differing only in add-ons must NOT merge,
 * which mobile sidesteps by keeping add-ons as separate rows.
 * @param productId - The product
 * @param combinationId - The resolved combination, or `null`
 * @param modifiers - The chosen modifier groups
 * @param addons - The chosen add-ons
 * @returns A stable string equal for equal configurations
 */
function cartLineId(
  productId: string,
  combinationId: string | null,
  modifiers: readonly CartModifierSelection[],
  addons: readonly CartAddonLine[]
): string {
  const optionIds = modifiers
    .flatMap((group) => group.selectedOptions.map((option) => option.optionId))
    .sort()
  const addonIds = addons.map((addon) => addon.addonId).sort()

  return [
    productId,
    combinationId ?? "-",
    optionIds.join(","),
    addonIds.join(",")
  ].join("|")
}

/**
 * Adds one line to this restaurant's cart, merging into an existing equal
 * configuration.
 *
 * **Takes the restaurant as given.** The cart handed in is this restaurant's or
 * empty, because `carts.ts` keeps one cart per restaurant and `addCartLine`
 * reaches this function only through `cartFor`. There is no conflict to detect
 * here and no cart to clear: a second restaurant gets its own cart.
 * @param cart - This restaurant's current cart, or the empty one
 * @param restaurant - The restaurant the line belongs to
 * @param line - The line to add
 * @returns The next cart
 * @example addLine(EMPTY_CART, ref, line).lines.length // -> 1
 */
export function addLine(
  cart: CartState,
  restaurant: CartRestaurantRef,
  line: CartLine
): CartState {
  const existing = cart.lines.find((entry) => entry.lineId === line.lineId)
  const lines =
    existing === undefined
      ? [
          ...cart.lines,
          // Clamped on the insert path too, not only on the merge below: an
          // edit-save removes the old line first, so a prefilled quantity
          // arrives here as a NEW line and would otherwise land verbatim.
          { ...line, quantity: Math.min(line.quantity, LINE_QUANTITY_MAX) }
        ]
      : cart.lines.map((entry) =>
          entry.lineId === line.lineId
            ? {
                ...entry,
                quantity: Math.min(
                  entry.quantity + line.quantity,
                  LINE_QUANTITY_MAX
                )
              }
            : entry
        )

  return {
    // `??`, NOT a plain overwrite. The rule is re-read on every menu render and
    // `page.tsx` degrades a failed read to `null`, so one transient upstream
    // blip on a SECOND add would otherwise silently strip the tax row and the
    // distance fee off a live cart. Another restaurant's cart never reaches
    // here (`addCartLine` passes what `cartFor` returned, which is this
    // restaurant's cart or an empty one), so nothing stale carries across
    // branches.
    branchCoordinates: restaurant.branchCoordinates ?? cart.branchCoordinates,
    citySlug: restaurant.citySlug,
    deliveryFee: restaurant.deliveryFee,
    deliveryRule: restaurant.deliveryRule ?? cart.deliveryRule,
    fulfillment: restaurant.fulfillment,
    lines,
    minimumOrder: restaurant.minimumOrder,
    restaurantName: restaurant.restaurantName,
    restaurantSlug: restaurant.restaurantSlug,
    tenantId: restaurant.tenantId
  }
}

/**
 * Sets one line's quantity; `0` removes it, and an emptied cart forgets its
 * restaurant so the next add starts clean.
 * @param cart - The current cart
 * @param lineId - The line to change
 * @param quantity - The new quantity, clamped to `0..LINE_QUANTITY_MAX`
 * @returns The next cart
 * @example setLineQuantity(cart, id, 0).lines.length // -> one fewer
 */
export function setLineQuantity(
  cart: CartState,
  lineId: string,
  quantity: number
): CartState {
  const clamped = Math.min(Math.max(Math.trunc(quantity), 0), LINE_QUANTITY_MAX)
  const lines =
    clamped === 0
      ? cart.lines.filter((line) => line.lineId !== lineId)
      : cart.lines.map((line) =>
          line.lineId === lineId ? { ...line, quantity: clamped } : line
        )

  return lines.length === 0 ? EMPTY_CART : { ...cart, lines }
}

/**
 * What one line costs: unit price plus its add-ons, times quantity — the same
 * figure `itemLineTotal` showed in the overlay when the line was built.
 * @param line - The line
 * @returns The line's total
 * @example lineTotal(line) // -> 1940
 */
export function lineTotal(line: CartLine): number {
  const addonsPerUnit = line.addons.reduce((sum, addon) => sum + addon.price, 0)

  return (line.unitPrice + addonsPerUnit) * line.quantity
}

/** How many units the cart holds, for the bar's badge. */
export function cartItemCount(cart: CartState): number {
  return cart.lines.reduce((count, line) => count + line.quantity, 0)
}

/** The cart's subtotal — Σ {@link lineTotal}, nothing else added. */
export function cartSubtotal(cart: CartState): number {
  return cart.lines.reduce((total, line) => total + lineTotal(line), 0)
}

/**
 * The cart as `calculatePricing` takes it: one entry per line plus one per
 * add-on, each already priced — exactly how mobile flattens
 * (`ViewCartDetailScreen.tsx:2100`), so the two apps' subtotals agree by
 * construction.
 * @param cart - The cart
 * @returns `CartItemInput`-shaped entries for `@/constants`' engine
 * @example cartToPricingItems(cart).length // -> lines + addons
 */
export function cartToPricingItems(cart: CartState): {
  price: number
  quantity: number
  productId?: string
  inventoryId?: string
}[] {
  return cart.lines.flatMap((line) => [
    {
      price: line.unitPrice,
      quantity: line.quantity,
      ...(line.productId ? { productId: line.productId } : {}),
      ...(line.inventoryId ? { inventoryId: line.inventoryId } : {})
    },
    ...line.addons.map((addon) => ({
      price: addon.price,
      quantity: line.quantity,
      productId: addon.productId,
      ...(addon.inventoryId ? { inventoryId: addon.inventoryId } : {})
    }))
  ])
}

/**
 * Narrows unknown persisted state to a cart, degrading to {@link EMPTY_CART}.
 *
 * **Hand-written rather than zod, and that is the M-012 byte decision** — this
 * module is imported by `"use client"` leaves, and the whole chain stays
 * zero-dependency only while nothing in it touches `schemas.ts`. Unreadable
 * state costs the visitor their cart, never a crash; each line is validated
 * whole (a corrupt member drops the line, not the field).
 * @param raw - Whatever `JSON.parse` produced, of unknown shape
 * @returns The cart, or the empty one
 * @example readCartState(null) // -> EMPTY_CART
 */
export function readCartState(raw: unknown): CartState {
  if (raw === null || typeof raw !== "object") {
    return EMPTY_CART
  }

  const candidate = raw as Partial<CartState>

  if (
    typeof candidate.restaurantSlug !== "string" ||
    typeof candidate.citySlug !== "string" ||
    !Array.isArray(candidate.lines)
  ) {
    return EMPTY_CART
  }

  const lines = candidate.lines.filter(isReadableLine)

  if (lines.length === 0) {
    return EMPTY_CART
  }

  return {
    branchCoordinates: readCoordinates(candidate.branchCoordinates),
    citySlug: candidate.citySlug,
    deliveryFee: finiteOrNull(candidate.deliveryFee),
    deliveryRule: readDeliveryRule(candidate.deliveryRule),
    fulfillment: readFulfillment(candidate.fulfillment),
    lines,
    minimumOrder: finiteOrNull(candidate.minimumOrder),
    restaurantName:
      typeof candidate.restaurantName === "string"
        ? candidate.restaurantName
        : null,
    restaurantSlug: candidate.restaurantSlug,
    tenantId:
      typeof candidate.tenantId === "string" && candidate.tenantId.trim() !== ""
        ? candidate.tenantId
        : null
  }
}

/**
 * A persisted fulfilment mode, or `null` for anything else.
 *
 * Narrowed against the shared enum rather than accepting any string: an
 * unrecognised value must degrade to "unknown", which asks the coverage
 * question, not to a value that could silently read as `pickup` and skip it.
 * @param value - One persisted member of unknown shape
 * @returns The known fulfilment mode, or `null`
 * @example readFulfillment("pickup") // -> "pickup"
 */
function readFulfillment(value: unknown): OrderFulfillment | null {
  return typeof value === "string" &&
    (ORDER_FULFILLMENT_VALUES as readonly string[]).includes(value)
    ? (value as OrderFulfillment)
    : null
}

/**
 * A persisted number, or `null` for anything else — how the nullable fee
 * fields degrade on a legacy or hand-edited cart (no migration, M-012's
 * hand-written narrowing).
 * @param value - One persisted member of unknown shape
 * @returns The finite number, or `null`
 */
function finiteOrNull(value: unknown): number | null {
  // Non-negative, not merely finite: `priceSchema` floors both fees at zero
  // (`schemas.ts:63`), so a negative here is hand-edited storage, and letting
  // it through would print a negative delivery row and understate the total.
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null
}

/**
 * A persisted finite number, or `null`.
 * @param value - One persisted member of unknown shape
 * @returns The finite number, or `null`
 */
function finiteMember(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/**
 * The same, as an optional schema member rather than a nullable one.
 * @param value - One persisted member of unknown shape
 * @returns The finite number, or `undefined`
 */
function optionalFinite(value: unknown): number | undefined {
  return finiteMember(value) ?? undefined
}

/**
 * A persisted map pin, or `null` for anything else.
 * @param value - One persisted member of unknown shape
 * @returns The pin, or `null`
 * @example readCoordinates({ latitude: 31.5, longitude: 74.3 })?.latitude // -> 31.5
 */
function readCoordinates(value: unknown): Coordinates | null {
  if (value === null || typeof value !== "object") {
    return null
  }

  const raw = value as { latitude?: unknown; longitude?: unknown }
  const latitude = finiteMember(raw.latitude)
  const longitude = finiteMember(raw.longitude)

  // BOUNDED, not merely finite — the same range `coordinatesSchema` enforces at
  // the wire boundary. A hand-edited `latitude: 500` is still a finite number,
  // and `haversineKm` would answer it with a real distance and a real per-km
  // fee. Restated rather than imported as a schema: this module stays
  // zero-zod so a `"use client"` leaf can import it (M-012).
  return latitude === null ||
    longitude === null ||
    latitude < COORDINATE_LIMITS.LATITUDE_MIN ||
    latitude > COORDINATE_LIMITS.LATITUDE_MAX ||
    longitude < COORDINATE_LIMITS.LONGITUDE_MIN ||
    longitude > COORDINATE_LIMITS.LONGITUDE_MAX
    ? null
    : { latitude, longitude }
}

/**
 * A persisted delivery-charge rule, or `null` for anything a fee cannot be
 * derived from — which is the legacy path, byte-for-byte.
 *
 * Hand-written for the reason {@link readCartState} states, and **whole-record**
 * for the reason `isReadableLine` is: a rule missing one of the seven numbers
 * the fee and tax paths read would otherwise quote a fee assembled from
 * defaults nobody configured. Rebuilt member by member rather than spread, so
 * nothing a hand-edited store carries survives into the object the engine sees.
 * @param value - One persisted member of unknown shape
 * @returns The rule, or `null`
 * @example readDeliveryRule(null) // -> null
 */
function readDeliveryRule(value: unknown): TenantDeliveryChargeRule | null {
  if (value === null || typeof value !== "object") {
    return null
  }

  const raw = value as Partial<Record<keyof TenantDeliveryChargeRule, unknown>>
  const defaultDeliveryFee = finiteMember(raw.defaultDeliveryFee)
  const deliveryFeePerKm = finiteMember(raw.deliveryFeePerKm)
  const freeDeliveryThreshold = finiteMember(raw.freeDeliveryThreshold)
  const taxRateCash = finiteMember(raw.taxRateCash)

  // ONLY the four members the fee and tax paths actually read, plus the flag
  // that gates the free-delivery branch. `platformFee`, `riderSharePercentage`
  // and `taxRateCard` are parsed below but never required: web reads none of
  // them, and rejecting a whole rule over a field nothing consumes would drop
  // the tax row and the distance fee for every cart on the site.
  if (
    defaultDeliveryFee === null ||
    deliveryFeePerKm === null ||
    freeDeliveryThreshold === null ||
    taxRateCash === null ||
    typeof raw.freeDeliveryThresholdEnabled !== "boolean"
  ) {
    return null
  }

  return {
    country: typeof raw.country === "string" ? raw.country : "",
    defaultDeliveryFee,
    deliveryFeePerKm,
    // `undefined` collapses onto `null`, which the rule reads as an UNLIMITED
    // threshold — the two are the same value to `deliveryFeeFromTenantChargeRule`.
    distanceThresholdKm: finiteMember(raw.distanceThresholdKm),
    freeDeliveryDistanceKm: optionalFinite(raw.freeDeliveryDistanceKm),
    freeDeliveryThreshold,
    freeDeliveryThresholdEnabled: raw.freeDeliveryThresholdEnabled,
    maxDeliveryDistanceKm: optionalFinite(raw.maxDeliveryDistanceKm),
    maxFreeDeliveryDistanceKm: optionalFinite(raw.maxFreeDeliveryDistanceKm),
    // Parsed, never required — see the guard above. Zero is not a claim about
    // the branch: nothing in this package reads these three.
    platformFee: finiteMember(raw.platformFee) ?? 0,
    riderSharePercentage: finiteMember(raw.riderSharePercentage) ?? 0,
    taxRateCard: finiteMember(raw.taxRateCard) ?? 0,
    taxRateCash
  }
}

/**
 * Whether one persisted entry is a whole, priceable line.
 * @param value - One member of the persisted array
 * @returns `true` when every member a line is priced or ordered by is present
 */
function isReadableLine(value: unknown): value is CartLine {
  if (value === null || typeof value !== "object") {
    return false
  }

  const line = value as Partial<CartLine>

  return (
    typeof line.lineId === "string" &&
    typeof line.productId === "string" &&
    typeof line.itemKey === "string" &&
    typeof line.name === "string" &&
    typeof line.unitPrice === "number" &&
    Number.isFinite(line.unitPrice) &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    line.quantity <= LINE_QUANTITY_MAX &&
    Array.isArray(line.addons) &&
    line.addons.every(
      (addon) =>
        addon !== null &&
        typeof addon === "object" &&
        typeof addon.addonId === "string" &&
        typeof addon.productId === "string" &&
        typeof addon.name === "string" &&
        typeof addon.price === "number" &&
        Number.isFinite(addon.price)
    ) &&
    Array.isArray(line.modifierSelections)
  )
}
