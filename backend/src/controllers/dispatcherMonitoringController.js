import {
  getDispatcherDeliveryReports,
  getLiveMonitoringSnapshot,
  serializeTripForDispatcher,
} from "../services/liveMonitoringService.js";

export async function getLiveMonitoring(req, res, next) {
  try {
    const requestedDepotId = req.query.depotId;
    const ownDepotId = req.user?.depot?.id || req.user?.depotId || null;
    const depotId = requestedDepotId || ownDepotId || undefined;
    const status = String(req.query.status || "ACTIVE").toUpperCase();

    const snapshot = await getLiveMonitoringSnapshot({ depotId, status });

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
    const snapshot = await getLiveMonitoringSnapshot({
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
