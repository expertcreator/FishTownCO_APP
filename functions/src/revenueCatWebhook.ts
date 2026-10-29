import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

const webhookSecret = defineSecret("REVENUECAT_WEBHOOK_SECRET");

const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "SUBSCRIPTION_EXTENDED",
]);

type SubscriptionStatus = "active" | "canceled" | "expired";

/**
 * Maps a store product id onto the monthly or annual plan.
 * @param productId - App Store or Play product id
 * @returns Plan id, or null when the product is unknown
 */
function planIdFromProduct(productId: string): "monthly" | "annual" | null {
  if (/year|annual/i.test(productId)) return "annual";
  if (/month/i.test(productId)) return "monthly";
  return null;
}

/**
 * Saves RevenueCat purchase, renewal, cancel, and refund events on the Firebase user.
 * The dashboard authorization header must be `Bearer <REVENUECAT_WEBHOOK_SECRET>`.
 */
export const revenueCatWebhook = onRequest(
  {
    region: "europe-west2",
    invoker: "public",
    secrets: [webhookSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const header = req.get("Authorization") ?? "";
    if (header !== `Bearer ${webhookSecret.value()}`) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    const event = req.body?.event as
      | {
          id?: string;
          type?: string;
          app_user_id?: string;
          product_id?: string;
          transaction_id?: string;
          expiration_at_ms?: number;
          purchased_at_ms?: number;
          event_timestamp_ms?: number;
        }
      | undefined;
    const uid = event?.app_user_id?.trim() ?? "";
    const type = event?.type ?? "";
    if (!uid || uid.startsWith("$RCAnonymous") || !type) {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }

    let status: SubscriptionStatus | null = null;
    if (ACTIVE_EVENTS.has(type)) status = "active";
    else if (type === "CANCELLATION") status = "canceled";
    else if (type === "EXPIRATION" || type === "REFUND") status = "expired";
    if (!status) {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }

    const productId = event?.product_id?.trim() ?? "";
    const planId = planIdFromProduct(productId);
    const expiresAt =
      typeof event?.expiration_at_ms === "number"
        ? new Date(event.expiration_at_ms)
        : null;

    const db = getFirestore();
    await db.doc(`users/${uid}`).set(
      {
        subscriptionStatus: status,
        subscriptionPlan: planId,
        subscriptionProductId: productId || null,
        subscriptionExpiresAt: expiresAt,
        subscriptionUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (status === "active" && planId) {
      const billingId = event?.transaction_id || event?.id || `${type}-${uid}`;
      const amountValue = planId === "annual" ? 100 : 10;
      const purchasedMs =
        typeof event?.purchased_at_ms === "number"
          ? event.purchased_at_ms
          : typeof event?.event_timestamp_ms === "number"
            ? event.event_timestamp_ms
            : Date.now();
      const paidAt = new Date(purchasedMs);
      const dateLabel = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Europe/London",
      })
        .format(paidAt)
        .replace(/,/g, "");
      await db.doc(`users/${uid}/billing/${billingId}`).set(
        {
          planId,
          amountValue,
          amountLabel: planId === "annual" ? "£100" : "£10",
          dateIso: paidAt.toISOString(),
          dateLabel,
          status: "Paid",
          method: "App Store / Google Play",
          source: "revenuecat",
          eventType: type,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    logger.info("RevenueCat subscription updated", { uid, type, status });
    res.status(200).json({ ok: true });
  }
);
