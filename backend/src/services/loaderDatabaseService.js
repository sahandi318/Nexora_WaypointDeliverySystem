import prisma from "../config/database.js";

const ITEM_STATUS_EVENT = "LOADING_ITEM_STATUS";
const VERIFICATION_EVENT = "LOADER_VERIFICATION_UPDATED";
const HANDOVER_EVENT = "LOADER_HANDOVER_COMPLETED";
const LOADING_EXCEPTION_EVENT = "LOADING_EXCEPTION_RECORDED";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function tripStatus(status) {
  if (status === "VEHICLE_READY") return "READY";
  if (status === "ISSUE") return "ISSUE";
  if (status === "LOADING") return "LOADING";
  return "WAITING";
}

function eventPayload(events, type) {
  const event = events.find((item) => item.type === type);
  return event ? asObject(event.payload) : {};
}

function latestItemStatuses(events) {
  const latestByItem = new Map();
  for (const event of events) {
    if (event.type !== ITEM_STATUS_EVENT) continue;
    const payload = asObject(event.payload);
    if (payload.itemId && !latestByItem.has(Number(payload.itemId))) {
      latestByItem.set(Number(payload.itemId), Boolean(payload.loaded));
    }
  }
  return latestByItem;
}

async function findLoaderPlanTrip(tripCode, depotId) {
  const liveTrip = await prisma.liveTrip.findFirst({
    where: {
      tripCode: String(tripCode),
      ...(depotId ? { depotId } : {}),
    },
    include: {
      depot: true,
      events: { orderBy: { createdAt: "desc" } },
      loadingExceptions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!liveTrip) return null;

  const plannedTrip = await prisma.plannedTrip.findUnique({
    where: { tripCode: liveTrip.tripCode },
    include: {
      vehicle: true,
      allocations: {
        include: {
          storeOrder: {
            include: {
              outlet: true,
              items: { include: { product: true }, orderBy: { id: "asc" } },
            },
          },
        },
        orderBy: { stopSequence: "asc" },
      },
    },
  });
  if (!plannedTrip) return null;

  return { liveTrip, plannedTrip };
}

function mapTrip({ liveTrip, plannedTrip }) {
  const itemStatuses = latestItemStatuses(liveTrip.events);
  const verification = eventPayload(liveTrip.events, VERIFICATION_EVENT);
  const handover = eventPayload(liveTrip.events, HANDOVER_EVENT);
  const allItems = [];
  const stops = plannedTrip.allocations.map((allocation) => {
    const order = allocation.storeOrder;
    const items = order.items.map((item) => {
      const loaded = itemStatuses.get(item.id) || false;
      const mapped = {
        id: item.id,
        name: item.product.name,
        meta: item.product.category || item.product.productType,
        quantity: item.quantity,
        qty: item.quantity,
        unit: item.product.unitLabel,
        loaded,
        weightKg: Number(item.product.unitWeightKg) * item.quantity,
      };
      allItems.push(mapped);
      return mapped;
    });

    return {
      id: `${liveTrip.tripCode}-S${allocation.stopSequence}`,
      number: allocation.stopSequence,
      sequence: allocation.stopSequence,
      name: order.outlet.brand,
      outletCode: order.outlet.outletCode,
      window: order.outlet.windowOpenTime && order.outlet.windowCloseTime
        ? `${order.outlet.windowOpenTime} – ${order.outlet.windowCloseTime}`
        : "Window not set",
      zone: order.outlet.district,
      orderId: order.orderCode,
      items,
    };
  });
  const totalItems = allItems.length;
  const loadedItems = allItems.filter((item) => item.loaded).length;
  const loadedWeight = allItems.reduce(
    (sum, item) => sum + (item.loaded ? item.weightKg : 0),
    0
  );
  const totalWeight = plannedTrip.allocations.reduce(
    (sum, allocation) => sum + Number(allocation.storeOrder.estimatedWeightKg || 0),
    0
  );
  const openExceptions = liveTrip.loadingExceptions.filter((item) => item.status === "OPEN");
  const depotLabel = liveTrip.depot?.name || "—";

  return {
    id: liveTrip.tripCode,
    tripId: liveTrip.tripCode,
    tripCode: liveTrip.tripCode,
    tripNumber: plannedTrip.tripNumber,
    vehicle: liveTrip.vehicleCode,
    vehicleId: liveTrip.vehicleCode,
    vehicleType: liveTrip.vehicleType,
    temperature: liveTrip.temperature,
    depot: {
      key: depotLabel.toLowerCase(),
      label: depotLabel,
      dock: "",
      notice: "",
    },
    route: stops.map((stop) => stop.zone).filter(Boolean).join(" · "),
    status: tripStatus(liveTrip.status),
    loaderStatus: liveTrip.status,
    dispatcherPlanStatus: "PUBLISHED",
    driver: liveTrip.driverName,
    driverName: liveTrip.driverName,
    depart: plannedTrip.plannedDeparture || "Not set",
    plannedDeparture: plannedTrip.plannedDeparture,
    priority: null,
    progress: totalItems ? Math.round((loadedItems / totalItems) * 100) : 0,
    loadedWeight,
    loaded: `${loadedWeight.toFixed(1)} kg`,
    capacityWeight: Number(plannedTrip.vehicle.capacityWeightKg),
    capacity: `${Number(plannedTrip.vehicle.capacityWeightKg).toFixed(1)} kg`,
    totalWeight,
    orderCount: plannedTrip.allocations.length,
    stopCount: stops.length,
    stops,
    verification: {
      count: Boolean(verification.count),
      secure: Boolean(verification.secure),
      temperature: Boolean(verification.temperature),
      docs: Boolean(verification.docs),
    },
    handoverCompleted: Boolean(handover.handedOverAt),
    handover: Object.keys(handover).length ? handover : null,
    loadingSteps: [
      { key: "published", label: "Plan published", completed: true },
      { key: "loading", label: "Loading", completed: ["LOADING", "VEHICLE_READY"].includes(liveTrip.status) },
      { key: "verification", label: "Verified", completed: Object.values(verification).length === 4 && Object.values(verification).every(Boolean) },
      { key: "handover", label: "Handover", completed: Boolean(handover.handedOverAt) },
    ],
    itemsLoaded: loadedItems,
    itemsTotal: totalItems,
    issueCount: openExceptions.length,
    latestUpdate: liveTrip.latestDriverUpdate,
    createdAt: liveTrip.createdAt,
  };
}

async function getLoaderPlans(depotId) {
  const liveTrips = await prisma.liveTrip.findMany({
    where: {
      ...(depotId ? { depotId } : {}),
      status: { not: "COMPLETED" },
    },
    select: { tripCode: true },
    orderBy: [{ deliveryDate: "asc" }, { tripCode: "asc" }],
  });
  const records = await Promise.all(
    liveTrips.map((trip) => findLoaderPlanTrip(trip.tripCode, depotId))
  );
  return records.filter(Boolean).map(mapTrip);
}

export async function getLoaderDashboardFromDatabase(depotId) {
  if (!depotId) return null;
  const depot = await prisma.depot.findUnique({ where: { id: depotId } });
  if (!depot?.isActive) return null;
  const trips = await getLoaderPlans(depotId);
  return {
    depot: {
      key: depot.name.toLowerCase(),
      label: depot.name,
      dock: "",
      notice: "",
    },
    summary: {
      total: trips.length,
      inProgress: trips.filter((trip) => trip.status === "LOADING").length,
      needsAction: trips.filter((trip) => trip.status === "ISSUE").length,
      ready: trips.filter((trip) => trip.status === "READY").length,
    },
    trips: trips.map((trip) => ({
      id: trip.id,
      vehicle: trip.vehicle,
      type: trip.vehicleType,
      trip: trip.tripNumber,
      route: trip.route,
      stops: trip.stopCount,
      status: trip.status,
      priority: trip.priority,
      depart: trip.depart,
      progress: trip.progress,
      loaded: trip.loaded,
      capacity: trip.capacity,
      loaderStatus: trip.loaderStatus,
      dispatcherPlanStatus: trip.dispatcherPlanStatus,
    })),
  };
}

export async function getLoaderTripsFromDatabase(depotId) {
  if (!depotId) return null;
  return getLoaderPlans(depotId);
}

export async function getLoaderTripFromDatabase(tripCode, depotId) {
  if (!depotId) return null;
  const trip = await findLoaderPlanTrip(tripCode, depotId);
  return trip ? mapTrip(trip) : null;
}

export async function updateLoaderItemInDatabase({
  tripCode,
  depotId,
  itemId,
  loaded,
  loaderUser,
}) {
  const itemKey = Number(itemId);
  if (!Number.isInteger(itemKey) || itemKey < 1) {
    throw Object.assign(new Error("A valid loading item is required."), { status: 400 });
  }
  const record = await findLoaderPlanTrip(tripCode, depotId);
  if (!record) throw Object.assign(new Error("Trip or loading item not found."), { status: 404 });
  const itemExists = record.plannedTrip.allocations.some((allocation) =>
    allocation.storeOrder.items.some((item) => item.id === itemKey)
  );
  if (!itemExists) throw Object.assign(new Error("Loading item not found on this trip."), { status: 404 });

  await prisma.liveTripEvent.create({
    data: {
      liveTripId: record.liveTrip.id,
      type: ITEM_STATUS_EVENT,
      message: `${loaderUser.fullName} marked item ${itemKey} ${loaded ? "loaded" : "not loaded"}.`,
      payload: { itemId: itemKey, loaded, loaderUserId: loaderUser.id },
    },
  });
  if (record.liveTrip.status === "PLANNED" || record.liveTrip.status === "VEHICLE_READY") {
    await prisma.liveTrip.update({
      where: { id: record.liveTrip.id },
      data: {
        status: "LOADING",
        latestDriverUpdate: "Loader is updating the published trip.",
        latestDriverUpdateAt: new Date(),
      },
    });
  }
  const updatedTrip = await getLoaderTripFromDatabase(tripCode, depotId);
  return {
    item: updatedTrip.stops.flatMap((stop) => stop.items).find((item) => item.id === itemKey),
    progress: updatedTrip.progress,
    tripStatus: updatedTrip.status,
  };
}

export async function createLoaderIssueInDatabase({
  tripCode,
  depotId,
  itemId,
  issueType,
  expectedQty,
  usableQty,
  reason,
  note,
  loaderUser,
}) {
  const itemKey = Number(itemId);
  const expected = Number(expectedQty);
  const usable = Number(usableQty);
  if (
    !Number.isInteger(itemKey) ||
    !Number.isFinite(expected) ||
    !Number.isFinite(usable) ||
    expected < 0 ||
    usable < 0 ||
    usable > expected ||
    !String(issueType || "").trim() ||
    !String(reason || "").trim()
  ) {
    throw Object.assign(new Error("Provide a valid item, issue type, quantities, and reason."), { status: 400 });
  }
  const record = await findLoaderPlanTrip(tripCode, depotId);
  if (!record) throw Object.assign(new Error("Trip not found."), { status: 404 });
  let foundItem = null;
  let storeOrderId = null;
  for (const allocation of record.plannedTrip.allocations) {
    foundItem = allocation.storeOrder.items.find((item) => item.id === itemKey) || null;
    if (foundItem) {
      storeOrderId = allocation.storeOrder.id;
      break;
    }
  }
  if (!foundItem) throw Object.assign(new Error("Loading item not found on this trip."), { status: 404 });

  const exceptionCode = `LOAD-${record.liveTrip.id}-${Date.now().toString(36)}`;
  const issue = await prisma.loadingException.create({
    data: {
      exceptionCode,
      liveTripId: record.liveTrip.id,
      storeOrderId,
      exceptionType: String(issueType).slice(0, 60),
      itemName: foundItem.product.name,
      expectedQuantity: expected,
      availableQuantity: usable,
      loaderName: loaderUser.fullName,
      loaderNote: `${String(reason).trim()}${note ? `\n${String(note).trim()}` : ""}`,
      status: "OPEN",
    },
  });
  await prisma.liveTripEvent.create({
    data: {
      liveTripId: record.liveTrip.id,
      type: LOADING_EXCEPTION_EVENT,
      message: `Loading issue recorded for ${foundItem.product.name}.`,
      payload: { exceptionId: issue.id, itemId: itemKey, storeOrderId },
    },
  });
  await prisma.liveTrip.update({
    where: { id: record.liveTrip.id },
    data: {
      status: "ISSUE",
      latestDriverUpdate: `Loading issue recorded for ${foundItem.product.name}.`,
      latestDriverUpdateAt: new Date(),
    },
  });
  return {
    id: String(issue.id),
    tripId: record.liveTrip.tripCode,
    itemId: itemKey,
    stopId: `${record.liveTrip.tripCode}-S${record.plannedTrip.allocations.find((item) => item.storeOrderId === storeOrderId).stopSequence}`,
    stopName: record.plannedTrip.allocations.find((item) => item.storeOrderId === storeOrderId).storeOrder.outlet.brand,
    itemName: foundItem.product.name,
    issueType,
    expectedQty: expected,
    usableQty: usable,
    reason,
    note: note || null,
    loaderUserId: loaderUser.id,
    status: "PENDING",
    createdAt: issue.createdAt,
  };
}

export async function getLoaderIssuesFromDatabase({ depotId, tripCode, status } = {}) {
  if (!depotId) return [];
  const records = await prisma.loadingException.findMany({
    where: {
      liveTrip: {
        depotId,
        ...(tripCode ? { tripCode: String(tripCode) } : {}),
      },
      ...(status
        ? { status: status === "PENDING" ? "OPEN" : status }
        : {}),
    },
    include: {
      liveTrip: { include: { events: { where: { type: LOADING_EXCEPTION_EVENT } } } },
      storeOrder: { include: { outlet: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return records.map((issue) => {
    const evidence = issue.liveTrip.events.find(
      (event) => Number(asObject(event.payload).exceptionId) === issue.id
    );
    return {
      id: String(issue.id),
      exceptionCode: issue.exceptionCode,
      tripId: issue.liveTrip.tripCode,
      itemId: Number(asObject(evidence?.payload).itemId) || null,
      itemName: issue.itemName,
      stopName: issue.storeOrder?.outlet?.brand || null,
      expectedQty: issue.expectedQuantity,
      usableQty: issue.availableQuantity,
      reason: issue.loaderNote,
      note: issue.loaderNote,
      loaderUserId: null,
      status: issue.status === "OPEN" ? "PENDING" : issue.status,
      resolution: issue.resolutionNote,
      createdAt: issue.createdAt,
      resolvedAt: issue.resolvedAt,
    };
  });
}

export async function resolveLoaderIssueInDatabase({ issueId, resolution, depotId }) {
  const id = Number(issueId);
  if (!Number.isInteger(id) || id < 1 || !String(resolution || "").trim()) {
    throw Object.assign(new Error("A valid issue and resolution are required."), { status: 400 });
  }
  const existing = await prisma.loadingException.findFirst({
    where: { id, liveTrip: { depotId } },
  });
  if (!existing) throw Object.assign(new Error("Issue not found."), { status: 404 });
  const updated = await prisma.loadingException.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolutionAction: "RESOLVED_BY_LOADER",
      resolutionNote: String(resolution).trim(),
      resolvedAt: new Date(),
    },
  });
  const remaining = await prisma.loadingException.count({
    where: { liveTripId: existing.liveTripId, status: "OPEN" },
  });
  if (remaining === 0) {
    await prisma.liveTrip.update({
      where: { id: existing.liveTripId },
      data: { status: "LOADING" },
    });
  }
  return {
    id: String(updated.id),
    status: "RESOLVED",
    resolution: updated.resolutionNote,
    resolvedAt: updated.resolvedAt,
  };
}

export async function updateLoaderVerificationInDatabase({ tripCode, depotId, verification }) {
  const record = await findLoaderPlanTrip(tripCode, depotId);
  if (!record) return null;
  const previous = eventPayload(record.liveTrip.events, VERIFICATION_EVENT);
  const updated = { ...previous, ...verification };
  await prisma.liveTripEvent.create({
    data: {
      liveTripId: record.liveTrip.id,
      type: VERIFICATION_EVENT,
      message: "Loader verification checklist updated.",
      payload: updated,
    },
  });
  return {
    verification: updated,
    complete: ["count", "secure", "temperature", "docs"].every((key) => updated[key] === true),
  };
}

export async function completeLoaderHandoverInDatabase({
  tripCode,
  depotId,
  loaderUser,
  sealNumber,
}) {
  const record = await findLoaderPlanTrip(tripCode, depotId);
  if (!record) return { error: "TRIP_NOT_FOUND" };
  const previousHandover = eventPayload(record.liveTrip.events, HANDOVER_EVENT);
  if (previousHandover.handedOverAt) return previousHandover;
  if (!record.liveTrip.driverUserId || !record.liveTrip.driverName?.trim()) {
    return { error: "DRIVER_NOT_ASSIGNED" };
  }
  const cleanSealNumber = String(sealNumber || "").trim();
  if (!cleanSealNumber) return { error: "SEAL_NUMBER_REQUIRED" };

  const verification = eventPayload(record.liveTrip.events, VERIFICATION_EVENT);
  if (!["count", "secure", "temperature", "docs"].every((key) => verification[key] === true)) {
    return { error: "VERIFICATION_INCOMPLETE" };
  }
  if (record.liveTrip.loadingExceptions.some((issue) => issue.status === "OPEN")) {
    return { error: "OPEN_ISSUE" };
  }
  const itemStatuses = latestItemStatuses(record.liveTrip.events);
  const items = record.plannedTrip.allocations.flatMap((allocation) => allocation.storeOrder.items);
  if (!items.length || items.some((item) => !itemStatuses.get(item.id))) {
    return { error: "ITEMS_NOT_LOADED" };
  }

  const handedOverAt = new Date();
  const handover = {
    loaderUserId: loaderUser.id,
    driver: record.liveTrip.driverName,
    sealNumber: cleanSealNumber,
    handedOverAt: handedOverAt.toISOString(),
  };
  await prisma.$transaction([
    prisma.liveTrip.update({
      where: { id: record.liveTrip.id },
      data: {
        status: "VEHICLE_READY",
        latestDriverUpdate: `Vehicle handed over to ${record.liveTrip.driverName}.`,
        latestDriverUpdateAt: handedOverAt,
      },
    }),
    prisma.liveTripEvent.create({
      data: {
        liveTripId: record.liveTrip.id,
        type: HANDOVER_EVENT,
        message: `Loader handed ${record.liveTrip.vehicleCode} over to the Driver.`,
        payload: handover,
      },
    }),
  ]);
  return handover;
}
