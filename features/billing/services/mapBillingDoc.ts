import type { QueryDocumentSnapshot } from "@react-native-firebase/firestore";
import { formatSafetyDueDateLong } from "@/features/safety/utils/formatSafetyDueDate";
import type {
  BillingPlanId,
  BillingRow,
  BillingStatus,
} from "@/features/billing/types/billing";

/**
 * Formats a GBP amount for billing list rows.
 * @param value - Amount in pounds
 * @returns Display string like `£14.99`
 */
export function formatBillingAmount(value: number): string {
  return `£${value.toFixed(2)}`;
}

/**
 * Reads the payment date from an ISO string or a Firestore timestamp.
 * @param data - Billing document fields
 * @returns Payment date, or now when the document has neither
 */
function paymentDate(data: Record<string, unknown>): Date {
  const dateIso = String(data.dateIso ?? "");
  if (dateIso) {
    const parsed = new Date(dateIso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const created = data.createdAt;
  if (
    created &&
    typeof created === "object" &&
    "toDate" in created &&
    typeof created.toDate === "function"
  ) {
    const date = created.toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

/**
 * Maps a Firestore billing document into the list model.
 * @param docSnap - Firestore document snapshot
 * @returns Billing row for UI
 */
export function mapBillingDoc(docSnap: QueryDocumentSnapshot): BillingRow {
  const data = docSnap.data() as Record<string, unknown>;
  const amountValue = Number(data.amountValue ?? data.amount ?? 0);
  const dateObj = paymentDate(data);
  const statusRaw = String(data.status ?? "Paid");
  const status: BillingStatus =
    statusRaw.toLowerCase() === "failed" ? "Failed" : "Paid";
  const planIdRaw = String(data.planId ?? "");
  const planId: BillingPlanId | undefined =
    planIdRaw === "monthly" || planIdRaw === "annual"
      ? planIdRaw
      : undefined;

  return {
    id: docSnap.id,
    amount:
      typeof data.amountLabel === "string" && data.amountLabel.trim()
        ? String(data.amountLabel)
        : formatBillingAmount(Number.isFinite(amountValue) ? amountValue : 0),
    amountValue: Number.isFinite(amountValue) ? amountValue : 0,
    date:
      typeof data.dateLabel === "string" && data.dateLabel.trim()
        ? String(data.dateLabel)
        : formatSafetyDueDateLong(dateObj),
    dateIso: dateObj.toISOString(),
    method: String(data.method ?? "Card").trim() || "Card",
    status,
    planId,
  };
}
