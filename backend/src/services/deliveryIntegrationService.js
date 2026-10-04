import prisma from "../config/database.js";

const ACTIVE_ALLOCATION_STATUSES = [
  "ALLOCATED",
  "PUBLISHED",
];

const MAX_CANCELLATION_REASON_LENGTH = 500;

const ALLOCATION_INCLUDE = {
  storeOrder: {
    include: {
      outlet: {
        include: {
          depot: true,
        },
      },
    },
  },
  liveTripStop: {
    include: {
      liveTrip: {
        include: {
          depot: true,
        },
      },
    },
  },
};

// ============================================================
// DOMAIN ERROR
// ============================================================

export class DeliveryIntegrationError extends Error {
  constructor(
    message,
    {
      status = 400,
      code = "DELIVERY_INTEGRATION_ERROR",
    } = {}
  ) {
    super(message);
    this.name = "DeliveryIntegrationError";
    this.status = status;
    this.code = code;
  }
}

// ============================================================
// DELIVERY STATUS PROJECTION
// ============================================================

/**
 * Converts the shared business + transport state into the Store Manager
 * delivery language used by the future Deliveries UI.
 *
 * Important: this is a projection only. It does not create another delivery
 * status column and therefore avoids duplicating the LiveTrip/LiveTripStop
 * execution state.
 */
export function deriveStoreManagerDeliveryStatus({
  orderStatus,
  allocationStatus = null,
  tripStatus = null,
  stopStatus = null,
  stopOutcome = null,
} = {}) {
  const order = normalizeState(orderStatus);
  const allocation = normalizeState(allocationStatus);
  const trip = normalizeState(tripStatus);
  const stop = normalizeState(stopStatus);
  const outcome = normalizeState(stopOutcome);

  if (order === "CANCELLED") return "CANCELLED";
  if (order === "DEFERRED") return "DEFERRED";
  if (order === "SUBMITTED") return "AWAITING_DISPATCHER";

  if (
    outcome === "DELIVERED_FULL"
  ) {
    return "DELIVERED";
  }

  if (
    outcome === "PARTIAL_DELIVERY"
  ) {
    return "PARTIAL";
  }

  if (
    outcome === "UNABLE_TO_DELIVER"
  ) {
    return "EXCEPTION";
  }

  if (stop === "ARRIVED") return "ARRIVED";
  if (stop === "NEXT_STOP") return "ARRIVING";

  if (
    stop === "COMPLETED"
  ) {
    return "COMPLETED";
  }

  if (
    !allocation ||
    allocation === "CANCELLED"
  ) {
    return order === "CONFIRMED"
      ? "AWAITING_PLAN"
      : "AWAITING_DISPATCHER";
  }

  if (trip === "DELAYED") return "DELAYED";

  if (
    trip === "ON_ROUTE" ||
    trip === "OFFLINE"
  ) {
    return "IN_TRANSIT";
  }

  if (trip === "VEHICLE_READY") {
    return "READY_FOR_DISPATCH";
  }

  if (trip === "COMPLETED") {
    return "COMPLETED";
  }

  if (
    trip === "PLANNED" ||
    allocation === "PUBLISHED"
  ) {
    return "SCHEDULED";
  }

  return "PLANNING";
}

// ============================================================
// ALLOCATE CONFIRMED ORDER TO LIVE STOP
// ============================================================

/**
 * Connect a CONFIRMED StoreOrder to the exact LiveTripStop that serves the
 * same outlet.
 *
 * Security / integrity rules:
 * - Browser-provided outlet IDs are not accepted.
 * - Outlet identity comes from StoreOrder -> Outlet.
 * - Stop outletCode must match that trusted Outlet.outletCode.
 * - When both sides have a depot, the depots must also match.
 * - One StoreOrder may have only one active allocation at a time.
 * - Calling the same allocation twice is idempotent.
 * - allocatedUnits is always copied from StoreOrder.totalUnits server-side.
 */
export async function allocateConfirmedStoreOrderToStop({
  orderCode,
  stopCode,
} = {}) {
  const normalizedOrderCode = normalizeIdentifier(
    orderCode,
    "orderCode"
  );

  const normalizedStopCode = normalizeIdentifier(
    stopCode,
    "stopCode"
  );

  return prisma.$transaction(async (tx) => {
    const order = await tx.storeOrder.findUnique({
      where: {
        orderCode: normalizedOrderCode,
      },
      include: {
        outlet: {
          include: {
            depot: true,
          },
        },
        deliveryAllocations: {
          where: {
            status: {
              in: ACTIVE_ALLOCATION_STATUSES,
            },
          },
          include: {
            liveTripStop: {
              include: {
                liveTrip: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new DeliveryIntegrationError(
        "Store order was not found.",
        {
          status: 404,
          code: "DELIVERY_ORDER_NOT_FOUND",
        }
      );
    }

    if (order.status !== "CONFIRMED") {
      throw new DeliveryIntegrationError(
        "Only a confirmed store order can be allocated to a delivery trip.",
        {
          status: 409,
          code: "DELIVERY_ORDER_NOT_CONFIRMED",
        }
      );
    }

    const stop = await tx.liveTripStop.findUnique({
      where: {
        stopCode: normalizedStopCode,
      },
      include: {
        liveTrip: {
          include: {
            depot: true,
          },
        },
      },
    });

    if (!stop) {
      throw new DeliveryIntegrationError(
        "Live delivery stop was not found.",
        {
          status: 404,
          code: "DELIVERY_STOP_NOT_FOUND",
        }
      );
    }

    assertOrderMatchesStop(order, stop);

    const samePair = await tx.deliveryAllocation.findUnique({
      where: {
        storeOrderId_liveTripStopId: {
          storeOrderId: order.id,
          liveTripStopId: stop.id,
        },
      },
      include: ALLOCATION_INCLUDE,
    });

    if (
      samePair &&
      samePair.status !== "CANCELLED"
    ) {
      return mapDeliveryAllocation(samePair);
    }

    const activeAllocation = order.deliveryAllocations[0] || null;

    if (activeAllocation) {
      throw new DeliveryIntegrationError(
        `Order ${order.orderCode} is already allocated to stop ${activeAllocation.liveTripStop.stopCode}.`,
        {
          status: 409,
          code: "DELIVERY_ORDER_ALREADY_ALLOCATED",
        }
      );
    }

    const now = new Date();

    const allocation = samePair
      ? await tx.deliveryAllocation.update({
          where: {
            id: samePair.id,
          },
          data: {
            status: "ALLOCATED",
            allocatedUnits: order.totalUnits,
            allocatedAt: now,
            publishedAt: null,
            cancelledAt: null,
            cancellationReason: null,
          },
          include: ALLOCATION_INCLUDE,
        })
      : await tx.deliveryAllocation.create({
          data: {
            storeOrderId: order.id,
            liveTripStopId: stop.id,
            status: "ALLOCATED",
            allocatedUnits: order.totalUnits,
            allocatedAt: now,
          },
          include: ALLOCATION_INCLUDE,
        });

    return mapDeliveryAllocation(allocation);
  });
}

// ============================================================
// PUBLISH ALLOCATION
// ============================================================

export async function publishDeliveryAllocation(
  allocationId
) {
  const id = normalizePositiveInteger(
    allocationId,
    "allocationId"
  );

  return prisma.$transaction(async (tx) => {
    const allocation = await tx.deliveryAllocation.findUnique({
      where: { id },
      include: ALLOCATION_INCLUDE,
    });

    if (!allocation) {
      throw new DeliveryIntegrationError(
        "Delivery allocation was not found.",
        {
          status: 404,
          code: "DELIVERY_ALLOCATION_NOT_FOUND",
        }
      );
    }

    if (allocation.status === "CANCELLED") {
      throw new DeliveryIntegrationError(
        "A cancelled delivery allocation cannot be published.",
        {
          status: 409,
          code: "DELIVERY_ALLOCATION_CANCELLED",
        }
      );
    }

    if (allocation.storeOrder.status !== "CONFIRMED") {
      throw new DeliveryIntegrationError(
        "The store order is no longer confirmed.",
        {
          status: 409,
          code: "DELIVERY_ORDER_NOT_CONFIRMED",
        }
      );
    }

    if (allocation.status === "PUBLISHED") {
      return mapDeliveryAllocation(allocation);
    }

    const updated = await tx.deliveryAllocation.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      include: ALLOCATION_INCLUDE,
    });

    return mapDeliveryAllocation(updated);
  });
}

// ============================================================
// CANCEL / RELEASE ALLOCATION
// ============================================================

export async function cancelDeliveryAllocation(
  allocationId,
  reason
) {
  const id = normalizePositiveInteger(
    allocationId,
    "allocationId"
  );

  const cancellationReason = normalizeCancellationReason(reason);

  return prisma.$transaction(async (tx) => {
    const allocation = await tx.deliveryAllocation.findUnique({
      where: { id },
      include: ALLOCATION_INCLUDE,
    });

    if (!allocation) {
      throw new DeliveryIntegrationError(
        "Delivery allocation was not found.",
        {
          status: 404,
          code: "DELIVERY_ALLOCATION_NOT_FOUND",
        }
      );
    }

    if (allocation.status === "CANCELLED") {
      return mapDeliveryAllocation(allocation);
    }

    const updated = await tx.deliveryAllocation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason,
      },
      include: ALLOCATION_INCLUDE,
    });

    return mapDeliveryAllocation(updated);
  });
}

// ============================================================
// INTERNAL READ MODEL FOR LATER STAGES
// ============================================================

export async function getActiveDeliveryAllocationForOrder(
  orderCode
) {
  const normalizedOrderCode = normalizeIdentifier(
    orderCode,
    "orderCode"
  );

  const allocation = await prisma.deliveryAllocation.findFirst({
    where: {
      storeOrder: {
        orderCode: normalizedOrderCode,
      },
      status: {
        in: ACTIVE_ALLOCATION_STATUSES,
      },
    },
    orderBy: {
      allocatedAt: "desc",
    },
    include: ALLOCATION_INCLUDE,
  });

  return allocation
    ? mapDeliveryAllocation(allocation)
    : null;
}

// ============================================================
// VALIDATION
// ============================================================

function assertOrderMatchesStop(order, stop) {
  const orderOutletCode = normalizeState(order.outlet?.outletCode);
  const stopOutletCode = normalizeState(stop.outletCode);

  if (
    !orderOutletCode ||
    !stopOutletCode ||
    orderOutletCode !== stopOutletCode
  ) {
    throw new DeliveryIntegrationError(
      "The selected delivery stop does not belong to the store order outlet.",
      {
        status: 409,
        code: "DELIVERY_OUTLET_MISMATCH",
      }
    );
  }

  const orderDepotId = order.outlet?.depotId ?? null;
  const tripDepotId = stop.liveTrip?.depotId ?? null;

  if (
    orderDepotId &&
    tripDepotId &&
    orderDepotId !== tripDepotId
  ) {
    throw new DeliveryIntegrationError(
      "The delivery trip depot does not match the store order outlet depot.",
      {
        status: 409,
        code: "DELIVERY_DEPOT_MISMATCH",
      }
    );
  }
}

function normalizeIdentifier(value, fieldName) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new DeliveryIntegrationError(
      `${fieldName} is required.`,
      {
        status: 400,
        code: "DELIVERY_IDENTIFIER_REQUIRED",
      }
    );
  }

  return normalized;
}

function normalizePositiveInteger(value, fieldName) {
  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    throw new DeliveryIntegrationError(
      `${fieldName} must be a positive integer.`,
      {
        status: 400,
        code: "DELIVERY_INVALID_IDENTIFIER",
      }
    );
  }

  return number;
}

function normalizeCancellationReason(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new DeliveryIntegrationError(
      "A cancellation reason is required.",
      {
        status: 400,
        code: "DELIVERY_CANCELLATION_REASON_REQUIRED",
      }
    );
  }

  if (
    normalized.length >
    MAX_CANCELLATION_REASON_LENGTH
  ) {
    throw new DeliveryIntegrationError(
      `Cancellation reason cannot exceed ${MAX_CANCELLATION_REASON_LENGTH} characters.`,
      {
        status: 400,
        code: "DELIVERY_CANCELLATION_REASON_TOO_LONG",
      }
    );
  }

  return normalized;
}

function normalizeState(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  return normalized || null;
}

// ============================================================
// API-SAFE MAPPING
// ============================================================

function mapDeliveryAllocation(allocation) {
  const order = allocation.storeOrder;
  const stop = allocation.liveTripStop;
  const trip = stop.liveTrip;

  return {
    id: allocation.id,
    status: allocation.status,
    allocatedUnits: allocation.allocatedUnits,
    allocatedAt: allocation.allocatedAt,
    publishedAt: allocation.publishedAt,
    cancelledAt: allocation.cancelledAt,
    cancellationReason: allocation.cancellationReason,

    deliveryStatus: deriveStoreManagerDeliveryStatus({
      orderStatus: order.status,
      allocationStatus: allocation.status,
      tripStatus: trip.status,
      stopStatus: stop.status,
      stopOutcome: stop.outcome,
    }),

    order: {
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      orderType: order.orderType,
      totalUnits: order.totalUnits,
      estimatedWeightKg: Number(order.estimatedWeightKg),
      estimatedVolumeM3: Number(order.estimatedVolumeM3),
      effectiveDispatchDate: order.effectiveDispatchDate,
      outlet: {
        id: order.outlet.id,
        outletCode: order.outlet.outletCode,
        brand: order.outlet.brand,
        district: order.outlet.district,
        depotId: order.outlet.depotId,
      },
    },

    stop: {
      id: stop.id,
      stopCode: stop.stopCode,
      sequence: stop.sequence,
      outletCode: stop.outletCode,
      plannedEta: stop.plannedEta,
      actualArrival: stop.actualArrival,
      status: stop.status,
      outcome: stop.outcome,
    },

    trip: {
      id: trip.id,
      tripCode: trip.tripCode,
      deliveryDate: trip.deliveryDate,
      depotId: trip.depotId,
      vehicleCode: trip.vehicleCode,
      vehicleType: trip.vehicleType,
      temperature: trip.temperature,
      driverName: trip.driverName,
      status: trip.status,
      eta: trip.eta,
      isDriverOnline: trip.isDriverOnline,
      currentLat: trip.currentLat,
      currentLng: trip.currentLng,
      lastSynchronized: trip.lastSynchronized,
    },
  };
}
