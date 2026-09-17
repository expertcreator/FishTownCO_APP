import { describe, expect, test } from "bun:test"
import {
  listAddonVariantLines,
  listBillLineAddonRows,
  splitAddonVariantLines
} from "../bill-line-addons"

describe("splitAddonVariantLines", () => {
  test("splits comma-separated option labels", () => {
    expect(splitAddonVariantLines("Size: Small, Flavor: Cola")).toEqual([
      "Size: Small",
      "Flavor: Cola"
    ])
    expect(splitAddonVariantLines("Size: Small / Flavour: Coke")).toEqual([
      "Size: Small",
      "Flavour: Coke"
    ])
    expect(splitAddonVariantLines("  ")).toEqual([])
  })
})

describe("listAddonVariantLines", () => {
  test("prefers structured selectedVariants over a label", () => {
    expect(
      listAddonVariantLines(
        {
          combinationLabel: "Size: Large",
          selectedVariants: [
            { name: { en: "Size" }, value: { en: "Small" } },
            { name: { en: "Flavour" }, value: { en: "Coke" } }
          ]
        },
        "en"
      )
    ).toEqual(["Size: Small", "Flavour: Coke"])
  })
})

describe("listBillLineAddonRows", () => {
  test("keeps named addons with quantity and price", () => {
    expect(
      listBillLineAddonRows(
        {
          addons: [
            {
              name: { en: "Cantina Chicken Crispy Taco" },
              quantity: 1,
              price: 700
            }
          ]
        },
        "en"
      )
    ).toEqual([
      {
        name: "Cantina Chicken Crispy Taco",
        variantLines: [],
        quantity: 1,
        price: 700
      }
    ])
  })

  test("splits combination labels onto their own wrap lines", () => {
    expect(
      listBillLineAddonRows(
        {
          addons: [
            {
              name: { en: "Drink" },
              combinationLabel: "Size: Small, Flavor: Cola",
              quantity: 1,
              price: 100
            }
          ]
        },
        "en"
      )
    ).toEqual([
      {
        name: "Drink",
        variantLines: ["Size: Small", "Flavor: Cola"],
        quantity: 1,
        price: 100
      }
    ])
  })

  test("renders selectedVariants when the label is missing", () => {
    expect(
      listBillLineAddonRows(
        {
          addons: [
            {
              name: { en: "Drink" },
              selectedVariants: [
                { name: { en: "Size" }, value: { en: "Small" } },
                { name: { en: "Flavour" }, value: { en: "Coke" } }
              ],
              quantity: 1,
              price: 100
            }
          ]
        },
        "en"
      )
    ).toEqual([
      {
        name: "Drink",
        variantLines: ["Size: Small", "Flavour: Coke"],
        quantity: 1,
        price: 100
      }
    ])
  })

  test("skips addons without a name or quantity", () => {
    expect(
      listBillLineAddonRows(
        {
          addons: [
            { name: { en: "" }, quantity: 1, price: 10 },
            { name: { en: "Drink" }, quantity: 0, price: 80 }
          ]
        },
        "en"
      )
    ).toEqual([])
  })
})
