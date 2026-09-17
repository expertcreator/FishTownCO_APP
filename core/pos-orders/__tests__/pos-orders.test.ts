import { describe, expect, test } from "bun:test"
import {
  applyPosBillEditToItems,
  buildPlaceOrderApiItems,
  buildPosBillEditPutBody,
  buildPosStatusPatchBody,
  buildSendKitchenApiPayload,
  buildSendRoundPutBody,
  buildReturnChangePutBody,
  buildSettlePutBody,
  buildTakePaymentApiPayload,
  canVoidBillLine,
  cartCtaOutcome,
  cartPrimaryPath,
  cartSecondaryPath,
  computeTender,
  estimateEditedBillAmounts,
  remainingBillDue,
  resolveSettleReceivedAmount,
  isDeliveryAddressMissing,
  isLiveBillSettleEligible,
  isOrderFullyComplete,
  isSellLiveActiveOrder,
  isPosOriginLiveBill,
  shouldShowSellLiveRow,
  mapExistingOrderItemForPut,
  POS_BILL_ITEM_WRITE,
  POS_ORDERS_API,
  shouldKeepBillOpenAfterMarkServed,
  shouldMarkPaidExactOnComplete,
  shouldPostMarketplaceOrderItems,
  formatBillLineMods,
  listBillLineMods,
  shouldShowLiveBillSettle,
  validateCashPartPay
} from "@/core/pos-orders"
import type { PosBillLine, PosCartLine } from "@/core/pos-orders"

const cartLine: PosCartLine = {
  quantity: 2,
  productId: "prod-1"
}

const billLine = (id: string, quantity = 1): PosBillLine => ({
  id,
  quantity,
  productId: `p-${id}`
})

describe("cart CTAs", () => {
  test("send-kitchen never uses pending orderStatus", () => {
    const outcome = cartCtaOutcome("send-kitchen")
    expect(outcome.orderStatus).toBe("confirmed")
    expect(outcome.paymentStatus).toBe("pending")
    expect(outcome.callsPlaceOrder).toBe(true)
  })

  test("dine-in primary is send-kitchen; takeaway primary is take-payment", () => {
    expect(cartPrimaryPath("DineIn")).toBe("send-kitchen")
    expect(cartSecondaryPath("DineIn")).toBe("take-payment")
    expect(cartPrimaryPath("TakeAway")).toBe("take-payment")
    expect(cartSecondaryPath("Delivery")).toBe("send-kitchen")
  })

  test("delivery without address is blocked", () => {
    expect(isDeliveryAddressMissing("Delivery", "  ")).toBe(true)
    expect(isDeliveryAddressMissing("DineIn", "")).toBe(false)
  })
})

describe("create payloads", () => {
  test("send kitchen is confirmed + pending + received 0", () => {
    const body = buildSendKitchenApiPayload({
      items: [cartLine],
      orderType: "DineIn",
      selectedTable: "table-1",
      branchId: "branch-1"
    })
    expect(body.orderStatus).toBe("confirmed")
    expect(body.paymentStatus).toBe("pending")
    expect(body.receivedAmount).toBe(0)
    expect(body.isOnlineOrder).toBe(false)
    expect(body.tableId).toBe("table-1")
    expect(body.items[0]?.productId).toBe("prod-1")
  })

  test("take payment paid uses receivedAmount; non-cash uses grandTotal", () => {
    const cash = buildTakePaymentApiPayload({
      items: [cartLine],
      orderType: "TakeAway",
      paymentMethod: "cash",
      receivedAmount: 500,
      grandTotal: 400
    })
    expect(cash.paymentStatus).toBe("paid")
    expect(cash.receivedAmount).toBe(400)

    const card = buildTakePaymentApiPayload({
      items: [cartLine],
      orderType: "TakeAway",
      paymentMethod: "card",
      receivedAmount: 1,
      grandTotal: 400
    })
    expect(card.receivedAmount).toBe(400)
    expect(card.paymentStatus).toBe("paid")
  })

  test("cash part-pay stays pending with real receivedAmount", () => {
    const body = buildTakePaymentApiPayload({
      items: [cartLine],
      orderType: "DineIn",
      paymentMethod: "cash",
      receivedAmount: 100,
      grandTotal: 400,
      partPayment: true
    })
    expect(body.paymentStatus).toBe("pending")
    expect(body.receivedAmount).toBe(100)
  })

  test("invalid part-pay throws", () => {
    expect(() =>
      buildTakePaymentApiPayload({
        items: [cartLine],
        orderType: "DineIn",
        paymentMethod: "cash",
        receivedAmount: 400,
        grandTotal: 400,
        partPayment: true
      })
    ).toThrow("part-payment-invalid")
    expect(validateCashPartPay(0, 100).ok).toBe(false)
    expect(validateCashPartPay(50, 100).ok).toBe(true)
  })
})

describe("rounds and bill edit", () => {
  test("existing lines keep id; new lines have no id", () => {
    const body = buildSendRoundPutBody(
      {
        orderStatus: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "DineIn",
        items: [billLine("line-1", 1)]
      },
      [{ quantity: 1, productId: "prod-new" }]
    )
    const existing = body.items.find(
      (row) => "id" in row && row.id === "line-1"
    )
    const appended = body.items.find(
      (row) =>
        !("id" in row) && "productId" in row && row.productId === "prod-new"
    )
    expect(existing != null).toBe(true)
    expect(appended != null).toBe(true)
    expect(body.isOnlineOrder).toBe(false)
  })

  test("marketplace bill edits keep isOnlineOrder true", () => {
    const body = buildSendRoundPutBody(
      {
        orderStatus: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "online",
        orderType: "Delivery",
        isOnlineOrder: true,
        items: [billLine("line-1", 1)]
      },
      [{ quantity: 1, productId: "prod-new" }]
    )
    expect(body.isOnlineOrder).toBe(true)
    expect(body.items).toHaveLength(2)
  })

  test("mapExisting keeps id", () => {
    const mapped = mapExistingOrderItemForPut(billLine("abc", 2))
    expect(mapped?.id).toBe("abc")
    expect(mapped?.quantity).toBe(2)
  })

  test("mapExisting keeps addon combinationId", () => {
    const mapped = mapExistingOrderItemForPut({
      ...billLine("abc", 1),
      addons: [
        {
          addonProductId: "crispy-taco",
          quantity: 1,
          combinationId: "addon-combo-large"
        }
      ]
    })
    expect(mapped?.addons).toEqual([
      {
        addonProductId: "crispy-taco",
        quantity: 1,
        combinationId: "addon-combo-large"
      }
    ])
  })

  test("last line void is blocked", () => {
    expect(canVoidBillLine({ lineCount: 1 })).toBe(false)
    expect(() =>
      applyPosBillEditToItems([billLine("only")], {
        kind: "void",
        itemId: "only"
      })
    ).toThrow("bill_edit_last_item")
  })

  test("void of a non-last line removes it", () => {
    const next = applyPosBillEditToItems([billLine("a"), billLine("b")], {
      kind: "void",
      itemId: "a"
    })
    expect(next.map((line) => line.id)).toEqual(["b"])
  })

  test("replace-qty of 0 voids a non-last line", () => {
    const next = applyPosBillEditToItems([billLine("a", 2), billLine("b", 1)], {
      kind: "replace-qty",
      itemId: "a",
      quantity: 0
    })
    expect(next.map((line) => line.id)).toEqual(["b"])
  })

  test("bill edit PUT sends removed lines as quantity 0", () => {
    const body = buildPosBillEditPutBody(
      {
        orderStatus: "preparing",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "DineIn",
        items: [billLine("keep", 1), billLine("drop", 2)]
      },
      [billLine("keep", 1)]
    )
    const dropped = body.items.find((row) => "id" in row && row.id === "drop")
    expect(dropped).toMatchObject({ id: "drop", quantity: 0 })
    const kept = body.items.find((row) => "id" in row && row.id === "keep")
    expect(kept).toMatchObject({ id: "keep", quantity: 1 })
    expect(body.orderStatus).toBe("preparing")
  })
})

describe("settle gate", () => {
  test("unpaid completed POS bill shows settle and is not fully complete", () => {
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: false,
        orderStatus: "completed",
        paymentStatus: "pending",
        orderType: "DineIn",
        tableId: "t1"
      })
    ).toBe(true)
    expect(
      isOrderFullyComplete({
        orderStatus: "completed",
        paymentStatus: "pending"
      })
    ).toBe(false)
    expect(shouldKeepBillOpenAfterMarkServed("pending")).toBe(true)
  })

  test("completed + paid is fully complete and hides settle", () => {
    expect(
      isOrderFullyComplete({
        orderStatus: "completed",
        paymentStatus: "paid"
      })
    ).toBe(true)
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: false,
        orderStatus: "completed",
        paymentStatus: "paid",
        orderType: "DineIn"
      })
    ).toBe(false)
  })

  test("marketplace prepaid does not settle", () => {
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: true,
        orderStatus: "completed",
        paymentStatus: "pending",
        paymentMethod: "online",
        orderType: "Delivery",
        deliveryProvider: "platform_rider"
      })
    ).toBe(false)
  })

  test("pending bills do not settle", () => {
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: true,
        orderStatus: "pending",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "Delivery",
        deliveryProvider: "own_rider",
        receivedAmount: 0,
        total: 2315
      })
    ).toBe(false)
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: false,
        orderStatus: "pending",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "TakeAway",
        receivedAmount: 0,
        total: 500
      })
    ).toBe(false)
  })

  test("preparing POS bill with remaining balance can settle", () => {
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: false,
        orderStatus: "preparing",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "TakeAway",
        receivedAmount: 4325,
        total: 13_709
      })
    ).toBe(true)
  })

  test("preparing POS bill marked paid still settles when short", () => {
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: false,
        orderStatus: "preparing",
        paymentStatus: "paid",
        paymentMethod: "cash",
        orderType: "TakeAway",
        receivedAmount: 4325,
        total: 13_709
      })
    ).toBe(true)
  })

  test("preparing POS bill with nothing due hides settle", () => {
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: false,
        orderStatus: "preparing",
        paymentStatus: "paid",
        paymentMethod: "cash",
        orderType: "TakeAway",
        receivedAmount: 13_709,
        total: 13_709
      })
    ).toBe(false)
  })

  test("dine-in with table is POS origin", () => {
    expect(
      isPosOriginLiveBill({
        isOnlineOrder: true,
        orderType: "DineIn",
        tableId: "t1"
      })
    ).toBe(true)
  })

  test("delivery with a table is not POS origin", () => {
    expect(
      isPosOriginLiveBill({
        isOnlineOrder: true,
        orderType: "Delivery",
        tableId: "t1"
      })
    ).toBe(false)
  })

  test("completed own-rider delivery POS bill shows settle when unpaid", () => {
    expect(
      isPosOriginLiveBill({
        isOnlineOrder: false,
        orderType: "Delivery",
        deliveryProvider: "own_rider"
      })
    ).toBe(true)
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: false,
        orderStatus: "completed",
        paymentStatus: "pending",
        orderType: "Delivery",
        deliveryProvider: "own_rider",
        receivedAmount: 0,
        total: 100
      })
    ).toBe(true)
  })

  test("POS platform-rider delivery does not settle", () => {
    expect(
      isPosOriginLiveBill({
        isOnlineOrder: false,
        orderType: "Delivery",
        deliveryProvider: "platform_rider"
      })
    ).toBe(true)
    expect(
      isLiveBillSettleEligible({
        isOnlineOrder: false,
        orderType: "Delivery",
        deliveryProvider: "platform_rider"
      })
    ).toBe(false)
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: false,
        orderStatus: "completed",
        paymentStatus: "pending",
        orderType: "Delivery",
        deliveryProvider: "platform_rider",
        receivedAmount: 0,
        total: 100
      })
    ).toBe(false)
  })

  test("marketplace own-rider delivery does not settle", () => {
    expect(
      isPosOriginLiveBill({
        isOnlineOrder: true,
        orderType: "Delivery",
        deliveryProvider: "own_rider"
      })
    ).toBe(false)
    expect(
      isLiveBillSettleEligible({
        isOnlineOrder: true,
        orderType: "Delivery",
        deliveryProvider: "own_rider"
      })
    ).toBe(false)
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: true,
        orderStatus: "completed",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "Delivery",
        deliveryProvider: "own_rider",
        receivedAmount: 0,
        total: 100
      })
    ).toBe(false)
  })

  test("marketplace pickup does not settle unpaid cash", () => {
    expect(
      isPosOriginLiveBill({
        isOnlineOrder: true,
        orderType: "TakeAway",
        deliveryProvider: "customer_pickup"
      })
    ).toBe(false)
    expect(
      isLiveBillSettleEligible({
        isOnlineOrder: true,
        orderType: "TakeAway",
        deliveryProvider: "customer_pickup"
      })
    ).toBe(false)
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: true,
        orderStatus: "completed",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "TakeAway",
        deliveryProvider: "customer_pickup",
        receivedAmount: 0,
        total: 725
      })
    ).toBe(false)
  })

  test("marketplace ticket with a table still does not settle", () => {
    expect(
      isLiveBillSettleEligible({
        isOnlineOrder: true,
        orderType: "DineIn",
        tableId: "t1",
        posOriginBill: true
      })
    ).toBe(false)
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: true,
        orderStatus: "completed",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "DineIn",
        tableId: "t1",
        posOriginBill: true,
        receivedAmount: 0,
        total: 500
      })
    ).toBe(false)
  })

  test("marketplace complete must mark paid with the exact total", () => {
    expect(
      shouldMarkPaidExactOnComplete({
        isOnlineOrder: true,
        newStatus: "completed"
      })
    ).toBe(true)
    expect(
      shouldMarkPaidExactOnComplete({
        isOnlineOrder: true,
        newStatus: "ready"
      })
    ).toBe(false)
    expect(
      shouldMarkPaidExactOnComplete({
        isOnlineOrder: false,
        newStatus: "completed"
      })
    ).toBe(false)
  })

  test("marketplace platform-rider delivery does not settle", () => {
    expect(
      isPosOriginLiveBill({
        isOnlineOrder: true,
        orderType: "Delivery",
        deliveryProvider: "platform_rider"
      })
    ).toBe(false)
    expect(
      isLiveBillSettleEligible({
        isOnlineOrder: true,
        orderType: "Delivery",
        deliveryProvider: "platform_rider"
      })
    ).toBe(false)
    expect(
      shouldShowLiveBillSettle({
        isOnlineOrder: true,
        orderStatus: "completed",
        paymentStatus: "pending",
        paymentMethod: "cash",
        orderType: "Delivery",
        deliveryProvider: "platform_rider",
        receivedAmount: 0,
        total: 100
      })
    ).toBe(false)
  })

  test("unfiltered live board keeps kitchen-active and unpaid tickets", () => {
    expect(
      isSellLiveActiveOrder({
        orderStatus: "preparing",
        paymentStatus: "paid"
      })
    ).toBe(true)
    expect(
      isSellLiveActiveOrder({
        orderStatus: "completed",
        paymentStatus: "pending"
      })
    ).toBe(true)
    expect(
      isSellLiveActiveOrder({
        orderStatus: "completed",
        paymentStatus: "paid"
      })
    ).toBe(false)
    expect(
      isSellLiveActiveOrder({
        orderStatus: "rejected",
        paymentStatus: "pending"
      })
    ).toBe(false)
    expect(
      isSellLiveActiveOrder({
        orderStatus: "cancelled",
        paymentStatus: "pending"
      })
    ).toBe(false)
    expect(
      shouldShowSellLiveRow({
        hasActiveFilters: false,
        orderStatus: "cancelled",
        paymentStatus: "pending"
      })
    ).toBe(false)
    expect(
      shouldShowSellLiveRow({
        hasActiveFilters: true,
        orderStatus: "cancelled",
        paymentStatus: "pending"
      })
    ).toBe(true)
  })

  test("settle PUT includes expectedTotal when paid and does not mention table", () => {
    const body = buildSettlePutBody({
      paymentMethod: "cash",
      receivedAmount: 200,
      grandTotal: 200,
      paymentStatus: "paid"
    })
    expect(body.expectedTotal).toBe(200)
    expect(body.paymentStatus).toBe("paid")
    expect("tableId" in body).toBe(false)
  })

  test("return-change PUT records received as the new total", () => {
    expect(
      buildReturnChangePutBody({
        grandTotal: 625,
        paymentMethod: "cash"
      })
    ).toEqual({
      paymentStatus: "paid",
      paymentMethod: "cash",
      receivedAmount: 625,
      paymentProofImage: null,
      expectedTotal: 625
    })
  })
})

describe("marketplace add-item path", () => {
  test("POS origin never POSTs /items; write method is PUT", () => {
    expect(shouldPostMarketplaceOrderItems(true)).toBe(false)
    expect(POS_BILL_ITEM_WRITE).toBe("PUT")
    expect(POS_ORDERS_API.marketplaceItems("x")).toBe("orders/x/items")
    expect(POS_ORDERS_API.admin).toBe("orders/admin")
    expect(POS_ORDERS_API.orderType("x")).toBe("orders/x/order-type")
  })
})

describe("tender", () => {
  test("short vs exact vs over", () => {
    expect(computeTender(100, 80).kind).toBe("short")
    expect(computeTender(100, 100).kind).toBe("exact")
    expect(computeTender(100, 120).changeToGive).toBe(20)
    expect(remainingBillDue(13_709, 4325)).toBe(9384)
    expect(remainingBillDue(50, 100)).toBe(0)
  })

  test("edited bill amounts drop a voided line and keep extras", () => {
    const next = estimateEditedBillAmounts({
      serverTotal: 18_034,
      serverSubtotal: 18_034,
      items: [
        { id: "a", quantity: 1, price: 4325, subtotal: 4325 },
        { id: "b", quantity: 1, price: 500, subtotal: 500 }
      ],
      lines: [{ id: "b", quantity: 1 }]
    })
    expect(next.subtotal).toBe(500)
    expect(next.total).toBe(500)
  })

  test("edited bill amounts raise due when qty grows", () => {
    const next = estimateEditedBillAmounts({
      serverTotal: 100,
      serverSubtotal: 100,
      items: [{ id: "a", quantity: 1, price: 100, subtotal: 100 }],
      lines: [{ id: "a", quantity: 3 }]
    })
    expect(next.total).toBe(300)
    expect(computeTender(next.total, 100).balanceDue).toBe(200)
    expect(computeTender(50, 100).changeToGive).toBe(50)
    expect(computeTender(440, 765).changeToGive).toBe(325)
  })

  test("over-tender records only the amount due", () => {
    expect(
      resolveSettleReceivedAmount({
        priorReceived: 0,
        amountDue: 435,
        cashTendered: 500,
        paymentMethod: "cash",
        grandTotal: 435
      })
    ).toBe(435)
    expect(
      resolveSettleReceivedAmount({
        priorReceived: 500,
        amountDue: 300,
        cashTendered: 500,
        paymentMethod: "cash",
        grandTotal: 800
      })
    ).toBe(800)
    expect(
      resolveSettleReceivedAmount({
        priorReceived: 0,
        amountDue: 435,
        cashTendered: 435,
        paymentMethod: "cash",
        grandTotal: 435
      })
    ).toBe(435)
    expect(
      resolveSettleReceivedAmount({
        priorReceived: 0,
        amountDue: 435,
        cashTendered: 200,
        paymentMethod: "cash",
        grandTotal: 435
      })
    ).toBe(200)
    expect(
      resolveSettleReceivedAmount({
        priorReceived: 0,
        amountDue: 435,
        cashTendered: 500,
        paymentMethod: "card",
        grandTotal: 435
      })
    ).toBe(435)
  })
})

describe("item mapping", () => {
  test("combination and deal win over productId", () => {
    const combo = buildPlaceOrderApiItems([
      { quantity: 1, productId: "p", combinationId: "c1" }
    ])
    expect(combo[0]?.combinationId).toBe("c1")
    expect(combo[0]?.productId).toBe(undefined)

    const deal = buildPlaceOrderApiItems([
      {
        quantity: 1,
        productId: "p",
        dealId: "d1",
        dealSelections: [{ groupId: "g", productId: "p2", combinationId: "c2" }]
      }
    ])
    expect(deal[0]?.dealId).toBe("d1")
    expect(deal[0]?.variantDetails.selections?.[0]?.groupId).toBe("g")
  })

  test("keeps addon combinationId on place-order items", () => {
    const [item] = buildPlaceOrderApiItems([
      {
        quantity: 1,
        combinationId: "parent-combo",
        selectedAddons: [
          {
            addonProductId: "crispy-taco",
            quantity: 1,
            combinationId: "addon-combo-large"
          }
        ]
      }
    ])
    expect(item?.addons).toEqual([
      {
        addonProductId: "crispy-taco",
        quantity: 1,
        combinationId: "addon-combo-large"
      }
    ])
  })
})

describe("status patch", () => {
  test("sends payment_status with new_status so unpaid completed stays pending", () => {
    expect(
      buildPosStatusPatchBody({
        newStatus: "completed",
        paymentStatus: "pending"
      })
    ).toEqual({
      new_status: "completed",
      payment_status: "pending"
    })
  })

  test("keeps paid when advancing a paid ticket", () => {
    expect(
      buildPosStatusPatchBody({
        newStatus: "ready",
        paymentStatus: "paid"
      })
    ).toEqual({
      new_status: "ready",
      payment_status: "paid"
    })
  })

  test("marketplace complete sends paid and the exact total", () => {
    expect(
      buildPosStatusPatchBody({
        newStatus: "completed",
        paymentStatus: "pending",
        isOnlineOrder: true,
        receivedAmount: 2315
      })
    ).toEqual({
      new_status: "completed",
      payment_status: "paid",
      received_amount: 2315
    })
  })

  test("POS complete keeps the current payment status and omits amount", () => {
    expect(
      buildPosStatusPatchBody({
        newStatus: "completed",
        paymentStatus: "pending",
        isOnlineOrder: false,
        receivedAmount: 2315
      })
    ).toEqual({
      new_status: "completed",
      payment_status: "pending"
    })
  })
})

describe("bill line mods", () => {
  test("collapses repeated sauce picks", () => {
    expect(
      formatBillLineMods({
        variants: [
          { value: "Standard Sauce" },
          { value: "Chipotle Sauce" },
          { value: "Cheese" },
          { value: "Standard Sauce" },
          { value: "Chipotle Sauce" },
          { value: "Chipotle Sauce" },
          { value: "Pickled Cucumber" },
          { value: "Barbeque Sauce" },
          { value: "Cheese" }
        ]
      })
    ).toBe(
      "Standard Sauce · Chipotle Sauce · Cheese · Pickled Cucumber · Barbeque Sauce"
    )
  })

  test("prefers combinationLabel", () => {
    expect(
      formatBillLineMods({
        combinationLabel: "Regular · Chicken",
        variants: [{ value: "small" }]
      })
    ).toBe("Regular · Chicken")
  })

  test("lists each variant on its own line", () => {
    expect(
      listBillLineMods({
        variants: [
          { group: "1st Sauce", value: "Standard Sauce" },
          { group: "2nd Sauce", value: "Chipotle Sauce" },
          { group: "Make It Better", value: "Pickled Cucumber" }
        ]
      })
    ).toEqual([
      "1st Sauce: Standard Sauce",
      "2nd Sauce: Chipotle Sauce",
      "Make It Better: Pickled Cucumber"
    ])
  })
})
