import {
  DispatcherOrderError,
  confirmDispatcherStoreOrder,
  deferDispatcherStoreOrder,
  getDispatcherStoreOrderByCode,
  listDispatcherStoreOrders,
} from "../services/dispatcherOrderService.js";

// ============================================================
// LIST STORE MANAGER ORDERS FOR DISPATCHER PLANNING
// ============================================================

export async function getDispatcherStoreOrders(
  req,
  res
) {
  try {
    const data = await listDispatcherStoreOrders(
      req.user,
      req.query
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleDispatcherOrderError(
      res,
      error,
      "Unable to load Store Manager orders for dispatcher planning."
    );
  }
}

// ============================================================
// ORDER DETAILS
// ============================================================

export async function getDispatcherStoreOrder(
  req,
  res
) {
  try {
    const order = await getDispatcherStoreOrderByCode(
      req.user,
      req.params.orderCode
    );

    return res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    return handleDispatcherOrderError(
      res,
      error,
      "Unable to load the Store Manager order."
    );
  }
}

// ============================================================
// CONFIRM ORDER
// ============================================================

export async function postDispatcherConfirmOrder(
  req,
  res
) {
  try {
    const result = await confirmDispatcherStoreOrder(
      req.user,
      req.params.orderCode
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleDispatcherOrderError(
      res,
      error,
      "Unable to confirm the Store Manager order."
    );
  }
}

// ============================================================
// DEFER ORDER
// ============================================================

export async function postDispatcherDeferOrder(
  req,
  res
) {
  try {
    const result = await deferDispatcherStoreOrder(
      req.user,
      req.params.orderCode,
      req.body
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleDispatcherOrderError(
      res,
      error,
      "Unable to defer the Store Manager order."
    );
  }
}

// ============================================================
// ERROR RESPONSE
// ============================================================

function handleDispatcherOrderError(
  res,
  error,
  fallbackMessage
) {
  if (error instanceof DispatcherOrderError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  console.error(
    "Dispatcher Store Manager order request failed:",
    error?.message || error
  );

  return res.status(500).json({
    success: false,
    code: "DISPATCHER_ORDER_INTERNAL_ERROR",
    message: fallbackMessage,
  });
}
