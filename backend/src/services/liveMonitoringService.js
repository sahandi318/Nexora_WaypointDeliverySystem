import prisma from "../config/database.js";
import { state } from "../mockData.js";

let ioInstance = null;
let syncTimer = null;

const ROUTE_EVENT_TYPE = "ROUTE_SNAPSHOT";
const POD_EVENT_TYPE = "POD_SUBMITTED";
const EXCEPTION_EVENT_TYPE = "EXCEPTION_RECORDED";
const OUTCOME_EVENT_TYPE = "DELIVERY_OUTCOME";
const ARRIVAL_EVENT_TYPE = "STOP_ARRIVED";
const COMPLETION_EVENT_TYPE = "STOP_COMPLETED";

function todayUtcDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function deriveTripStatus(trip, isOnline) {
  if (trip.driverExecutionStatus === "COMPLETED") return "COMPLETED";
  if (!isOnline && trip.driverExecutionStatus === "IN_PROGRESS") return "OFFLINE";
  if (trip.driverExecutionStatus === "IN_PROGRESS") return "ON_ROUTE";
  if (trip.loaderStatus === "VEHICLE_READY") return "VEHICLE_READY";
  if (trip.dispatcherPlanStatus === "PUBLISHED") return "PLANNED";
  return "WAITING";
}

function deriveStopStatus(stop) {
  if (stop.completed) return "COMPLETED";
  if (stop.status === "arrived") return "ARRIVED";
  if (stop.status === "next") return "NEXT_STOP";
  return "PENDING";
}

function latestDriverMessage(trip) {
  const arrived = [...trip.stops].reverse().find((stop) => stop.status === "arrived");
  if (arrived) {
    return `Driver arrived at ${arrived.outletId}. Delivery outcome is pending.`;
  }

  const latestCompleted = [...trip.stops].reverse().find((stop) => stop.completed);
  const next = trip.stops.find((stop) => !stop.completed);

  if (trip.driverExecutionStatus === "COMPLETED") {
    return `Trip ${trip.tripId} completed. All stop records are available.`;
  }

  if (latestCompleted && next) {
    return `${latestCompleted.outletId} completed. Driver is continuing to ${next.outletId}.`;
  }

  if (next) {
    return `Driver is en route to ${next.outletId}.`;
  }

  return "Trip is ready for driver progress updates.";
}

function safeJsonObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function parseRoutePayload(event) {
  return event?.type === ROUTE_EVENT_TYPE ? safeJsonObject(event.payload) : null;
}

async function resolveDriverUser(userId = null) {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { depot: true },
    });

    if (user?.role === "DRIVER" && user.isActive) return user;
  }

  return prisma.user.findFirst({
    where: {
      role: "DRIVER",
      isActive: true,
    },
    include: {
      depot: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

async function resolveDepot(driverUser) {
  if (driverUser?.depot) return driverUser.depot;

  const preferredName = state.vehicle?.depot;
  if (preferredName) {
    const preferred = await prisma.depot.findFirst({
      where: {
        OR: [
          { name: preferredName },
          { code: preferredName },
        ],
        isActive: true,
      },
    });
    if (preferred) return preferred;
  }

  return prisma.depot.findFirst({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });
}

async function existingLiveTrip(tripCode) {
  return prisma.liveTrip.findUnique({
    where: { tripCode },
    include: {
      events: {
        where: { type: ROUTE_EVENT_TYPE },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

async function ensureStateEvidenceEvents(liveTripId, trip) {
  const existingEvidence = await prisma.liveTripEvent.findMany({
    where: {
      liveTripId,
      type: { in: [POD_EVENT_TYPE, EXCEPTION_EVENT_TYPE] },
    },
    select: { type: true, payload: true },
  });

  const existingKeys = new Set(
    existingEvidence.map((event) => {
      const payload = safeJsonObject(event.payload);
      return `${event.type}:${payload.stopId || ""}`;
    })
  );

  for (const stop of trip.stops) {
    if (stop.pod && !existingKeys.has(`${POD_EVENT_TYPE}:${stop.stopId}`)) {
      await prisma.liveTripEvent.create({
        data: {
          liveTripId,
          type: POD_EVENT_TYPE,
          message: `Proof of delivery available for ${stop.outletId}.`,
          payload: {
            tripId: trip.tripId,
            stopId: stop.stopId,
            outletCode: stop.outletId,
            orderId: stop.orderId || null,
            outcome: stop.outcome || null,
            expectedUnits: stop.expectedUnits ?? null,
            deliveredQuantity: stop.deliveredQuantity ?? stop.expectedUnits ?? null,
            receiverName: stop.pod.receiverName || null,
            deliveryNote: stop.pod.deliveryNote || "",
            photoName: stop.pod.photoName || null,
            recordedAt: stop.pod.recordedAt || null,
          },
        },
      });
    }

    if (stop.exception && !existingKeys.has(`${EXCEPTION_EVENT_TYPE}:${stop.stopId}`)) {
      await prisma.liveTripEvent.create({
        data: {
          liveTripId,
          type: EXCEPTION_EVENT_TYPE,
          message: `Delivery exception available for ${stop.outletId}.`,
          payload: {
            tripId: trip.tripId,
            stopId: stop.stopId,
            outletCode: stop.outletId,
            orderId: stop.orderId || null,
            outcome: stop.outcome || stop.exception.outcome || null,
            expectedUnits: stop.expectedUnits ?? null,
            deliveredQuantity: stop.exception.deliveredQuantity ?? stop.deliveredQuantity ?? null,
            ...stop.exception,
          },
        },
      });
    }
  }
}

async function upsertTripFromDriverState(trip, driverUser, depot, { preferExistingAssignment = true } = {}) {
  const existing = await existingLiveTrip(trip.tripId);
  const isOnline = existing?.isDriverOnline ?? true;
  const completedCount = trip.stops.filter((stop) => stop.completed).length;
  const next = trip.stops.find((stop) => !stop.completed) || null;
  const routePayload = parseRoutePayload(existing?.events?.[0]);
  const routeMatchesNext = Boolean(routePayload && next && routePayload.stopId === next.stopId);
  const message = latestDriverMessage(trip);
  const messageChanged = message !== existing?.latestDriverUpdate;

  const assignedDriverUserId = preferExistingAssignment && existing?.driverUserId
    ? existing.driverUserId
    : driverUser?.id || existing?.driverUserId || null;
  const assignedDriverName = preferExistingAssignment && existing?.driverUserId
    ? existing.driverName
    : driverUser?.fullName || existing?.driverName || state.user?.name || "Assigned Driver";
  const assignedDepotId = preferExistingAssignment && existing?.depotId
    ? existing.depotId
    : depot?.id || existing?.depotId || null;

  const commonData = {
    deliveryDate: todayUtcDate(),
    depotId: assignedDepotId,
    vehicleCode: trip.vehicleId || state.vehicle?.vehicleId || "UNASSIGNED",
    vehicleType: state.vehicle?.type || "Vehicle",
    temperature: state.vehicle?.temp || "Ambient",
    driverUserId: assignedDriverUserId,
    driverName: assignedDriverName,
    status: deriveTripStatus(trip, isOnline),
    progressCompleted: completedCount,
    progressTotal: trip.stops.length,
    nextDestination: next?.outletId || null,
    eta: routeMatchesNext && routePayload?.etaLabel
      ? routePayload.etaLabel
      : next?.plannedArrival || null,
    latestDriverUpdate: message,
    latestDriverUpdateAt: messageChanged
      ? new Date()
      : existing?.latestDriverUpdateAt || new Date(),
  };

  const liveTrip = await prisma.liveTrip.upsert({
    where: { tripCode: trip.tripId },
    update: commonData,
    create: {
      tripCode: trip.tripId,
      ...commonData,
      isDriverOnline: true,
      lastSynchronized: null,
      routeUpdatedAt: null,
    },
  });

  for (const stop of trip.stops) {
    const latitude = stop.destination?.latitude ?? null;
    const longitude = stop.destination?.longitude ?? null;

    await prisma.liveTripStop.upsert({
      where: { stopCode: stop.stopId },
      update: {
        liveTripId: liveTrip.id,
        sequence: stop.position,
        outletCode: stop.outletId,
        outletName: stop.outletId,
        district: stop.district || trip.district || null,
        latitude,
        longitude,
        plannedEta: stop.plannedArrival || null,
        actualArrival: stop.arrivalTime || null,
        status: deriveStopStatus(stop),
        outcome: stop.outcome || null,
      },
      create: {
        stopCode: stop.stopId,
        liveTripId: liveTrip.id,
        sequence: stop.position,
        outletCode: stop.outletId,
        outletName: stop.outletId,
        district: stop.district || trip.district || null,
        latitude,
        longitude,
        plannedEta: stop.plannedArrival || null,
        actualArrival: stop.arrivalTime || null,
        status: deriveStopStatus(stop),
        outcome: stop.outcome || null,
      },
    });
  }

  await ensureStateEvidenceEvents(liveTrip.id, trip);

  return liveTrip;
}

async function ensureAdditionalDemoTrips(depot) {
  if (!depot) return;

  const demo = [
    { code: "TRP002", vehicle: "VEH002", driver: "Kasun Silva", status: "ON_ROUTE", done: 3, total: 6, next: "OUT024", eta: "11:15 AM" },
    { code: "TRP003", vehicle: "VEH003", driver: "Tharindu Jayasekara", status: "DELAYED", done: 1, total: 5, next: "OUT031", eta: "11:40 AM" },
    { code: "TRP004", vehicle: "VEH004", driver: "Amal Fernando", status: "ON_ROUTE", done: 4, total: 7, next: "OUT042", eta: "12:05 PM" },
    { code: "TRP005", vehicle: "VEH005", driver: "Ravindu Dias", status: "OFFLINE", done: 0, total: 3, next: "OUT051", eta: "12:20 PM" },
  ];

  for (const item of demo) {
    const existing = await prisma.liveTrip.findUnique({ where: { tripCode: item.code } });
    const lastSynchronized = existing?.lastSynchronized
      || (item.status === "OFFLINE" ? new Date(Date.now() - 12 * 60 * 1000) : new Date());

    await prisma.liveTrip.upsert({
      where: { tripCode: item.code },
      update: {
        deliveryDate: todayUtcDate(),
        depotId: depot.id,
        vehicleCode: item.vehicle,
        vehicleType: item.code === "TRP003" ? "Dry-box Truck" : "Truck",
        temperature: item.code === "TRP002" ? "Chilled (2°C - 8°C)" : "Ambient",
        driverName: item.driver,
        status: item.status,
        progressCompleted: item.done,
        progressTotal: item.total,
        nextDestination: item.next,
        eta: item.eta,
        isDriverOnline: item.status !== "OFFLINE",
        lastSynchronized,
        latestDriverUpdate: item.status === "OFFLINE"
          ? "Driver device is offline. Showing the last synchronized progress."
          : `Driver is continuing to ${item.next}.`,
        latestDriverUpdateAt: existing?.latestDriverUpdateAt || new Date(),
      },
      create: {
        tripCode: item.code,
        deliveryDate: todayUtcDate(),
        depotId: depot.id,
        vehicleCode: item.vehicle,
        vehicleType: item.code === "TRP003" ? "Dry-box Truck" : "Truck",
        temperature: item.code === "TRP002" ? "Chilled (2°C - 8°C)" : "Ambient",
        driverName: item.driver,
        status: item.status,
        progressCompleted: item.done,
        progressTotal: item.total,
        nextDestination: item.next,
        eta: item.eta,
        isDriverOnline: item.status !== "OFFLINE",
        lastSynchronized,
        latestDriverUpdate: item.status === "OFFLINE"
          ? "Driver device is offline. Showing the last synchronized progress."
          : `Driver is continuing to ${item.next}.`,
        latestDriverUpdateAt: new Date(),
      },
    });
  }
}

export function setMonitoringIo(io) {
  ioInstance = io;
}

export function emitMonitoringUpdate(payload = {}) {
  ioInstance?.to("dispatchers").emit("monitoring:update", {
    at: new Date().toISOString(),
    ...payload,
  });
}

export async function initializeLiveMonitoring() {
  const driver = await resolveDriverUser();
  const depot = await resolveDepot(driver);

  for (const trip of state.trips || []) {
    await upsertTripFromDriverState(trip, driver, depot);
  }

  await ensureAdditionalDemoTrips(depot);
}

export async function synchronizeDriverState() {
  const driver = await resolveDriverUser();
  const depot = await resolveDepot(driver);

  for (const trip of state.trips || []) {
    await upsertTripFromDriverState(trip, driver, depot);
  }

  emitMonitoringUpdate({ reason: "driver-state-sync" });
}

export async function synchronizeTripForDriver({ trip, driverUser, emit = true }) {
  if (!trip) return null;
  const resolvedDriver = driverUser?.id
    ? await resolveDriverUser(driverUser.id)
    : await resolveDriverUser();
  const depot = await resolveDepot(resolvedDriver || driverUser);
  const liveTrip = await upsertTripFromDriverState(
    trip,
    resolvedDriver || driverUser,
    depot,
    { preferExistingAssignment: false }
  );

  if (emit) {
    emitMonitoringUpdate({ reason: "driver-trip-sync", tripCode: trip.tripId });
  }

  return liveTrip;
}

export function startMonitoringSyncLoop() {
  if (syncTimer) return;
  syncTimer = setInterval(() => {
    synchronizeDriverState().catch((error) => {
      console.error("Live monitoring synchronization failed:", error);
    });
  }, 5000);
  syncTimer.unref?.();
}

export function stopMonitoringSyncLoop() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

export async function updateDriverPresence({
  userId,
  online,
  latitude = null,
  longitude = null,
  message = null,
}) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user || user.role !== "DRIVER") return;

  const trips = await prisma.liveTrip.findMany({
    where: {
      driverUserId: user.id,
      status: { not: "COMPLETED" },
    },
  });

  const validLat = Number.isFinite(Number(latitude)) ? Number(latitude) : null;
  const validLng = Number.isFinite(Number(longitude)) ? Number(longitude) : null;
  const now = new Date();

  for (const trip of trips) {
    await prisma.liveTrip.update({
      where: { id: trip.id },
      data: {
        isDriverOnline: Boolean(online),
        status: online
          ? (trip.status === "OFFLINE" ? "ON_ROUTE" : trip.status)
          : "OFFLINE",
        currentLat: validLat ?? trip.currentLat,
        currentLng: validLng ?? trip.currentLng,
        lastSynchronized: online ? now : trip.lastSynchronized,
        latestDriverUpdate: message || trip.latestDriverUpdate || (online
          ? "Driver is online. Live tracking is available."
          : "Driver appears to be offline. Showing last synchronized progress."),
        latestDriverUpdateAt: message
          ? now
          : trip.latestDriverUpdateAt || now,
      },
    });
  }

  emitMonitoringUpdate({ reason: online ? "driver-online" : "driver-offline" });
}

export async function recordDriverRouteSnapshot({
  trip,
  stop,
  driverUser,
  routePoints = [],
  currentLat = null,
  currentLng = null,
  distanceKm = null,
  durationMinutes = null,
  etaLabel = null,
  recordedAt = null,
}) {
  const liveTrip = await synchronizeTripForDriver({ trip, driverUser, emit: false });
  if (!liveTrip) return null;

  const normalizedPoints = Array.isArray(routePoints)
    ? routePoints
        .slice(0, 1800)
        .map((point) => [Number(point?.[0]), Number(point?.[1])])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
    : [];

  const lat = currentLat == null ? Number.NaN : Number(currentLat);
  const lng = currentLng == null ? Number.NaN : Number(currentLng);
  const now = recordedAt ? new Date(recordedAt) : new Date();
  const safeNow = Number.isNaN(now.getTime()) ? new Date() : now;

  await prisma.liveTripEvent.deleteMany({
    where: {
      liveTripId: liveTrip.id,
      type: ROUTE_EVENT_TYPE,
    },
  });

  await prisma.liveTripEvent.create({
    data: {
      liveTripId: liveTrip.id,
      type: ROUTE_EVENT_TYPE,
      message: `Live road route to ${stop.outletId} updated.`,
      payload: {
        tripId: trip.tripId,
        stopId: stop.stopId,
        outletCode: stop.outletId,
        routePoints: normalizedPoints,
        currentLat: Number.isFinite(lat) ? lat : null,
        currentLng: Number.isFinite(lng) ? lng : null,
        destinationLat: stop.destination?.latitude ?? null,
        destinationLng: stop.destination?.longitude ?? null,
        distanceKm: Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : null,
        durationMinutes: Number.isFinite(Number(durationMinutes)) ? Number(durationMinutes) : null,
        etaLabel: etaLabel || stop.plannedArrival || null,
        recordedAt: safeNow.toISOString(),
      },
    },
  });

  await prisma.liveTrip.update({
    where: { id: liveTrip.id },
    data: {
      driverUserId: driverUser?.id || liveTrip.driverUserId,
      driverName: driverUser?.fullName || liveTrip.driverName,
      isDriverOnline: true,
      status: trip.driverExecutionStatus === "COMPLETED" ? "COMPLETED" : "ON_ROUTE",
      currentLat: Number.isFinite(lat) ? lat : liveTrip.currentLat,
      currentLng: Number.isFinite(lng) ? lng : liveTrip.currentLng,
      nextDestination: stop.outletId,
      eta: etaLabel || stop.plannedArrival || liveTrip.eta,
      lastSynchronized: safeNow,
      latestDriverUpdate: `Driver is en route to ${stop.outletId}. Live road route updated.`,
      latestDriverUpdateAt: safeNow,
      routeUpdatedAt: safeNow,
    },
  });

  emitMonitoringUpdate({
    reason: "driver-route-update",
    tripCode: trip.tripId,
    stopCode: stop.stopId,
  });

  return { ok: true, updatedAt: safeNow.toISOString() };
}

export async function recordDriverWorkflowEvent({
  trip,
  stop,
  driverUser,
  type,
  message,
  payload = {},
}) {
  const liveTrip = await synchronizeTripForDriver({ trip, driverUser, emit: false });
  if (!liveTrip) return null;

  const now = new Date();

  await prisma.liveTripEvent.create({
    data: {
      liveTripId: liveTrip.id,
      type,
      message,
      payload: {
        tripId: trip.tripId,
        stopId: stop?.stopId || null,
        outletCode: stop?.outletId || null,
        orderId: stop?.orderId || null,
        outcome: stop?.outcome || null,
        expectedUnits: stop?.expectedUnits ?? null,
        deliveredQuantity: stop?.deliveredQuantity ?? null,
        ...payload,
      },
    },
  });

  await prisma.liveTrip.update({
    where: { id: liveTrip.id },
    data: {
      isDriverOnline: true,
      lastSynchronized: now,
      latestDriverUpdate: message,
      latestDriverUpdateAt: now,
      status: deriveTripStatus(trip, true),
      progressCompleted: trip.stops.filter((item) => item.completed).length,
      progressTotal: trip.stops.length,
      nextDestination: trip.stops.find((item) => !item.completed)?.outletId || null,
    },
  });

  emitMonitoringUpdate({
    reason: type.toLowerCase(),
    tripCode: trip.tripId,
    stopCode: stop?.stopId || null,
  });

  return { ok: true, recordedAt: now.toISOString() };
}

export async function getLiveMonitoringSnapshot({
  depotId,
  status = "ACTIVE",
  tripCode = null,
  date = null,
} = {}) {
  const where = {};

  if (depotId) where.depotId = Number(depotId);
  if (tripCode) where.tripCode = tripCode;
  if (date) where.deliveryDate = new Date(`${date}T00:00:00.000Z`);
  if (status === "ACTIVE") where.status = { not: "COMPLETED" };
  if (status === "OFFLINE") where.status = "OFFLINE";
  if (status === "DELAYED") where.status = "DELAYED";

  const trips = await prisma.liveTrip.findMany({
    where,
    include: {
      depot: true,
      stops: {
        orderBy: { sequence: "asc" },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 60,
      },
    },
    orderBy: [
      { status: "asc" },
      { tripCode: "asc" },
    ],
  });

  const summaryTrips = await prisma.liveTrip.findMany({
    where: {
      ...(depotId ? { depotId: Number(depotId) } : {}),
      ...(date ? { deliveryDate: new Date(`${date}T00:00:00.000Z`) } : {}),
      status: { not: "COMPLETED" },
    },
    select: {
      status: true,
      isDriverOnline: true,
    },
  });

  const depots = await prisma.depot.findMany({
    where: { isActive: true, ...(depotId ? { id: Number(depotId) } : {}) },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  const summary = {
    activeTrips: summaryTrips.length,
    onSchedule: summaryTrips.filter((trip) => ["ON_ROUTE", "PLANNED", "VEHICLE_READY"].includes(trip.status)).length,
    delayed: summaryTrips.filter((trip) => trip.status === "DELAYED").length,
    offlineDevices: summaryTrips.filter((trip) => trip.status === "OFFLINE" || !trip.isDriverOnline).length,
  };

  return { summary, depots, trips };
}

function getLatestEvent(events, type) {
  return (events || []).find((event) => event.type === type) || null;
}

function reportStatus(trip, stops, podCount) {
  const partial = stops.filter((stop) => stop.outcome === "PARTIAL_DELIVERY").length;
  const unable = stops.filter((stop) => stop.outcome === "UNABLE_TO_DELIVER").length;

  if (unable > 0) return "Issue to Review";
  if (partial > 0) return "Partially Delivered";
  if (trip.status === "COMPLETED") return "All Delivered";
  if (podCount > 0) return "Receipt Pending";
  return trip.status === "OFFLINE" ? "Receipt Pending" : "In Progress";
}

export async function getDispatcherDeliveryReports({ depotName = null } = {}) {
  const allTrips = await prisma.liveTrip.findMany({
    include: {
      depot: true,
      stops: { orderBy: { sequence: "asc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const assignedTrips = allTrips.filter((trip) => trip.driverUserId != null);
  const trips = depotName
    ? assignedTrips.filter((trip) => trip.depot?.name === depotName)
    : assignedTrips;

  const records = trips
    .map((trip) => {
      const podEvents = trip.events.filter((event) => event.type === POD_EVENT_TYPE);
      const completionEvent = getLatestEvent(trip.events, COMPLETION_EVENT_TYPE);
      const latestPodEvent = podEvents[0] || null;

      const stops = trip.stops.map((stop) => {
        const podEvent = podEvents.find((event) => safeJsonObject(event.payload).stopId === stop.stopCode) || null;
        const exceptionEvent = trip.events.find(
          (event) => event.type === EXCEPTION_EVENT_TYPE && safeJsonObject(event.payload).stopId === stop.stopCode
        ) || null;
        const pod = podEvent ? { ...safeJsonObject(podEvent.payload), createdAt: podEvent.createdAt } : null;
        const exception = exceptionEvent ? { ...safeJsonObject(exceptionEvent.payload), createdAt: exceptionEvent.createdAt } : null;

        return {
          stopCode: stop.stopCode,
          sequence: stop.sequence,
          outletCode: stop.outletCode,
          outletName: stop.outletName,
          plannedEta: stop.plannedEta,
          actualArrival: stop.actualArrival,
          status: stop.status,
          outcome: stop.outcome,
          pod,
          exception,
        };
      });

      const proofRecords = stops.filter((stop) => stop.pod).length;
      const deliveredOrders = stops.filter((stop) => ["DELIVERED_FULL", "PARTIAL_DELIVERY"].includes(stop.outcome)).length;
      const partialFailed = stops.filter((stop) => ["PARTIAL_DELIVERY", "UNABLE_TO_DELIVER"].includes(stop.outcome)).length;
      const status = reportStatus(trip, stops, proofRecords);

      return {
        id: trip.id,
        tripCode: trip.tripCode,
        deliveryDate: trip.deliveryDate,
        vehicleCode: trip.vehicleCode,
        vehicleType: trip.vehicleType,
        driverName: trip.driverName,
        depot: trip.depot?.name || null,
        tripStatus: trip.status,
        status,
        totalStops: trip.progressTotal || stops.length,
        completedStops: trip.progressCompleted,
        deliveredOrders,
        partialFailed,
        proofRecords,
        confirmation: `${proofRecords}/${trip.progressTotal || stops.length} POD`,
        completionTime: trip.status === "COMPLETED"
          ? completionEvent?.createdAt || trip.updatedAt
          : null,
        lastActivityAt: trip.latestDriverUpdateAt || trip.updatedAt,
        lastSynchronized: trip.lastSynchronized,
        stops,
        latestPod: latestPodEvent
          ? { ...safeJsonObject(latestPodEvent.payload), createdAt: latestPodEvent.createdAt }
          : null,
      };
    })
    .filter((trip) => trip.proofRecords > 0 || trip.completedStops > 0 || trip.tripStatus === "COMPLETED");

  const summary = {
    completedTrips: records.filter((trip) => trip.tripStatus === "COMPLETED").length,
    deliveredOrders: records.reduce((sum, trip) => sum + trip.deliveredOrders, 0),
    partialFailedDeliveries: records.reduce((sum, trip) => sum + trip.partialFailed, 0),
    proofRecords: records.reduce((sum, trip) => sum + trip.proofRecords, 0),
  };

  return { summary, trips: records };
}

export function serializeTripForDispatcher(trip) {
  const routeEvent = (trip.events || []).find((event) => event.type === ROUTE_EVENT_TYPE) || null;
  const routePayload = parseRoutePayload(routeEvent) || {};

  return {
    id: trip.id,
    tripCode: trip.tripCode,
    deliveryDate: trip.deliveryDate,
    depot: trip.depot ? { id: trip.depot.id, code: trip.depot.code, name: trip.depot.name } : null,
    vehicleCode: trip.vehicleCode,
    vehicleType: trip.vehicleType,
    temperature: trip.temperature,
    driverName: trip.driverName,
    status: trip.status,
    progressCompleted: trip.progressCompleted,
    progressTotal: trip.progressTotal,
    nextDestination: trip.nextDestination,
    eta: trip.eta,
    isDriverOnline: trip.isDriverOnline,
    lastSynchronized: trip.lastSynchronized,
    currentLat: trip.currentLat,
    currentLng: trip.currentLng,
    latestDriverUpdate: trip.latestDriverUpdate,
    latestDriverUpdateAt: trip.latestDriverUpdateAt,
    routeUpdatedAt: trip.routeUpdatedAt,
    routePoints: Array.isArray(routePayload.routePoints) ? routePayload.routePoints : [],
    routeStopId: routePayload.stopId || null,
    routeDistanceKm: routePayload.distanceKm ?? null,
    routeDurationMinutes: routePayload.durationMinutes ?? null,
    stops: (trip.stops || []).map((stop) => ({
      id: stop.id,
      stopCode: stop.stopCode,
      sequence: stop.sequence,
      outletCode: stop.outletCode,
      outletName: stop.outletName,
      district: stop.district,
      latitude: stop.latitude,
      longitude: stop.longitude,
      plannedEta: stop.plannedEta,
      actualArrival: stop.actualArrival,
      status: stop.status,
      outcome: stop.outcome,
    })),
    events: (trip.events || [])
      .filter((event) => event.type !== ROUTE_EVENT_TYPE)
      .slice(0, 12)
      .map((event) => ({
        id: event.id,
        type: event.type,
        message: event.message,
        createdAt: event.createdAt,
      })),
  };
}

export const LIVE_MONITORING_EVENT_TYPES = {
  ROUTE_EVENT_TYPE,
  POD_EVENT_TYPE,
  EXCEPTION_EVENT_TYPE,
  OUTCOME_EVENT_TYPE,
  ARRIVAL_EVENT_TYPE,
  COMPLETION_EVENT_TYPE,
};
