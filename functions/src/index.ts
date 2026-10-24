import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  buildMilestoneBody,
  collectMilestoneReminders,
  londonDateKey,
  reminderItemsFromUserCollections,
  type MilestoneReminder,
} from "./attention";

export { deleteUserData } from "./deleteUserData";
export { revenueCatWebhook } from "./revenueCatWebhook";

initializeApp();

const expo = new Expo();
const REMINDER_TITLE = "Expiry reminder";

type DeviceTarget = {
  token: string;
  refPath: string;
};

/**
 * Sends expiry reminders at 08:00 UK time.
 * A safety item, wallet document, or crew certificate is included only when
 * it is exactly 90, 60, 30, or 7 days from its due date. Other days send nothing.
 */
export const sendOverviewReminders = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "Europe/London",
    region: "europe-west2",
    timeoutSeconds: 540,
    memory: "256MiB",
  },
  async () => {
    const now = new Date();
    const todayKey = londonDateKey(now);
    const db = getFirestore();
    const devices = await db.collectionGroup("devices").get();

    const byUser = new Map<string, DeviceTarget[]>();
    for (const device of devices.docs) {
      const uid = device.ref.parent.parent?.id;
      const token = device.get("token");
      if (!uid || typeof token !== "string" || !Expo.isExpoPushToken(token)) {
        continue;
      }
      const list = byUser.get(uid) ?? [];
      if (!list.some((item) => item.token === token)) {
        list.push({ token, refPath: device.ref.path });
      }
      byUser.set(uid, list);
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const [uid, targets] of byUser) {
      try {
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();
        if (userSnap.get("overviewReminderOn") === todayKey) {
          skipped += 1;
          continue;
        }

        const [safety, wallet, crew] = await Promise.all([
          userRef.collection("safety").get(),
          userRef.collection("wallet").get(),
          userRef.collection("crew").get(),
        ]);
        const items = reminderItemsFromUserCollections({
          safety: safety.docs.map((doc) => doc.data()),
          wallet: wallet.docs.map((doc) => doc.data()),
          crew: crew.docs.map((doc) => doc.data()),
        });
        const hits = collectMilestoneReminders(items, now);
        const body = buildMilestoneBody(hits);
        if (!body) {
          await userRef.set({ overviewReminderOn: todayKey }, { merge: true });
          skipped += 1;
          continue;
        }

        const delivered = await sendOverview(targets, body, hits);
        if (!delivered) {
          failed += 1;
          continue;
        }

        await userRef.set(
          { overviewReminderOn: todayKey, overviewReminderAt: now },
          { merge: true }
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        logger.error("Overview reminder failed", {
          uid,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("Overview reminders finished", {
      users: byUser.size,
      sent,
      skipped,
      failed,
      day: todayKey,
    });

    if (failed > 0) {
      throw new Error(`Overview reminders failed for ${failed} user(s)`);
    }
  }
);

/**
 * Sends the expiry reminder to each phone and drops tokens Expo says are dead.
 * @param targets - Unique Expo tokens for one user
 * @param body - Notification body
 * @param hits - Items that reached a 90, 60, 30, or 7 day reminder today
 * @returns True when at least one phone accepted the message
 */
async function sendOverview(
  targets: DeviceTarget[],
  body: string,
  hits: MilestoneReminder[]
): Promise<boolean> {
  const messages: ExpoPushMessage[] = targets.map((target) => ({
    to: target.token,
    title: REMINDER_TITLE,
    body,
    sound: "default",
    priority: "high",
    channelId: "default_high",
    data: {
      screen: "home",
      type: "expiry-reminder",
      count: hits.length,
    },
  }));

  const db = getFirestore();
  let delivered = false;

  const chunks = expo.chunkPushNotifications(messages);
  let offset = 0;
  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    for (let index = 0; index < tickets.length; index += 1) {
      const ticket = tickets[index];
      const target = targets[offset + index];
      if (!ticket || !target) continue;
      if (ticket.status === "ok") {
        delivered = true;
        continue;
      }
      if (isUnregistered(ticket)) {
        await db.doc(target.refPath).delete().catch(() => undefined);
      } else {
        logger.warn("Expo push ticket error", {
          message: ticket.message,
          error: ticket.details?.error,
        });
      }
    }
    offset += chunk.length;
  }

  return delivered;
}

/**
 * True when Expo will never deliver to this token again.
 * @param ticket - Error ticket from the Expo push API
 * @returns Whether the device document should be removed
 */
function isUnregistered(ticket: ExpoPushTicket): boolean {
  return (
    ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered"
  );
}
