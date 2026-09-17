import assert from "node:assert/strict"
import { describe, it } from "vitest"
import type { OrderDetailItem } from "../types"
import {
  buildRevisionDiff,
  extractOrderDetailPayload,
  includeSoftDeletedPriorLines
} from "../revision-diff-model"

function line(
  partial: Partial<OrderDetailItem> & {
    id: string
    productId: string
    quantity: number
    price: string
    subtotal: string
    name: string
  }
): OrderDetailItem {
  const { name, ...rest } = partial
  return {
    orderId: "o1",
    inventoryId: `inv-${partial.productId}`,
    productName: { en: name, ar: name },
    product: {
      id: partial.productId,
      name: [{ language: "en", value: name }],
      images: []
    },
    inventory: {
      id: `inv-${partial.productId}`,
      branchId: "b1",
      productId: partial.productId,
      price: partial.price
    },
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...rest
  } as OrderDetailItem
}

describe("buildRevisionDiff", () => {
  it("marks removals, changes, and additions", () => {
    const prior = [
      line({
        id: "1",
        productId: "p1",
        quantity: 2,
        price: "100",
        subtotal: "200",
        name: "Fries"
      }),
      line({
        id: "2",
        productId: "p2",
        quantity: 1,
        price: "500",
        subtotal: "500",
        name: "Burger"
      })
    ]
    const revised = [
      line({
        id: "3",
        productId: "p2",
        quantity: 2,
        price: "500",
        subtotal: "1000",
        name: "Burger"
      }),
      line({
        id: "4",
        productId: "p3",
        quantity: 1,
        price: "300",
        subtotal: "300",
        name: "Salad"
      })
    ]

    const diff = buildRevisionDiff({
      priorItems: prior,
      revisedItems: revised,
      priorTotal: 700,
      revisedTotal: 1300,
      language: "en"
    })

    assert.equal(diff.priorTotal, 700)
    assert.equal(diff.revisedTotal, 1300)
    assert.equal(diff.hasChanges, true)

    const byName = Object.fromEntries(diff.lines.map((row) => [row.name, row]))
    assert.equal(byName.Fries?.kind, "removed")
    assert.equal(byName.Burger?.kind, "changed")
    assert.equal(byName.Burger?.priorQuantity, 1)
    assert.equal(byName.Burger?.revisedQuantity, 2)
    assert.equal(byName.Salad?.kind, "added")
  })

  it("supports a remove-only revision", () => {
    const prior = [
      line({
        id: "1",
        productId: "p1",
        quantity: 1,
        price: "100",
        subtotal: "100",
        name: "Fries"
      }),
      line({
        id: "2",
        productId: "p2",
        quantity: 1,
        price: "200",
        subtotal: "200",
        name: "Drink"
      })
    ]
    const revised = [
      line({
        id: "3",
        productId: "p2",
        quantity: 1,
        price: "200",
        subtotal: "200",
        name: "Drink"
      })
    ]

    const diff = buildRevisionDiff({
      priorItems: prior,
      revisedItems: revised,
      language: "en"
    })

    assert.equal(diff.lines.filter((row) => row.kind === "removed").length, 1)
    assert.equal(
      diff.lines.find((row) => row.name === "Fries")?.kind,
      "removed"
    )
    assert.equal(
      diff.lines.find((row) => row.name === "Drink")?.kind,
      "unchanged"
    )
  })
})

// --- Added by mw-4-3. Everything above is the mobile suite, verbatim apart
// from its runner import. These are the I/O-matrix rows it did not reach.
describe("buildRevisionDiff — remaining kinds and fallbacks", () => {
  it("marks an untouched line unchanged and reports hasChanges false", () => {
    const only = [
      line({
        id: "1",
        productId: "p1",
        quantity: 1,
        price: "100",
        subtotal: "100",
        name: "Fries"
      })
    ]
    const diff = buildRevisionDiff({ priorItems: only, revisedItems: only })
    assert.equal(diff.lines.length, 1)
    assert.equal(diff.lines[0]?.kind, "unchanged")
    assert.equal(diff.hasChanges, false)
  })

  it("sums totals from the lines when the payload omits them", () => {
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          id: "1",
          productId: "p1",
          quantity: 2,
          price: "100",
          subtotal: "200",
          name: "Fries"
        })
      ],
      revisedItems: []
    })
    assert.equal(diff.priorTotal, 200)
    assert.equal(diff.revisedTotal, 0)
  })

  it("falls back to price times quantity when subtotal is unusable", () => {
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          id: "1",
          productId: "p1",
          quantity: 3,
          price: "50",
          subtotal: "" as never,
          name: "Fries"
        })
      ],
      revisedItems: []
    })
    assert.equal(diff.priorTotal, 150)
  })

  it("ignores a sub-paisa money difference", () => {
    const base = {
      id: "1",
      productId: "p1",
      quantity: 1,
      price: "100",
      name: "Fries"
    }
    const diff = buildRevisionDiff({
      priorItems: [line({ ...base, subtotal: "100.000" })],
      revisedItems: [line({ ...base, id: "2", subtotal: "100.004" })]
    })
    assert.equal(diff.lines[0]?.kind, "unchanged")
  })

  it("marks a money-only change as changed when the quantity is identical", () => {
    // The kind is decided by `left.quantity !== right.quantity ||
    // !moneyClose(...)`. Every other "changed" case here also moves the
    // quantity, so the first operand decides and the money comparison is never
    // reached — replacing moneyClose's body with `return true` left the whole
    // suite green. This pins it: same identity key, same quantity, price moved.
    const base = {
      id: "1",
      productId: "p1",
      quantity: 1,
      price: "100",
      name: "Fries"
    }
    const diff = buildRevisionDiff({
      priorItems: [line({ ...base, subtotal: "100" })],
      revisedItems: [line({ ...base, id: "2", subtotal: "120" })]
    })
    assert.equal(diff.lines.length, 1)
    assert.equal(diff.lines[0]?.kind, "changed")
    assert.equal(diff.lines[0]?.priorQuantity, 1)
    assert.equal(diff.lines[0]?.revisedQuantity, 1)
    assert.equal(diff.lines[0]?.priorSubtotal, 100)
    assert.equal(diff.lines[0]?.revisedSubtotal, 120)
    assert.equal(diff.hasChanges, true)
  })

  it("treats a one-paisa difference as changed, pinning the 0.005 tolerance", () => {
    // The sub-paisa test above holds the tolerance from below (0.004 is
    // unchanged); this holds it from above, so widening the comparison or
    // dropping it cannot pass silently.
    const base = {
      id: "1",
      productId: "p1",
      quantity: 1,
      price: "100",
      name: "Fries"
    }
    const diff = buildRevisionDiff({
      priorItems: [line({ ...base, subtotal: "100.00" })],
      revisedItems: [line({ ...base, id: "2", subtotal: "100.01" })]
    })
    assert.equal(diff.lines[0]?.kind, "changed")
    assert.equal(diff.hasChanges, true)
  })

  it("merges repeated lines that share an identity key", () => {
    const base = {
      productId: "p1",
      quantity: 1,
      price: "100",
      subtotal: "100",
      name: "Fries"
    }
    const diff = buildRevisionDiff({
      priorItems: [line({ ...base, id: "1" }), line({ ...base, id: "2" })],
      revisedItems: []
    })
    assert.equal(diff.lines.length, 1)
    assert.equal(diff.lines[0]?.priorQuantity, 2)
    assert.equal(diff.lines[0]?.priorSubtotal, 200)
  })

  it("skips add-on and soft-deleted lines on both sides", () => {
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          id: "1",
          productId: "p1",
          quantity: 1,
          price: "10",
          subtotal: "10",
          name: "Cheese",
          isAddon: true
        }),
        line({
          id: "2",
          productId: "p2",
          quantity: 1,
          price: "20",
          subtotal: "20",
          name: "Gone",
          deletedAt: "2026-01-02"
        })
      ],
      revisedItems: []
    })
    assert.deepEqual(diff.lines, [])
    assert.equal(diff.hasChanges, false)
  })

  it("names a deal line by its deal identity and keys it separately", () => {
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          id: "1",
          productId: "p1",
          quantity: 1,
          price: "10",
          subtotal: "10",
          name: "",
          dealId: "d1",
          productName: undefined as never,
          product: undefined as never
        })
      ],
      revisedItems: []
    })
    assert.equal(diff.lines[0]?.name, "Deal")
    assert.equal(diff.lines[0]?.key, "deal:d1")
  })

  it("reads the product name array when productName is empty", () => {
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          id: "1",
          productId: "p1",
          quantity: 1,
          price: "10",
          subtotal: "10",
          name: "ignored",
          productName: {} as never,
          product: {
            id: "p1",
            name: [
              { language: "en", value: "English Name" },
              { language: "ur", value: "Urdu Name" }
            ],
            images: []
          }
        })
      ],
      revisedItems: [],
      language: "ur"
    })
    assert.equal(diff.lines[0]?.name, "Urdu Name")
  })

  it("falls back to Item when nothing names the line", () => {
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          id: "1",
          productId: "p1",
          quantity: 1,
          price: "10",
          subtotal: "10",
          name: "",
          productName: undefined as never,
          product: undefined as never
        })
      ],
      revisedItems: []
    })
    assert.equal(diff.lines[0]?.name, "Item")
  })

  it("answers an empty diff for no input at all", () => {
    const diff = buildRevisionDiff({})
    assert.deepEqual(diff.lines, [])
    assert.equal(diff.priorTotal, 0)
    assert.equal(diff.revisedTotal, 0)
    assert.equal(diff.hasChanges, false)
  })
})

describe("includeSoftDeletedPriorLines", () => {
  it("keeps soft-deleted lines and drops only add-ons", () => {
    const items = [
      line({
        id: "1",
        productId: "p1",
        quantity: 1,
        price: "10",
        subtotal: "10",
        name: "Removed",
        deletedAt: "2026-01-02"
      }),
      line({
        id: "2",
        productId: "p2",
        quantity: 1,
        price: "5",
        subtotal: "5",
        name: "Cheese",
        isAddon: true
      })
    ]
    const kept = includeSoftDeletedPriorLines(items)
    assert.equal(kept.length, 1)
    assert.equal(kept[0]?.id, "1")
  })

  it("answers an empty list for missing input", () => {
    assert.deepEqual(includeSoftDeletedPriorLines(undefined), [])
  })
})

describe("extractOrderDetailPayload", () => {
  it("answers null for anything that is not an object", () => {
    for (const raw of [null, undefined, "", "{}", 7, true]) {
      assert.equal(extractOrderDetailPayload(raw), null)
    }
  })

  it("reads a flat payload", () => {
    const payload = extractOrderDetailPayload({
      id: "o1",
      orderNumber: "A-1",
      total: 500,
      items: [],
      revisionStatus: "pending",
      preRevisionOrderId: "o0",
      revisionExpiryDeadline: "2026-01-01T00:00:00Z"
    })
    assert.equal(payload?.id, "o1")
    assert.equal(payload?.orderNumber, "A-1")
    assert.equal(payload?.total, 500)
    assert.equal(payload?.revisionStatus, "pending")
    assert.equal(payload?.preRevisionOrderId, "o0")
    assert.equal(payload?.revisionExpiryDeadline, "2026-01-01T00:00:00Z")
  })

  it("digs through both wrapper layers", () => {
    const payload = extractOrderDetailPayload({
      success: true,
      data: {
        data: { id: "o2", orderNumber: " A-2 ", total: "750", items: [] }
      }
    })
    assert.equal(payload?.id, "o2")
    assert.equal(payload?.orderNumber, "A-2")
    assert.equal(payload?.total, 750)
  })

  it("takes items from whichever layer carries them", () => {
    const items = [
      line({
        id: "1",
        productId: "p1",
        quantity: 1,
        price: "10",
        subtotal: "10",
        name: "Fries"
      })
    ]
    assert.equal(extractOrderDetailPayload({ items })?.items?.length, 1)
    assert.equal(
      extractOrderDetailPayload({ data: { items } })?.items?.length,
      1
    )
    assert.equal(
      extractOrderDetailPayload({ data: { data: { items } } })?.items?.length,
      1
    )
  })

  it("answers empty fields rather than throwing on an unusable payload", () => {
    const payload = extractOrderDetailPayload({ data: "nope" })
    assert.equal(payload?.id, undefined)
    assert.equal(payload?.orderNumber, undefined)
    assert.equal(payload?.total, 0)
    assert.equal(payload?.items, undefined)
    assert.equal(payload?.revisionStatus, null)
    assert.equal(payload?.preRevisionOrderId, null)
    assert.equal(payload?.revisionExpiryDeadline, null)
  })

  it("ignores a blank string where an id is expected", () => {
    assert.equal(extractOrderDetailPayload({ id: "   " })?.id, undefined)
  })
})

describe("revision diff — localized names and wrapper layers", () => {
  it("reads the Arabic and Urdu members of a line name", () => {
    const base = {
      id: "1",
      productId: "p1",
      quantity: 1,
      price: "10",
      subtotal: "10",
      name: "Fries"
    }
    const withNames = (language: string) =>
      buildRevisionDiff({
        priorItems: [
          line({
            ...base,
            productName: { en: "Fries", ar: "بطاطس", ur: "Aalu" } as never
          })
        ],
        revisedItems: [],
        language
      }).lines[0]?.name

    assert.equal(withNames("ar"), "بطاطس")
    assert.equal(withNames("ur"), "Aalu")
    assert.equal(withNames("rmu"), "Aalu")
    assert.equal(withNames("en-US"), "Fries")
  })

  it("falls back to English when the requested member is missing", () => {
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          id: "1",
          productId: "p1",
          quantity: 1,
          price: "10",
          subtotal: "10",
          name: "Fries",
          productName: { en: "Fries" } as never
        })
      ],
      revisedItems: [],
      language: "ar"
    })
    assert.equal(diff.lines[0]?.name, "Fries")
  })

  it("reads items from the middle and outer layers when the inner one has none", () => {
    const items = [
      line({
        id: "1",
        productId: "p1",
        quantity: 1,
        price: "10",
        subtotal: "10",
        name: "Fries"
      })
    ]
    assert.equal(
      extractOrderDetailPayload({ data: { items, data: { id: "o1" } } })?.items
        ?.length,
      1
    )
    assert.equal(
      extractOrderDetailPayload({ items, data: { data: { id: "o1" } } })?.items
        ?.length,
      1
    )
  })
})

describe("revision diff — line identity and ordering", () => {
  it("keys a line by inventory and variant, so a variant change is add + remove", () => {
    const base = {
      productId: "p1",
      quantity: 1,
      price: "10",
      subtotal: "10",
      name: "Fries"
    }
    const diff = buildRevisionDiff({
      priorItems: [line({ ...base, id: "1", variantId: "small" })],
      revisedItems: [line({ ...base, id: "2", variantId: "large" })]
    })
    assert.equal(diff.lines.length, 2)
    assert.deepEqual(
      diff.lines.map((row) => row.kind),
      ["removed", "added"]
    )
  })

  it("keys off variantDetails when there is no variant id", () => {
    const base = {
      productId: "p1",
      quantity: 1,
      price: "10",
      subtotal: "10",
      name: "Fries"
    }
    const diff = buildRevisionDiff({
      priorItems: [line({ ...base, id: "1", variantDetails: { size: "S" } })],
      revisedItems: [line({ ...base, id: "2", variantDetails: { size: "L" } })]
    })
    assert.equal(diff.lines.length, 2)
  })

  it("falls back to the inventory's productId and to 'unknown'", () => {
    const base = { quantity: 1, price: "10", subtotal: "10", name: "Fries" }
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          ...base,
          id: "1",
          productId: null as never,
          inventoryId: "" as never,
          inventory: undefined as never
        })
      ],
      revisedItems: []
    })
    assert.equal(diff.lines[0]?.key, "product:unknown::null")
  })

  it("sorts by kind, then by name within a kind", () => {
    const base = { quantity: 1, price: "10", subtotal: "10" }
    const diff = buildRevisionDiff({
      priorItems: [
        line({ ...base, id: "1", productId: "p1", name: "Zaatar" }),
        line({ ...base, id: "2", productId: "p2", name: "Apple" })
      ],
      revisedItems: [line({ ...base, id: "3", productId: "p3", name: "Mango" })]
    })
    assert.deepEqual(
      diff.lines.map((row) => `${row.kind}:${row.name}`),
      ["removed:Apple", "removed:Zaatar", "added:Mango"]
    )
  })

  it("reads a quantity that is neither a number nor a numeric string as 0", () => {
    const diff = buildRevisionDiff({
      priorItems: [
        line({
          id: "1",
          productId: "p1",
          quantity: "abc" as never,
          price: "10",
          subtotal: "" as never,
          name: "Fries"
        })
      ],
      revisedItems: []
    })
    // quantity 0 falls back to price * 1 for the subtotal.
    assert.equal(diff.lines[0]?.priorQuantity, 0)
    assert.equal(diff.lines[0]?.priorSubtotal, 10)
  })
})
