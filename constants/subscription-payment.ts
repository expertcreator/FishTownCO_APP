/**
 * Subscription payment options for Fishtownco.
 * Replace bank details when the client provides them.
 */

export type SubscriptionPaymentBrand = "fishtownco";

export type SubscriptionPaymentMethod = {
  key: string;
  brand: SubscriptionPaymentBrand;
  method: "bank_transfer" | "wallet";
  label: string;
  accountTitle: string;
  accountNumber?: string;
  bankName?: string;
};

export const SUBSCRIPTION_PAYMENT_METHODS: SubscriptionPaymentMethod[] = [
  {
    key: "fishtownco_bank_transfer",
    brand: "fishtownco",
    method: "bank_transfer",
    label: "Bank transfer",
    accountTitle: "Fishtownco",
    bankName: "TBD",
  },
];

/**
 * Lists payment methods for the active brand.
 * @param brand - Subscription payment brand
 * @returns Matching payment methods
 */
export function getSubscriptionPaymentMethods(
  brand: SubscriptionPaymentBrand = "fishtownco"
): SubscriptionPaymentMethod[] {
  return SUBSCRIPTION_PAYMENT_METHODS.filter((m) => m.brand === brand);
}
