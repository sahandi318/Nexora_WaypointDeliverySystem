import prisma from "../config/database.js";

const MAX_REASON_LENGTH = 500;
const MAX_SEARCH_LENGTH = 100;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const ORDER_STATUSES = new Set([
  "SUBMITTED",
  "DEFERRED",
  "CONFIRMED",
  "CANCELLED",
]);

const ACTIVE_ALLOCATION_STATUSES = [
  "ALLOCATED",
  "PUBLISHED",
];

const ORDER_LIST_INCLUDE = {
  outlet: {
    include: {
      depot: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      userId: true,
      fullName: true,
    },
  },
  _count: {
    select: {
      items: true,
    },
  },
  deliveryAllocations: {
    where: {
      status: {
        in: ACTIVE_ALLOCATION_STATUSES,
      },
    },
    take: 1,
    orderBy: {
      allocatedAt: "desc",
    },
    select: {
      id: true,
      status: true,
      liveTripStop: {
        select: {
          stopCode: true,
          sequence: true,
          liveTrip: {
            select: {
              tripCode: true,
              deliveryDate: true,
              status: true,
            },
          },
        },
      },
    },
  },
};

const ORDER_DETAIL_INCLUDE = {
  outlet: {
    include: {
      depot: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      userId: true,
      fullName: true,
      email: true,
    },
  },
  items: {
    orderBy: {
      id: "asc",
    },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          manufacturerBrand: true,
          productType: true,
          handlingType: true,
          category: true,
          unitLabel: true,
          unitWeightKg: true,
          unitVolumeM3: true,
        },
      },
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
    include: {
      liveTripStop: {
        include: {
          liveTrip: true,
        },
      },
    },
  },
  dispatcherDecisions: {
    orderBy: {
      decidedAt: "desc",
    },
    take: 20,
    include: {
      decidedByUser: {
        select: {
          id: true,
          userId: true,
          fullName: true,
          role: true,
        },
      },
    },
  },
};

// ============================================================
// DOMAIN ERROR
// ============================================================

export class DispatcherOrderError extends Error {
  constructor(
    message,
    {
      status = 400,
      code = "DISPATCHER_ORDER_ERROR",
    } = {}
  ) {
    super(message);
    this.name = "DispatcherOrderError";
    this.status = status;
    this.code = code;
  }
}

// ============================================================
// LIST / QUEUE
// ============================================================

/**
 * Returns Store Manager orders visible to the authenticated Dispatcher.
 *
 * A Dispatcher is always scoped to the depot stored on the authenticated
 * database User record. A browser-supplied depot cannot expand that scope.
 * ADMIN may optionally filter by depot code for support/oversight purposes.
 */
export async function listDispatcherStoreOrders(
  actor,
  rawQuery = {}
) {
  const scope = await resolveActorScope(
    actor,
    rawQuery?.depotCode
  );

  const query = normalizeListQuery(rawQuery);
  const baseWhere = buildListWhere(scope, query);

  const [
    orders,
    total,
    submittedCount,
    deferredCount,
    confirmedCount,
  ] = await Promise.all([
    prisma.storeOrder.findMany({
      where: baseWhere,
      orderBy: [
        {
          effectiveDispatchDate: "asc",
        },
        {
          submittedAt: "asc",
        },
      ],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: ORDER_LIST_INCLUDE,
    }),
    prisma.storeOrder.count({
      where: baseWhere,
    }),
    prisma.storeOrder.count({
      where: buildListWhere(scope, {
        ...query,
        status: "SUBMITTED",
      }),
    }),
    prisma.storeOrder.count({
      where: buildListWhere(scope, {
        ...query,
        status: "DEFERRED",
      }),
    }),
    prisma.storeOrder.count({
      where: buildListWhere(scope, {
        ...query,
        status: "CONFIRMED",
      }),
    }),
  ]);

  return {
    scope: serializeScope(scope),
    filters: {
      status: query.status,
      date: query.date,
      search: query.search || null,
    },
    summary: {
      submitted: submittedCount,
      deferred: deferredCount,
      confirmed: confirmedCount,
    },
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(
        1,
        Math.ceil(total / query.pageSize)
      ),
    },
    orders: orders.map(mapDispatcherOrderListItem),
  };
}

// ============================================================
// ORDER DETAILS
// ============================================================

export async function getDispatcherStoreOrderByCode(
  actor,
  orderCode
) {
  const scope = await resolveActorScope(actor);
  const normalizedOrderCode = normalizeOrderCode(orderCode);

  const order = await prisma.storeOrder.findFirst({
    where: {
      orderCode: normalizedOrderCode,
      ...scope.where,
    },
    include: ORDER_DETAIL_INCLUDE,
  });

  if (!order) {
    throw new DispatcherOrderError(
      "Store order was not found in your dispatcher scope.",
      {
        status: 404,
        code: "DISPATCHER_ORDER_NOT_FOUND",
      }
    );
  }

  return mapDispatcherOrderDetails(order);
}

// ============================================================
// CONFIRM ORDER
// ============================================================

/**
 * Allowed transitions:
 *   SUBMITTED -> CONFIRMED
 *   DEFERRED  -> CONFIRMED
 *
 * Confirming an already-confirmed order is idempotent and does not create a
 * duplicate decision record. This makes retries safe if the client loses the
 * first HTTP response.
 */
export async function confirmDispatcherStoreOrder(
  actor,
  orderCode
) {
  const scope = await resolveActorScope(actor);
  const normalizedOrderCode = normalizeOrderCode(orderCode);

  return prisma.$transaction(async (tx) => {
    const order = await tx.storeOrder.findFirst({
      where: {
        orderCode: normalizedOrderCode,
        ...scope.where,
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    if (!order) {
      throw new DispatcherOrderError(
        "Store order was not found in your dispatcher scope.",
        {
          status: 404,
          code: "DISPATCHER_ORDER_NOT_FOUND",
        }
      );
    }

    if (order.status === "CANCELLED") {
      throw new DispatcherOrderError(
        "A cancelled store order cannot be confirmed.",
        {
          status: 409,
          code: "DISPATCHER_ORDER_CANCELLED",
        }
      );
    }

    if (order.status === "CONFIRMED") {
      return {
        order: mapDispatcherOrderDetails(order),
        transition: {
          previousStatus: "CONFIRMED",
          resultingStatus: "CONFIRMED",
          idempotent: true,
        },
      };
    }

    if (
      order.status !== "SUBMITTED" &&
      order.status !== "DEFERRED"
    ) {
      throw new DispatcherOrderError(
        `Order ${order.orderCode} cannot be confirmed from status ${order.status}.`,
        {
          status: 409,
          code: "DISPATCHER_ORDER_INVALID_CONFIRM_TRANSITION",
        }
      );
    }

    const previousStatus = order.status;

    await tx.storeOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "CONFIRMED",
        deferredReason: null,
      },
    });

    await tx.storeOrderDecision.create({
      data: {
        storeOrderId: order.id,
        decidedByUserId: actor.id,
        decision: "CONFIRMED",
        previousStatus,
        resultingStatus: "CONFIRMED",
        reason: null,
        effectiveDispatchDate: order.effectiveDispatchDate,
      },
    });

    const updated = await tx.storeOrder.findUnique({
      where: {
        id: order.id,
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    return {
      order: mapDispatcherOrderDetails(updated),
      transition: {
        previousStatus,
        resultingStatus: "CONFIRMED",
        idempotent: false,
      },
    };
  });
}

// ============================================================
// DEFER ORDER
// ============================================================

/**
 * Allowed transitions:
 *   SUBMITTED -> DEFERRED
 *   CONFIRMED -> DEFERRED, only before an active trip allocation exists
 *
 * The next delivery date is mandatory and must be later than the current
 * effective dispatch date, so a deferral can never silently keep the same run.
 */
export async function deferDispatcherStoreOrder(
  actor,
  orderCode,
  payload = {}
) {
  const scope = await resolveActorScope(actor);
  const normalizedOrderCode = normalizeOrderCode(orderCode);
  const reason = normalizeDeferralReason(payload?.reason);
  const nextDeliveryDate = parseDateOnly(
    payload?.nextDeliveryDate,
    "nextDeliveryDate"
  );

  return prisma.$transaction(async (tx) => {
    const order = await tx.storeOrder.findFirst({
      where: {
        orderCode: normalizedOrderCode,
        ...scope.where,
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    if (!order) {
      throw new DispatcherOrderError(
        "Store order was not found in your dispatcher scope.",
        {
          status: 404,
          code: "DISPATCHER_ORDER_NOT_FOUND",
        }
      );
    }

    if (order.status === "CANCELLED") {
      throw new DispatcherOrderError(
        "A cancelled store order cannot be deferred.",
        {
          status: 409,
          code: "DISPATCHER_ORDER_CANCELLED",
        }
      );
    }

    if (order.status === "DEFERRED") {
      throw new DispatcherOrderError(
        "This store order is already deferred. Confirm it for a delivery run before recording another deferral.",
        {
          status: 409,
          code: "DISPATCHER_ORDER_ALREADY_DEFERRED",
        }
      );
    }

    if (
      order.status !== "SUBMITTED" &&
      order.status !== "CONFIRMED"
    ) {
      throw new DispatcherOrderError(
        `Order ${order.orderCode} cannot be deferred from status ${order.status}.`,
        {
          status: 409,
          code: "DISPATCHER_ORDER_INVALID_DEFER_TRANSITION",
        }
      );
    }

    if (
      order.status === "CONFIRMED" &&
      order.deliveryAllocations.length > 0
    ) {
      throw new DispatcherOrderError(
        "Cancel the active delivery allocation before deferring this confirmed order.",
        {
          status: 409,
          code: "DISPATCHER_ORDER_HAS_ACTIVE_ALLOCATION",
        }
      );
    }

    const currentEffectiveDate = dateOnly(order.effectiveDispatchDate);
    const nextDateOnly = dateOnly(nextDeliveryDate);

    if (nextDateOnly <= currentEffectiveDate) {
      throw new DispatcherOrderError(
        "The next delivery date must be later than the order's current effective dispatch date.",
        {
          status: 400,
          code: "DISPATCHER_ORDER_INVALID_NEXT_DELIVERY_DATE",
        }
      );
    }

    const previousStatus = order.status;

    await tx.storeOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "DEFERRED",
        deferredReason: reason,
        effectiveDispatchDate: nextDeliveryDate,
      },
    });

    await tx.storeOrderDecision.create({
      data: {
        storeOrderId: order.id,
        decidedByUserId: actor.id,
        decision: "DEFERRED",
        previousStatus,
        resultingStatus: "DEFERRED",
        reason,
        effectiveDispatchDate: nextDeliveryDate,
      },
    });

    const updated = await tx.storeOrder.findUnique({
      where: {
        id: order.id,
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    return {
      order: mapDispatcherOrderDetails(updated),
      transition: {
        previousStatus,
        resultingStatus: "DEFERRED",
        idempotent: false,
      },
    };
  });
}

// ============================================================
// ACTOR / DEPOT SCOPE
// ============================================================

export async function resolveActorScope(
  actor,
  requestedDepotCode = null
) {
  if (!actor) {
    throw new DispatcherOrderError(
      "Authenticated Dispatcher context is required.",
      {
        status: 401,
        code: "DISPATCHER_AUTHENTICATION_REQUIRED",
      }
    );
  }

  if (
    actor.role !== "DISPATCHER" &&
    actor.role !== "ADMIN"
  ) {
    throw new DispatcherOrderError(
      "Dispatcher access is required.",
      {
        status: 403,
        code: "DISPATCHER_ACCESS_DENIED",
      }
    );
  }

  const normalizedRequestedDepot = normalizeOptionalIdentifier(
    requestedDepotCode
  );

  if (actor.role === "DISPATCHER") {
    if (!actor.depotId || !actor.depot) {
      throw new DispatcherOrderError(
        "This Dispatcher does not have a depot assignment.",
        {
          status: 403,
          code: "DISPATCHER_DEPOT_REQUIRED",
        }
      );
    }

    if (!actor.depot.isActive) {
      throw new DispatcherOrderError(
        "The assigned Dispatcher depot is inactive.",
        {
          status: 403,
          code: "DISPATCHER_DEPOT_INACTIVE",
        }
      );
    }

    if (
      normalizedRequestedDepot &&
      normalizedRequestedDepot !== "ALL" &&
      normalizedRequestedDepot !== actor.depot.code.toUpperCase()
    ) {
      throw new DispatcherOrderError(
        "A Dispatcher cannot access another depot's Store Manager orders.",
        {
          status: 403,
          code: "DISPATCHER_DEPOT_SCOPE_VIOLATION",
        }
      );
    }

    return {
      type: "DEPOT",
      depotId: actor.depotId,
      depotCode: actor.depot.code,
      depotName: actor.depot.name,
      where: {
        outlet: {
          depotId: actor.depotId,
        },
      },
    };
  }

  if (
    !normalizedRequestedDepot ||
    normalizedRequestedDepot === "ALL"
  ) {
    return {
      type: "ALL_DEPOTS",
      depotId: null,
      depotCode: null,
      depotName: "All depots",
      where: {},
    };
  }

  const depot = await prisma.depot.findUnique({
    where: {
      code: normalizedRequestedDepot,
    },
  });

  if (!depot) {
    throw new DispatcherOrderError(
      "Requested depot was not found.",
      {
        status: 404,
        code: "DISPATCHER_DEPOT_NOT_FOUND",
      }
    );
  }

  return {
    type: "DEPOT",
    depotId: depot.id,
    depotCode: depot.code,
    depotName: depot.name,
    where: {
      outlet: {
        depotId: depot.id,
      },
    },
  };
}

// ============================================================
// QUERY NORMALIZATION
// ============================================================

function normalizeListQuery(rawQuery) {
  const rawStatus = String(rawQuery?.status || "SUBMITTED")
    .trim()
    .toUpperCase();

  const status = rawStatus === "ALL"
    ? "ALL"
    : rawStatus;

  if (
    status !== "ALL" &&
    !ORDER_STATUSES.has(status)
  ) {
    throw new DispatcherOrderError(
      "Unsupported order status filter.",
      {
        status: 400,
        code: "DISPATCHER_ORDER_INVALID_STATUS_FILTER",
      }
    );
  }

  const page = normalizePositiveInteger(
    rawQuery?.page,
    1
  );

  const pageSize = Math.min(
    normalizePositiveInteger(
      rawQuery?.pageSize,
      DEFAULT_PAGE_SIZE
    ),
    MAX_PAGE_SIZE
  );

  const search = String(rawQuery?.search || "")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);

  const date = rawQuery?.date
    ? dateOnly(
        parseDateOnly(rawQuery.date, "date")
      )
    : null;

  return {
    status,
    date,
    search,
    page,
    pageSize,
  };
}

function buildListWhere(scope, query) {
  const where = {
    ...scope.where,
  };

  if (query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.date) {
    where.effectiveDispatchDate = parseDateOnly(
      query.date,
      "date"
    );
  }

  if (query.search) {
    where.OR = [
      {
        orderCode: {
          contains: query.search,
        },
      },
      {
        outlet: {
          outletCode: {
            contains: query.search,
          },
        },
      },
      {
        outlet: {
          brand: {
            contains: query.search,
          },
        },
      },
      {
        outlet: {
          district: {
            contains: query.search,
          },
        },
      },
    ];
  }

  return where;
}

// ============================================================
// INPUT HELPERS
// ============================================================

function normalizeOrderCode(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new DispatcherOrderError(
      "orderCode is required.",
      {
        status: 400,
        code: "DISPATCHER_ORDER_CODE_REQUIRED",
      }
    );
  }

  return normalized;
}

function normalizeDeferralReason(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new DispatcherOrderError(
      "A deferral reason is required.",
      {
        status: 400,
        code: "DISPATCHER_DEFERRAL_REASON_REQUIRED",
      }
    );
  }

  if (normalized.length > MAX_REASON_LENGTH) {
    throw new DispatcherOrderError(
      `Deferral reason cannot exceed ${MAX_REASON_LENGTH} characters.`,
      {
        status: 400,
        code: "DISPATCHER_DEFERRAL_REASON_TOO_LONG",
      }
    );
  }

  return normalized;
}

function normalizeOptionalIdentifier(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  return normalized || null;
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return fallback;
  }

  return number;
}

function parseDateOnly(value, fieldName) {
  const normalized = String(value ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new DispatcherOrderError(
      `${fieldName} must use YYYY-MM-DD format.`,
      {
        status: 400,
        code: "DISPATCHER_ORDER_INVALID_DATE",
      }
    );
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    throw new DispatcherOrderError(
      `${fieldName} is not a valid calendar date.`,
      {
        status: 400,
        code: "DISPATCHER_ORDER_INVALID_DATE",
      }
    );
  }

  return parsed;
}

function dateOnly(value) {
  return new Date(value)
    .toISOString()
    .slice(0, 10);
}

// ============================================================
// API MAPPING
// ============================================================

function serializeScope(scope) {
  return {
    type: scope.type,
    depotId: scope.depotId,
    depotCode: scope.depotCode,
    depotName: scope.depotName,
  };
}

function mapDispatcherOrderListItem(order) {
  const activeAllocation = order.deliveryAllocations?.[0] || null;

  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    orderType: order.orderType,
    cutoffDecision: order.cutoffDecision,
    submittedAt: order.submittedAt,
    requestedDispatchDate: dateOnly(order.requestedDispatchDate),
    effectiveDispatchDate: dateOnly(order.effectiveDispatchDate),
    deferredReason: order.deferredReason,
    storeManagerNote: order.storeManagerNote,
    totalUnits: order.totalUnits,
    itemCount: order._count?.items ?? 0,
    estimatedWeightKg: Number(order.estimatedWeightKg),
    estimatedVolumeM3: Number(order.estimatedVolumeM3),
    outlet: mapOutlet(order.outlet),
    submittedBy: order.createdByUser
      ? {
          id: order.createdByUser.id,
          userId: order.createdByUser.userId,
          fullName: order.createdByUser.fullName,
        }
      : null,
    allocation: activeAllocation
      ? {
          id: activeAllocation.id,
          status: activeAllocation.status,
          stopCode: activeAllocation.liveTripStop.stopCode,
          sequence: activeAllocation.liveTripStop.sequence,
          tripCode: activeAllocation.liveTripStop.liveTrip.tripCode,
          tripStatus: activeAllocation.liveTripStop.liveTrip.status,
          deliveryDate: dateOnly(
            activeAllocation.liveTripStop.liveTrip.deliveryDate
          ),
        }
      : null,
  };
}

function mapDispatcherOrderDetails(order) {
  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    orderType: order.orderType,
    cutoffDecision: order.cutoffDecision,
    submittedAt: order.submittedAt,
    requestedDispatchDate: dateOnly(order.requestedDispatchDate),
    effectiveDispatchDate: dateOnly(order.effectiveDispatchDate),
    deferredReason: order.deferredReason,
    storeManagerNote: order.storeManagerNote,
    totalUnits: order.totalUnits,
    estimatedWeightKg: Number(order.estimatedWeightKg),
    estimatedVolumeM3: Number(order.estimatedVolumeM3),
    outlet: mapOutlet(order.outlet),
    submittedBy: order.createdByUser
      ? {
          id: order.createdByUser.id,
          userId: order.createdByUser.userId,
          fullName: order.createdByUser.fullName,
          email: order.createdByUser.email,
        }
      : null,
    items: (order.items || []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        manufacturerBrand: item.product.manufacturerBrand,
        productType: item.product.productType,
        handlingType: item.product.handlingType,
        category: item.product.category,
        unitLabel: item.product.unitLabel,
        unitWeightKg: Number(item.product.unitWeightKg),
        unitVolumeM3: Number(item.product.unitVolumeM3),
      },
    })),
    activeAllocations: (order.deliveryAllocations || []).map(
      (allocation) => ({
        id: allocation.id,
        status: allocation.status,
        stopCode: allocation.liveTripStop.stopCode,
        sequence: allocation.liveTripStop.sequence,
        trip: {
          tripCode: allocation.liveTripStop.liveTrip.tripCode,
          deliveryDate: dateOnly(
            allocation.liveTripStop.liveTrip.deliveryDate
          ),
          status: allocation.liveTripStop.liveTrip.status,
          vehicleCode: allocation.liveTripStop.liveTrip.vehicleCode,
        },
      })
    ),
    decisionHistory: (order.dispatcherDecisions || []).map(
      (decision) => ({
        id: decision.id,
        decision: decision.decision,
        previousStatus: decision.previousStatus,
        resultingStatus: decision.resultingStatus,
        reason: decision.reason,
        effectiveDispatchDate: dateOnly(
          decision.effectiveDispatchDate
        ),
        decidedAt: decision.decidedAt,
        decidedBy: decision.decidedByUser
          ? {
              id: decision.decidedByUser.id,
              userId: decision.decidedByUser.userId,
              fullName: decision.decidedByUser.fullName,
              role: decision.decidedByUser.role,
            }
          : null,
      })
    ),
  };
}

function mapOutlet(outlet) {
  return {
    id: outlet.id,
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
          id: outlet.depot.id,
          code: outlet.depot.code,
          name: outlet.depot.name,
          district: outlet.depot.district,
        }
      : null,
  };
}
