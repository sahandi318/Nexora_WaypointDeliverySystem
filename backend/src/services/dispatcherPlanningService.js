import prisma from "../config/database.js";

import {
  DispatcherOrderError,
  resolveActorScope,
} from "./dispatcherOrderService.js";

import {
  allocateConfirmedStoreOrderToStop,
  publishDeliveryAllocation,
} from "./deliveryIntegrationService.js";

import {
  emitMonitoringUpdate,
} from "./liveMonitoringService.js";

const ACTIVE_ALLOCATION_STATUSES = ["ALLOCATED", "PUBLISHED"];
const MAX_VEHICLE_CODE_LENGTH = 50;
const MAX_VEHICLE_TYPE_LENGTH = 120;

export class DispatcherPlanningError extends Error {
  constructor(
    message,
    {
      status = 400,
      code = "DISPATCHER_PLANNING_ERROR",
    } = {}
  ) {
    super(message);
    this.name = "DispatcherPlanningError";
    this.status = status;
    this.code = code;
  }
}

function dateOnly(value) {
  return value
    ? new Date(value).toISOString().slice(0, 10)
    : null;
}

function parseDateOnly(value, fieldName = "date") {
  const normalized = String(value ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new DispatcherPlanningError(
      `${fieldName} must use YYYY-MM-DD format.`,
      {
        status: 400,
        code: "DISPATCHER_PLANNING_INVALID_DATE",
      }
    );
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    throw new DispatcherPlanningError(
      `${fieldName} is not a valid calendar date.`,
      {
        status: 400,
        code: "DISPATCHER_PLANNING_INVALID_DATE",
      }
    );
  }

  return parsed;
}

function normalizeOptionalDate(value) {
  const normalized = String(value ?? "").trim();
  return normalized ? parseDateOnly(normalized) : null;
}

function normalizeVehicleCode(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new DispatcherPlanningError(
      "A vehicle code is required before creating a draft allocation.",
      {
        status: 400,
        code: "DISPATCHER_PLANNING_VEHICLE_REQUIRED",
      }
    );
  }

  if (normalized.length > MAX_VEHICLE_CODE_LENGTH) {
    throw new DispatcherPlanningError(
      `Vehicle code cannot exceed ${MAX_VEHICLE_CODE_LENGTH} characters.`,
      {
        status: 400,
        code: "DISPATCHER_PLANNING_VEHICLE_TOO_LONG",
      }
    );
  }

  return normalized;
}

function normalizeVehicleType(value) {
  const normalized = String(value ?? "").trim();
  return normalized.slice(0, MAX_VEHICLE_TYPE_LENGTH) || "Delivery vehicle";
}

function temperatureLabel(orderType) {
  return orderType === "CHILLED" ? "Chilled" : "Ambient";
}

function deliveryWindow(outlet) {
  const open = outlet?.windowOpenTime || null;
  const close = outlet?.windowCloseTime || null;

  if (open && close) return `${open} - ${close}`;
  return open || close || "Not specified";
}

function restrictionLabel(outlet) {
  return (
    outlet?.parkingConstraint ||
    outlet?.dockType ||
    "Standard access"
  );
}

function serializeScope(scope) {
  return {
    type: scope.type,
    depotId: scope.depotId,
    depotCode: scope.depotCode,
    depotName: scope.depotName,
  };
}

function mapPlanningOrder(order) {
  const allocation = order.deliveryAllocations?.[0] || null;
  const previouslyDeferred = (order.dispatcherDecisions || []).some(
    (decision) => decision.decision === "DEFERRED"
  );

  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    orderType: order.orderType,
    temperature: temperatureLabel(order.orderType),
    submittedAt: order.submittedAt,
    requestedDispatchDate: dateOnly(order.requestedDispatchDate),
    effectiveDispatchDate: dateOnly(order.effectiveDispatchDate),
    deferredReason: order.deferredReason || null,
    previouslyDeferred,
    totalUnits: order.totalUnits,
    estimatedWeightKg: Number(order.estimatedWeightKg),
    estimatedVolumeM3: Number(order.estimatedVolumeM3),
    outlet: {
      id: order.outlet.id,
      outletCode: order.outlet.outletCode,
      brand: order.outlet.brand,
      district: order.outlet.district,
      dockType: order.outlet.dockType,
      parkingConstraint: order.outlet.parkingConstraint,
      mallWindow: order.outlet.mallWindow,
      windowOpenTime: order.outlet.windowOpenTime,
      windowCloseTime: order.outlet.windowCloseTime,
      deliveryWindow: deliveryWindow(order.outlet),
      restriction: restrictionLabel(order.outlet),
      depot: order.outlet.depot
        ? {
            id: order.outlet.depot.id,
            code: order.outlet.depot.code,
            name: order.outlet.depot.name,
          }
        : null,
    },
    allocation: allocation
      ? {
          id: allocation.id,
          status: allocation.status,
          stopCode: allocation.liveTripStop.stopCode,
          sequence: allocation.liveTripStop.sequence,
          tripCode: allocation.liveTripStop.liveTrip.tripCode,
          tripStatus: allocation.liveTripStop.liveTrip.status,
          deliveryDate: dateOnly(
            allocation.liveTripStop.liveTrip.deliveryDate
          ),
          vehicleCode: allocation.liveTripStop.liveTrip.vehicleCode,
          driverName: allocation.liveTripStop.liveTrip.driverName,
        }
      : null,
  };
}

function mapPlanningTrip(trip) {
  const allocations = [];

  for (const stop of trip.stops || []) {
    for (const allocation of stop.deliveryAllocations || []) {
      allocations.push({
        id: allocation.id,
        status: allocation.status,
        orderCode: allocation.storeOrder.orderCode,
        orderType: allocation.storeOrder.orderType,
        totalUnits: allocation.storeOrder.totalUnits,
        stopCode: stop.stopCode,
        sequence: stop.sequence,
        outletCode: allocation.storeOrder.outlet.outletCode,
        brand: allocation.storeOrder.outlet.brand,
        district: allocation.storeOrder.outlet.district,
      });
    }
  }

  return {
    id: trip.id,
    tripCode: trip.tripCode,
    deliveryDate: dateOnly(trip.deliveryDate),
    status: trip.status,
    vehicleCode: trip.vehicleCode,
    vehicleType: trip.vehicleType,
    temperature: trip.temperature,
    driverUserId: trip.driverUserId,
    driverName: trip.driverName,
    progressCompleted: trip.progressCompleted,
    progressTotal: trip.progressTotal,
    nextDestination: trip.nextDestination,
    eta: trip.eta,
    allocations,
    canPublish:
      allocations.length > 0 &&
      allocations.some((item) => item.status === "ALLOCATED"),
    isPublished:
      allocations.length > 0 &&
      allocations.every((item) => item.status === "PUBLISHED"),
  };
}

async function getOrderForPlanning(scope, orderCode) {
  const normalizedOrderCode = String(orderCode ?? "").trim();

  if (!normalizedOrderCode) {
    throw new DispatcherPlanningError(
      "orderCode is required.",
      {
        status: 400,
        code: "DISPATCHER_PLANNING_ORDER_CODE_REQUIRED",
      }
    );
  }

  const order = await prisma.storeOrder.findFirst({
    where: {
      orderCode: normalizedOrderCode,
      ...scope.where,
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
        take: 1,
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
    },
  });

  if (!order) {
    throw new DispatcherPlanningError(
      "Store order was not found in the authenticated Dispatcher depot.",
      {
        status: 404,
        code: "DISPATCHER_PLANNING_ORDER_NOT_FOUND",
      }
    );
  }

  return order;
}

async function resolveDriverForScope(scope, driverUserId) {
  const normalized = String(driverUserId ?? "").trim();

  if (!normalized) return null;

  const driver = await prisma.user.findFirst({
    where: {
      userId: normalized,
      role: "DRIVER",
      isActive: true,
      ...(scope.depotId
        ? {
            depotId: scope.depotId,
          }
        : {}),
    },
    include: {
      depot: true,
    },
  });

  if (!driver) {
    throw new DispatcherPlanningError(
      "The selected driver is not an active Driver in this depot.",
      {
        status: 400,
        code: "DISPATCHER_PLANNING_DRIVER_INVALID",
      }
    );
  }

  return driver;
}

export async function getDispatcherPlanningWorkspace(
  actor,
  rawQuery = {}
) {
  const scope = await resolveActorScope(
    actor,
    rawQuery?.depotCode
  );

  const selectedDate = normalizeOptionalDate(rawQuery?.date);

  const orderWhere = {
    ...scope.where,
    ...(selectedDate
      ? {
          effectiveDispatchDate: selectedDate,
        }
      : {}),
  };

  const tripWhere = {
    ...(scope.depotId
      ? {
          depotId: scope.depotId,
        }
      : {}),
    ...(selectedDate
      ? {
          deliveryDate: selectedDate,
        }
      : {}),
    stops: {
      some: {
        deliveryAllocations: {
          some: {
            status: {
              in: ACTIVE_ALLOCATION_STATUSES,
            },
          },
        },
      },
    },
  };

  const [orders, drivers, liveTrips, observedTrips] = await Promise.all([
    prisma.storeOrder.findMany({
      where: orderWhere,
      orderBy: [
        { effectiveDispatchDate: "asc" },
        { submittedAt: "asc" },
      ],
      include: {
        outlet: {
          include: {
            depot: true,
          },
        },
        dispatcherDecisions: {
          select: {
            decision: true,
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
                liveTrip: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: "DRIVER",
        isActive: true,
        ...(scope.depotId
          ? {
              depotId: scope.depotId,
            }
          : {}),
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
        depotId: true,
      },
    }),
    prisma.liveTrip.findMany({
      where: tripWhere,
      orderBy: [
        { deliveryDate: "asc" },
        { tripCode: "asc" },
      ],
      include: {
        stops: {
          orderBy: {
            sequence: "asc",
          },
          include: {
            deliveryAllocations: {
              where: {
                status: {
                  in: ACTIVE_ALLOCATION_STATUSES,
                },
              },
              include: {
                storeOrder: {
                  include: {
                    outlet: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.liveTrip.findMany({
      where: {
        ...(scope.depotId
          ? {
              depotId: scope.depotId,
            }
          : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
      select: {
        vehicleCode: true,
        vehicleType: true,
        temperature: true,
      },
    }),
  ]);

  const mappedOrders = orders.map(mapPlanningOrder);

  const submittedOrders = mappedOrders.filter(
    (order) => order.status === "SUBMITTED"
  );
  const confirmedOrders = mappedOrders.filter(
    (order) => order.status === "CONFIRMED"
  );
  const deferredOrders = mappedOrders.filter(
    (order) => order.status === "DEFERRED"
  );

  const allocatedOrders = confirmedOrders.filter(
    (order) => Boolean(order.allocation)
  );
  const unallocatedOrders = confirmedOrders.filter(
    (order) => !order.allocation
  );

  const vehicleMap = new Map();
  for (const trip of observedTrips) {
    if (!trip.vehicleCode) continue;
    if (!vehicleMap.has(trip.vehicleCode)) {
      vehicleMap.set(trip.vehicleCode, {
        vehicleCode: trip.vehicleCode,
        vehicleType: trip.vehicleType || "Delivery vehicle",
        temperature: trip.temperature || null,
      });
    }
  }

  return {
    scope: serializeScope(scope),
    filters: {
      date: selectedDate ? dateOnly(selectedDate) : null,
    },
    summary: {
      submittedOrders: submittedOrders.length,
      confirmedOrders: confirmedOrders.length,
      allocatedOrders: allocatedOrders.length,
      unallocatedOrders: unallocatedOrders.length,
      deferredOrders: deferredOrders.length,
      publishedOrders: allocatedOrders.filter(
        (order) => order.allocation?.status === "PUBLISHED"
      ).length,
      plannedTrips: liveTrips.length,
    },
    orders: {
      submitted: submittedOrders,
      confirmed: confirmedOrders,
      deferred: deferredOrders,
      allocated: allocatedOrders,
      unallocated: unallocatedOrders,
    },
    drivers,
    vehicles: Array.from(vehicleMap.values()).sort((a, b) =>
      a.vehicleCode.localeCompare(b.vehicleCode)
    ),
    trips: liveTrips.map(mapPlanningTrip),
  };
}

export async function allocateDispatcherOrderToDraftTrip(
  actor,
  orderCode,
  payload = {}
) {
  const scope = await resolveActorScope(
    actor,
    payload?.depotCode
  );

  const order = await getOrderForPlanning(scope, orderCode);

  if (order.status !== "CONFIRMED") {
    throw new DispatcherPlanningError(
      "Only a confirmed Store Manager order can be allocated.",
      {
        status: 409,
        code: "DISPATCHER_PLANNING_ORDER_NOT_CONFIRMED",
      }
    );
  }

  const activeAllocation = order.deliveryAllocations?.[0] || null;
  if (activeAllocation) {
    return {
      allocation: {
        id: activeAllocation.id,
        status: activeAllocation.status,
        tripCode: activeAllocation.liveTripStop.liveTrip.tripCode,
        stopCode: activeAllocation.liveTripStop.stopCode,
      },
      idempotent: true,
    };
  }

  if (
    scope.depotId &&
    order.outlet.depotId !== scope.depotId
  ) {
    throw new DispatcherPlanningError(
      "The Store Manager order does not belong to the authenticated Dispatcher depot.",
      {
        status: 403,
        code: "DISPATCHER_PLANNING_DEPOT_SCOPE_VIOLATION",
      }
    );
  }

  const driver = await resolveDriverForScope(
    scope,
    payload?.driverUserId
  );

  const vehicleCode = normalizeVehicleCode(payload?.vehicleCode);
  const vehicleType = normalizeVehicleType(payload?.vehicleType);
  const deliveryDate = order.effectiveDispatchDate;
  const tripCode = `PLN-${order.id}-${dateOnly(deliveryDate).replaceAll("-", "")}`;
  const stopCode = `PLNST-${order.id}`;
  const plannedEta = order.outlet.windowOpenTime || null;

  const trip = await prisma.liveTrip.upsert({
    where: {
      tripCode,
    },
    update: {
      deliveryDate,
      depotId: order.outlet.depotId,
      vehicleCode,
      vehicleType,
      temperature: temperatureLabel(order.orderType),
      driverUserId: driver?.id || null,
      driverName: driver?.fullName || "Unassigned driver",
      status: "PLANNED",
      progressCompleted: 0,
      progressTotal: 1,
      nextDestination: order.outlet.outletCode,
      eta: plannedEta,
      isDriverOnline: false,
      latestDriverUpdate: "Draft delivery plan created. Awaiting publication.",
      latestDriverUpdateAt: new Date(),
    },
    create: {
      tripCode,
      deliveryDate,
      depotId: order.outlet.depotId,
      vehicleCode,
      vehicleType,
      temperature: temperatureLabel(order.orderType),
      driverUserId: driver?.id || null,
      driverName: driver?.fullName || "Unassigned driver",
      status: "PLANNED",
      progressCompleted: 0,
      progressTotal: 1,
      nextDestination: order.outlet.outletCode,
      eta: plannedEta,
      isDriverOnline: false,
      latestDriverUpdate: "Draft delivery plan created. Awaiting publication.",
      latestDriverUpdateAt: new Date(),
    },
  });

  await prisma.liveTripStop.upsert({
    where: {
      stopCode,
    },
    update: {
      liveTripId: trip.id,
      sequence: 1,
      outletCode: order.outlet.outletCode,
      outletName: `${order.outlet.brand} · ${order.outlet.outletCode}`,
      district: order.outlet.district,
      plannedEta,
      actualArrival: null,
      status: "PENDING",
      outcome: null,
    },
    create: {
      stopCode,
      liveTripId: trip.id,
      sequence: 1,
      outletCode: order.outlet.outletCode,
      outletName: `${order.outlet.brand} · ${order.outlet.outletCode}`,
      district: order.outlet.district,
      plannedEta,
      status: "PENDING",
    },
  });

  let allocation;
  try {
    allocation = await allocateConfirmedStoreOrderToStop({
      orderCode: order.orderCode,
      stopCode,
    });
  } catch (error) {
    if (error instanceof DispatcherOrderError) throw error;
    throw error;
  }

  emitMonitoringUpdate({
    reason: "dispatcher-draft-allocation",
    tripCode,
    notifyTripOutlets: true,
  });

  return {
    allocation,
    idempotent: false,
  };
}

export async function publishDispatcherPlanningTrip(
  actor,
  tripCode,
  payload = {}
) {
  const scope = await resolveActorScope(
    actor,
    payload?.depotCode
  );

  const normalizedTripCode = String(tripCode ?? "").trim();
  if (!normalizedTripCode) {
    throw new DispatcherPlanningError(
      "tripCode is required.",
      {
        status: 400,
        code: "DISPATCHER_PLANNING_TRIP_CODE_REQUIRED",
      }
    );
  }

  const trip = await prisma.liveTrip.findFirst({
    where: {
      tripCode: normalizedTripCode,
      ...(scope.depotId
        ? {
            depotId: scope.depotId,
          }
        : {}),
    },
    include: {
      stops: {
        include: {
          deliveryAllocations: {
            where: {
              status: {
                in: ACTIVE_ALLOCATION_STATUSES,
              },
            },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new DispatcherPlanningError(
      "Planning trip was not found in the authenticated Dispatcher depot.",
      {
        status: 404,
        code: "DISPATCHER_PLANNING_TRIP_NOT_FOUND",
      }
    );
  }

  const allocations = trip.stops.flatMap(
    (stop) => stop.deliveryAllocations || []
  );

  if (allocations.length === 0) {
    throw new DispatcherPlanningError(
      "This trip has no active Store Manager order allocations to publish.",
      {
        status: 409,
        code: "DISPATCHER_PLANNING_TRIP_EMPTY",
      }
    );
  }

  const published = [];
  for (const allocation of allocations) {
    published.push(
      await publishDeliveryAllocation(allocation.id)
    );
  }

  await prisma.liveTrip.update({
    where: {
      id: trip.id,
    },
    data: {
      status: "PLANNED",
      latestDriverUpdate: "Delivery plan published. Awaiting driver start.",
      latestDriverUpdateAt: new Date(),
    },
  });

  await prisma.liveTripEvent.create({
    data: {
      liveTripId: trip.id,
      type: "DISPATCHER_PLAN_PUBLISHED",
      message: `Dispatcher published ${normalizedTripCode}.`,
      payload: {
        tripCode: normalizedTripCode,
        allocationCount: allocations.length,
      },
    },
  });

  emitMonitoringUpdate({
    reason: "plan-published",
    tripCode: normalizedTripCode,
    notifyTripOutlets: true,
  });

  return {
    tripCode: normalizedTripCode,
    publishedAllocations: published.length,
  };
}
