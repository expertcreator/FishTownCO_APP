import type { RiderDeliveryFailureReason } from "@/constants"
import type { RiderOrderAction } from "./constants"

export type LocalizedText = string | { en?: string; ar?: string; ur?: string }

export type RiderOrderActionRequest = {
  orderId: string
  action: RiderOrderAction
  deliveryProofImage?: string
  paymentProofImage?: string
  contactAttempted?: boolean
  failureReason?: string
}

export type RiderOrderActionResponse = {
  success?: boolean
  message?: string
  code?: string
  id?: string
  orderNumber?: string
  deliveryStatus?: string
  orderStatus?: string
  [key: string]: unknown
}

export type FailRiderOrderDeliveryRequest = {
  orderId: string
  failureReason: RiderDeliveryFailureReason
  contactAttempted: boolean
}

export type UpdateEstimatedDeliveryTimeRequest = {
  orderId: string
  minutes: number
}

export type UpdateEstimatedDeliveryTimeResponse = {
  success?: boolean
  message?: string
  code?: string
  branch?: unknown
  order?: {
    id?: string
    orderNumber?: string
    estimatedDeliveryTime?: string
    [key: string]: unknown
  }
}

export type RiderOrdersListParams = {
  page?: number
  limit?: number
  status?: string
  startDate?: string
  endDate?: string
}

export type RiderOrderListItem = {
  id: string
  orderNumber: string
  customerName: string
  customerMobile?: string
  location: string
  time?: string
  distance: string
  price: number
  status: string
  statusColor: string
  branchName: LocalizedText
  branchImage?: string
  branchCountry?: string
  riderEarningAmount?: number
  riderEarning?: number
}

export type RiderOrdersListResponse = {
  items: RiderOrderListItem[]
  total: number
  page: number
  limit: number
}

export type RiderOrderDetailsItem = {
  name: LocalizedText
  quantity: number
  price: number
  image?: string
}

export type RiderOrderDetailsResponse = {
  id: string
  orderNumber: string
  customerName: string
  customerMobile?: string
  deliveryAddress?: LocalizedText | { ar?: string; en?: string }
  subtotal?: string
  deliveryFee?: string
  tax?: string
  discount?: string
  total?: string
  orderStatus?: string
  paymentStatus?: string
  paymentMethod?: string
  orderType?: string
  notes?: string | null
  driverId?: string
  deliveryStatus?: string
  estimatedDeliveryTime?: string | null
  createdAt?: string
  updatedAt?: string
  deliveryProofImage?: string
  paymentProofImage?: string
  riderEarningAmount?: number
  riderEarning?: number
  branch?: {
    id: string
    name: LocalizedText
    address?: LocalizedText
    logo?: string
    restaurantPicture?: string
  }
  items?: RiderOrderDetailsItem[]
  tracking?: {
    estimatedDeliveryTime?: string
    deliveryProofImage?: string
    paymentProofImage?: string
  }
}

export type RiderActiveOrder = {
  orderId: string
  orderNumber: string
} | null
