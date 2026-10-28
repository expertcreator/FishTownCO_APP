import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from "@react-native-firebase/firestore";
import Purchases from "react-native-purchases";
import {
  firebaseFirestore,
  getCurrentUser,
} from "@/features/common/firebase";
import {
  configurePurchases,
  PREMIUM_ENTITLEMENT_ID,
  revenueCatApiKey,
} from "@/features/subscription/services/configurePurchases";

/** Free trial length before the payment screen locks the app. */
export const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;

type AccessListener = (known?: Partial<SubscriptionAccess>) => void;

const accessListeners = new Set<AccessListener>();

/**
 * Reloads subscription gates after a trial start or a purchase.
 * @param known - Values already saved, applied before the reload finishes so
 *   a gate never redirects on the old access
 */
export function notifySubscriptionAccessChanged(
  known?: Partial<SubscriptionAccess>
): void {
  accessListeners.forEach((listener) => {
    listener(known);
  });
}

/**
 * Subscribes to trial and payment changes.
 * @param listener - Called after the saved access changes, with any values
 *   already known
 * @returns Unsubscribe function
 */
export function subscribeSubscriptionAccess(
  listener: AccessListener
): () => void {
  accessListeners.add(listener);
  return () => {
    accessListeners.delete(listener);
  };
}

export type SubscriptionAccess = {
  trialStartedAt: Date | null;
  subscriptionStatus: string;
  subscriptionExpiresAt: Date | null;
  storePaid: boolean;
};

/**
 * Converts a Firestore timestamp or Date into a Date.
 * @param value - Stored timestamp
 * @returns Date, or null when the value is empty
 */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  return null;
}

/**
 * Reads the trial and paid status stored on the signed-in user.
 * An active RevenueCat entitlement counts as paid even before the webhook writes.
 * @returns Access record. Missing user data is an unpaid account with no trial.
 * @throws {Error} When the user is signed out
 */
export async function fetchSubscriptionAccess(): Promise<SubscriptionAccess> {
  const user = getCurrentUser();
  if (!user?.uid) throw new Error("NOT_SIGNED_IN");

  const snap = await getDoc(doc(firebaseFirestore, "users", user.uid));
  const data = snap.data() ?? {};
  const billingSnap = await getDocs(
    collection(firebaseFirestore, "users", user.uid, "billing")
  );
  const billingPaid = billingSnap.docs.some((item) => {
    const row = item.data();
    if (String(row.status ?? "") !== "Paid") return false;
    const paidAt = toDate(row.dateIso) ?? toDate(row.createdAt);
    if (!paidAt) return false;
    const periodMs =
      String(row.planId ?? "") === "annual"
        ? 365 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
    return Date.now() < paidAt.getTime() + periodMs;
  });
  let storePaid = false;
  if (revenueCatApiKey()) {
    try {
      await configurePurchases(user.uid);
      const info = await Purchases.getCustomerInfo();
      storePaid = Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
    } catch {
      storePaid = false;
    }
  }

  return {
    trialStartedAt: toDate(data.trialStartedAt),
    subscriptionStatus: String(data.subscriptionStatus ?? ""),
    subscriptionExpiresAt: toDate(data.subscriptionExpiresAt),
    storePaid: storePaid || billingPaid,
  };
}

/**
 * Starts the 7-day trial once. A second tap does not move the start date.
 * @returns Promise that resolves when the user document is saved
 * @throws {Error} When the user is signed out
 */
export async function startFreeTrial(): Promise<void> {
  const user = getCurrentUser();
  if (!user?.uid) throw new Error("NOT_SIGNED_IN");
  const ref = doc(firebaseFirestore, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.data()?.trialStartedAt) return;
  const trialStartedAt = new Date();
  await setDoc(
    ref,
    { trialStartedAt: Timestamp.fromDate(trialStartedAt) },
    { merge: true }
  );
  notifySubscriptionAccessChanged({ trialStartedAt });
}

/**
 * Whether the 7-day trial is still running.
 * @param access - Saved trial and payment state
 * @param now - Clock used for the check
 * @returns True during the seven days after the trial starts
 */
export function isTrialActive(
  access: SubscriptionAccess,
  now = new Date()
): boolean {
  if (!access.trialStartedAt) return false;
  return now.getTime() < access.trialStartedAt.getTime() + TRIAL_MS;
}

/**
 * Whether a store purchase or saved subscription is still active.
 * @param access - Saved trial and payment state
 * @param now - Clock used for the expiry check
 * @returns True when the user has paid and the period has not ended
 */
export function hasPaidAccess(
  access: SubscriptionAccess,
  now = new Date()
): boolean {
  if (access.storePaid) return true;
  if (access.subscriptionStatus !== "active") return false;
  if (!access.subscriptionExpiresAt) return true;
  return access.subscriptionExpiresAt.getTime() > now.getTime();
}

/**
 * Whether Home and the other tabs should open.
 * @param access - Saved trial and payment state
 * @param now - Clock used for the check
 * @returns True during the trial or while a payment is active
 */
export function canUseApp(access: SubscriptionAccess, now = new Date()): boolean {
  return hasPaidAccess(access, now) || isTrialActive(access, now);
}
