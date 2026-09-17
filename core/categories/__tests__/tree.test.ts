import { describe, expect, test } from "bun:test"
import { categoryFilterIds, flattenCategories } from "../tree"

const tree = [
  {
    id: "food",
    subcategories: [{ id: "tacos" }, { id: "burgers" }]
  },
  { id: "drinks" }
]

describe("flattenCategories", () => {
  test("returns unique roots and descendants", () => {
    expect(flattenCategories(tree).map((item) => item.id)).toEqual([
      "food",
      "tacos",
      "burgers",
      "drinks"
    ])
  })
})

describe("categoryFilterIds", () => {
  test("includes a parent and its descendants", () => {
    expect([...categoryFilterIds(tree, "food")].sort()).toEqual([
      "burgers",
      "food",
      "tacos"
    ])
  })

  test("falls back to the selected id when the node is missing", () => {
    expect([...categoryFilterIds(tree, "missing")]).toEqual(["missing"])
  })
})
