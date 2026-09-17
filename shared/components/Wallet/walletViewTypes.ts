export type TransactionStatus = "pending" | "approved" | "rejected";

/** Display row for a wallet transaction (mapped from API in `Wallet`). */
export type WalletTransaction = {
  id: string;
  requestId?: string;
  type: "cashout" | "collection";
  title: string;
  reference: string;
  hideReference?: boolean;
  date: string;
  dateTime: string;
  createdAt?: string;
  amount: string;
  amountNumber: number;
  currencyCode: string;
  status: TransactionStatus;
  rejectionReason?: string | null;
  proofImageUrl?: string | null;
};
