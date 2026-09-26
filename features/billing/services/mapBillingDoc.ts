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
 * Maps a Firestore billing document into the list model.
 * @param docSnap - Firestore document snapshot
 * @returns Billing row for UI
 */
export function mapBillingDoc(docSnap: QueryDocumentSnapshot): BillingRow {
  const data = docSnap.data() as Record<string, unknown>;
  const amountValue = Number(data.amountValue ?? data.amount ?? 0);
  const dateIso = String(data.dateIso ?? "");
  const parsed = dateIso ? new Date(dateIso) : null;
  const dateObj =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
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
