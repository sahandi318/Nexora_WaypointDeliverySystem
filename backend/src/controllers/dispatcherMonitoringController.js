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
  getDispatcherDeliveryReports,
  getLiveMonitoringSnapshot,
  serializeTripForDispatcher,
} from "../services/liveMonitoringService.js";

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
