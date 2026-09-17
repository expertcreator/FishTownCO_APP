import { describe, expect, test } from "bun:test"
import {
  canChangeOnlineDeliveryToPickup,
  isProductSellableOnMarketplace,
  isProductSellableOnPos,
  restaurantFacingOrderTotal,
  shouldShowRestaurantCustomerInfo,
  shouldShowRestaurantDeliveryFee,
  shouldShowRestaurantPaymentCollection,
  shouldShowRestaurantCommissionFee,
  shouldShowRestaurantPlatformFee
} from "../fulfillment"

describe("canChangeOnlineDeliveryToPickup", () => {
  test("allows marketplace delivery only while pending", () => {
    expect(
      canChangeOnlineDeliveryToPickup({
        isOnlineOrder: true,
        orderType: "Delivery",
        orderStatus: "pending"
      })
    ).toBe(true)
    expect(
      canChangeOnlineDeliveryToPickup({
        isOnlineOrder: true,
        orderType: "Delivery",
        orderStatus: "preparing"
      })
    ).toBe(false)
    expect(
      canChangeOnlineDeliveryToPickup({
        isOnlineOrder: true,
        orderType: "Delivery",
        orderStatus: "completed"
      })
    ).toBe(false)
    expect(
      canChangeOnlineDeliveryToPickup({
        isOnlineOrder: false,
        orderType: "Delivery",
        orderStatus: "pending"
      })
    ).toBe(false)
    expect(
      canChangeOnlineDeliveryToPickup({
        isOnlineOrder: true,
        orderType: "TakeAway",
        orderStatus: "pending"
      })
    ).toBe(false)
    expect(
      canChangeOnlineDeliveryToPickup({
        isOnlineOrder: true,
        orderType: "Delivery",
        orderStatus: "pending",
        deliveryProvider: "platform_rider"
      })
    ).toBe(false)
    expect(
      canChangeOnlineDeliveryToPickup({
        isOnlineOrder: true,
        orderType: "Delivery",
        orderStatus: "pending",
        deliveryProvider: "own_rider"
      })
    ).toBe(true)
  })
})

describe("shouldShowRestaurantDeliveryFee", () => {
  test("shows own-rider delivery fees and marketplace delivery fees", () => {
    expect(
      shouldShowRestaurantDeliveryFee({
        orderType: "Delivery",
        deliveryProvider: "own_rider",
        deliveryFee: 40,
        isOnlineOrder: false
      })
    ).toBe(true)
    expect(
      shouldShowRestaurantDeliveryFee({
        orderType: "Delivery",
        deliveryProvider: "own_rider",
        deliveryFee: 40,
        isOnlineOrder: true
      })
    ).toBe(true)
    expect(
      shouldShowRestaurantDeliveryFee({
        orderType: "Delivery",
        deliveryProvider: "customer_pickup",
        deliveryFee: 40,
        isOnlineOrder: true
      })
    ).toBe(true)
  })

  test("hides platform-rider and non-delivery fees", () => {
    expect(
      shouldShowRestaurantDeliveryFee({
        orderType: "Delivery",
        deliveryProvider: "platform_rider",
        deliveryFee: 40,
        isOnlineOrder: true
      })
    ).toBe(false)
    expect(
      shouldShowRestaurantDeliveryFee({
        orderType: "TakeAway",
        deliveryProvider: "own_rider",
        deliveryFee: 40,
        isOnlineOrder: true
      })
    ).toBe(false)
    expect(
      shouldShowRestaurantDeliveryFee({
        orderType: "Delivery",
        deliveryProvider: "own_rider",
        deliveryFee: 0,
        isOnlineOrder: true
      })
    ).toBe(false)
  })
})

describe("shouldShowRestaurantPlatformFee", () => {
  test("hides Fishtownco rider platform fees and empty fees", () => {
    expect(
      shouldShowRestaurantPlatformFee({
        deliveryProvider: "platform_rider",
        platformFee: 15
      })
    ).toBe(false)
    expect(
      shouldShowRestaurantPlatformFee({
        deliveryProvider: "own_rider",
        platformFee: 0
      })
    ).toBe(false)
  })

  test("shows platform fees for own-rider and pickup", () => {
    expect(
      shouldShowRestaurantPlatformFee({
        deliveryProvider: "own_rider",
        platformFee: 15
      })
    ).toBe(true)
    expect(
      shouldShowRestaurantPlatformFee({
        deliveryProvider: "customer_pickup",
        platformFee: 15
      })
    ).toBe(true)
  })
})

describe("shouldShowRestaurantCommissionFee", () => {
  test("hides empty commission", () => {
    expect(shouldShowRestaurantCommissionFee({ commissionFee: 0 })).toBe(false)
    expect(shouldShowRestaurantCommissionFee({ commissionFee: null })).toBe(
      false
    )
  })

  test("shows snapshotted commission", () => {
    expect(shouldShowRestaurantCommissionFee({ commissionFee: 10 })).toBe(true)
    expect(shouldShowRestaurantCommissionFee({ commissionFee: "5.50" })).toBe(
      true
    )
  })
})

describe("restaurantFacingOrderTotal", () => {
  test("subtracts Fishtownco rider delivery and platform fees", () => {
    expect(
      restaurantFacingOrderTotal({
        total: 1862,
        deliveryFee: 1087,
        deliveryProvider: "platform_rider"
      })
    ).toBe(775)
    expect(
      restaurantFacingOrderTotal({
        total: 1862,
        deliveryFee: 1087,
        platformFee: 50,
        deliveryProvider: "platform_rider"
      })
    ).toBe(725)
    expect(
      restaurantFacingOrderTotal({
        total: 1862,
        deliveryFee: 1087,
        platformFee: 50,
        deliveryProvider: "own_rider"
      })
    ).toBe(1862)
    expect(
      restaurantFacingOrderTotal({
        total: 450,
        deliveryFee: 0,
        deliveryProvider: "platform_rider"
      })
    ).toBe(450)
  })
})

describe("shouldShowRestaurantPaymentCollection", () => {
  test("hides payment collection for Fishtownco rider", () => {
    expect(
      shouldShowRestaurantPaymentCollection({
        deliveryProvider: "platform_rider"
      })
    ).toBe(false)
    expect(
      shouldShowRestaurantPaymentCollection({
        deliveryProvider: "own_rider"
      })
    ).toBe(true)
    expect(
      shouldShowRestaurantPaymentCollection({
        deliveryProvider: "customer_pickup"
      })
    ).toBe(true)
  })
})

describe("shouldShowRestaurantCustomerInfo", () => {
  test("hides diner details for Fishtownco rider", () => {
    expect(
      shouldShowRestaurantCustomerInfo({
        deliveryProvider: "platform_rider"
      })
    ).toBe(false)
    expect(
      shouldShowRestaurantCustomerInfo({
        deliveryProvider: "own_rider"
      })
    ).toBe(true)
    expect(
      shouldShowRestaurantCustomerInfo({
        deliveryProvider: "customer_pickup"
      })
    ).toBe(true)
  })
})

describe("product sell-on channels", () => {
  test("treats pos and hybrid as POS-sellable", () => {
    expect(isProductSellableOnPos({ sellOn: "pos" })).toBe(true)
    expect(isProductSellableOnPos({ sellOn: "hybrid" })).toBe(true)
    expect(isProductSellableOnPos({ sellOn: "marketplace" })).toBe(false)
    expect(isProductSellableOnPos({ sellOn: ["marketplace"] })).toBe(false)
  })

  test("treats marketplace and hybrid as marketplace-sellable", () => {
    expect(isProductSellableOnMarketplace({ sellOn: "marketplace" })).toBe(true)
    expect(isProductSellableOnMarketplace({ sellOn: "hybrid" })).toBe(true)
    expect(isProductSellableOnMarketplace({ sellOn: "pos" })).toBe(false)
    expect(isProductSellableOnMarketplace({ sellOn: ["pos"] })).toBe(false)
  })
})
