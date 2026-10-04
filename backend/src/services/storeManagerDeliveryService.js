import prisma from "../config/database.js";

import {
  deriveStoreManagerDeliveryStatus,
} from "./deliveryIntegrationService.js";

const ACTIVE_ALLOCATION_STATUSES = [
  "ALLOCATED",
  "PUBLISHED",
];

const DELIVERY_ORDER_STATUSES = [
  "CONFIRMED",
  "DEFERRED",
];

const DELIVERY_SUMMARY_INCLUDE = {
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
    orderBy: {
      allocatedAt: "desc",
    },
    take: 1,
    include: {
      liveTripStop: {
        include: {
          liveTrip: {
            include: {
              depot: true,
            },
          },
        },
      },
      receivedConfirmedBy: {
        select: {
          id: true,
          userId: true,
          fullName: true,
        },
      },
    },
  },
};

const DELIVERY_DETAIL_INCLUDE = {
  ...DELIVERY_SUMMARY_INCLUDE,
  items: {
    orderBy: {
      id: "asc",
    },
    include: {
      product: true,
    },
  },
  dispatcherDecisions: {
    orderBy: {
      decidedAt: "desc",
    },
    take: 10,
    include: {
      decidedByUser: {
        select: {
          id: true,
          userId: true,
          fullName: true,
        },
      },
    },
  },
};

export class StoreManagerDeliveryError extends Error {
  constructor(
    message,
    {
      status = 400,
      code = "STORE_MANAGER_DELIVERY_ERROR",
    } = {}
  ) {
    super(message);
    this.name = "StoreManagerDeliveryError";
    this.status = status;
    this.code = code;
  }
}

// ============================================================
// STORE MANAGER DELIVERY LIST
// ============================================================

/**
 * Returns only delivery work belonging to the authenticated Store Manager's
 * trusted outlet. The browser cannot select or override the outlet.
 *
 * Confirmed orders appear even before trip allocation so the Store Manager
 * can see the transition from "Awaiting plan" into a published delivery.
 * Deferred orders are also included so the delivery workspace can show the
 * current deferral reason without manufacturing a second delivery record.
 */
export async function listStoreManagerDeliveries(
  context
) {
  const outletId = requireTrustedOutletId(context);

  const orders = await prisma.storeOrder.findMany({
    where: {
      outletId,
      OR: [
        {
          status: {
            in: DELIVERY_ORDER_STATUSES,
          },
        },
        {
          deliveryAllocations: {
            some: {
              status: {
                in: ACTIVE_ALLOCATION_STATUSES,
              },
            },
          },
        },
      ],
    },
    orderBy: [
      {
        effectiveDispatchDate: "asc",
      },
      {
        submittedAt: "desc",
      },
    ],
    include: DELIVERY_SUMMARY_INCLUDE,
  });

  return orders.map(mapDeliverySummary);
}

// ============================================================
// STORE MANAGER DELIVERY DETAIL
// ============================================================

export async function getStoreManagerDeliveryByOrderCode(
  context,
  orderCode
) {
  const outletId = requireTrustedOutletId(context);
  const normalizedOrderCode = normalizeIdentifier(
    orderCode,
    "orderCode"
  );

  const order = await prisma.storeOrder.findFirst({
    where: {
      orderCode: normalizedOrderCode,
      outletId,
      OR: [
        {
          status: {
            in: DELIVERY_ORDER_STATUSES,
          },
        },
        {
          deliveryAllocations: {
            some: {
              status: {
                in: ACTIVE_ALLOCATION_STATUSES,
              },
            },
          },
        },
      ],
    },
    include: DELIVERY_DETAIL_INCLUDE,
  });

  if (!order) {
    throw new StoreManagerDeliveryError(
      "Delivery was not found for this outlet.",
      {
        status: 404,
        code: "STORE_MANAGER_DELIVERY_NOT_FOUND",
      }
    );
  }

  return mapDeliveryDetails(order);
}

// ============================================================
// STORE MANAGER SAFE TRACKING VIEW
// ============================================================

/**
 * Returns only the trip information needed by the Store Manager to track
 * their own outlet delivery. Other outlet identities and downstream route
 * details are deliberately excluded.
 */
export async function getStoreManagerDeliveryTracking(
  context,
  orderCode
) {
  const outletId = requireTrustedOutletId(context);
  const normalizedOrderCode = normalizeIdentifier(
    orderCode,
    "orderCode"
  );

  const order = await prisma.storeOrder.findFirst({
    where: {
      orderCode: normalizedOrderCode,
      outletId,
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
        orderBy: {
          allocatedAt: "desc",
        },
        take: 1,
        include: {
          liveTripStop: {
            include: {
              liveTrip: {
                include: {
                  depot: true,
                  stops: {
                    select: {
                      id: true,
                      sequence: true,
                      status: true,
                      outcome: true,
                    },
                    orderBy: {
                      sequence: "asc",
                    },
                  },
                },
              },
            },
          },
          receivedConfirmedBy: {
            select: {
              id: true,
              userId: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new StoreManagerDeliveryError(
      "Delivery was not found for this outlet.",
      {
        status: 404,
        code: "STORE_MANAGER_DELIVERY_NOT_FOUND",
      }
    );
  }

  const allocation = getActiveAllocation(order);

  if (!allocation) {
    throw new StoreManagerDeliveryError(
      "This order has not been allocated to a delivery trip yet.",
      {
        status: 409,
        code: "STORE_MANAGER_DELIVERY_NOT_PLANNED",
      }
    );
  }

  if (allocation.status !== "PUBLISHED") {
    throw new StoreManagerDeliveryError(
      "Live tracking becomes available after the delivery plan is published.",
      {
        status: 409,
        code: "STORE_MANAGER_DELIVERY_NOT_PUBLISHED",
      }
    );
  }

  assertAllocationBelongsToTrustedOutlet(
    allocation,
    context
  );

  return mapSafeTracking(order, allocation);
}

// ============================================================
// STORE MANAGER RECEIPT CONFIRMATION
// ============================================================

/**
 * Confirms that the authenticated Store Manager has received a completed
 * delivery for their own outlet.
 *
 * Rules:
 * - outlet identity is always taken from the trusted authenticated context
 * - the delivery must have a published allocation
 * - only DELIVERED or PARTIAL outcomes may be acknowledged
 * - PARTIAL requires an explicit acknowledgement flag from the UI
 * - repeated confirmation is idempotent and never creates duplicate records
 */
export async function confirmStoreManagerDeliveryReceived(
  context,
  orderCode,
  {
    acknowledgePartial = false,
    note = "",
  } = {}
) {
  const outletId = requireTrustedOutletId(context);
  const userDatabaseId = Number(context?.userDatabaseId);
  const normalizedOrderCode = normalizeIdentifier(
    orderCode,
    "orderCode"
  );
  const normalizedNote = normalizeReceiptNote(note);

  if (!Number.isInteger(userDatabaseId) || userDatabaseId <= 0) {
    throw new StoreManagerDeliveryError(
      "Store Manager identity is unavailable.",
      {
        status: 403,
        code: "STORE_MANAGER_DELIVERY_USER_REQUIRED",
      }
    );
  }

  const order = await prisma.storeOrder.findFirst({
    where: {
      orderCode: normalizedOrderCode,
      outletId,
    },
    include: {
      outlet: {
        include: {
          depot: true,
        },
      },
      deliveryAllocations: {
        where: {
          status: "PUBLISHED",
        },
        orderBy: {
          allocatedAt: "desc",
        },
        take: 1,
        include: {
          liveTripStop: {
            include: {
              liveTrip: true,
            },
          },
          receivedConfirmedBy: {
            select: {
              id: true,
              userId: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new StoreManagerDeliveryError(
      "Delivery was not found for this outlet.",
      {
        status: 404,
        code: "STORE_MANAGER_DELIVERY_NOT_FOUND",
      }
    );
  }

  const allocation = order.deliveryAllocations?.[0] ?? null;

  if (!allocation) {
    throw new StoreManagerDeliveryError(
      "This delivery has not been published yet.",
      {
        status: 409,
        code: "STORE_MANAGER_DELIVERY_NOT_PUBLISHED",
      }
    );
  }

  assertAllocationBelongsToTrustedOutlet(allocation, context);

  const stop = allocation.liveTripStop;
  const trip = stop?.liveTrip ?? null;
  const deliveryStatus = deriveStoreManagerDeliveryStatus({
    orderStatus: order.status,
    allocationStatus: allocation.status,
    tripStatus: trip?.status,
    stopStatus: stop?.status,
    stopOutcome: stop?.outcome,
  });

  if (!["DELIVERED", "PARTIAL"].includes(deliveryStatus)) {
    throw new StoreManagerDeliveryError(
      "Only delivered or partial deliveries can be confirmed as received.",
      {
        status: 409,
        code: "STORE_MANAGER_DELIVERY_NOT_RECEIVABLE",
      }
    );
  }

  if (
    deliveryStatus === "PARTIAL" &&
    acknowledgePartial !== true
  ) {
    throw new StoreManagerDeliveryError(
      "A partial delivery must be explicitly acknowledged before confirmation.",
      {
        status: 422,
        code: "STORE_MANAGER_PARTIAL_ACKNOWLEDGEMENT_REQUIRED",
      }
    );
  }

  if (allocation.receivedConfirmedAt) {
    return {
      orderCode: order.orderCode,
      deliveryStatus,
      alreadyConfirmed: true,
      receipt: mapDeliveryReceipt(allocation, deliveryStatus),
    };
  }

  const confirmedAt = new Date();

  const updateResult = await prisma.deliveryAllocation.updateMany({
    where: {
      id: allocation.id,
      receivedConfirmedAt: null,
    },
    data: {
      receivedConfirmedAt: confirmedAt,
      receivedConfirmedByUserId: userDatabaseId,
      receivedConfirmationNote: normalizedNote,
    },
  });

  const updatedAllocation = await prisma.deliveryAllocation.findUnique({
    where: {
      id: allocation.id,
    },
    include: {
      receivedConfirmedBy: {
        select: {
          id: true,
          userId: true,
          fullName: true,
        },
      },
    },
  });

  if (!updatedAllocation?.receivedConfirmedAt) {
    throw new StoreManagerDeliveryError(
      "Unable to confirm this delivery as received.",
      {
        status: 409,
        code: "STORE_MANAGER_RECEIPT_CONFIRMATION_FAILED",
      }
    );
  }

  return {
    orderCode: order.orderCode,
    deliveryStatus,
    alreadyConfirmed: updateResult.count === 0,
    receipt: mapDeliveryReceipt(
      updatedAllocation,
      deliveryStatus
    ),
  };
}

// ============================================================
// MAPPERS
// ============================================================

function mapDeliverySummary(order) {
  const allocation = getActiveAllocation(order);
  const stop = allocation?.liveTripStop ?? null;
  const trip = stop?.liveTrip ?? null;

  return {
    orderCode: order.orderCode,
    orderStatus: order.status,
    deliveryStatus: deriveStoreManagerDeliveryStatus({
      orderStatus: order.status,
      allocationStatus: allocation?.status,
      tripStatus: trip?.status,
      stopStatus: stop?.status,
      stopOutcome: stop?.outcome,
    }),
    orderType: order.orderType,
    cutoffDecision: order.cutoffDecision,
    effectiveDispatchDate: formatDatabaseDate(
      order.effectiveDispatchDate
    ),
    deferredReason: order.deferredReason,
    totalUnits: order.totalUnits,
    estimatedWeightKg: decimalToNumber(
      order.estimatedWeightKg
    ),
    estimatedVolumeM3: decimalToNumber(
      order.estimatedVolumeM3
    ),
    outlet: mapOutlet(order.outlet),
    receipt: mapDeliveryReceipt(
      allocation,
      deriveStoreManagerDeliveryStatus({
        orderStatus: order.status,
        allocationStatus: allocation?.status,
        tripStatus: trip?.status,
        stopStatus: stop?.status,
        stopOutcome: stop?.outcome,
      })
    ),
    plan: allocation
      ? {
          allocationId: allocation.id,
          allocationStatus: allocation.status,
          allocatedAt: allocation.allocatedAt,
          publishedAt: allocation.publishedAt,
          tripCode: trip?.tripCode ?? null,
          deliveryDate: formatDatabaseDate(
            trip?.deliveryDate
          ),
          stopCode: stop?.stopCode ?? null,
          sequence: stop?.sequence ?? null,
          plannedEta: stop?.plannedEta ?? null,
          actualArrival: stop?.actualArrival ?? null,
          tripStatus: trip?.status ?? null,
          stopStatus: stop?.status ?? null,
          outcome: stop?.outcome ?? null,
          vehicleCode: trip?.vehicleCode ?? null,
          vehicleType: trip?.vehicleType ?? null,
          temperature: trip?.temperature ?? null,
          driverName:
            allocation.status === "PUBLISHED"
              ? trip?.driverName ?? null
              : null,
        }
      : null,
  };
}

function mapDeliveryDetails(order) {
  const summary = mapDeliverySummary(order);

  return {
    ...summary,
    submittedAt: order.submittedAt,
    requestedDispatchDate: formatDatabaseDate(
      order.requestedDispatchDate
    ),
    storeManagerNote: order.storeManagerNote,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        manufacturerBrand: item.product.manufacturerBrand,
        productType: item.product.productType,
        category: item.product.category,
        handlingType: item.product.handlingType,
        unitLabel: item.product.unitLabel,
        unitWeightKg: decimalToNumber(
          item.product.unitWeightKg
        ),
        unitVolumeM3: decimalToNumber(
          item.product.unitVolumeM3
        ),
        imageMimeType: item.product.imageMimeType ?? null,
        imageBase64: item.product.imageData
          ? Buffer.from(item.product.imageData).toString("base64")
          : null,
      },
    })),
    dispatcherDecisions: order.dispatcherDecisions.map(
      (decision) => ({
        id: decision.id,
        decision: decision.decision,
        previousStatus: decision.previousStatus,
        resultingStatus: decision.resultingStatus,
        reason: decision.reason,
        effectiveDispatchDate: formatDatabaseDate(
          decision.effectiveDispatchDate
        ),
        decidedAt: decision.decidedAt,
        decidedBy: decision.decidedByUser
          ? {
              userId: decision.decidedByUser.userId,
              fullName: decision.decidedByUser.fullName,
            }
          : null,
      })
    ),
  };
}

export function resolveStoreManagerTrackingEta(
  trip,
  stop
) {
  const isCurrentDestination =
    normalizeState(trip?.nextDestination) &&
    normalizeState(trip?.nextDestination) ===
      normalizeState(stop?.outletCode);

  // liveTrip.eta is continuously refreshed by the Driver route-progress
  // endpoint and applies only to the driver's current destination. For later
  // outlets, keep the published/planned stop ETA rather than leaking the ETA
  // of another stop.
  if (isCurrentDestination && trip?.eta) {
    return {
      value: trip.eta,
      source: "LIVE",
    };
  }

  return {
    value: stop?.plannedEta ?? null,
    source: stop?.plannedEta
      ? "PLANNED"
      : "UNAVAILABLE",
  };
}

function mapSafeTracking(order, allocation) {
  const stop = allocation.liveTripStop;
  const trip = stop.liveTrip;
  const allStops = trip.stops ?? [];
  const deliveryStatus = deriveStoreManagerDeliveryStatus({
    orderStatus: order.status,
    allocationStatus: allocation.status,
    tripStatus: trip.status,
    stopStatus: stop.status,
    stopOutcome: stop.outcome,
  });

  const pendingBeforeOutlet = allStops.filter(
    (candidate) =>
      candidate.sequence < stop.sequence &&
      !isStopFinished(candidate)
  ).length;

  const trackingEta =
    resolveStoreManagerTrackingEta(
      trip,
      stop
    );

  return {
    orderCode: order.orderCode,
    deliveryStatus,
    receipt: mapDeliveryReceipt(allocation, deliveryStatus),
    outlet: mapOutlet(order.outlet),
    trip: {
      tripCode: trip.tripCode,
      deliveryDate: formatDatabaseDate(
        trip.deliveryDate
      ),
      status: trip.status,
      vehicleCode: trip.vehicleCode,
      vehicleType: trip.vehicleType,
      temperature: trip.temperature,
      driverName: trip.driverName,
      isDriverOnline: trip.isDriverOnline,
      currentLocation:
        Number.isFinite(trip.currentLat) &&
        Number.isFinite(trip.currentLng)
          ? {
              latitude: trip.currentLat,
              longitude: trip.currentLng,
            }
          : null,
      lastSynchronized: trip.lastSynchronized,
      latestDriverUpdate: trip.latestDriverUpdate,
      latestDriverUpdateAt: trip.latestDriverUpdateAt,
    },
    myStop: {
      stopCode: stop.stopCode,
      sequence: stop.sequence,
      plannedEta: stop.plannedEta,
      actualArrival: stop.actualArrival,
      status: stop.status,
      outcome: stop.outcome,
      latitude: stop.latitude,
      longitude: stop.longitude,
      stopsRemainingBeforeOutlet: pendingBeforeOutlet,
    },
    eta: trackingEta.value,
    etaSource: trackingEta.source,
  };
}

function mapDeliveryReceipt(allocation, deliveryStatus) {
  if (!allocation) {
    return {
      confirmed: false,
      confirmedAt: null,
      confirmedBy: null,
      note: null,
      canConfirm: false,
      requiresPartialAcknowledgement: false,
    };
  }

  const confirmed = Boolean(allocation.receivedConfirmedAt);

  return {
    confirmed,
    confirmedAt: allocation.receivedConfirmedAt ?? null,
    confirmedBy: allocation.receivedConfirmedBy
      ? {
          userId: allocation.receivedConfirmedBy.userId,
          fullName: allocation.receivedConfirmedBy.fullName,
        }
      : null,
    note: allocation.receivedConfirmationNote ?? null,
    canConfirm:
      !confirmed &&
      ["DELIVERED", "PARTIAL"].includes(deliveryStatus),
    requiresPartialAcknowledgement:
      !confirmed && deliveryStatus === "PARTIAL",
  };
}

function normalizeReceiptNote(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > 500) {
    throw new StoreManagerDeliveryError(
      "Receipt note must be 500 characters or fewer.",
      {
        status: 422,
        code: "STORE_MANAGER_RECEIPT_NOTE_TOO_LONG",
      }
    );
  }

  return normalized;
}

// ============================================================
// SECURITY / INTEGRITY HELPERS
// ============================================================

function requireTrustedOutletId(context) {
  const outletId = Number(context?.outletDatabaseId);

  if (!Number.isInteger(outletId) || outletId <= 0) {
    throw new StoreManagerDeliveryError(
      "Store Manager outlet context is unavailable.",
      {
        status: 403,
        code: "STORE_MANAGER_DELIVERY_OUTLET_REQUIRED",
      }
    );
  }

  return outletId;
}

function assertAllocationBelongsToTrustedOutlet(
  allocation,
  context
) {
  const trustedOutletCode = normalizeState(
    context?.outletCode
  );
  const stopOutletCode = normalizeState(
    allocation?.liveTripStop?.outletCode
  );

  if (
    !trustedOutletCode ||
    !stopOutletCode ||
    trustedOutletCode !== stopOutletCode
  ) {
    throw new StoreManagerDeliveryError(
      "The delivery stop does not belong to this Store Manager outlet.",
      {
        status: 403,
        code: "STORE_MANAGER_DELIVERY_OUTLET_MISMATCH",
      }
    );
  }
}

function getActiveAllocation(order) {
  return order?.deliveryAllocations?.[0] ?? null;
}

function isStopFinished(stop) {
  const status = normalizeState(stop?.status);
  const outcome = normalizeState(stop?.outcome);

  return (
    status === "COMPLETED" ||
    outcome === "DELIVERED_FULL" ||
    outcome === "PARTIAL_DELIVERY" ||
    outcome === "UNABLE_TO_DELIVER"
  );
}

function mapOutlet(outlet) {
  if (!outlet) return null;

  return {
    outletCode: outlet.outletCode,
    brand: outlet.brand,
    district: outlet.district,
    dockType: outlet.dockType,
    parkingConstraint: outlet.parkingConstraint,
    mallWindow: outlet.mallWindow,
    windowOpenTime: outlet.windowOpenTime,
    windowCloseTime: outlet.windowCloseTime,
    depot: outlet.depot
      ? {
          code: outlet.depot.code,
          name: outlet.depot.name,
          district: outlet.depot.district,
        }
      : null,
  };
}

function normalizeIdentifier(value, fieldName) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new StoreManagerDeliveryError(
      `${fieldName} is required.`,
      {
        status: 400,
        code: "STORE_MANAGER_DELIVERY_IDENTIFIER_REQUIRED",
      }
    );
  }

  return normalized;
}

function normalizeState(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function decimalToNumber(value) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function formatDatabaseDate(value) {
  if (!value) return null;

  const date = value instanceof Date
    ? value
    : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}
