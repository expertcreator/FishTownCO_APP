/**
 * Billing history row matching prototype screen 22.
 */
export type BillingRow = {
  id: string;
  amount: string;
  date: string;
  method: string;
  status: "Paid" | "Failed";
};

/**
 * Demo billing payments matching https://fishtownco.itoasis.co/ screen 22.
 */
export const DEMO_BILLING: BillingRow[] = [
  {
    id: "b1",
    amount: "£10.00",
    date: "14 Jun 2026",
    method: "Visa •••• 4417",
    status: "Paid",
  },
  {
    id: "b2",
    amount: "£10.00",
    date: "14 May 2026",
    method: "Visa •••• 4417",
    status: "Paid",
  },
  {
    id: "b3",
    amount: "£10.00",
    date: "14 Apr 2026",
    method: "Visa •••• 4417",
    status: "Paid",
  },
  {
    id: "b4",
    amount: "£10.00",
    date: "14 Mar 2026",
    method: "Visa •••• 4417",
    status: "Failed",
  },
  {
    id: "b5",
    amount: "£10.00",
    date: "14 Feb 2026",
    method: "Visa •••• 4417",
    status: "Paid",
  },
];
