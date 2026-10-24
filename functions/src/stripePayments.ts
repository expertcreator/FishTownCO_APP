// import { getAuth } from "firebase-admin/auth"; // Stripe backend disabled
// import { FieldValue, getFirestore } from "firebase-admin/firestore"; // Stripe backend disabled
// import { logger } from "firebase-functions"; // Stripe backend disabled
// import { defineSecret } from "firebase-functions/params"; // Stripe backend disabled
// import { onRequest } from "firebase-functions/v2/https"; // Stripe backend disabled
// import Stripe from "stripe"; // Stripe backend disabled

/**
 * Stripe payments backend disabled. Ready for RevenueCat / In-App Purchase integration.
 */

/*
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

const PRICE_IDS = {
  monthly: "price_1URFqpLSPIMW0ioZiBe0uLJX",
  annual: "price_1URFUYLSPIMW0ioZbdkEG5z6",
} as const;

type PlanId = keyof typeof PRICE_IDS;

const REGION = "europe-west2";
const EPHEMERAL_API_VERSION = "2026-09-30.endive";

function stripeClient(): Stripe {
  return new Stripe(stripeSecretKey.value());
}

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
*/

/**
 * Stripe Cloud Functions disabled for RevenueCat migration.
 */
/*
export const createSubscriptionPayment = onRequest(
  {
    region: "europe-west2",
    cors: true,
    invoker: "public",
  },
  async (req, res) => {
    res.status(404).json({ error: "STRIPE_DISABLED" });
  }
);

export const recordSubscriptionPayment = onRequest(
  {
    region: "europe-west2",
    cors: true,
    invoker: "public",
  },
  async (req, res) => {
    res.status(404).json({ error: "STRIPE_DISABLED" });
  }
);
*/