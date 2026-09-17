import { describe, expect, it } from "vitest"
import {
  addonsFor,
  allCombinationsUnavailable,
  availableOptionsFor,
  defaultSelection,
  type ItemSelection,
  resolveCombination,
  type SelectableAddon,
  type SelectableCombination,
  type SelectableItem,
  type SelectableVariant,
  selectionComplete,
  singleSelectVariantsOf
} from "../item-selection"

/**
 * Builds a single-select variant with the options named.
 * @param id - Variant id
 * @param optionIds - Option ids, in display order
 * @param overrides - Any rule members to change
 * @returns The variant
 */
function single(
  id: string,
  optionIds: readonly string[],
  overrides: Partial<SelectableVariant> = {}
): SelectableVariant {
  return {
    id,
    isRequired: false,
    maxSelections: null,
    minSelections: 0,
    options: optionIds.map((optionId) => ({ id: optionId })),
    selectionType: "single",
    ...overrides
  }
}

/**
 * Builds a multi-select modifier group.
 * @param id - Variant id
 * @param optionIds - Option ids
 * @param overrides - Any rule members to change
 * @returns The variant
 */
function multiple(
  id: string,
  optionIds: readonly string[],
  overrides: Partial<SelectableVariant> = {}
): SelectableVariant {
  return single(id, optionIds, { selectionType: "multiple", ...overrides })
}

/**
 * Builds a combination out of `variantId:optionId` pairs.
 * @param id - Combination id
 * @param pairs - `variantId:optionId` strings
 * @param isAvailable - Whether the path is purchasable
 * @returns The combination
 */
function combo(
  id: string,
  pairs: readonly string[],
  isAvailable = true
): SelectableCombination {
  return {
    id,
    isAvailable,
    options: pairs.map((pair) => {
      const [variantId = "", optionId = ""] = pair.split(":")

      return { id: optionId, variantId }
    })
  }
}

/**
 * Builds an item from its three collections.
 * @param parts - Whichever collections the case needs
 * @returns A complete item
 */
function item(parts: Partial<SelectableItem>): SelectableItem {
  return { addons: [], combinations: [], variants: [], ...parts }
}

/**
 * Builds a selection from its single-select half alone.
 * @param options - Variant id to chosen option id
 * @param modifiers - Variant id to chosen option ids
 * @param addonIds - Chosen add-on link ids
 * @returns The selection
 */
function selection(
  options: Record<string, string> = {},
  modifiers: Record<string, readonly string[]> = {},
  addonIds: readonly string[] = []
): ItemSelection {
  return { addonIds, modifiers, options }
}

/** Size x protein, the shape 30 of 111 live items have. */
const SIZED = item({
  combinations: [
    combo("c-small-beef", ["size:small", "protein:beef"]),
    combo("c-large-beef", ["size:large", "protein:beef"]),
    combo("c-large-chicken", ["size:large", "protein:chicken"])
  ],
  variants: [
    single("size", ["small", "large"]),
    single("protein", ["beef", "chicken"])
  ]
})

describe("singleSelectVariantsOf", () => {
  it("keeps everything that is not explicitly multiple", () => {
    // Single-select is the DEFAULT reading — a positive test for `"single"`
    // would reclassify anything unrecognised as a modifier group.
    expect(
      singleSelectVariantsOf([
        single("a", ["x"]),
        multiple("b", ["y"]),
        single("c", ["z"])
      ]).map((variant) => variant.id)
    ).toEqual(["a", "c"])
  })

  it("is empty for an item with only modifier groups", () => {
    expect(singleSelectVariantsOf([multiple("b", ["y"])])).toEqual([])
  })
})

describe("resolveCombination", () => {
  it("resolves once every single-select variant is chosen", () => {
    expect(
      resolveCombination(SIZED, selection({ protein: "beef", size: "large" }))
        ?.id
    ).toBe("c-large-beef")
  })

  it("answers null while any single-select variant is unchosen", () => {
    expect(resolveCombination(SIZED, selection({ size: "large" }))).toBeNull()
    expect(resolveCombination(SIZED, selection())).toBeNull()
  })

  it("answers null for an option set that forms no combination", () => {
    // `small + chicken` is not sold. Unreachable by clicking thanks to the
    // cross-filter, reachable by hand-editing the URL.
    expect(
      resolveCombination(
        SIZED,
        selection({ protein: "chicken", size: "small" })
      )
    ).toBeNull()
  })

  it("answers null for an item with no variants at all", () => {
    expect(resolveCombination(item({}), selection())).toBeNull()
  })

  it("answers null when the variants exist but no combinations do", () => {
    // The backend's `hasCombinations` gate counts ALL combination rows, so an
    // item whose rows are all unpurchasable here returns `variants: []` AND
    // `combinations: []` — but the inverse is still a shape to survive.
    expect(
      resolveCombination(
        item({ variants: [single("size", ["small"])] }),
        selection({ size: "small" })
      )
    ).toBeNull()
  })

  it("ignores multi-select choices when matching", () => {
    // Modifiers never appear in combination rows, so including them would make
    // every match fail.
    const withModifier = item({
      combinations: [combo("c1", ["size:small"])],
      variants: [single("size", ["small"]), multiple("extras", ["cheese"])]
    })

    expect(
      resolveCombination(
        withModifier,
        selection({ size: "small" }, { extras: ["cheese"] })
      )?.id
    ).toBe("c1")
  })

  it("refuses a strict subset rather than taking the first row that fits", () => {
    // A subset match would resolve "large" alone onto `c-large-beef` and price
    // a choice the visitor never made.
    const partial = item({
      combinations: [combo("c1", ["size:large", "protein:beef"])],
      variants: [single("size", ["large"]), single("protein", ["beef"])]
    })

    expect(resolveCombination(partial, selection({ size: "large" }))).toBeNull()
  })

  it("resolves a sold-out combination like any other", () => {
    const soldOut = item({
      combinations: [combo("c1", ["size:small"], false)],
      variants: [single("size", ["small"])]
    })

    expect(resolveCombination(soldOut, selection({ size: "small" }))?.id).toBe(
      "c1"
    )
  })
})

describe("availableOptionsFor", () => {
  it("offers everything when nothing else is chosen", () => {
    expect(
      availableOptionsFor(SIZED, "protein", selection()).map(
        (option) => option.id
      )
    ).toEqual(["beef", "chicken"])
  })

  it("withdraws an option that co-occurs with nothing chosen", () => {
    // `small` is only sold with `beef`, so choosing `small` must remove
    // `chicken` from the protein group — which is what makes the "forms no
    // combination" state unreachable by clicking.
    expect(
      availableOptionsFor(SIZED, "protein", selection({ size: "small" })).map(
        (option) => option.id
      )
    ).toEqual(["beef"])
  })

  it("keeps both when the other choice permits both", () => {
    expect(
      availableOptionsFor(SIZED, "protein", selection({ size: "large" })).map(
        (option) => option.id
      )
    ).toEqual(["beef", "chicken"])
  })

  it("never filters a modifier group", () => {
    // Modifier options appear in no combination row, so filtering them against
    // combinations would remove every one of them.
    const withModifier = item({
      combinations: [combo("c1", ["size:small"])],
      variants: [single("size", ["small"]), multiple("extras", ["a", "b"])]
    })

    expect(
      availableOptionsFor(
        withModifier,
        "extras",
        selection({ size: "small" })
      ).map((option) => option.id)
    ).toEqual(["a", "b"])
  })

  it("answers an empty list for a variant the item does not have", () => {
    expect(availableOptionsFor(SIZED, "not-a-variant", selection())).toEqual([])
  })

  it("does not withdraw a sold-out option path", () => {
    // Shown and marked, never hidden — the same rule `MenuItemRow` follows.
    const partlySoldOut = item({
      combinations: [
        combo("c1", ["size:small", "protein:beef"], false),
        combo("c2", ["size:large", "protein:beef"])
      ],
      variants: [
        single("size", ["small", "large"]),
        single("protein", ["beef"])
      ]
    })

    expect(
      availableOptionsFor(
        partlySoldOut,
        "size",
        selection({ protein: "beef" })
      ).map((option) => option.id)
    ).toEqual(["small", "large"])
  })

  it("keeps the backend's option order rather than re-sorting", () => {
    expect(
      availableOptionsFor(SIZED, "size", selection()).map((option) => option.id)
    ).toEqual(["small", "large"])
  })
})

describe("defaultSelection", () => {
  it("chooses nothing for an item with no variants — the 73% path", () => {
    expect(defaultSelection(item({}))).toEqual({
      addonIds: [],
      modifiers: {},
      options: {}
    })
  })

  it("preselects the first option of every single-select variant", () => {
    expect(defaultSelection(SIZED).options).toEqual({
      protein: "beef",
      size: "small"
    })
  })

  it("narrows each choice by the ones before it, so the default always resolves", () => {
    // Mobile picks `options[0]` of every variant independently, which on this
    // item opens on `small + chicken` — a selection matching nothing.
    const crossed = item({
      combinations: [
        combo("c1", ["size:small", "protein:beef"]),
        combo("c2", ["size:large", "protein:chicken"])
      ],
      variants: [
        single("size", ["small", "large"]),
        single("protein", ["chicken", "beef"])
      ]
    })
    const chosen = defaultSelection(crossed)

    expect(chosen.options).toEqual({ protein: "beef", size: "small" })
    expect(resolveCombination(crossed, chosen)?.id).toBe("c1")
  })

  it("leaves modifier groups and add-ons empty", () => {
    const withExtras = item({
      addons: [{ id: "link-1", selectedCombinationIds: null }],
      combinations: [combo("c1", ["size:small"])],
      variants: [single("size", ["small"]), multiple("extras", ["cheese"])]
    })
    const chosen = defaultSelection(withExtras)

    expect(chosen.modifiers).toEqual({})
    expect(chosen.addonIds).toEqual([])
  })

  it("leaves a variant unchosen when nothing in it can co-occur", () => {
    // Defensive: the backend prunes options appearing in no purchasable
    // combination, so a variant with no offerable option should not reach here.
    const orphaned = item({
      combinations: [combo("c1", ["size:small"])],
      variants: [single("size", ["small"]), single("crust", ["thin"])]
    })

    expect(defaultSelection(orphaned).options).toEqual({ size: "small" })
  })

  it("lands on a sold-out path rather than steering around it", () => {
    const soldOutFirst = item({
      combinations: [
        combo("c1", ["size:small"], false),
        combo("c2", ["size:large"])
      ],
      variants: [single("size", ["small", "large"])]
    })

    expect(defaultSelection(soldOutFirst).options.size).toBe("small")
  })
})

describe("selectionComplete", () => {
  it("is true for an item with nothing to configure", () => {
    expect(selectionComplete(item({}), selection())).toBe(true)
  })

  it("is true once every single-select variant resolves a combination", () => {
    expect(
      selectionComplete(SIZED, selection({ protein: "beef", size: "large" }))
    ).toBe(true)
  })

  it("is false while a single-select variant is unchosen", () => {
    expect(selectionComplete(SIZED, selection({ size: "large" }))).toBe(false)
  })

  it("is false for an option id the variant does not own", () => {
    expect(
      selectionComplete(SIZED, selection({ protein: "beef", size: "medium" }))
    ).toBe(false)
  })

  it("is false when the chosen pair forms no combination", () => {
    expect(
      selectionComplete(SIZED, selection({ protein: "chicken", size: "small" }))
    ).toBe(false)
  })

  it("treats a required modifier group as needing at least one, whatever minSelections says", () => {
    // `minSelections` is `0` on every live variant, so `isRequired` is the only
    // thing carrying the obligation.
    const required = item({
      variants: [multiple("extras", ["a", "b"], { isRequired: true })]
    })

    expect(selectionComplete(required, selection())).toBe(false)
    expect(selectionComplete(required, selection({}, { extras: ["a"] }))).toBe(
      true
    )
  })

  it("honours an explicit minSelections above one", () => {
    const twoNeeded = item({
      variants: [multiple("extras", ["a", "b", "c"], { minSelections: 2 })]
    })

    expect(selectionComplete(twoNeeded, selection({}, { extras: ["a"] }))).toBe(
      false
    )
    expect(
      selectionComplete(twoNeeded, selection({}, { extras: ["a", "b"] }))
    ).toBe(true)
  })

  it("REJECTS a modifier group over its maxSelections", () => {
    // THE CHECK MOBILE NEVER MAKES. Its widget refuses the toggle and nothing
    // re-checks, so a restored or deep-linked selection goes to the kitchen
    // over the limit.
    const capped = item({
      variants: [multiple("extras", ["a", "b", "c"], { maxSelections: 2 })]
    })

    expect(
      selectionComplete(capped, selection({}, { extras: ["a", "b"] }))
    ).toBe(true)
    expect(
      selectionComplete(capped, selection({}, { extras: ["a", "b", "c"] }))
    ).toBe(false)
  })

  it("accepts any count when maxSelections is null", () => {
    const uncapped = item({ variants: [multiple("extras", ["a", "b", "c"])] })

    expect(
      selectionComplete(uncapped, selection({}, { extras: ["a", "b", "c"] }))
    ).toBe(true)
  })

  it("is true for an optional, empty modifier group", () => {
    expect(
      selectionComplete(
        item({ variants: [multiple("extras", ["a"])] }),
        selection()
      )
    ).toBe(true)
  })

  it("says nothing about availability", () => {
    // "Finished" and "orderable right now" are different facts with different
    // remedies; collapsing them makes a sold-out item look like a broken form.
    const soldOut = item({
      combinations: [combo("c1", ["size:small"], false)],
      variants: [single("size", ["small"])]
    })

    expect(selectionComplete(soldOut, selection({ size: "small" }))).toBe(true)
  })
})

describe("addonsFor", () => {
  const UNGATED: SelectableAddon = { id: "raita", selectedCombinationIds: null }
  const GATED: SelectableAddon = {
    id: "extra-large-dip",
    selectedCombinationIds: ["c-large-beef"]
  }
  const WITH_ADDONS = item({ addons: [UNGATED, GATED] })

  it("offers an ungated add-on against every combination", () => {
    expect(
      addonsFor(WITH_ADDONS, "c-large-beef").map((addon) => addon.id)
    ).toEqual(["raita", "extra-large-dip"])
  })

  it("withdraws a gated add-on when the selection moves off its combination", () => {
    // The one add-on rule that has to work, and the one mobile does not have at
    // all — the field appears in its types and is referenced nowhere.
    expect(
      addonsFor(WITH_ADDONS, "c-small-beef").map((addon) => addon.id)
    ).toEqual(["raita"])
  })

  it("offers only the ungated add-ons before anything resolves", () => {
    expect(addonsFor(WITH_ADDONS, null).map((addon) => addon.id)).toEqual([
      "raita"
    ])
  })

  it("offers an add-on gated to an empty list against nothing at all", () => {
    // `[]` and `null` are opposites: none versus all.
    const gatedToNone = item({
      addons: [{ id: "never", selectedCombinationIds: [] }]
    })

    expect(addonsFor(gatedToNone, "c1")).toEqual([])
    expect(addonsFor(gatedToNone, null)).toEqual([])
  })

  it("is empty for an item with no add-ons — 95.5% of production", () => {
    expect(addonsFor(item({}), "c1")).toEqual([])
  })
})

describe("allCombinationsUnavailable", () => {
  it("is true only when combinations exist and none is available", () => {
    // One live item is in this state: approved, on the menu, and with no path
    // through its pickers that can be ordered right now.
    expect(
      allCombinationsUnavailable(
        item({
          combinations: [
            combo("c1", ["size:small"], false),
            combo("c2", ["size:large"], false)
          ]
        })
      )
    ).toBe(true)
  })

  it("is false when one path survives", () => {
    expect(
      allCombinationsUnavailable(
        item({
          combinations: [
            combo("c1", ["size:small"], false),
            combo("c2", ["size:large"])
          ]
        })
      )
    ).toBe(false)
  })

  it("is false for an item with no combinations at all", () => {
    // Those are the 73% ordered directly; their availability is the item's own
    // flag, and reporting "every option is sold out" for them would be a claim
    // about pickers that do not exist.
    expect(allCombinationsUnavailable(item({}))).toBe(false)
  })
})
