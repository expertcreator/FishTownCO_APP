export type PosCartCtaPath = "send-kitchen" | "take-payment" | "hold"

export interface PosCartCtaOutcome {
  callsPlaceOrder: boolean
  opensPayment: boolean
  localHoldOnly: boolean
  paymentStatus: "pending" | "paid" | null
  /** Never `pending` — marketplace auto-reject cron filter. */
  orderStatus: "confirmed" | null
}

export interface PosAddonPayload {
  addonProductId: string
  quantity: number
  combinationId?: string
}

export interface PosModifierSelection {
  variantId: string
  variantName: string
  selectionType: "single" | "multiple"
  selectedOptions: Array<{
    optionId: string
    optionName: string
    priceModifier: number
  }>
}

export interface PosDealSelection {
  groupId: string
  productId: string
  combinationId: string
}

export interface PosVariantLike {
  variantId: string
  optionIds: string[]
  optionNames?: string[]
}

/** Cart line before POST/PUT — no server line `id`. */
export interface PosCartLine {
  quantity: number
  productId?: string
  combinationId?: string
  dealId?: string
  selectedVariants?: PosVariantLike[]
  selectedAddons?: PosAddonPayload[]
  modifierSelections?: PosModifierSelection[]
  modifierTotal?: number
  dealSelections?: PosDealSelection[]
}

export interface PosPlaceOrderApiItem {
  quantity: number
  productId?: string
  combinationId?: string
  dealId?: string
  addons?: PosAddonPayload[]
  variantDetails: {
    combinationId?: string
    combinationLabel?: string
    modifierSelections?: PosModifierSelection[]
    modifierTotal: number
    selections?: PosDealSelection[]
  }
}

export interface PosBillLine {
  id: string
  quantity: number
  productId?: string
  combinationId?: string | null
  dealId?: string
  addons?: PosAddonPayload[]
  modifierSelections?: PosModifierSelection[]
  variantDetails?: {
    combinationId?: string
    combinationLabel?: string
    modifierSelections?: PosModifierSelection[]
    modifierTotal?: number
    selections?: unknown
  } | null
}

export interface PosExistingPutItem {
  id: string
  quantity: number
  productId?: string
  combinationId?: string
  dealId?: string
  addons?: PosAddonPayload[]
  variantDetails?: Record<string, unknown>
}

export interface PosOrderShell {
  orderStatus?: string | null
  paymentStatus?: string | null
  paymentMethod?: string | null
  orderType?: string | null
  notes?: string | null
  customerName?: string | null
  customerMobile?: string | null
  items?: PosBillLine[] | null
  isOnlineOrder?: boolean | null
}

export interface PosCreateOrderBody {
  userId: null
  branchId?: string
  tableId: string | null
  isOnlineOrder: false
  addressId: null
  orderStatus: "confirmed"
  paymentStatus: "pending" | "paid"
  paymentMethod: string
  orderType: string
  receivedAmount: number
  notes: string
  customerName: string
  customerMobile: string
  deliveryAddress?: Record<string, string>
  paymentProofImage: string | null
  items: PosPlaceOrderApiItem[]
  expectedTotal?: number
}

export interface PosSendRoundPutBody {
  items: Array<PosExistingPutItem | PosPlaceOrderApiItem>
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  orderType: string | null | undefined
  notes: string
  customerName: string
  customerMobile: string
  isOnlineOrder: boolean
}

export interface PosSettlePutBody {
  paymentStatus: "paid" | "pending"
  paymentMethod: string
  receivedAmount: number
  paymentProofImage: string | null
  expectedTotal?: number
}

export type PosBillEditAction =
  | { kind: "void"; itemId: string }
  | { kind: "add"; itemId: string; quantity: number }
  | { kind: "replace-qty"; itemId: string; quantity: number }

export type PosTenderKind = "empty" | "exact" | "over" | "short"

export interface PosTenderSnapshot {
  kind: PosTenderKind
  total: number
  received: number
  changeToGive: number
  shortBy: number
  balanceDue: number
}

export type PosPartPayResult =
  | { ok: true }
  | { ok: false; code: "part-payment-invalid" }
