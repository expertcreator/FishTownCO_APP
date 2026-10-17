import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

const PRICE_IDS = {
  monthly: "price_1URFqpLSPIMW0ioZiBe0uLJX",
  annual: "price_1URFUYLSPIMW0ioZbdkEG5z6",
} as const;

type PlanId = keyof typeof PRICE_IDS;

const REGION = "europe-west2";
/** Matches @stripe/stripe-react-native 0.64 Payment Sheet. */
const EPHEMERAL_API_VERSION = "2024-12-15";

/**
 * Builds a Stripe client from the server secret.
 * @returns Stripe SDK client
 */
function stripeClient(): Stripe {
  return new Stripe(stripeSecretKey.value());
}

/**
 * Reads the Firebase user from the Authorization bearer token.
 * @param authorization - Authorization header
 * @returns User id, or null when the token is missing or invalid
 */
async function uidFromAuthorization(
  authorization: string | undefined
): Promise<string | null> {
  const match = /^Bearer\s+(.+)$/i.exec(authorization ?? "");
  if (!match?.[1]) return null;
  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * Reads a monthly or annual plan id from a request body.
 * @param body - Parsed JSON body
 * @returns Plan id, or null
 */
function readPlanId(body: unknown): PlanId | null {
  if (!body || typeof body !== "object") return null;
  const planId = (body as { planId?: unknown }).planId;
  if (planId === "monthly" || planId === "annual") return planId;
  return null;
}

/**
 * Reads a subscription id from a request body.
 * @param body - Parsed JSON body
 * @returns Subscription id, or null
 */
function readSubscriptionId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const subscriptionId = (body as { subscriptionId?: unknown }).subscriptionId;
  if (typeof subscriptionId !== "string") return null;
  const trimmed = subscriptionId.trim();
  return trimmed.startsWith("sub_") ? trimmed : null;
}

/**
 * Returns the Stripe price id on a subscription item.
 * @param price - Price object or id
 * @returns Price id
 */
function priceIdOf(price: string | Stripe.Price): string {
  return typeof price === "string" ? price : price.id;
}

/**
 * Finds an active subscription for this customer on the selected price.
 * @param stripe - Stripe client
 * @param customerId - Stripe customer id
 * @param priceId - Selected price id
 * @returns Active subscription, or null
 */
async function findActiveSubscription(
  stripe: Stripe,
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription | null> {
  const listed = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 10,
  });
  return (
    listed.data.find((subscription) =>
      subscription.items.data.some((item) => priceIdOf(item.price) === priceId)
    ) ?? null
  );
}

/**
 * Reuses an unfinished subscription for the same price so a closed card sheet
 * does not create another one.
 * @param stripe - Stripe client
 * @param customerId - Stripe customer id
 * @param priceId - Selected price id
 * @returns Incomplete subscription, or null
 */
async function findIncompleteSubscription(
  stripe: Stripe,
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription | null> {
  const listed = await stripe.subscriptions.list({
    customer: customerId,
    status: "incomplete",
    limit: 10,
  });
  return (
    listed.data.find((subscription) =>
      subscription.items.data.some((item) => priceIdOf(item.price) === priceId)
    ) ?? null
  );
}

/**
 * Creates a Stripe customer for this Firebase user, or returns the saved one.
 * @param stripe - Stripe client
 * @param uid - Firebase Auth uid
 * @returns Stripe customer id
 */
async function ensureCustomer(stripe: Stripe, uid: string): Promise<string> {
  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const existing = snap.get("stripeCustomerId");
  if (typeof existing === "string" && existing.trim()) return existing.trim();

  const user = await getAuth().getUser(uid);
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: { firebaseUid: uid },
  });
  await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
  return customer.id;
}

const INVOICE_EXPAND = [
  "confirmation_secret",
  "payments.data.payment.payment_intent",
] as const;

/**
 * Reads the Payment Sheet client secret from a subscription invoice.
 * Stripe omits confirmation_secret unless it is expanded.
 * @param stripe - Stripe client
 * @param subscription - Subscription whose latest invoice should be paid
 * @returns Client secret and a short reason when it is missing
 */
async function paymentClientSecret(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<{ secret: string | null; detail: string }> {
  const invoiceRef = subscription.latest_invoice;
  const invoiceId = typeof invoiceRef === "string" ? invoiceRef : invoiceRef?.id;
  if (!invoiceId) {
    return { secret: null, detail: "Subscription has no invoice" };
  }

  let invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: [...INVOICE_EXPAND],
  });
  if (invoice.status === "draft") {
    invoice = await stripe.invoices.finalizeInvoice(invoiceId, {
      expand: [...INVOICE_EXPAND],
    });
  }

  const fromConfirmation = invoice.confirmation_secret?.client_secret?.trim();
  if (fromConfirmation) return { secret: fromConfirmation, detail: "" };

  const payment =
    invoice.payments?.data.find((item) => item.is_default) ??
    invoice.payments?.data[0];
  const intent = payment?.payment.payment_intent;
  if (intent && typeof intent !== "string" && intent.client_secret) {
    return { secret: intent.client_secret, detail: "" };
  }
  if (typeof intent === "string") {
    const retrieved = await stripe.paymentIntents.retrieve(intent);
    if (retrieved.client_secret) {
      return { secret: retrieved.client_secret, detail: "" };
    }
  }

  return {
    secret: null,
    detail: `Invoice ${invoice.id} status ${invoice.status ?? "unknown"} has no payment secret`,
  };
}

/**
 * Builds a card label such as `Visa •••• 4242`.
 * @param paymentMethod - Stripe payment method, when expanded
 * @returns Display label
 */
function cardLabel(
  paymentMethod: string | Stripe.PaymentMethod | null | undefined
): string {
  if (!paymentMethod || typeof paymentMethod === "string" || !paymentMethod.card) {
    return "Card";
  }
  const brand = paymentMethod.card.brand ?? "card";
  const name = brand.charAt(0).toUpperCase() + brand.slice(1);
  const last4 = paymentMethod.card.last4;
  return last4 ? `${name} •••• ${last4}` : name;
}

/**
 * Formats a London calendar date as `16 Oct 2026`.
 * @param date - Instant to format
 * @returns Display date
 */
function formatDateLabel(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("day")} ${read("month")} ${read("year")}`;
}

/**
 * Writes one paid invoice into `users/{uid}/billing/{invoiceId}`.
 * @param uid - Firebase Auth uid
 * @param planId - Selected plan
 * @param invoice - Paid Stripe invoice
 * @param method - Card label
 * @returns void
 */
async function writePaidInvoice(
  uid: string,
  planId: PlanId,
  invoice: Stripe.Invoice,
  method: string
): Promise<void> {
  const paidAtSeconds = invoice.status_transitions?.paid_at ?? invoice.created;
  const paidAt = new Date(paidAtSeconds * 1000);
  const amountValue = (invoice.amount_paid ?? 0) / 100;
  await getFirestore()
    .collection("users")
    .doc(uid)
    .collection("billing")
    .doc(invoice.id)
    .set(
      {
        planId,
        amountValue,
        amountLabel: `£${amountValue.toFixed(2)}`,
        dateIso: paidAt.toISOString(),
        dateLabel: formatDateLabel(paidAt),
        method,
        status: "Paid",
        stripeInvoiceId: invoice.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

/**
 * Saves the latest paid invoice for a subscription owned by this user.
 * @param stripe - Stripe client
 * @param uid - Firebase Auth uid
 * @param subscriptionId - Stripe subscription id
 * @returns True when a paid invoice was stored
 */
async function recordPaidSubscription(
  stripe: Stripe,
  uid: string,
  subscriptionId: string
): Promise<boolean> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice", "default_payment_method"],
  });
  if (subscription.metadata?.firebaseUid !== uid) return false;

  const planId = readPlanId({ planId: subscription.metadata?.planId });
  const invoice = subscription.latest_invoice;
  if (!planId || !invoice || typeof invoice === "string" || invoice.status !== "paid") {
    return false;
  }

  await writePaidInvoice(
    uid,
    planId,
    invoice,
    cardLabel(subscription.default_payment_method)
  );
  return true;
}

/**
 * Creates a Stripe subscription and returns the Payment Sheet secrets.
 * The app calls this when the user taps Subscribe.
 */
export const createSubscriptionPayment = onRequest(
  {
    region: REGION,
    cors: true,
    invoker: "public",
    secrets: [stripeSecretKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const uid = await uidFromAuthorization(req.get("Authorization"));
    if (!uid) {
      res.status(401).json({ error: "NOT_SIGNED_IN" });
      return;
    }

    const planId = readPlanId(req.body);
    if (!planId) {
      res.status(400).json({ error: "INVALID_PLAN" });
      return;
    }

    try {
      const stripe = stripeClient();
      const customerId = await ensureCustomer(stripe, uid);
      const priceId = PRICE_IDS[planId];
      const active = await findActiveSubscription(stripe, customerId, priceId);
      if (active) {
        await recordPaidSubscription(stripe, uid, active.id);
        res.json({ alreadyActive: true });
        return;
      }

      const subscription =
        (await findIncompleteSubscription(stripe, customerId, priceId)) ??
        (await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          metadata: { firebaseUid: uid, planId },
          expand: ["latest_invoice.confirmation_secret"],
        }));

      const payment = await paymentClientSecret(stripe, subscription);
      if (!payment.secret) {
        logger.warn("Subscription invoice has no payment secret", {
          uid,
          subscriptionId: subscription.id,
          detail: payment.detail,
        });
        res.status(409).json({ error: "PAYMENT_NOT_READY", detail: payment.detail });
        return;
      }

      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: EPHEMERAL_API_VERSION }
      );
      if (!ephemeralKey.secret) {
        res.status(500).json({ error: "PAYMENT_NOT_READY" });
        return;
      }

      res.json({
        alreadyActive: false,
        customerId,
        ephemeralKey: ephemeralKey.secret,
        paymentIntentClientSecret: payment.secret,
        subscriptionId: subscription.id,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      logger.error("Create subscription payment failed", { uid, error: detail });
      res.status(500).json({ error: "PAYMENT_FAILED", detail });
    }
  }
);

/**
 * Verifies the Stripe subscription and writes the billing row after the card sheet.
 */
export const recordSubscriptionPayment = onRequest(
  {
    region: REGION,
    cors: true,
    invoker: "public",
    secrets: [stripeSecretKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      return;
    }

    const uid = await uidFromAuthorization(req.get("Authorization"));
    if (!uid) {
      res.status(401).json({ error: "NOT_SIGNED_IN" });
      return;
    }

    const subscriptionId = readSubscriptionId(req.body);
    if (!subscriptionId) {
      res.status(400).json({ error: "INVALID_SUBSCRIPTION" });
      return;
    }

    try {
      const saved = await recordPaidSubscription(
        stripeClient(),
        uid,
        subscriptionId
      );
      if (!saved) {
        res.status(409).json({ error: "PAYMENT_NOT_COMPLETE" });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      logger.error("Record subscription payment failed", { uid, error: detail });
      res.status(500).json({ error: "PAYMENT_FAILED", detail });
    }
  }
);
