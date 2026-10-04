import {
  DispatcherPlanningError,
  allocateDispatcherOrderToDraftTrip,
  getDispatcherPlanningWorkspace,
  publishDispatcherPlanningTrip,
} from "../services/dispatcherPlanningService.js";

import {
  DispatcherOrderError,
} from "../services/dispatcherOrderService.js";

import {
  DeliveryIntegrationError,
} from "../services/deliveryIntegrationService.js";

function handlePlanningError(res, error, fallbackMessage) {
  if (
    error instanceof DispatcherPlanningError ||
    error instanceof DispatcherOrderError ||
    error instanceof DeliveryIntegrationError
  ) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  console.error(
    "Dispatcher planning request failed:",
    error?.message || error
  );

  return res.status(500).json({
    success: false,
    code: "DISPATCHER_PLANNING_INTERNAL_ERROR",
    message: fallbackMessage,
  });
}

export async function getPlanningWorkspace(req, res) {
  try {
    const data = await getDispatcherPlanningWorkspace(
      req.user,
      req.query
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handlePlanningError(
      res,
      error,
      "Unable to load Dispatcher planning data."
    );
  }
}

export async function postCreateDraftAllocation(req, res) {
  try {
    const data = await allocateDispatcherOrderToDraftTrip(
      req.user,
      req.params.orderCode,
      req.body
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handlePlanningError(
      res,
      error,
      "Unable to allocate the confirmed order."
    );
  }
}

export async function postPublishPlanningTrip(req, res) {
  try {
    const data = await publishDispatcherPlanningTrip(
      req.user,
      req.params.tripCode,
      req.body
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handlePlanningError(
      res,
      error,
      "Unable to publish the delivery plan."
    );
  }
}
