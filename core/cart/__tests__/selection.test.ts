import { describe, expect, it } from "vitest"
import { type CartLine, type CartRestaurantRef, EMPTY_CART } from "../cart-line"
import { addCartLine, EMPTY_CARTS, setCartLineQuantity } from "../carts"
import {
  effectiveSelection,
  EMPTY_SELECTION,
  pruneSelection,
  readSelectionState,
  selectAdded,
  selectedCart,
  toggleLine,
  toggleRestaurant
} from "../selection"

const REF: CartRestaurantRef = {
  branchCoordinates: null,
  citySlug: "gujranwala",
  deliveryFee: 70,
  deliveryRule: null,
  fulfillment: "delivery",
  minimumOrder: 500,
  restaurantName: "Chattha Chargha",
  restaurantSlug: "chattha-chargha",
  tenantId: "tenant-1"
}

const OTHER: CartRestaurantRef = {
  ...REF,
  citySlug: "lahore",
  restaurantName: "Butt Karahi",
  restaurantSlug: "butt-karahi",
  tenantId: "tenant-2"
}

/** A plain line, the 73% shape with nothing configured. */
function line(lineId: string, quantity = 1): CartLine {
  return {
    addons: [],
    combinationId: null,
    combinationLabel: null,
    imageUrl: null,
    inventoryId: "inv-plain",
    itemKey: "chargha-pulao",
    lineId,
    modifierSelections: [],
    modifierTotal: 0,
    name: "Chargha Pulao",
    productId: "product-plain",
    quantity,
    unitPrice: 690
  }
}

const ONE = addCartLine(
  addCartLine(EMPTY_CARTS, REF, line("a")),
  REF,
  line("b")
)
const TWO = addCartLine(ONE, OTHER, line("c"))
const BOTH_LINES = { lineIds: ["a", "b"], restaurantSlug: REF.restaurantSlug }

describe("toggleLine", () => {
  it("adds a line without repeating it", () => {
    const one = toggleLine(EMPTY_SELECTION, REF.restaurantSlug, "a", true)

    expect(one).toEqual({ lineIds: ["a"], restaurantSlug: REF.restaurantSlug })
    expect(toggleLine(one, REF.restaurantSlug, "a", true)).toBe(one)
    expect(toggleLine(one, REF.restaurantSlug, "b", true).lineIds).toEqual([
      "a",
      "b"
    ])
  })

  it("moves the whole selection to another restaurant", () => {
    expect(toggleLine(BOTH_LINES, OTHER.restaurantSlug, "c", true)).toEqual({
      lineIds: ["c"],
      restaurantSlug: OTHER.restaurantSlug
    })
  })

  it("empties the selection when the last line is unchecked", () => {
    const one = { lineIds: ["a"], restaurantSlug: REF.restaurantSlug }

    expect(toggleLine(BOTH_LINES, REF.restaurantSlug, "b", false)).toEqual(one)
    expect(toggleLine(one, REF.restaurantSlug, "a", false)).toBe(
      EMPTY_SELECTION
    )
  })

  it("ignores unchecking a line under another restaurant", () => {
    expect(toggleLine(BOTH_LINES, OTHER.restaurantSlug, "c", false)).toBe(
      BOTH_LINES
    )
  })
})

describe("toggleRestaurant", () => {
  it("checks every line of that restaurant's cart", () => {
    expect(
      toggleRestaurant(EMPTY_SELECTION, TWO, REF.restaurantSlug, true)
    ).toEqual(BOTH_LINES)
  })

  it("answers nothing for a restaurant with no cart", () => {
    expect(toggleRestaurant(BOTH_LINES, TWO, "kfc", true)).toBe(EMPTY_SELECTION)
  })

  it("clears the selection when its own restaurant is unchecked", () => {
    expect(toggleRestaurant(BOTH_LINES, TWO, REF.restaurantSlug, false)).toBe(
      EMPTY_SELECTION
    )
  })

  it("ignores another restaurant being unchecked", () => {
    expect(toggleRestaurant(BOTH_LINES, TWO, OTHER.restaurantSlug, false)).toBe(
      BOTH_LINES
    )
  })
})

describe("selectAdded", () => {
  it("keeps a same-restaurant selection and adds the new line", () => {
    expect(selectAdded(BOTH_LINES, REF.restaurantSlug, "d").lineIds).toEqual([
      "a",
      "b",
      "d"
    ])
  })

  it("moves to the restaurant just added from", () => {
    expect(selectAdded(BOTH_LINES, OTHER.restaurantSlug, "c")).toEqual({
      lineIds: ["c"],
      restaurantSlug: OTHER.restaurantSlug
    })
  })
})

describe("pruneSelection", () => {
  it("drops a line a quantity of zero removed", () => {
    const carts = setCartLineQuantity(TWO, REF.restaurantSlug, "b", 0)

    expect(pruneSelection(BOTH_LINES, carts)).toEqual({
      lineIds: ["a"],
      restaurantSlug: REF.restaurantSlug
    })
  })

  it("empties when the restaurant has no cart left", () => {
    expect(pruneSelection(BOTH_LINES, EMPTY_CARTS)).toBe(EMPTY_SELECTION)
  })

  it("leaves an empty selection empty", () => {
    expect(pruneSelection(EMPTY_SELECTION, TWO)).toBe(EMPTY_SELECTION)
  })
})

describe("effectiveSelection", () => {
  it("defaults to the whole cart when there is only one", () => {
    expect(effectiveSelection(EMPTY_SELECTION, ONE)).toEqual(BOTH_LINES)
  })

  it("stays empty with several carts and nothing checked", () => {
    expect(effectiveSelection(EMPTY_SELECTION, TWO)).toBe(EMPTY_SELECTION)
  })

  it("keeps what is checked", () => {
    expect(effectiveSelection(BOTH_LINES, TWO)).toEqual(BOTH_LINES)
  })

  it("defaults to nothing when the sole cart has no restaurant", () => {
    expect(effectiveSelection(EMPTY_SELECTION, { carts: [EMPTY_CART] })).toBe(
      EMPTY_SELECTION
    )
  })
})

describe("selectedCart", () => {
  it("keeps the restaurant fields and only the selected lines", () => {
    const cart = selectedCart(TWO, {
      lineIds: ["b"],
      restaurantSlug: REF.restaurantSlug
    })

    expect(cart.restaurantSlug).toBe(REF.restaurantSlug)
    expect(cart.restaurantName).toBe(REF.restaurantName)
    expect(cart.citySlug).toBe(REF.citySlug)
    expect(cart.deliveryFee).toBe(70)
    expect(cart.tenantId).toBe("tenant-1")
    expect(cart.lines.map((entry) => entry.lineId)).toEqual(["b"])
  })

  it("answers the empty cart when nothing is selected", () => {
    expect(selectedCart(TWO, EMPTY_SELECTION)).toBe(EMPTY_CART)
  })
})

describe("readSelectionState", () => {
  it("degrades anything unreadable to nothing selected", () => {
    expect(readSelectionState(null)).toBe(EMPTY_SELECTION)
    expect(readSelectionState("kfc")).toBe(EMPTY_SELECTION)
    expect(readSelectionState({ lineIds: ["a"], restaurantSlug: 5 })).toBe(
      EMPTY_SELECTION
    )
    expect(readSelectionState({ lineIds: ["a"], restaurantSlug: "" })).toBe(
      EMPTY_SELECTION
    )
    expect(readSelectionState({ restaurantSlug: "kfc" })).toBe(EMPTY_SELECTION)
  })

  it("enforces the invariant on an empty line list", () => {
    expect(readSelectionState({ lineIds: [], restaurantSlug: "kfc" })).toBe(
      EMPTY_SELECTION
    )
  })

  it("reads a valid selection and drops non-string ids", () => {
    expect(
      readSelectionState({ lineIds: ["a", 7, "b"], restaurantSlug: "kfc" })
    ).toEqual({ lineIds: ["a", "b"], restaurantSlug: "kfc" })
  })
})
