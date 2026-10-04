import {
  deferStoreOrder,
  getDispatcherPlanningSnapshot,
  publishDispatcherPlan,
} from "../services/dispatcherPlanningService.js";

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
      }, req.user);

    return res.status(200).json({
      success: true,
      ...snapshot,
    });
  } catch (error) {
    return next(error);
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
    return next(error);
  }
}

export async function publishPlanningTrip(req, res, next) {
  try {
    const result = await publishDispatcherPlan({
      trip: req.body?.trip,
      dispatcherUser: req.user,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery plan published to the Driver workflow.",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
}
