import prisma from "../config/database.js";
import { resolveActorScope, DispatcherOrderError } from "../services/dispatcherOrderService.js";
import { getDispatcherDashboardData, validateDispatcherDate } from "../services/dispatcherDashboardService.js";

export async function getDashboard(req, res, next) {
  try {
    const data = await getDispatcherDashboardData(req.user, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
}

async function monitoringScope(req) {
  // Dispatcher requests always use the assignment loaded by authentication.
  let depotCode = null;
  if (req.user.role === "ADMIN" && req.query.depotId) {
    const id = Number(req.query.depotId);
    if (!Number.isInteger(id) || id <= 0) throw new DispatcherOrderError("Invalid depot.");
    const depot = await prisma.depot.findUnique({ where: { id } });
    if (!depot) throw new DispatcherOrderError("Depot not found.", { status: 404 });
    depotCode = depot.code;
  }
  return resolveActorScope(req.user, depotCode);
}

import {
  getDispatcherPlanningSnapshot,
  getDispatcherLoadingExceptions,
} from "../services/dispatcherPlanningService.js";

import {
  getDispatcherDeliveryReports,
  getLiveMonitoringSnapshot,
  saveDispatcherReceiptDecision,
  serializeTripForDispatcher,
} from "../services/liveMonitoringService.js";

export async function getDispatcherDashboard(req, res, next) {
  try {
    const depotName = String(req.query.depot || "").trim();
    const planning = await getDispatcherPlanningSnapshot({
      date: req.query.date,
      depotName: depotName && depotName !== "ALL" ? depotName : null,
    });
    const deliveryDate = new Date(`${planning.date}T00:00:00.000Z`);
    const endDate = new Date(`${planning.date}T23:59:59.999Z`);
    const depot = planning.depots.find((item) => item.name === depotName);
    const [liveTrips, loadingExceptions] = await Promise.all([
      prisma.liveTrip.findMany({
        where: {
          deliveryDate: { gte: deliveryDate, lte: endDate },
          ...(depot ? { depotId: depot.id } : {}),
        },
        include: {
          depot: true,
          stops: { orderBy: { sequence: "asc" } },
          events: { orderBy: { createdAt: "desc" }, take: 20 },
          loadingExceptions: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      getDispatcherLoadingExceptions({
        date: planning.date,
        depotName: depotName && depotName !== "ALL" ? depotName : null,
      }),
    ]);
    const trips = liveTrips.map(serializeTripForDispatcher);
    const activeTrips = liveTrips.filter((trip) => trip.status !== "COMPLETED");
    const attentionItems = [
      ...loadingExceptions.exceptions
        .filter((item) => item.status === "OPEN")
        .map((item) => ({
          id: `loading-${item.id}`,
          type: item.issueType,
          reference: item.tripId,
          description: item.reason || `${item.itemName} loading exception.`,
          time: item.createdAt,
          severity: "HIGH",
          actionLabel: "Review",
        })),
      ...liveTrips
        .filter((trip) => trip.status === "DELAYED" || trip.status === "OFFLINE")
        .map((trip) => ({
          id: `trip-${trip.id}`,
          type: trip.status === "OFFLINE" ? "Driver offline" : "Trip delayed",
          reference: trip.tripCode,
          description: trip.latestDriverUpdate || trip.status,
          time: trip.latestDriverUpdateAt || trip.updatedAt,
          severity: trip.status === "OFFLINE" ? "MEDIUM" : "HIGH",
          actionLabel: "Review",
        })),
    ];
    const activity = liveTrips
      .flatMap((trip) =>
        trip.events.map((event) => ({
          id: event.id,
          tripId: trip.tripCode,
          message: event.message,
          time: event.createdAt,
        }))
      )
      .sort((left, right) => new Date(right.time) - new Date(left.time))
      .slice(0, 8);

    return res.status(200).json({
      success: true,
      date: planning.date,
      depot: depotName || "ALL",
      planStatus: planning.deliveryPlan?.status || planning.summary.status,
      summary: {
        confirmedOrders: planning.summary.confirmedOrders,
        allocatedOrders: planning.summary.allocatedOrders,
        unallocatedOrders: planning.summary.unallocatedOrders,
        deferredOrders: planning.summary.deferredOrders,
        availableVehicles: planning.fleet.filter(
          (vehicle) => vehicle.availability === "Available"
        ).length,
        activeTrips: activeTrips.length,
      },
      readiness: {
        awaitingAllocation: planning.summary.unallocatedOrders,
        awaitingLoading: activeTrips.filter((trip) => trip.status === "PLANNED").length,
        loadingNow: activeTrips.filter((trip) => trip.status === "LOADING").length,
        readyForDeparture: activeTrips.filter((trip) => trip.status === "VEHICLE_READY").length,
        publishedTrips: activeTrips.length,
      },
      attentionItems,
      trips: trips.map((trip) => ({
        ...trip,
        vehicleId: trip.vehicleCode,
        depot: trip.depot?.name || "—",
      })),
      liveOverview: trips.map((trip) => ({
        tripId: trip.tripCode,
        vehicleId: trip.vehicleCode,
        depot: trip.depot?.name || "—",
        status: trip.status,
        progressCompleted: trip.progressCompleted,
        progressTotal: trip.progressTotal,
        nextDestination: trip.nextDestination,
      })),
      recentActivity: activity,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getLiveMonitoring(req, res, next) {
  try {
    const scope = await monitoringScope(req);
    const status = String(req.query.status || "ACTIVE").toUpperCase();
    if (!["ACTIVE", "ALL", "OFFLINE", "DELAYED"].includes(status)) {
      throw new DispatcherOrderError("Invalid monitoring status.");
    }
    const date = validateDispatcherDate(req.query.date);
    const snapshot = await getLiveMonitoringSnapshot({ depotId: scope.depotId, status, date });

    res.status(200).json({
      success: true,
      summary: snapshot.summary,
      depots: snapshot.depots,
      trips: snapshot.trips.map(serializeTripForDispatcher),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getLiveMonitoringTrip(req, res, next) {
  try {
    const scope = await monitoringScope(req);
    const snapshot = await getLiveMonitoringSnapshot({
      depotId: scope.depotId,
      tripCode: req.params.tripCode,
      status: "ALL",
    });

    const trip = snapshot.trips[0];
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Live trip not found.",
      });
    }

    return res.status(200).json({
      success: true,
      trip: serializeTripForDispatcher(trip),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getDeliveryReports(req, res, next) {
  try {
    const requestedDepotName = String(req.query.depot || "").trim();
    const ownDepotName = req.user?.depot?.name || null;
    const depotName = requestedDepotName || ownDepotName || null;

    const report = await getDispatcherDeliveryReports({ depotName });

    return res.status(200).json({
      success: true,
      ...report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function postReceiptDiscrepancyDecision(req, res, next) {
  try {
    const decision = await saveDispatcherReceiptDecision({
      tripCode: req.params.tripCode,
      stopCode: req.params.stopCode,
      action: req.body?.action,
      note: req.body?.note,
      dispatcherUser: req.user,
    });
    return res.status(201).json({
      success: true,
      message: "Delivery discrepancy decision saved.",
      decision,
    });
  } catch (error) {
    if (Number(error?.status) >= 400 && Number(error?.status) < 500) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
  }
}
