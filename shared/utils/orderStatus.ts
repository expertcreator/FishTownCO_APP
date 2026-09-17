/**
 * Maps API delivery / kitchen statuses to display statuses used in OrderCard.
 * Delivery: "assigned" | "picked_up" | "on_the_way" | "delivered" | "cancelled"
 * Kitchen: "preparing" is Pending after accept; "ready" is Picking.
 * Display: "Pending" | "Picking" | "Delivering" | "Completed" | "Cancelled"
 */

export type ApiDeliveryStatus =
  | "assigned"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export type DisplayOrderStatus =
  | "Pending"
  | "Picking"
  | "Delivering"
  | "Completed"
  | "Cancelled";

/**
 * Maps kitchen or delivery API status to the OrderCard display status.
 * @param apiStatus - Raw list or details status string
 * @returns Display status used on rider cards and tabs
 */
export const mapApiStatusToDisplay = (
  apiStatus: string | undefined | null
): DisplayOrderStatus => {
  if (!apiStatus) {
    return "Pending";
  }

  const normalizedStatus = apiStatus.toLowerCase().trim();

  // Check if status is already in display format (case-insensitive)
  const displayStatuses: DisplayOrderStatus[] = [
    "Pending",
    "Picking",
    "Delivering",
    "Completed",
    "Cancelled",
  ];
  const isDisplayFormat = displayStatuses.some(
    (ds) => ds.toLowerCase() === normalizedStatus
  );
  if (isDisplayFormat) {
    // Return the properly capitalized display status
    return displayStatuses.find(
      (ds) => ds.toLowerCase() === normalizedStatus
    ) as DisplayOrderStatus;
  }

  // Map API statuses to display statuses
  const statusMap: Record<string, DisplayOrderStatus> = {
    assigned: "Pending",
    preparing: "Pending",
    ready: "Picking",
    picked_up: "Picking",
    on_the_way: "Delivering",
    ontheway: "Delivering", // Handle variant without underscores
    delivered: "Completed",
    completed: "Completed",
    complete: "Completed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  return statusMap[normalizedStatus] || "Pending";
};

const isFinalDisplayStatus = (status: DisplayOrderStatus): boolean =>
  status === "Completed" || status === "Cancelled";

/**
 * Resolves display status from order details API fields.
 * Final statuses on orderStatus/deliveryStatus win over in-progress tracking.
 */
export const resolveOrderDetailsStatus = (fields: {
  orderStatus?: string | null;
  deliveryStatus?: string | null;
  trackingDeliveryStatus?: string | null;
}): DisplayOrderStatus => {
  const fromOrderStatus = mapApiStatusToDisplay(fields.orderStatus);
  if (isFinalDisplayStatus(fromOrderStatus)) {
    return fromOrderStatus;
  }

  const fromDeliveryStatus = mapApiStatusToDisplay(fields.deliveryStatus);
  if (isFinalDisplayStatus(fromDeliveryStatus)) {
    return fromDeliveryStatus;
  }

  return mapApiStatusToDisplay(
    fields.trackingDeliveryStatus ||
      fields.deliveryStatus ||
      fields.orderStatus ||
      ""
  );
};

/** Completed or cancelled orders open the history details sheet. */
export const isHistoryOrderStatus = (
  status: string | undefined | null
): boolean => {
  const displayStatus = mapApiStatusToDisplay(status);
  return displayStatus === "Completed" || displayStatus === "Cancelled";
};

/**
 * True when the order is a new assignment that the rider has not accepted yet.
 * Those offers are map-only: they stay off Home/Orders lists and must not open list sheets.
 * Only API `assigned` (delivery). Kitchen `preparing` is accepted work and stays on the list as Pending.
 * @param status - Raw API delivery status or OrderCard display status
 * @returns Whether the status is an unaccepted assignment
 */
export const isUnacceptedAssignedOrderStatus = (
  status: string | undefined | null
): boolean => {
  if (!status) {
    return false;
  }

  return status.toLowerCase().trim() === "assigned";
};

/**
 * Gets status color matching OrderCard STATUS_STYLES
 */
export const getStatusColor = (status: string | DisplayOrderStatus): string => {
  const STATUS_STYLES: Record<DisplayOrderStatus, string> = {
    Pending: "#EFEFEF",
    Picking: "#DBFCE7",
    Delivering: "#C5E6DD",
    Completed: "#38D595",
    Cancelled: "#FEE2E2",
  };

  // First try to map API status to display status
  const displayStatus = mapApiStatusToDisplay(status);
  return STATUS_STYLES[displayStatus] || STATUS_STYLES.Pending;
};

/**
 * Gets status label matching OrderCard format
 */
export const getStatusLabel = (
  status: string | DisplayOrderStatus
): DisplayOrderStatus => mapApiStatusToDisplay(status);
