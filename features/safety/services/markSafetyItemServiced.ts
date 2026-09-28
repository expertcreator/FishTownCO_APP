import {
  doc,
  serverTimestamp,
  updateDoc,
} from "@react-native-firebase/firestore";
import {
  firebaseFirestore,
  getCurrentUser,
  queryClient,
} from "@/features/common/firebase";
import { SAFETY_ITEMS_QUERY_KEY } from "@/features/safety/hooks/useSafetyItems";
import { fetchSafetyItem } from "@/features/safety/services/fetchSafetyItem";
import {
  formatSafetyDueDate,
  parseSafetyDueDate,
} from "@/features/safety/utils/formatSafetyDueDate";

const DEFAULT_SERVICE_INTERVAL_DAYS = 365;

/**
 * Marks a safety item as serviced: sets last service to today and advances
 * the next due date by the previous service interval (default 1 year).
 * @param itemId - Safety Firestore document id
 * @returns Updated next due date
 * @throws {Error} When signed out, missing, or the Firestore update fails
 */
export async function markSafetyItemServiced(
  itemId: string
): Promise<{ nextDueDateIso: string; path: string }> {
  const user = getCurrentUser();
  if (!user?.uid) {
    throw new Error("NOT_SIGNED_IN");
  }

  const item = await fetchSafetyItem(itemId);
  if (!item) {
    throw new Error("SAFETY_ITEM_NOT_FOUND");
  }

  const now = new Date();
  const previousDue = item.dueDateIso
    ? new Date(item.dueDateIso)
    : parseSafetyDueDate(item.dueDate);
  const previousService = item.lastServiceDate
    ? parseSafetyDueDate(item.lastServiceDate)
    : null;

  let intervalDays = DEFAULT_SERVICE_INTERVAL_DAYS;
  if (
    previousService &&
    previousDue &&
    !Number.isNaN(previousService.getTime()) &&
    !Number.isNaN(previousDue.getTime())
  ) {
    const diff = Math.round(
      (previousDue.getTime() - previousService.getTime()) /
        (24 * 60 * 60 * 1000)
    );
    if (diff > 0) {
      intervalDays = diff;
    }
  }

  const nextDue = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + intervalDays,
    12,
    0,
    0
  );
  const path = `users/${user.uid}/safety/${itemId}`;

  try {
    await updateDoc(
      doc(firebaseFirestore, "users", user.uid, "safety", itemId),
      {
        lastServiceDate: formatSafetyDueDate(now),
        nextDueDate: formatSafetyDueDate(nextDue),
        dueDate: formatSafetyDueDate(nextDue),
        dueDateIso: nextDue.toISOString(),
        updatedAt: serverTimestamp(),
      }
    );

    await queryClient.invalidateQueries({ queryKey: SAFETY_ITEMS_QUERY_KEY });
    await queryClient.invalidateQueries({
      queryKey: ["safety", "item", itemId],
    });

    return { nextDueDateIso: nextDue.toISOString(), path };
  } catch (error) {

    throw error;
  }
}
