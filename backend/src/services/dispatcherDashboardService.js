import prisma from "../config/database.js";
import { resolveActorScope, DispatcherOrderError } from "./dispatcherOrderService.js";
import { getLiveMonitoringSnapshot, serializeTripForDispatcher } from "./liveMonitoringService.js";

export function validateDispatcherDate(value) {
  if (!value) return null;
  const date = String(value);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new DispatcherOrderError("Date must be a valid YYYY-MM-DD date.");
  }
  return date;
}

export async function getDispatcherDashboardData(actor, query = {}) {
  const scope = await resolveActorScope(actor, query.depotCode);
  const date = validateDispatcherDate(query.date);
  const where = {
    ...scope.where,
    ...(date ? { effectiveDispatchDate: new Date(`${date}T00:00:00.000Z`) } : {}),
  };
  const [orders, snapshot] = await Promise.all([
    prisma.storeOrder.findMany({
      where,
      select: {
        id: true, orderCode: true, status: true,
        deliveryAllocations: {
          where: { status: { in: ["ALLOCATED", "PUBLISHED"] } },
          select: { status: true, liveTripStop: { select: { liveTripId: true } } },
        },
      },
    }),
    getLiveMonitoringSnapshot({ depotId: scope.depotId, date, status: "ALL" }),
  ]);
  const confirmed = orders.filter((order) => order.status === "CONFIRMED");
  const allocated = confirmed.filter((order) => order.deliveryAllocations.length > 0);
  const unallocated = confirmed.length - allocated.length;
  const trips = snapshot.trips.map(serializeTripForDispatcher);
  const publishedTripIds = new Set(orders.flatMap((order) => order.deliveryAllocations
    .filter((allocation) => allocation.status === "PUBLISHED")
    .map((allocation) => allocation.liveTripStop.liveTripId)));
  const publishedStatuses = ["PLANNED", "VEHICLE_READY", "ON_ROUTE", "DELAYED", "OFFLINE", "COMPLETED"];
  const attentionItems = trips.filter((trip) => trip.status === "DELAYED" || trip.status === "OFFLINE" || !trip.isDriverOnline)
    .map((trip) => ({
      id: `trip-${trip.id}`, reference: trip.tripCode,
      type: trip.status === "DELAYED" ? "Delayed trip" : "Offline driver",
      description: trip.latestDriverUpdate || "Review the latest synchronized trip state.",
      time: trip.lastSynchronized, severity: "Medium", actionLabel: "Review",
    }));
  return {
    scope, depots: snapshot.depots,
    summary: {
      confirmedOrders: confirmed.length, allocatedOrders: allocated.length,
      unallocatedOrders: unallocated,
      deferredOrders: orders.filter((order) => order.status === "DEFERRED").length,
    },
    readiness: {
      awaitingAllocation: unallocated,
      awaitingLoading: trips.filter((trip) => trip.status === "PLANNED").length,
      loadingNow: null,
      readyForDeparture: trips.filter((trip) => trip.status === "VEHICLE_READY").length,
      publishedTrips: trips.filter((trip) => publishedTripIds.has(trip.id) || publishedStatuses.includes(trip.status)).length,
    },
    syncMessage: "Loading-in-progress telemetry is not available from the current trip service.",
    attentionItems,
    trips: trips.map((trip) => ({ ...trip, tripId: trip.tripCode, vehicleId: trip.vehicleCode, depot: trip.depot?.name })),
    liveOverview: trips.map((trip) => ({
      id: trip.id, reference: trip.tripCode, location: trip.nextDestination || trip.tripCode,
      status: trip.status.replaceAll("_", " "), progress: `${trip.progressCompleted} / ${trip.progressTotal}`,
    })),
    recentActivity: trips.flatMap((trip) => trip.events.map((event) => ({
      id: event.id, description: event.message, time: event.createdAt,
    }))).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10),
    generatedAt: new Date().toISOString(),
  };
}
