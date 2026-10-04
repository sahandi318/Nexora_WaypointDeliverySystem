import {
  StoreManagerDeliveryError,
  confirmStoreManagerDeliveryReceived,
  getStoreManagerDeliveryByOrderCode,
  getStoreManagerDeliveryTracking,
  listStoreManagerDeliveries,
} from "../services/storeManagerDeliveryService.js";

export async function getStoreManagerDeliveries(
  req,
  res
) {
  try {
    const deliveries = await listStoreManagerDeliveries(
      req.storeManagerContext
    );

    return res.status(200).json({
      success: true,
      data: {
        deliveries,
      },
    });
  } catch (error) {
    return handleDeliveryError(
      res,
      error,
      "Unable to load Store Manager deliveries."
    );
  }
}

export async function getStoreManagerDelivery(
  req,
  res
) {
  try {
    const delivery = await getStoreManagerDeliveryByOrderCode(
      req.storeManagerContext,
      req.params.orderCode
    );

    return res.status(200).json({
      success: true,
      data: {
        delivery,
      },
    });
  } catch (error) {
    return handleDeliveryError(
      res,
      error,
      "Unable to load the Store Manager delivery."
    );
  }
}

export async function postStoreManagerDeliveryReceiptConfirmation(
  req,
  res
) {
  try {
    const confirmation = await confirmStoreManagerDeliveryReceived(
      req.storeManagerContext,
      req.params.orderCode,
      {
        acknowledgePartial:
          req.body?.acknowledgePartial === true,
        note: req.body?.note ?? "",
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        confirmation,
      },
    });
  } catch (error) {
    return handleDeliveryError(
      res,
      error,
      "Unable to confirm this delivery as received."
    );
  }
}

export async function getStoreManagerDeliveryTrackingController(
  req,
  res
) {
  try {
    const tracking = await getStoreManagerDeliveryTracking(
      req.storeManagerContext,
      req.params.orderCode
    );

    return res.status(200).json({
      success: true,
      data: {
        tracking,
      },
    });
  } catch (error) {
    return handleDeliveryError(
      res,
      error,
      "Unable to load delivery tracking."
    );
  }
}

function handleDeliveryError(
  res,
  error,
  fallbackMessage
) {
  if (error instanceof StoreManagerDeliveryError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  console.error(
    "Store Manager delivery request failed:",
    error?.message || error
  );

  return res.status(500).json({
    success: false,
    code: "STORE_MANAGER_DELIVERY_INTERNAL_ERROR",
    message: fallbackMessage,
  });
}
