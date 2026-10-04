import {
  deferStoreOrder,
  getDispatcherLoadingExceptions,
  getDispatcherLoadingSnapshot,
  getDispatcherCapacitySnapshot,
  getDispatcherPlanningSnapshot,
  publishDispatcherPlan,
  resolveDispatcherLoadingException,
  saveDispatcherDraft,
} from "../services/dispatcherPlanningService.js";

function respondWithError(res, error) {
  const status = Number(error?.status) || 500;
  if (status >= 500) {
    console.error("Dispatcher planning request failed:", error);
  }
  return res.status(status).json({
    success: false,
    message: status < 500
      ? error.message
      : "The Dispatcher request could not be completed.",
  });
}

export async function getPlanningSnapshot(req, res, next) {
  try {
    const requestedDepot = String(
      req.query.depot || ""
    ).trim();

    const snapshot =
      await getDispatcherPlanningSnapshot({
        date: req.query.date,

        depotName:
          requestedDepot &&
          requestedDepot !== "ALL"
            ? requestedDepot
            : null,
        orderId: req.query.orderId,
      });

    return res.status(200).json({
      success: true,
      ...snapshot,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function savePlanningDraft(req, res) {
  try {
    const plan = await saveDispatcherDraft({
      date: req.body?.date,
      depot: req.body?.depot,
      depotId: req.body?.depotId,
      trips: req.body?.trips,
      dispatcherUser: req.user,
    });
    return res.status(200).json({
      success: true,
      message: "Delivery plan draft saved.",
      deliveryPlan: plan,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function deferPlanningOrder(req, res, next) {
  try {
    const updated = await deferStoreOrder({
      orderId: req.body?.orderId,
      reason: req.body?.reason,
    });

    return res.status(200).json({
      success: true,
      message: "Order deferred with a recorded reason.",
      orderId: updated.id,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function publishPlanningTrip(req, res, next) {
  try {
    const result = await publishDispatcherPlan({
      date: req.body?.date,
      depot: req.body?.depot,
      dispatcherUser: req.user,
    });

    return res.status(201).json({
      success: true,
      message: "Saved delivery plan published to the Loader and Driver workflows.",
      ...result,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getLoadingOverview(req, res) {
  try {
    const data = await getDispatcherLoadingSnapshot({
      date: req.query.date,
      depotName: req.query.depot,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getLoadingExceptions(req, res) {
  try {
    const data = await getDispatcherLoadingExceptions({
      date: req.query.date,
      depotName: req.query.depot,
    });
    const summary = {
      ...data.summary,
      openExceptions: data.summary.open,
      missingItems: data.exceptions.filter((item) =>
        item.issueType.toLowerCase().includes("missing")
      ).length,
      damagedItems: data.exceptions.filter((item) =>
        item.issueType.toLowerCase().includes("damage")
      ).length,
      resolvedTrips: new Set(
        data.exceptions
          .filter((item) => item.status === "RESOLVED")
          .map((item) => item.tripId)
      ).size,
    };
    return res.status(200).json({
      success: true,
      data: { ...data, summary },
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getCapacitySnapshot(req, res) {
  try {
    const data = await getDispatcherCapacitySnapshot({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      depotName: req.query.depot,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function decideLoadingException(req, res) {
  try {
    const exception = await resolveDispatcherLoadingException({
      id: req.params.id,
      action: req.body?.action,
      note: req.body?.note || req.body?.action,
    });
    return res.status(200).json({
      success: true,
      message: "Loading exception decision saved.",
      exception,
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}
