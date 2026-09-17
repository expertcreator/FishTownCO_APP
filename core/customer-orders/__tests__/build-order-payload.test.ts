import { describe, expect, it } from "vitest"
import type { CartLine, CartState } from "../../cart/cart-line"
import { EMPTY_CART } from "../../cart/cart-line"
import { EMPTY_CHECKOUT_DRAFT } from "../../checkout/draft"
import type { CheckoutDraft } from "../../checkout/draft"
import type { SavedAddress } from "../../checkout/schemas"
import { buildOrderPayload, orderHasItems } from "../build-order-payload"

const IDEMPOTENCY_KEY = "11111111-1111-1111-1111-111111111111"

const LINE: CartLine = {
  addons: [
    {
      addonId: "link-1",
      inventoryId: "inv-addon-1",
      name: "Raita",
      price: 90,
      productId: "p-addon-1"
    }
  ],
  combinationId: "combo-1",
  combinationLabel: "Large",
  imageUrl: null,
  inventoryId: "inv-1",
  itemKey: "seekh-platter",
  lineId: "p1|combo-1|opt-1|link-1",
  modifierSelections: [
    {
      selectedOptions: [
        { optionId: "opt-1", optionName: "Extra spicy", priceModifier: 0 }
      ],
      selectionType: "multiple",
      variantId: "variant-1",
      variantName: "Spice level"
    }
  ],
  modifierTotal: 0,
  name: "Seekh Platter",
  productId: "p1",
  quantity: 2,
  unitPrice: 690
}

const CART: CartState = {
  ...EMPTY_CART,
  citySlug: "gujranwala",
  fulfillment: "delivery",
  lines: [LINE],
  restaurantSlug: "chattha-chargha",
  restaurantName: "Chattha Chargha",
  tenantId: "tenant-1"
}

const DRAFT: CheckoutDraft = {
  ...EMPTY_CHECKOUT_DRAFT,
  addressId: "addr-1",
  countryCode: "PK",
  mobileNumber: "3001234567",
  notes: "No onions please"
}

const ADDRESS: SavedAddress = {
  addressLine1: "House 12, Street 4",
  addressLine2: null,
  city: "Gujranwala",
  id: "addr-1",
  isDefault: true,
  label: "Home"
}

/** Every money field the backend forbids submitting. */
const FORBIDDEN_KEYS = ["deliveryFee", "tax", "platformFee", "total", "pricing"]

describe("buildOrderPayload — the happy path", () => {
  it("assembles a delivery order with modifierSelections, addons and no money fields", () => {
    const payload = buildOrderPayload(CART, DRAFT, ADDRESS, IDEMPOTENCY_KEY)

    expect(payload.paymentMethod).toBe("cash")
    expect(payload.addressId).toBe("addr-1")
    expect(payload.idempotencyKey).toBe(IDEMPOTENCY_KEY)
    expect(payload.customerPhone).toBe("+923001234567")
    expect(payload.deliveryInstructions).toBe("No onions please")

    expect(payload.orders).toHaveLength(1)
    const order = payload.orders[0] as {
      branchId: string
      fulfillmentType: string
      items: unknown[]
    }

    expect(order.branchId).toBe("tenant-1")
    expect(order.fulfillmentType).toBe("delivery")
    expect(order.items).toEqual([
      {
        productId: "p1",
        inventoryId: "inv-1",
        quantity: 2,
        modifierSelections: [
          { variantId: "variant-1", selectedOptions: [{ optionId: "opt-1" }] }
        ],
        addons: [
          { productId: "p-addon-1", inventoryId: "inv-addon-1", quantity: 2 }
        ]
      }
    ])

    for (const key of FORBIDDEN_KEYS) {
      expect(payload).not.toHaveProperty(key)
      expect(order).not.toHaveProperty(key)
    }
  })

  it("omits modifierSelections and addons entirely for a plain line", () => {
    const plainLine: CartLine = {
      ...LINE,
      addons: [],
      modifierSelections: []
    }
    const payload = buildOrderPayload(
      { ...CART, lines: [plainLine] },
      DRAFT,
      ADDRESS,
      IDEMPOTENCY_KEY
    )
    const item = payload.orders[0]?.items[0] as Record<string, unknown>

    expect("modifierSelections" in item).toBe(false)
    expect("addons" in item).toBe(false)
  })
})

describe("buildOrderPayload — pickup", () => {
  it("maps to takeaway and omits addressId even when one is passed", () => {
    const payload = buildOrderPayload(
      { ...CART, fulfillment: "pickup" },
      DRAFT,
      ADDRESS,
      IDEMPOTENCY_KEY
    )

    expect(payload.orders[0]?.fulfillmentType).toBe("takeaway")
    expect(payload.addressId).toBeUndefined()
  })
})

describe("buildOrderPayload — no address chosen", () => {
  it("omits addressId for a delivery order with no address selected yet", () => {
    const payload = buildOrderPayload(CART, DRAFT, null, IDEMPOTENCY_KEY)

    expect(payload.addressId).toBeUndefined()
  })
})

describe("buildOrderPayload — dropped lines and addons", () => {
  it("drops a line with no inventory row", () => {
    const noInventory: CartLine = { ...LINE, inventoryId: null }
    const payload = buildOrderPayload(
      { ...CART, lines: [noInventory] },
      DRAFT,
      ADDRESS,
      IDEMPOTENCY_KEY
    )

    expect(payload.orders[0]?.items).toEqual([])
  })

  it("orderHasItems is false once every line in the cart has dropped", () => {
    const noInventory: CartLine = { ...LINE, inventoryId: null }
    const payload = buildOrderPayload(
      { ...CART, lines: [noInventory] },
      DRAFT,
      ADDRESS,
      IDEMPOTENCY_KEY
    )

    expect(orderHasItems(payload)).toBe(false)
  })

  it("orderHasItems is true when at least one line survived", () => {
    const payload = buildOrderPayload(CART, DRAFT, ADDRESS, IDEMPOTENCY_KEY)

    expect(orderHasItems(payload)).toBe(true)
  })

  it("drops only the addon missing its own inventory row, keeping the line", () => {
    const mixedAddons: CartLine = {
      ...LINE,
      addons: [
        ...LINE.addons,
        {
          addonId: "link-2",
          inventoryId: null,
          name: "Extra sauce",
          price: 40,
          productId: "p-addon-2"
        }
      ]
    }
    const payload = buildOrderPayload(
      { ...CART, lines: [mixedAddons] },
      DRAFT,
      ADDRESS,
      IDEMPOTENCY_KEY
    )
    const item = payload.orders[0]?.items[0] as { addons: unknown[] }

    expect(item.addons).toEqual([
      { productId: "p-addon-1", inventoryId: "inv-addon-1", quantity: 2 }
    ])
  })

  it("omits addons entirely when EVERY addon on the line lacks an inventory row", () => {
    const allAddonsInvalid: CartLine = {
      ...LINE,
      addons: LINE.addons.map((addon) => ({ ...addon, inventoryId: null }))
    }
    const payload = buildOrderPayload(
      { ...CART, lines: [allAddonsInvalid] },
      DRAFT,
      ADDRESS,
      IDEMPOTENCY_KEY
    )
    const item = payload.orders[0]?.items[0] as Record<string, unknown>

    expect("addons" in item).toBe(false)
  })
})

describe("buildOrderPayload — contact and notes", () => {
  it("omits customerPhone for an empty draft number", () => {
    const payload = buildOrderPayload(
      CART,
      { ...DRAFT, mobileNumber: "" },
      ADDRESS,
      IDEMPOTENCY_KEY
    )

    expect(payload.customerPhone).toBeUndefined()
  })

  it("omits deliveryInstructions for empty or whitespace-only notes", () => {
    const payload = buildOrderPayload(
      CART,
      { ...DRAFT, notes: "   " },
      ADDRESS,
      IDEMPOTENCY_KEY
    )

    expect(payload.deliveryInstructions).toBeUndefined()
  })

  it("sends the raw national number for a non-PK draft (no composition table for it)", () => {
    const payload = buildOrderPayload(
      CART,
      { ...DRAFT, countryCode: "AE", mobileNumber: "501234567" },
      ADDRESS,
      IDEMPOTENCY_KEY
    )

    expect(payload.customerPhone).toBe("501234567")
  })
})

describe("buildOrderPayload — branch id", () => {
  it("falls back to an empty branchId for a legacy cart with no captured tenantId", () => {
    const payload = buildOrderPayload(
      { ...CART, tenantId: null },
      DRAFT,
      ADDRESS,
      IDEMPOTENCY_KEY
    )

    expect(payload.orders[0]?.branchId).toBe("")
  })
})
