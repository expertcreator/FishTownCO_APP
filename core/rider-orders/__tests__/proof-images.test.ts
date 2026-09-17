import { describe, expect, test } from "bun:test"
import { pickOrderProofImageUrls } from "../proof-images"

describe("pickOrderProofImageUrls", () => {
  test("returns empty when payload is missing", () => {
    expect(pickOrderProofImageUrls(null)).toEqual({})
    expect(pickOrderProofImageUrls(undefined)).toEqual({})
  })

  test("prefers current field names over aliases", () => {
    expect(
      pickOrderProofImageUrls({
        deliveryProofImage: " https://cdn/drop.jpg ",
        dropoffImage: "https://cdn/old-drop.jpg",
        paymentProofImage: "https://cdn/cash.jpg",
        cashProofImage: "https://cdn/old-cash.jpg"
      })
    ).toEqual({
      deliveryProofImage: "https://cdn/drop.jpg",
      paymentProofImage: "https://cdn/cash.jpg"
    })
  })

  test("falls back to tracking aliases", () => {
    expect(
      pickOrderProofImageUrls({
        tracking: {
          dropoffImage: "https://cdn/t-drop.jpg",
          cashProofImage: "https://cdn/t-cash.jpg"
        }
      })
    ).toEqual({
      deliveryProofImage: "https://cdn/t-drop.jpg",
      paymentProofImage: "https://cdn/t-cash.jpg"
    })
  })
})
