import assert from "node:assert/strict"
import { describe, it } from "vitest"
import {
  collectOrderItemCustomizationParts,
  linesFromOrderVariantDetails,
  orderItemCustomizationSummary
} from "../variant-details-display"

describe("variantDetailsDisplay", () => {
  it("matches Place order subtitle: options joined with /", () => {
    assert.equal(
      orderItemCustomizationSummary(
        {
          combinationLabel: "large / egg / extra cheicken"
        },
        "en"
      ),
      "large / egg / extra cheicken"
    )
  })

  it("reads combinationLabel + modifier option names (checkout style)", () => {
    const parts = collectOrderItemCustomizationParts(
      {
        combinationId: "c1",
        combinationLabel: "Large",
        modifierSelections: [
          {
            variantId: "v1",
            variantName: "Flavor",
            selectionType: "multiple",
            selectedOptions: [
              { optionId: "o1", optionName: "Chocolate", priceModifier: 0 },
              { optionId: "o2", optionName: "Vanilla", priceModifier: 10 }
            ]
          }
        ]
      },
      "en"
    )

    assert.deepEqual(parts, ["Large", "Chocolate", "Vanilla"])
    assert.deepEqual(
      linesFromOrderVariantDetails(
        {
          combinationLabel: "Large",
          modifierSelections: [
            {
              variantName: "Flavor",
              selectedOptions: [
                { optionName: "Chocolate" },
                { optionName: "Vanilla" }
              ]
            }
          ]
        },
        "en"
      ),
      ["Large / Chocolate / Vanilla"]
    )
  })

  it("formats Order API array as option-only values", () => {
    assert.deepEqual(
      linesFromOrderVariantDetails(
        [
          { name: { en: "Size" }, value: { en: "large" } },
          { name: { en: "Add-on" }, value: { en: "egg" } },
          { variantName: { en: "Extra" }, optionName: { en: "extra cheicken" } }
        ],
        "en"
      ),
      ["large / egg / extra cheicken"]
    )
  })

  it("parses JSON string payloads", () => {
    assert.deepEqual(
      linesFromOrderVariantDetails(
        JSON.stringify({
          combinationLabel: "Regular / Spicy"
        }),
        "en"
      ),
      ["Regular / Spicy"]
    )
  })

  it("reads nested selectedVariants on object payloads", () => {
    assert.deepEqual(
      linesFromOrderVariantDetails(
        {
          combinationId: "c1",
          selectedVariants: [
            { name: "Flavor", value: "Strawberry" },
            { variantName: "Topping", optionName: "Nuts" }
          ]
        },
        "en"
      ),
      ["Strawberry / Nuts"]
    )
  })
})

// --- Added by mw-4-3. Everything above is the mobile suite, verbatim apart
// from its runner import. The module is 291 lines of payload-shape tolerance
// and the port exercised roughly half of it.
describe("variantDetailsDisplay — locales", () => {
  it("reads the Arabic member for an Arabic locale, falling back to en then value", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        [{ value: { ar: "كبير", en: "Large" } }],
        "ar"
      ),
      ["كبير"]
    )
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ value: { en: "Large" } }], "ar-EG"),
      ["Large"]
    )
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ value: { value: "Large" } }], "ar"),
      ["Large"]
    )
  })

  it("reads the ur member for both Urdu script and Roman Urdu", () => {
    const record = [{ value: { en: "Large", ur: "Bara" } }]
    assert.deepEqual(collectOrderItemCustomizationParts(record, "ur"), ["Bara"])
    assert.deepEqual(collectOrderItemCustomizationParts(record, "rmu"), [
      "Bara"
    ])
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ value: { en: "Large" } }], "ur"),
      ["Large"]
    )
  })

  it("treats an empty locale as English and an empty record as no text", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ value: { en: "Large" } }], ""),
      ["Large"]
    )
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ value: {} }], "en"),
      []
    )
  })

  it("picks the matching entry out of a language-tagged array", () => {
    const details = [
      {
        value: [
          { language: "en", value: "Large" },
          { language: "ur-PK", value: "Bara" }
        ]
      }
    ]
    assert.deepEqual(collectOrderItemCustomizationParts(details, "ur"), [
      "Bara"
    ])
    assert.deepEqual(collectOrderItemCustomizationParts(details, "en"), [
      "Large"
    ])
  })

  it("falls back to the first usable entry when no language matches", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        [
          {
            value: [
              null,
              { language: 7, value: "  " },
              { language: "fr", value: "Grande" }
            ]
          }
        ],
        "en"
      ),
      ["Grande"]
    )
  })

  it("answers nothing for an array carrying no usable text", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ value: [null, {}, 3] }], "en"),
      []
    )
  })
})

describe("variantDetailsDisplay — payload shapes", () => {
  it("answers an empty list for empty, blank and unusable payloads", () => {
    for (const raw of [undefined, null, "", "   ", 5, true, [], {}]) {
      assert.deepEqual(collectOrderItemCustomizationParts(raw, "en"), [])
    }
  })

  it("treats a bare string payload as a combination label", () => {
    assert.deepEqual(collectOrderItemCustomizationParts("  Large  ", "en"), [
      "Large"
    ])
  })

  it("keeps a JSON-looking string that does not parse as a plain label", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts('{"combinationLabel": broken', "en"),
      ['{"combinationLabel": broken']
    )
  })

  it("splits a comma-joined label as well as a slash-joined one", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        { combinationLabel: "large, egg" },
        "en"
      ),
      ["large", "egg"]
    )
  })

  it("drops duplicate options case-insensitively", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        {
          combinationLabel: "Large / large",
          modifierSelections: [
            { selectedOptions: [{ optionName: "LARGE" }, { name: "Egg" }] }
          ]
        },
        "en"
      ),
      ["Large", "Egg"]
    )
  })

  it("reads optionNames arrays, joining them with a slash", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        [{ optionNames: [{ en: "Large" }, { en: "Egg" }] }],
        "en"
      ),
      ["Large", "Egg"]
    )
  })

  it("falls through optionNames to the single-option keys when it yields nothing", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        [{ optionNames: [null, ""], selectedOptionName: "Large" }],
        "en"
      ),
      ["Large"]
    )
  })

  it("reads each single-option key in priority order", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ selectedValue: "A" }], "en"),
      ["A"]
    )
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ label: "B" }], "en"),
      ["B"]
    )
    assert.deepEqual(
      collectOrderItemCustomizationParts([{ combinationLabel: "C" }], "en"),
      ["C"]
    )
  })

  it("skips malformed modifier groups and options instead of throwing", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        {
          combinationLabel: "Large",
          modifierSelections: [
            null,
            "nope",
            { selectedOptions: "not-an-array" },
            { selectedOptions: [null, 4, { optionName: "Egg" }] }
          ]
        },
        "en"
      ),
      ["Large", "Egg"]
    )
  })

  it("ignores modifierSelections that is not an array", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        { combinationLabel: "Large", modifierSelections: { a: 1 } },
        "en"
      ),
      ["Large"]
    )
  })

  it("reads every nested variant key", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        {
          combinationId: "c1",
          variants: [{ optionName: "A" }],
          variantOptions: [{ optionName: "B" }],
          options: [{ optionName: "C" }, [1], null]
        },
        "en"
      ),
      ["A", "B", "C"]
    )
  })

  it("falls back to reading the root itself when nothing nested matched", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts({ optionName: "Large" }, "en"),
      ["Large"]
    )
  })

  it("filters entries that are not objects out of an array payload", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        [null, 3, { optionName: "Large" }],
        "en"
      ),
      ["Large"]
    )
  })
})

describe("variantDetailsDisplay — summary and lines", () => {
  it("answers undefined and an empty list when there is no customization", () => {
    assert.equal(orderItemCustomizationSummary({}, "en"), undefined)
    assert.deepEqual(linesFromOrderVariantDetails(undefined, "en"), [])
  })

  it("defaults the locale to English", () => {
    assert.equal(
      orderItemCustomizationSummary({ combinationLabel: "Large" }),
      "Large"
    )
    assert.deepEqual(
      collectOrderItemCustomizationParts({ optionName: "Large" }),
      ["Large"]
    )
    assert.deepEqual(linesFromOrderVariantDetails({ optionName: "Large" }), [
      "Large"
    ])
  })
})

describe("variantDetailsDisplay — remaining fallbacks", () => {
  it("keeps a brace-wrapped string that fails to parse as a plain label", () => {
    assert.deepEqual(collectOrderItemCustomizationParts("{nope}", "en"), [
      "{nope}"
    ])
    assert.deepEqual(collectOrderItemCustomizationParts("[nope]", "en"), [
      "[nope]"
    ])
  })

  it("drops empty segments produced by splitting a label", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        { combinationLabel: "large,,egg" },
        "en"
      ),
      ["large", "egg"]
    )
  })

  it("drops a modifier option that carries no readable name", () => {
    assert.deepEqual(
      collectOrderItemCustomizationParts(
        {
          combinationLabel: "Large",
          modifierSelections: [
            { selectedOptions: [{ optionId: "o1" }, { optionName: "Egg" }] }
          ]
        },
        "en"
      ),
      ["Large", "Egg"]
    )
  })
})
