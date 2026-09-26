/**
 * Billing payment row for prototype screen 22.
 * Stored at `users/{uid}/billing/{id}`.
 */
export type BillingStatus = "Paid" | "Failed";

export type BillingPlanId = "monthly" | "annual";

export type BillingRow = {
  id: string;
  amount: string;
  amountValue: number;
  date: string;
  dateIso: string;
  method: string;
  status: BillingStatus;
  planId?: BillingPlanId;
};
