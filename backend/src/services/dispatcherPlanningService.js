import prisma from "../config/database.js";
import { resolveActorScope } from "./dispatcherOrderService.js";
import {
  allocateConfirmedStoreOrderToStop,
  publishDeliveryAllocation,
} from "./deliveryIntegrationService.js";
import { state } from "../mockData.js";
import {
  emitMonitoringUpdate,
  synchronizeTripForDriver,
} from "./liveMonitoringService.js";
import {
  buildOrganizerTripEstimate,
  getOrganizerDatasetSummary,
  getOrganizerVehicleRow,
  getOrganizerVehicleRows,
} from "./organizerOperationalDataService.js";

function localDateOnly(dateValue) {
  if (!dateValue) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  return String(dateValue).slice(0, 10);
}

function dateRange(dateValue) {
  const dateText = localDateOnly(dateValue);
  const start = new Date(`${dateText}T00:00:00.000Z`);
  const end = new Date(`${dateText}T23:59:59.999Z`);
  return { start, end, dateText };
}

function orderTemperature(order) {
  return order.orderType === "CHILLED" ? "Chilled" : "Ambient";
}

function orderRestriction(outlet) {
  const parts = [
    outlet?.parkingConstraint,
    outlet?.dockType,
    outlet?.mallWindow ? `Mall: ${outlet.mallWindow}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Standard access";
}

function orderView(order) {
  const outlet = order.outlet;

  return {
    id: order.id,
    orderId: order.orderCode,
    outletId: outlet?.outletCode || `OUT-${order.outletId}`,
    outletName: outlet?.outletCode || `Outlet ${order.outletId}`,
    brand: outlet?.brand || "Waypoint",
    district: outlet?.district || "—",
    depot: outlet?.depot?.name || "—",
    depotId: outlet?.depot?.id || null,
    deliveryWindow:
      outlet?.windowOpenTime && outlet?.windowCloseTime
        ? `${outlet.windowOpenTime} – ${outlet.windowCloseTime}`
        : "Window not set",
    windowOpen: outlet?.windowOpenTime || null,
    windowClose: outlet?.windowCloseTime || null,
    mallWindow: outlet?.mallWindow || null,
    restriction: orderRestriction(outlet),
    parkingConstraint: outlet?.parkingConstraint || null,
    dockType: outlet?.dockType || null,
    temperature: orderTemperature(order),
    orderType: order.orderType,
    totalUnits: order.totalUnits,
    load: `${order.totalUnits} units`,
    weightKg: Number(order.estimatedWeightKg || 0),
    volumeM3: Number(order.estimatedVolumeM3 || 0),
    weight: `${Number(order.estimatedWeightKg || 0).toFixed(1)} kg`,
    volume: `${Number(order.estimatedVolumeM3 || 0).toFixed(2)} m³`,
    status: order.status === "DEFERRED" ? "Deferred" : "Confirmed",
    previouslyDeferred: order.status === "DEFERRED",
    previousDeferrals: order.status === "DEFERRED" ? 1 : 0,
    deferredReason: order.deferredReason || null,
    location: outlet?.district || "—",
  };
}

function vehicleView(row, tripsUsed = 0) {
  const maxWeight = Number(row.weight_cap_kg || 0);
  const maxVolume = Number(row.volume_cap_m3 || 0);
  const temperature = String(row.temp || "").toLowerCase() === "reefer"
    ? "Refrigerated"
    : "Ambient";

  return {
    vehicleId: row.vehicle_id,
    type: String(row.type || "vehicle")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    depot: row.depot,
    temperature,
    maxWeightKg: maxWeight,
    maxVolumeM3: maxVolume,
    maxWeight: `${maxWeight.toLocaleString()} kg`,
    maxVolume: `${maxVolume.toFixed(1)} m³`,
    currentLoad: "0 kg / 0 m³",
    tripsLeft: Math.max(0, 2 - tripsUsed),
    availability: tripsUsed >= 2 ? "Unavailable" : "Available",
    capacityGroup: maxWeight >= 5000 ? "HIGH" : maxWeight >= 3500 ? "MEDIUM" : "LOW",
    isSuitable: tripsUsed < 2,
    fuelType: row.fuel_type || null,
    kmPerL: Number(row.km_per_l || 0),
    weeklyFuelQuotaL: Number(row.weekly_fuel_quota_l || 0),
    weeklyFuelQuota: `${Number(row.weekly_fuel_quota_l || 0).toLocaleString()} L`,
    dataSource: "Waypoint organizer vehicles.csv",
  };
}

function deterministicCoordinate(outletCode, depotName) {
  const seed = [...String(outletCode || "OUT")].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );

  const kandy = String(depotName || "").toLowerCase().includes("kandy");
  const base = kandy
    ? { latitude: 7.2906, longitude: 80.6337 }
    : { latitude: 6.9271, longitude: 79.8612 };

  const latOffset = ((seed % 19) - 9) * 0.0032;
  const lngOffset = (((seed * 7) % 19) - 9) * 0.0032;

  return {
    latitude: base.latitude + latOffset,
    longitude: base.longitude + lngOffset,
    source: "DEMO_COORDINATE_DERIVED_FOR_HACKATHON_UI",
  };
}

function compatibleVehicle(order, vehicle) {
  const needsChilled = order.temperature === "Chilled";
  const isReefer = vehicle.temperature === "Refrigerated";
  const vanOnly = String(order.parkingConstraint || "")
    .toLowerCase()
    .includes("van_only");
  const isVan = String(vehicle.type || "").toLowerCase().includes("van");

  return (!needsChilled || isReefer) && (!vanOnly || isVan);
}

async function makeSuggestedTrips(orders, fleet, drivers, { date } = {}) {
  const availableOrders = orders.filter((order) => order.status !== "Deferred");
  const remaining = [...availableOrders];
  const trips = [];
  let tripNumber = 1;

  while (remaining.length) {
    const first = remaining[0];
    const sameDepot = remaining
      .filter((order) => order.depot === first.depot)
      .sort((left, right) => {
        const leftSameDistrict = left.district === first.district ? 0 : 1;
        const rightSameDistrict = right.district === first.district ? 0 : 1;
        if (leftSameDistrict !== rightSameDistrict) return leftSameDistrict - rightSameDistrict;
        return String(left.windowOpen || "23:59").localeCompare(String(right.windowOpen || "23:59"));
      });
    const candidateVehicle =
      fleet.find(
        (vehicle) =>
          vehicle.depot === first.depot &&
          vehicle.availability === "Available" &&
          compatibleVehicle(first, vehicle)
      ) ||
      fleet.find(
        (vehicle) =>
          vehicle.depot === first.depot &&
          vehicle.availability === "Available"
      );

    if (!candidateVehicle) break;

    const capacityOrders = [];
    let weight = 0;
    let volume = 0;

    for (const order of sameDepot) {
      if (capacityOrders.length >= 4) break;
      if (!compatibleVehicle(order, candidateVehicle)) continue;

      const nextWeight = weight + order.weightKg;
      const nextVolume = volume + order.volumeM3;

      if (
        nextWeight <= candidateVehicle.maxWeightKg &&
        nextVolume <= candidateVehicle.maxVolumeM3
      ) {
        capacityOrders.push(order);
        weight = nextWeight;
        volume = nextVolume;
      }
    }

    if (!capacityOrders.length) {
      capacityOrders.push(first);
    }

    const driver =
      drivers.find((item) => item.depot === first.depot) ||
      drivers[0] ||
      null;

    const tripId = `PLAN-${first.depot.replace(/\s+/g, "").toUpperCase()}-${String(
      tripNumber
    ).padStart(2, "0")}`;

    const organizerEstimate = await buildOrganizerTripEstimate({
      date,
      depot: first.depot,
      vehicle: candidateVehicle,
      orders: capacityOrders,
    });

    const stopEstimateByOrder = new Map(
      organizerEstimate.stops.map((stop) => [stop.orderId, stop])
    );
    const compatibilityReady = capacityOrders.every((order) =>
      compatibleVehicle(order, candidateVehicle)
    );
    const hasOperationalWarnings = organizerEstimate.warnings.length > 0;

    trips.push({
      tripId,
      tripCode: tripId,
      vehicleId: candidateVehicle.vehicleId,
      vehicleType: candidateVehicle.type,
      depot: first.depot,
      driverUserId: driver?.id || null,
      driverName: driver?.name || "Unassigned Driver",
      stops: capacityOrders.length,
      orders: capacityOrders.length,
      departure: organizerEstimate.departure || first.windowOpen || "After plan publication",
      validation: compatibilityReady && !hasOperationalWarnings ? "Ready" : "Warning",
      validationWarnings: organizerEstimate.warnings,
      capacityUsage: `${weight.toFixed(0)} / ${candidateVehicle.maxWeightKg.toFixed(
        0
      )} kg`,
      estimatedDistanceKm: organizerEstimate.totalDistanceKm,
      estimatedDurationMinutes: organizerEstimate.totalDurationMinutes,
      estimatedTravelMinutes: organizerEstimate.totalTravelMinutes,
      estimatedServiceMinutes: organizerEstimate.totalServiceMinutes,
      estimatedFuelL: organizerEstimate.estimatedFuelL,
      fuelQuotaPercent: organizerEstimate.fuelQuotaPercent,
      kmPerL: organizerEstimate.kmPerL,
      weeklyFuelQuotaL: organizerEstimate.weeklyFuelQuotaL,
      dataSource: "Waypoint organizer General Data",
      stopsList: capacityOrders.map((order, index) => {
        const estimate = stopEstimateByOrder.get(order.orderId);
        return {
          sequence: index + 1,
          orderId: order.orderId,
          outletId: order.outletId,
          outletName: order.outletName,
          name: order.outletName || order.outletId,
          district: order.district,
          deliveryWindow: order.deliveryWindow,
          plannedArrival: estimate?.plannedArrival || order.windowOpen || null,
          eta: estimate?.plannedArrival || order.windowOpen || null,
          distanceKm: estimate?.distanceKm ?? null,
          travelMinutes: estimate?.travelMinutes ?? null,
          serviceAllowanceMinutes: estimate?.serviceAllowanceMinutes ?? null,
          lateByMinutes: estimate?.lateByMinutes ?? 0,
          planningContext: estimate?.planningContext ?? null,
        };
      }),
      orderIds: capacityOrders.map((order) => order.id),
    });

    const used = new Set(capacityOrders.map((order) => order.id));
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (used.has(remaining[index].id)) remaining.splice(index, 1);
    }

    tripNumber += 1;
  }

  return trips;
}

export async function getDispatcherPlanningSnapshot({
  date,
  depotName = null,
} = {}, actor) {
  // Authentication middleware loads this actor from the database. Request
  // filters must never expand a Dispatcher's assigned depot scope.
  const scope = await resolveActorScope(actor);
  const dispatcherDepotId = actor.role === "DISPATCHER" ? scope.depotId : null;
  if (dispatcherDepotId) depotName = scope.depotName;
  const { start, end, dateText } = dateRange(date);

  const orderWhere = {
    effectiveDispatchDate: {
      gte: start,
      lte: end,
    },
    status: {
      in: ["SUBMITTED", "CONFIRMED", "DEFERRED"],
    },
  };

  if (dispatcherDepotId) {
    orderWhere.outlet = { depotId: dispatcherDepotId };
  } else if (depotName && depotName !== "ALL") {
    orderWhere.outlet = {
      depot: {
        name: depotName,
      },
    };
  }

  const [ordersDb, vehicleRows, activeTrips, driversDb, depots] =
    await Promise.all([
      prisma.storeOrder.findMany({
        where: orderWhere,
        include: {
          outlet: {
            include: {
              depot: true,
            },
          },
        },
        orderBy: {
          submittedAt: "asc",
        },
      }),
      getOrganizerVehicleRows(),
      prisma.liveTrip.findMany({
        where: {
          ...(dispatcherDepotId ? { depotId: dispatcherDepotId } : {}),
          deliveryDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          vehicleCode: true,
          status: true,
        },
      }),
      prisma.user.findMany({
        where: {
          role: "DRIVER",
          isActive: true,
          ...(dispatcherDepotId ? { depotId: dispatcherDepotId } : {}),
        },
        include: {
          depot: true,
        },
        orderBy: {
          fullName: "asc",
        },
      }),
      prisma.depot.findMany({
        where: { isActive: true, ...(dispatcherDepotId ? { id: dispatcherDepotId } : {}) },
        select: {
          id: true,
          code: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

  const tripCountByVehicle = new Map();
  for (const trip of activeTrips) {
    if (trip.status === "COMPLETED") continue;
    tripCountByVehicle.set(
      trip.vehicleCode,
      (tripCountByVehicle.get(trip.vehicleCode) || 0) + 1
    );
  }

  const orders = ordersDb.map(orderView);

  const fleet = vehicleRows
    .filter((row) => !depotName || depotName === "ALL" || row.depot === depotName)
    .map((row) => vehicleView(row, tripCountByVehicle.get(row.vehicle_id) || 0));

  const drivers = driversDb.map((driver) => ({
    id: driver.id,
    userId: driver.userId,
    name: driver.fullName,
    depot: driver.depot?.name || null,
    depotId: driver.depot?.id || null,
  }));

  const [suggestedTrips, organizerDataset] = await Promise.all([
    makeSuggestedTrips(orders, fleet, drivers, { date: dateText }),
    getOrganizerDatasetSummary(),
  ]);

  const publicationPreview = [
    {
      id: "loader",
      title: "Loader",
      description:
        suggestedTrips.length > 0
          ? `${suggestedTrips.length} trip plan(s) will be available in stop sequence.`
          : "No trip plan is ready to publish.",
    },
    {
      id: "driver",
      title: "Driver",
      description:
        suggestedTrips.length > 0
          ? "Assigned published trips become available to Driver workflow and Live Delivery Monitoring."
          : "No Driver assignment is available yet.",
    },
    {
      id: "store-manager",
      title: "Store Manager",
      description:
        orders.some((order) => order.status === "Deferred")
          ? "Deferred orders retain a clear reason for Store Manager visibility."
          : "Confirmed orders remain scheduled for the planned delivery run.",
    },
  ];

  const summary = {
    confirmedOrders: orders.filter((order) => order.status === "Confirmed").length,
    allocatedOrders: suggestedTrips.reduce(
      (sum, trip) => sum + trip.orderIds.length,
      0
    ),
    unallocatedOrders: Math.max(
      0,
      orders.filter((order) => order.status === "Confirmed").length -
        suggestedTrips.reduce((sum, trip) => sum + trip.orderIds.length, 0)
    ),
    deferredOrders: orders.filter((order) => order.status === "Deferred").length,
    plannedTrips: suggestedTrips.length,
    blockingErrors: suggestedTrips.some((trip) => !trip.driverUserId) ? 1 : 0,
    unassigned: suggestedTrips.filter((trip) => !trip.driverUserId).length,
    warnings: suggestedTrips.filter((trip) => trip.validation !== "Ready").length,
    status: suggestedTrips.length ? "Ready for Review" : "Waiting for Orders",
  };

  return {
    date: dateText,
    depots,
    orders,
    deferredOrders: orders.filter((order) => order.status === "Deferred"),
    fleet,
    drivers,
    suggestedTrips,
    publicationPreview,
    summary,
    organizerDataset,
  };
}

export async function deferStoreOrder({
  orderId,
  reason,
}) {
  const id = Number(orderId);
  if (!Number.isInteger(id)) {
    throw new Error("A valid order is required.");
  }

  return prisma.storeOrder.update({
    where: { id },
    data: {
      status: "DEFERRED",
      deferredReason: String(reason || "Deferred by Dispatcher").slice(0, 500),
    },
  });
}

function timeLabelFromOrders(orders) {
  const first = orders[0];
  if (!first) return "Published delivery plan";
  const open = first.outlet?.windowOpenTime;
  const close = orders.at(-1)?.outlet?.windowCloseTime;
  return open && close ? `${open} – ${close}` : "Published delivery plan";
}

function stopFromOrder(order, index, tripCode, estimate = null) {
  const outlet = order.outlet;
  const coords = deterministicCoordinate(outlet?.outletCode, outlet?.depot?.name);

  return {
    stopId: `${tripCode}-STOP${String(index + 1).padStart(2, "0")}`,
    storeOrderId: order.id,
    position: index + 1,
    outletId: outlet?.outletCode || `OUT-${order.outletId}`,
    orderId: order.orderCode,
    district: outlet?.district || "",
    windowOpen: outlet?.windowOpenTime || null,
    windowClose: outlet?.windowCloseTime || null,
    plannedArrival: estimate?.plannedArrival || outlet?.windowOpenTime || null,
    arrivalTime: null,
    tempRequirement: orderTemperature(order),
    expectedUnits: order.totalUnits,
    loadedUnits: order.totalUnits,
    deliveredQuantity: null,
    unloadingPoint: outlet?.dockType || "Standard unloading",
    vehicleAccess: outlet?.parkingConstraint || "Normal access",
    mallWindow: outlet?.mallWindow || null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${coords.latitude}%2C${coords.longitude}`,
    destination: coords,
    etaMinutes: estimate?.travelMinutes ?? null,
    distanceKm: estimate?.distanceKm ?? null,
    serviceAllowanceMinutes: estimate?.serviceAllowanceMinutes ?? null,
    planningReference: estimate?.planningContext ?? null,
    status: index === 0 ? "next" : "pending",
    completed: false,
    outcome: null,
    pod: null,
    exception: null,
  };
}

async function publishStoreManagerAllocationsForTrip({
  orders,
  driverTrip,
  liveTrip,
}) {
  const persistedStops = await prisma.liveTripStop.findMany({
    where: {
      liveTripId: liveTrip.id,
    },
    select: {
      stopCode: true,
      outletCode: true,
    },
  });

  const persistedStopByCode = new Map(
    persistedStops.map((stop) => [stop.stopCode, stop])
  );
  const driverStopByOrderCode = new Map(
    driverTrip.stops.map((stop) => [stop.orderId, stop])
  );

  const publishedAllocations = [];

  for (const order of orders) {
    const driverStop = driverStopByOrderCode.get(order.orderCode);
    const persistedStop = driverStop
      ? persistedStopByCode.get(driverStop.stopId)
      : null;

    if (!driverStop || !persistedStop) {
      throw new Error(
        `Published stop mapping is unavailable for order ${order.orderCode}.`
      );
    }

    const allocation = await allocateConfirmedStoreOrderToStop({
      orderCode: order.orderCode,
      stopCode: persistedStop.stopCode,
    });

    const published = await publishDeliveryAllocation(allocation.id);
    publishedAllocations.push(published);
  }

  return publishedAllocations;
}

export async function publishDispatcherPlan({
  trip,
  dispatcherUser,
}) {
  if (!trip?.vehicleId || !Array.isArray(trip.orderIds) || !trip.orderIds.length) {
    throw new Error("The plan needs a vehicle and at least one order.");
  }

  const actorScope = await resolveActorScope(dispatcherUser);
  const requestedOrderIds = [
    ...new Set(
      trip.orderIds
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  if (requestedOrderIds.length !== trip.orderIds.length) {
    throw new Error("The plan contains an invalid or duplicate order selection.");
  }

  const orders = await prisma.storeOrder.findMany({
    where: {
      id: {
        in: requestedOrderIds,
      },
      ...(dispatcherUser?.role === "DISPATCHER"
        ? actorScope.where
        : {}),
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
            in: ["ALLOCATED", "PUBLISHED"],
          },
        },
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  if (orders.length !== requestedOrderIds.length) {
    throw new Error(
      "One or more selected orders are unavailable in the authenticated Dispatcher depot."
    );
  }

  const orderDepotIds = [
    ...new Set(
      orders
        .map((order) => order.outlet?.depotId)
        .filter(Boolean)
    ),
  ];

  if (orderDepotIds.length !== 1) {
    throw new Error("A published trip must contain orders from one depot only.");
  }

  if (orders.some((order) => order.status === "DEFERRED" || order.status === "CANCELLED")) {
    throw new Error("Deferred or cancelled orders cannot be published in a trip.");
  }

  if (orders.some((order) => order.deliveryAllocations.length > 0)) {
    throw new Error("One or more selected orders already have an active delivery allocation.");
  }

  const tripDepotId = orderDepotIds[0];
  const trustedDepotName = orders[0]?.outlet?.depot?.name || null;
  const organizerVehicleRow = await getOrganizerVehicleRow(trip.vehicleId);

  if (!organizerVehicleRow) {
    throw new Error("Select a vehicle from the organizer fleet before publishing the plan.");
  }

  const organizerVehicle = vehicleView(organizerVehicleRow, 0);
  if (organizerVehicle.depot !== trustedDepotName) {
    throw new Error("The selected vehicle does not belong to the delivery depot.");
  }

  const totalWeightKg = orders.reduce(
    (sum, order) => sum + Number(order.estimatedWeightKg || 0),
    0
  );
  const totalVolumeM3 = orders.reduce(
    (sum, order) => sum + Number(order.estimatedVolumeM3 || 0),
    0
  );
  const trustedOrderViews = orders.map(orderView);

  if (
    totalWeightKg > organizerVehicle.maxWeightKg ||
    totalVolumeM3 > organizerVehicle.maxVolumeM3
  ) {
    throw new Error("The selected vehicle capacity is not sufficient for this trip.");
  }

  if (trustedOrderViews.some((order) => !compatibleVehicle(order, organizerVehicle))) {
    throw new Error("The selected vehicle does not satisfy the trip temperature or access constraints.");
  }

  const driver = trip.driverUserId
    ? await prisma.user.findFirst({
        where: {
          id: Number(trip.driverUserId),
          role: "DRIVER",
          isActive: true,
          depotId: tripDepotId,
        },
        include: { depot: true },
      })
    : await prisma.user.findFirst({
        where: {
          role: "DRIVER",
          isActive: true,
          depotId: tripDepotId,
        },
        include: { depot: true },
        orderBy: { id: "asc" },
      });

  if (!driver) {
    throw new Error(
      "Assign an active Driver from the delivery depot before publishing the plan."
    );
  }

  const tripCode = `TRIP${Date.now().toString().slice(-6)}`;
  const publishEstimate = await buildOrganizerTripEstimate({
    date: orders[0]?.effectiveDispatchDate,
    depot: orders[0]?.outlet?.depot?.name,
    vehicle: organizerVehicle,
    orders: trustedOrderViews,
  });
  const publishEstimateByOrder = new Map(
    publishEstimate.stops.map((stop) => [stop.orderId, stop])
  );
  const stops = orders.map((order, index) =>
    stopFromOrder(
      order,
      index,
      tripCode,
      publishEstimateByOrder.get(order.orderCode) ?? null
    )
  );

  const driverTrip = {
    tripId: tripCode,
    tripNumber: state.trips.length + 1,
    brand: orders[0].outlet?.brand || "Waypoint",
    district: orders[0].outlet?.district || "",
    vehicleId: organizerVehicle.vehicleId,
    vehicleType: organizerVehicle.type,
    vehicleTemperature: organizerVehicle.temperature,
    fuelType: organizerVehicle.fuelType,
    kmPerL: organizerVehicle.kmPerL,
    weeklyFuelQuotaL: organizerVehicle.weeklyFuelQuotaL,
    assignedDriverUserId: driver.id,
    assignedDriverUserCode: driver.userId,
    timeLabel: timeLabelFromOrders(orders),
    dispatcherPlanStatus: "PUBLISHED",
    // The Loader module can later change this to VEHICLE_READY.
    // For the connected Hackathon demo we expose the published plan
    // to the Driver while preserving the operational state label.
    loaderStatus: "VEHICLE_READY",
    driverExecutionStatus: "NOT_STARTED",
    completedAt: null,
    publishedBy: dispatcherUser?.userId || null,
    publishedAt: new Date().toISOString(),
    organizerPlanning: {
      estimatedDistanceKm: publishEstimate.totalDistanceKm,
      estimatedDurationMinutes: publishEstimate.totalDurationMinutes,
      estimatedFuelL: publishEstimate.estimatedFuelL,
      warnings: publishEstimate.warnings,
      source: "Waypoint organizer General Data",
    },
    stops,
  };

  const previousOrderStatuses = new Map(
    orders.map((order) => [order.id, order.status])
  );
  let liveTrip = null;

  try {
    for (const order of orders) {
      await prisma.storeOrder.update({
        where: { id: order.id },
        data: { status: "CONFIRMED" },
      });
    }

    liveTrip = await synchronizeTripForDriver({
      trip: driverTrip,
      driverUser: driver,
      emit: false,
    });

    if (!liveTrip) {
      throw new Error(
        "The published plan could not be synchronized to live delivery tracking."
      );
    }

    const publishedAllocations =
      await publishStoreManagerAllocationsForTrip({
        orders,
        driverTrip,
        liveTrip,
      });

    // Keep the in-memory Driver workflow in sync only after the persisted
    // LiveTrip + StoreOrder -> LiveTripStop delivery bridge is complete.
    state.trips.push(driverTrip);

    emitMonitoringUpdate({
      reason: "dispatcher-plan-published",
      tripCode,
      notifyTripOutlets: true,
    });

    return {
      tripCode,
      driverTrip,
      publishedDeliveryCount: publishedAllocations.length,
    };
  } catch (error) {
    // If the final bridge fails, do not leave a published LiveTrip or partial
    // DeliveryAllocation set behind. LiveTrip deletion cascades through stops
    // and any allocations already created for those stops.
    if (liveTrip?.id) {
      await prisma.liveTrip.delete({
        where: { id: liveTrip.id },
      }).catch(() => null);
    }

    await Promise.all(
      orders.map((order) =>
        prisma.storeOrder.update({
          where: { id: order.id },
          data: {
            status: previousOrderStatuses.get(order.id),
          },
        })
      )
    ).catch(() => null);

    throw error;
  }
}
