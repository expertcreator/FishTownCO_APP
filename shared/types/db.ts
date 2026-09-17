import type {
  AvailableCountry,
  DeliveryStatus,
  Locale,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  DaypartMenuSlug,
  ProductStatus,
  ProductType,
  SellOn,
  TenantAdminStatus,
  TenantStatus,
  TenantType,
  UserType,
} from "@/constants";
import type { Permission } from "@/constants/permissions";

export type Tenant = {
  id: string;
  name: Record<Locale, string>;
  address: Record<Locale, string> | null;
  coordinates: { lat: number; lng: number } | null;
  description: Record<Locale, string> | null;
  // Extended fields (may be null/unused in some contexts)
  socialMedia?: Record<string, unknown> | null;
  businessHours: Record<Locale, string> | null;
  contactEmail: string | null;
  contactPhone: string | null;
  type: TenantType;
  country: AvailableCountry;
  parentId: string | null;
  restaurantPicture: string | null;
  coverPicture: string | null;
  rating: string;
  reviewsCount: number;
  // Optional categorisation for marketplace views
  categoryId?: string | null;
  sellOn: SellOn[];
  requiredLocales: Locale[];
  // Delivery configuration
  freeDelivery?: boolean;
  isDeliveredByFishtownco?: boolean;
  adminStatus: TenantAdminStatus;
  // Rejection fields (when adminStatus is "rejected")
  rejectionReason: Record<Locale, string> | null;
  rejectedAt: string | null;
  tenantStatus: TenantStatus | null;
  // Estimated delivery time range in minutes
  timeRange?: { min: number; max: number };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string | null;
  passwordHash?: string | null;
  phone: string | null;
  address: string | null;
  image: string | null;
  type: UserType;
  roleId: string | null;
  tenantId: string | null;
  branchId: string | null;
  // Guest / consumer specific fields
  isGuest?: boolean;
  guestDeviceId?: string | null;
  familyMemberContact?: string | null;
  phoneVerified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  tenantId: string;
  scope?: string;
  parentId: string | null;
  isGlobal: boolean;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  image: string;
  createdAt: string;
  updatedAt: string;
  subcategories: Category[];
};

export type Role = {
  id: string;
  tenantId: string;
  name: Record<Locale, string>;
  permissions: Permission[];
  canCreateAllRoles?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  tenantId: string;
  categoryId: string;
  rating: string;
  reviewsCount: number;
  tenantCategoryId?: string | null;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  images: string[];
  sellOn: SellOn[];
  /** Locked daypart slugs. Empty / omitted means available all day. */
  menuSlugs?: DaypartMenuSlug[];
  status: ProductStatus;
  type: ProductType[];
  preparationTime?: number | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: Record<Locale, string>;
  position: number;
  /** Single-select variants participate in combinations; multiple variants are modifier groups. */
  selectionType?: "single" | "multiple";
  /** Minimum selected options for modifier groups. */
  minSelections?: number;
  /** Maximum selected options for modifier groups; null/undefined means no explicit max. */
  maxSelections?: number | null;
  /** Required modifier groups must satisfy at least `minSelections` (or one selection). */
  isRequired?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VariantOption = {
  id: string;
  variantId: string;
  name: Record<Locale, string>;
  position: number;
  /** Modifier price delta. Combination variants still derive price from inventory. */
  priceModifier?: string | number | null;
  createdAt: string;
  updatedAt: string;
};

export type CombinationOptionInfo = {
  optionId: string;
  optionName: Record<Locale, string>;
  optionPosition: number;
  variantId: string;
  variantName: Record<Locale, string>;
};

export type VariantCombination = {
  id: string;
  productId: string;
  options: CombinationOptionInfo[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductInventory = {
  id: string;
  branchId: string;
  sku: string;
  price: string;
  stock: number | null;
  isActive: boolean;
  barcode: string;
  compareAtPrice?: string | null;
  createdAt: string;
  updatedAt: string;
} & (
  | {
      productId: string;
      combinationId?: null;
    }
  | ({
      combinationId: string;
      productId?: null;
    } & {
      // Soft-delete support for inventories
      deletedAt?: string | null;
    })
);

export type ProductAddon = {
  id: string;
  productId: string;
  addonProductId: string;
  isRequired: boolean;
  position: number;
  selectedCombinationIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProductWithVariants = Product & {
  variants: (ProductVariant & { options: VariantOption[] })[];
  inventory: ProductInventory[];
  combinations: VariantCombination[];
};

// ============================================================================
// ORDER TYPES
// ============================================================================

export type Order = {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerMobile: string;
  branchId: string;
  tableId: string | null;
  isTableFree?: boolean;
  addressId: string | null;
  deliveryAddress: Record<Locale, string> | null;
  subtotal: string;
  deliveryFee: string | null;
  tax: string;
  discount: string;
  total: string;
  receivedAmount: string | null;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  notes: string | null;
  driverId: string | null;
  deliveryStatus: DeliveryStatus | null;
  estimatedPreparationTime: string | null;
  estimatedDeliveryTime: string | null;
  paymentProofImage: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ============================================================================
// ORDER ITEM TYPES
// ============================================================================

export type OrderItemModifierSelection = {
  variantId: string;
  variantName: string;
  selectionType: "single" | "multiple";
  selectedOptions: Array<{
    optionId: string;
    optionName: string;
    priceModifier: number;
  }>;
};

export type OrderItemVariantDetails = {
  combinationId?: string;
  combinationLabel?: string;
  modifierSelections?: OrderItemModifierSelection[];
  modifierTotal?: number;
} & Record<string, unknown>;

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  inventoryId: string;
  productName: Record<Locale, string>;
  sku: string;
  price: string;
  quantity: number;
  subtotal: string;
  variantDetails: OrderItemVariantDetails | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ============================================================================
// PAYMENT TRANSACTION TYPES
// ============================================================================

export type PaymentTransaction = {
  id: string;
  orderId: string;
  transactionId: string;
  referenceNo: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string | null;
  gatewayResponse: Record<string, unknown> | null;
  gatewayCallback: Record<string, unknown> | null;
  errorMessage: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ============================================================================
// TABLE TYPES
// ============================================================================

export type TableStatus = "reserved" | "free" | "occupied";

export type Table = {
  id: string;
  name: string;
  branchId: string;
  status: TableStatus;
  capacity: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ============================================================================
// ADDRESS TYPES
// ============================================================================

export type Address = {
  id: string;
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RawMaterial = {
  name: Record<Locale, string>;
  id: string;
  description: Record<Locale, string>;
  quantity: string;
  branchId: string;
  unitName: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
