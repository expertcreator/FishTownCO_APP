import { describe, expect, test } from "bun:test"
import {
  groupItemsByKitchenRound,
  kitchenModificationIndex,
  nextKitchenRoundNumber
} from "../round"

describe("kitchenModificationIndex", () => {
  test("maps send 1 to the original order", () => {
    expect(kitchenModificationIndex(1)).toBe(0)
    expect(kitchenModificationIndex(3)).toBe(2)
    expect(kitchenModificationIndex(0)).toBe(0)
  })
})

describe("groupItemsByKitchenRound", () => {
  test("keeps marketplace originals ahead of a later add-round", () => {
    const groups = groupItemsByKitchenRound([
      {
        id: "fries",
        roundNo: 1,
        roundSentAt: null
      },
      {
        id: "wings",
        roundNo: 1,
        roundSentAt: null
      },
      {
        id: "zinger",
        roundNo: 2,
        roundSentAt: "2026-08-21T10:51:48.086Z"
      }
    ])

    expect(groups.map((group) => group.itemIds)).toEqual([
      ["fries", "wings"],
      ["zinger"]
    ])
    expect(groups[0]).toMatchObject({
      roundNo: 1,
      modificationIndex: 0,
      isOpening: true,
      isLatest: false
    })
    expect(groups[1]).toMatchObject({
      roundNo: 2,
      modificationIndex: 1,
      isOpening: false,
      isLatest: true
    })
  })

  test("sorts by roundNo when a later send has the only timestamp", () => {
    const groups = groupItemsByKitchenRound([
      {
        id: "later",
        roundNo: 2,
        roundSentAt: "2026-08-21T10:51:48.086Z"
      },
      {
        id: "opening",
        roundNo: 1,
        roundSentAt: null
      }
    ])

    expect(groups.map((group) => group.itemIds)).toEqual([
      ["opening"],
      ["later"]
    ])
  })

  test("sorts timestamp-only groups chronologically", () => {
    const groups = groupItemsByKitchenRound([
      {
        id: "second",
        roundSentAt: "2026-08-21T11:00:00.000Z"
      },
      {
        id: "first",
        roundSentAt: "2026-08-21T10:00:00.000Z"
      }
    ])

    expect(groups.map((group) => group.itemIds)).toEqual([
      ["first"],
      ["second"]
    ])
  })
})

describe("nextKitchenRoundNumber", () => {
  test("is group count plus one", () => {
    expect(nextKitchenRoundNumber([])).toBe(1)
    expect(
      nextKitchenRoundNumber([
        { id: "a", roundNo: 1 },
        { id: "b", roundNo: 2 }
      ])
    ).toBe(3)
  })
})
