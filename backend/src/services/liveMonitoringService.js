import prisma from "../config/database.js";
import { state } from "../mockData.js";

let ioInstance = null;
let syncTimer = null;

function todayUtcDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function asTimeLabel(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
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

async function resolveDriverUser() {
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

async function currentPresence(tripCode) {
  const record = await prisma.liveTrip.findUnique({
    where: { tripCode },
    select: {
      isDriverOnline: true,
      currentLat: true,
      currentLng: true,
      lastSynchronized: true,
    },
  });

  return record || {
    isDriverOnline: true,
    currentLat: null,
    currentLng: null,
    lastSynchronized: null,
  };
}

async function upsertTripFromDriverState(trip, driverUser, depot) {
  const presence = await currentPresence(trip.tripId);
  const isOnline = presence.isDriverOnline ?? true;
  const completedCount = trip.stops.filter((stop) => stop.completed).length;
  const next = trip.stops.find((stop) => !stop.completed) || null;

  const liveTrip = await prisma.liveTrip.upsert({
    where: { tripCode: trip.tripId },
    update: {
      deliveryDate: todayUtcDate(),
      depotId: depot?.id || null,
      vehicleCode: trip.vehicleId || state.vehicle?.vehicleId || "UNASSIGNED",
      vehicleType: state.vehicle?.type || "Vehicle",
      temperature: state.vehicle?.temp || "Ambient",
      driverUserId: driverUser?.id || null,
      driverName: driverUser?.fullName || state.user?.name || "Assigned Driver",
      status: deriveTripStatus(trip, isOnline),
      progressCompleted: completedCount,
      progressTotal: trip.stops.length,
      nextDestination: next?.outletId || null,
      eta: next?.plannedArrival || null,
      lastSynchronized: isOnline ? new Date() : presence.lastSynchronized,
      latestDriverUpdate: latestDriverMessage(trip),
      latestDriverUpdateAt: new Date(),
      routeUpdatedAt: new Date(),
    },
    create: {
      tripCode: trip.tripId,
      deliveryDate: todayUtcDate(),
      depotId: depot?.id || null,
      vehicleCode: trip.vehicleId || state.vehicle?.vehicleId || "UNASSIGNED",
      vehicleType: state.vehicle?.type || "Vehicle",
      temperature: state.vehicle?.temp || "Ambient",
      driverUserId: driverUser?.id || null,
      driverName: driverUser?.fullName || state.user?.name || "Assigned Driver",
      status: deriveTripStatus(trip, true),
      progressCompleted: completedCount,
      progressTotal: trip.stops.length,
      nextDestination: next?.outletId || null,
      eta: next?.plannedArrival || null,
      lastSynchronized: new Date(),
      isDriverOnline: true,
      latestDriverUpdate: latestDriverMessage(trip),
      latestDriverUpdateAt: new Date(),
      routeUpdatedAt: new Date(),
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
        lastSynchronized: item.status === "OFFLINE" ? new Date(Date.now() - 12 * 60 * 1000) : new Date(),
        latestDriverUpdate: item.status === "OFFLINE"
          ? "Driver device is offline. Showing the last synchronized progress."
          : `Driver is continuing to ${item.next}.`,
        latestDriverUpdateAt: new Date(),
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
        lastSynchronized: item.status === "OFFLINE" ? new Date(Date.now() - 12 * 60 * 1000) : new Date(),
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

export function startMonitoringSyncLoop() {
  if (syncTimer) return;
  syncTimer = setInterval(() => {
    synchronizeDriverState().catch((error) => {
      console.error("Live monitoring synchronization failed:", error);
    });
  }, 3000);
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

  for (const trip of trips) {
    await prisma.liveTrip.update({
      where: { id: trip.id },
      data: {
        isDriverOnline: Boolean(online),
        status: online
          ? (trip.status === "OFFLINE" ? "ON_ROUTE" : trip.status)
          : "OFFLINE",
        currentLat: Number.isFinite(Number(latitude)) ? Number(latitude) : trip.currentLat,
        currentLng: Number.isFinite(Number(longitude)) ? Number(longitude) : trip.currentLng,
        lastSynchronized: online ? new Date() : trip.lastSynchronized,
        latestDriverUpdate: message || (online
          ? "Driver connection restored. Live tracking resumed."
          : "Driver appears to be offline. Showing last synchronized progress."),
        latestDriverUpdateAt: new Date(),
      },
    });
  }

  emitMonitoringUpdate({ reason: online ? "driver-online" : "driver-offline" });
}

export async function getLiveMonitoringSnapshot({
  depotId,
  status = "ACTIVE",
  tripCode = null,
} = {}) {
  const where = {};

  if (depotId) where.depotId = Number(depotId);
  if (tripCode) where.tripCode = tripCode;
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
        take: 8,
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
      status: { not: "COMPLETED" },
    },
    select: {
      status: true,
      isDriverOnline: true,
    },
  });

  const depots = await prisma.depot.findMany({
    where: { isActive: true },
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

export function serializeTripForDispatcher(trip) {
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
    events: (trip.events || []).map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      createdAt: event.createdAt,
    })),
  };
}
