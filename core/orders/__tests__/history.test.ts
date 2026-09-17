import { describe, expect, test } from "bun:test"
import {
  getOrderCreatedActorName,
  getOrderHistoryEvents,
  type OrderHistorySource
} from "../history"

const orderBase: OrderHistorySource = {
  id: "order-1",
  orderStatus: "preparing",
  createdAt: "2026-08-20T07:27:18.284Z",
  updatedAt: "2026-08-20T08:32:16.494Z"
}

function actor(name: string, type?: string) {
  return { id: "user-1", name, email: "admin@example.com", type: type ?? null }
}

describe("getOrderHistoryEvents", () => {
  test("keeps ORDER_MODIFIED rows even when status does not change", () => {
    const events = getOrderHistoryEvents(
      {
        ...orderBase,
        orderStatusHistory: [
          {
            id: "created",
            oldStatus: "preparing",
            newStatus: "preparing",
            notes: "ORDER_CREATED",
            createdAt: "2026-08-20T07:27:18.284Z",
            updatedByUser: actor("Ali Raza")
          },
          {
            id: "modified-1",
            oldStatus: "preparing",
            newStatus: "preparing",
            notes: "ORDER_MODIFIED",
            changedAt: "2026-08-20T08:29:12.032Z",
            createdAt: "2026-08-20T08:29:12.032Z",
            updatedByUser: actor("Ali Raza")
          }
        ]
      },
      "Fishtownco",
      "Dr Saucys"
    )

    expect(events.map((event) => event.kind)).toEqual(["created", "modified"])
    expect(events.at(1)?.actor).toBe("Ali Raza (Dr Saucys)")
    expect(events.at(1)?.timestamp).toBe("2026-08-20T08:29:12.032Z")
  })

  test("keeps every ORDER_MODIFIED row and skips the duplicate created status", () => {
    const events = getOrderHistoryEvents(
      {
        ...orderBase,
        orderStatusHistory: [
          {
            id: "created",
            oldStatus: "preparing",
            newStatus: "preparing",
            notes: "ORDER_CREATED",
            createdAt: "2026-08-20T07:27:18.284Z",
            updatedByUser: actor("Ali Raza")
          },
          {
            id: "bridge-confirmed",
            oldStatus: "preparing",
            newStatus: "confirmed",
            notes: null,
            createdAt: "2026-08-20T07:27:39.780Z",
            updatedByUser: actor("Ali Raza")
          },
          {
            id: "bridge-preparing",
            oldStatus: "confirmed",
            newStatus: "preparing",
            notes: null,
            createdAt: "2026-08-20T07:27:40.343Z",
            updatedByUser: actor("Ali Raza")
          },
          {
            id: "modified-1",
            oldStatus: "preparing",
            newStatus: "preparing",
            notes: "ORDER_MODIFIED",
            createdAt: "2026-08-20T08:29:12.032Z",
            updatedByUser: actor("Ali Raza")
          },
          {
            id: "modified-2",
            oldStatus: "preparing",
            newStatus: "preparing",
            notes: "ORDER_MODIFIED",
            createdAt: "2026-08-20T08:32:10.305Z",
            updatedByUser: actor("Ali Raza")
          }
        ]
      },
      "Fishtownco",
      "Dr Saucys"
    )

    expect(events.map((event) => event.kind)).toEqual([
      "created",
      "accepted",
      null,
      "modified",
      "modified"
    ])
    expect(events.filter((event) => event.id === "created")).toHaveLength(0)
  })

  test("skips no-op status rows that are not order modifications", () => {
    const events = getOrderHistoryEvents(
      {
        ...orderBase,
        orderStatusHistory: [
          {
            id: "accepted",
            oldStatus: "preparing",
            newStatus: "confirmed",
            notes: null,
            createdAt: "2026-08-20T07:27:39.780Z",
            updatedByUser: actor("Ali Raza")
          },
          {
            id: "noop",
            oldStatus: "preparing",
            newStatus: "preparing",
            notes: null,
            createdAt: "2026-08-20T08:00:00.000Z"
          }
        ]
      },
      "Fishtownco",
      "Dr Saucys"
    )

    expect(events.map((event) => event.id)).toEqual([
      "order-1-created",
      "accepted"
    ])
    expect(events.some((event) => event.id === "noop")).toBe(false)
  })

  test("labels rider and super admin by user type instead of tenant", () => {
    const events = getOrderHistoryEvents(
      {
        ...orderBase,
        orderStatus: "completed",
        orderStatusHistory: [
          {
            id: "accepted",
            oldStatus: "pending",
            newStatus: "confirmed",
            notes: null,
            createdAt: "2026-08-20T07:27:39.780Z",
            updatedByUser: actor("Yaqoob Mehar", "staff")
          },
          {
            id: "completed",
            oldStatus: "ready",
            newStatus: "completed",
            notes: null,
            createdAt: "2026-08-20T08:48:00.000Z",
            updatedByUser: actor("Mohsin Shrafat", "rider")
          },
          {
            id: "cancelled-by-admin",
            oldStatus: "completed",
            newStatus: "cancelled",
            notes: null,
            createdAt: "2026-08-20T09:00:00.000Z",
            updatedByUser: actor("Platform Admin", "super_admin")
          }
        ]
      },
      "Fishtownco",
      "Tenant"
    )

    expect(events.at(1)?.actor).toBe("Yaqoob Mehar (Tenant)")
    expect(events.at(2)?.actor).toBe("Mohsin Shrafat (Rider)")
    expect(events.at(3)?.actor).toBe("Platform Admin (Super Admin)")
  })
})

describe("getOrderCreatedActorName", () => {
  test("reads ORDER_CREATED history before createdBy", () => {
    expect(
      getOrderCreatedActorName({
        ...orderBase,
        createdBy: actor("Later Person"),
        orderStatusHistory: [
          {
            notes: "ORDER_CREATED",
            createdAt: orderBase.createdAt,
            updatedByUser: actor("Ali Raza")
          }
        ]
      })
    ).toBe("Ali Raza")
  })

  test("falls back to createdBy when history has no creator", () => {
    expect(
      getOrderCreatedActorName({
        ...orderBase,
        createdBy: actor("Ali Raza")
      })
    ).toBe("Ali Raza")
  })

  test("hides opaque createdBy ids", () => {
    expect(
      getOrderCreatedActorName({
        ...orderBase,
        createdBy: "dfbba3da-db75-4744-9f9e-1c67b50c85dc"
      })
    ).toBe(null)
  })
})
