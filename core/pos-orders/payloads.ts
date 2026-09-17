import { sendKitchenSettlement } from "./cart-cta"
import { shouldMarkPaidExactOnComplete } from "./completion"
import { buildPlaceOrderApiItems } from "./items"
import { resolveSettleReceivedAmount, validateCashPartPay } from "./tender"
import type { PosCartLine, PosCreateOrderBody, PosSettlePutBody } from "./types"

export interface BuildCreateOrderInput {
  items: PosCartLine[]
  orderType: string
  selectedTable?: string
  branchId?: string
  kitchenNote?: string
  customerName?: string
  customerMobile?: string
  deliveryAddress?: Record<string, string>
}

/**
 * POST `/orders` body for send-kitchen (confirmed + unpaid).
 * @param input - Cart and session fields
 * @returns Create body with receivedAmount 0
 */
export function buildSendKitchenApiPayload(
  input: BuildCreateOrderInput
): PosCreateOrderBody {
  const settlement = sendKitchenSettlement()
  const tableId =
    input.orderType === "DineIn" && input.selectedTable
      ? input.selectedTable
      : null

  return {
    userId: null,
    ...(input.branchId ? { branchId: input.branchId } : {}),
    tableId,
    isOnlineOrder: false,
    addressId: null,
    ...settlement,
    orderType: input.orderType,
    notes: input.kitchenNote || "",
    customerName: input.customerName || "",
    customerMobile: input.customerMobile || "",
    ...(input.deliveryAddress
      ? { deliveryAddress: input.deliveryAddress }
      : {}),
    paymentProofImage: null,
    items: buildPlaceOrderApiItems(input.items)
  }
}

export type BuildTakePaymentInput = BuildCreateOrderInput & {
  paymentMethod: string
  receivedAmount: number
  grandTotal: number
  partPayment?: boolean
  paymentProofImage?: string | null
}

/**
 * POST `/orders` body for take-payment (paid or cash part-pay pending).
 * @param input - Cart, tender, and session fields
 * @returns Create body
 * @throws {Error} `part-payment-invalid` when cash short-pay is out of range
 */
export function buildTakePaymentApiPayload(
  input: BuildTakePaymentInput
): PosCreateOrderBody {
  const isCash = input.paymentMethod === "cash"
  const isPartPayment = Boolean(input.partPayment) && isCash
  if (isPartPayment) {
    const part = validateCashPartPay(input.receivedAmount, input.grandTotal)
    if (!part.ok) {
      throw new Error(part.code)
    }
  }

  const receivedAmount = resolveSettleReceivedAmount({
    priorReceived: 0,
    amountDue: input.grandTotal,
    cashTendered: Number(input.receivedAmount),
    paymentMethod: input.paymentMethod,
    grandTotal: input.grandTotal
  })
  const tableId =
    input.orderType === "DineIn" && input.selectedTable
      ? input.selectedTable
      : null

  return {
    userId: null,
    ...(input.branchId ? { branchId: input.branchId } : {}),
    tableId,
    isOnlineOrder: false,
    addressId: null,
    orderStatus: "confirmed",
    paymentStatus: isPartPayment ? "pending" : "paid",
    paymentMethod: input.paymentMethod,
    orderType: input.orderType,
    receivedAmount,
    notes: input.kitchenNote || "",
    customerName: input.customerName || "",
    customerMobile: input.customerMobile || "",
    ...(input.deliveryAddress
      ? { deliveryAddress: input.deliveryAddress }
      : {}),
    paymentProofImage: isCash ? null : (input.paymentProofImage ?? null),
    items: buildPlaceOrderApiItems(input.items)
  }
}

/**
 * PUT settle body for an existing unpaid POS bill.
 * @param input - Tender fields
 * @returns Partial PUT body (no table free)
 */
export function buildSettlePutBody(input: {
  paymentMethod: string
  receivedAmount: number
  grandTotal: number
  paymentStatus: "paid" | "pending"
  paymentProofImage?: string | null
}): PosSettlePutBody {
  const isPaid = input.paymentStatus === "paid"
  return {
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    receivedAmount: input.receivedAmount,
    paymentProofImage:
      input.paymentMethod === "cash" ? null : (input.paymentProofImage ?? null),
    ...(isPaid ? { expectedTotal: input.grandTotal } : {})
  }
}

/**
 * PUT body after staff confirm they handed leftover cash back.
 * Records received as the current bill total so change-to-return clears.
 * @param input - Current bill total and payment method
 * @param input.grandTotal - Total after delivery fee / edits
 * @param input.paymentMethod - Existing tender method
 * @returns Settle PUT with received equal to total
 */
export function buildReturnChangePutBody(input: {
  grandTotal: number
  paymentMethod?: string | null
}): PosSettlePutBody {
  return buildSettlePutBody({
    paymentMethod: input.paymentMethod?.trim() || "cash",
    receivedAmount: input.grandTotal,
    grandTotal: input.grandTotal,
    paymentStatus: "paid"
  })
}

/**
 * PATCH `/orders/:id/status` body. Always sends payment_status so POS
 * Mark served unpaid is not auto-flipped to paid.
 * Marketplace complete also sends paid plus the exact bill total.
 * @param input - Next kitchen status, current payment status, and marketplace fields
 * @param input.newStatus - Next kitchen status
 * @param input.paymentStatus - Current payment status for POS tickets
 * @param input.isOnlineOrder - `true` for marketplace-placed tickets
 * @param input.receivedAmount - Exact bill total sent on marketplace complete
 * @returns Snake-case status patch body
 */
export function buildPosStatusPatchBody(input: {
  newStatus: string
  paymentStatus?: string | null
  isOnlineOrder?: boolean | null
  receivedAmount?: number | null
}): {
  new_status: string
  payment_status: string
  received_amount?: number
} {
  const markPaidExact = shouldMarkPaidExactOnComplete({
    isOnlineOrder: input.isOnlineOrder,
    newStatus: input.newStatus
  })
  const receivedAmount = Number(input.receivedAmount)

  return {
    new_status: input.newStatus,
    payment_status: markPaidExact
      ? "paid"
      : input.paymentStatus?.trim() || "pending",
    ...(markPaidExact && Number.isFinite(receivedAmount)
      ? { received_amount: receivedAmount }
      : {})
  }
}
